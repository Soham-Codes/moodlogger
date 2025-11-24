import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(5000)
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(50),
  userId: z.string().uuid()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error);
      return new Response(
        JSON.stringify({ 
          error: "Invalid input", 
          details: validationResult.error.issues 
        }), 
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const { messages, userId } = validationResult.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch user survey data
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { data: surveyData, error: surveyError } = await supabase
      .from('user_survey')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (surveyError) {
      console.log("No survey data found for user:", userId);
    }

    // Build system prompt based on user data
    let systemPrompt = `You are a compassionate AI mood support assistant. Your role is to:
- Listen actively and empathetically to the user's feelings and concerns
- Help them feel heard and validated
- Provide supportive, non-judgmental responses
- Suggest practical activities and coping strategies to improve their mood
- Maintain a warm, caring, and understanding tone

Keep responses conversational and concise (2-4 sentences typically).`;

    if (surveyData) {
      if (surveyData.mental_health_conditions && surveyData.mental_health_conditions.length > 0) {
        systemPrompt += `\n\nThe user has shared these mental health experiences: ${surveyData.mental_health_conditions.join(', ')}. Be sensitive to these experiences when providing support.`;
      }
      
      if (surveyData.hobbies_interests && surveyData.hobbies_interests.length > 0) {
        systemPrompt += `\n\nThe user enjoys these activities: ${surveyData.hobbies_interests.join(', ')}. When appropriate, suggest these or similar activities to help improve their mood.`;
      }
    } else {
      systemPrompt += `\n\nThe user hasn't shared their interests yet. If appropriate, gently ask what activities or hobbies they enjoy, as this can help you provide better personalized suggestions.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Mood chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
