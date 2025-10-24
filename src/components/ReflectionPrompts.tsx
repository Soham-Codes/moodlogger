import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const prompts = [
  "What made today good?",
  "What could tomorrow be better?",
  "What are three things you're grateful for today?",
  "What's one thing that made you smile?",
  "What challenge did you overcome today?",
  "What's something you learned about yourself?",
  "Who made a positive impact on your day?",
  "What's one small win you achieved today?",
  "How did you take care of yourself today?",
  "What's something you're looking forward to?",
];

const ReflectionPrompts = () => {
  const [todayPrompt, setTodayPrompt] = useState("");
  const [reflection, setReflection] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Get a consistent prompt for today
    const today = new Date().toDateString();
    const seed = today.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = seed % prompts.length;
    setTodayPrompt(prompts[index]);
  }, []);

  const handleSubmitReflection = async () => {
    if (!reflection.trim()) {
      toast.error("Please write something first");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to save reflections");
        return;
      }

      const { error } = await supabase.from("journal_entries").insert({
        user_id: session.user.id,
        content: `Daily Reflection: ${todayPrompt}\n\n${reflection}`,
      });

      if (error) throw error;

      toast.success("Reflection saved to your journal!");
      setReflection("");
    } catch (error) {
      console.error("Error saving reflection:", error);
      toast.error("Failed to save reflection");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          Daily Reflection
        </CardTitle>
        <CardDescription>Take a moment to reflect</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-lg font-medium text-center">{todayPrompt}</p>
        <div className="space-y-3">
          <Textarea
            placeholder="Write your reflection here..."
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          <Button 
            onClick={handleSubmitReflection} 
            disabled={isSubmitting || !reflection.trim()}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? "Saving..." : "Save to Journal"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReflectionPrompts;
