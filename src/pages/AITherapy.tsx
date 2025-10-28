import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const AITherapy = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize session
    const initSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to use AI Therapy",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('therapy_sessions')
        .insert({ user_id: user.id })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
      } else {
        setSessionId(data.id);
        // Add welcome message
        const welcomeMsg: Message = {
          role: "assistant",
          content: "Hello, I'm here to listen and support you. How are you feeling today?"
        };
        setMessages([welcomeMsg]);
      }
    };

    initSession();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording",
        description: "Speak freely, I'm listening..."
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Convert audio to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        if (!base64Audio) return;

        // Here you would call a speech-to-text API
        // For now, we'll simulate it with a placeholder
        const transcribedText = "I've been feeling overwhelmed lately..."; // Placeholder
        
        const userMessage: Message = { role: "user", content: transcribedText };
        setMessages(prev => [...prev, userMessage]);

        // Get AI response
        await getAIResponse([...messages, userMessage]);
      };
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process audio",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getAIResponse = async (conversationMessages: Message[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let assistantMessage = "";
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/therapy-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: conversationMessages }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to get response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantMessage += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantMessage };
                return updated;
              });
            }
          } catch (e) {
            console.error('Error parsing chunk:', e);
          }
        }
      }

      // Speak the response
      await speakText(assistantMessage);

      // Save messages to database
      if (sessionId) {
        await supabase.from('therapy_messages').insert([
          {
            user_id: user.id,
            session_id: sessionId,
            role: 'user',
            content: conversationMessages[conversationMessages.length - 1].content
          },
          {
            user_id: user.id,
            session_id: sessionId,
            role: 'assistant',
            content: assistantMessage
          }
        ]);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: "Error",
        description: "Failed to get response from AI",
        variant: "destructive"
      });
    }
  };

  const speakText = async (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const endSession = async () => {
    if (sessionId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('therapy_sessions')
          .update({ ended_at: new Date().toISOString() })
          .eq('id', sessionId);
      }
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">AI Therapy</h1>
            <p className="text-muted-foreground mt-2">A safe space to talk and be heard</p>
          </div>
          <Button variant="outline" onClick={endSession}>
            End Session
          </Button>
        </div>

        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
            <CardDescription>
              Tap the microphone to speak. Your conversation is private and secure.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 pr-4 mb-4">
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-secondary text-secondary-foreground rounded-lg p-4">
                      <p className="animate-pulse">Processing...</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="flex items-center justify-center gap-4">
              {isSpeaking && (
                <div className="flex items-center gap-2 text-primary">
                  <Volume2 className="w-5 h-5 animate-pulse" />
                  <span className="text-sm">AI is speaking...</span>
                </div>
              )}
              
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  size="lg"
                  className="rounded-full w-16 h-16"
                  disabled={isProcessing || isSpeaking}
                >
                  <Mic className="w-6 h-6" />
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  size="lg"
                  variant="destructive"
                  className="rounded-full w-16 h-16 animate-pulse"
                >
                  <MicOff className="w-6 h-6" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary/30">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              <strong>Important:</strong> This AI assistant is not a replacement for professional mental health care.
              If you're in crisis, please contact a crisis helpline or emergency services immediately.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AITherapy;
