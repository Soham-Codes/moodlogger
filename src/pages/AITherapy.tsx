import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mic, Volume2 } from "lucide-react";
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

    // Load voices for text-to-speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }

    initSession();
  }, []);

  const checkMicrophonePermissions = async () => {
    try {
      console.log('🎤 Checking microphone permissions...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone access granted');
      stream.getTracks().forEach(track => track.stop()); // Stop the test stream
      return true;
    } catch (error) {
      console.error('❌ Microphone permission denied:', error);
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access in your browser settings and refresh the page.",
        variant: "destructive"
      });
      return false;
    }
  };

  const startRecording = async () => {
    try {
      // Check for speech recognition support
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        toast({
          title: "Not Supported",
          description: "Speech recognition is not supported in this browser. Please use Chrome or Edge.",
          variant: "destructive"
        });
        return;
      }

      // Check microphone permissions first
      const hasPermission = await checkMicrophonePermissions();
      if (!hasPermission) {
        return;
      }

      console.log('🎙️ Starting speech recognition...');
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      setIsRecording(true);
      
      toast({
        title: "Listening",
        description: "Speak clearly into your microphone..."
      });

      recognition.onstart = () => {
        console.log('✅ Speech recognition started');
      };

      recognition.onresult = async (event: any) => {
        const transcribedText = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        console.log('📝 Transcribed:', transcribedText, 'Confidence:', confidence);
        
        setIsRecording(false);
        setIsProcessing(true);
        
        const userMessage: Message = { role: "user", content: transcribedText };
        setMessages(prev => [...prev, userMessage]);

        // Get AI response
        await getAIResponse([...messages, userMessage]);
        setIsProcessing(false);
      };

      recognition.onerror = (event: any) => {
        console.error('❌ Speech recognition error:', event.error, event);
        setIsRecording(false);
        
        let errorMessage = "Could not recognize speech. Please try again.";
        let errorTitle = "Recognition Error";
        
        switch(event.error) {
          case 'network':
            errorTitle = "Network Error";
            errorMessage = "Cannot connect to speech recognition service. Check your internet connection and try again.";
            break;
          case 'audio-capture':
            errorTitle = "Microphone Error";
            errorMessage = "Cannot capture audio. Make sure your microphone is connected and not being used by another app.";
            break;
          case 'not-allowed':
            errorTitle = "Permission Denied";
            errorMessage = "Microphone access was denied. Please allow microphone access in your browser settings.";
            break;
          case 'no-speech':
            errorTitle = "No Speech Detected";
            errorMessage = "No speech was detected. Please try speaking closer to the microphone.";
            break;
          case 'aborted':
            errorTitle = "Recognition Aborted";
            errorMessage = "Speech recognition was stopped. Please try again.";
            break;
        }
        
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive"
        });
      };

      recognition.onend = () => {
        console.log('🛑 Speech recognition ended');
        setIsRecording(false);
      };

      recognition.start();
    } catch (error) {
      console.error('❌ Error starting speech recognition:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions and try again.",
        variant: "destructive"
      });
      setIsRecording(false);
    }
  };


  const getAIResponse = async (conversationMessages: Message[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('📤 Sending messages to AI:', conversationMessages);

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

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }
      
      if (!response.body) {
        throw new Error("No response body received");
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
            console.error('❌ Error parsing streaming chunk:', e, 'Raw line:', line);
          }
        }
      }

      console.log('✅ Complete AI response received:', assistantMessage);

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
      console.error('❌ Error getting AI response:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get response from AI",
        variant: "destructive"
      });
      
      // Remove the empty assistant message that was added
      setMessages(prev => prev.slice(0, -1));
    }
  };

  const speakText = async (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      
      // Get the best available voice
      const voices = window.speechSynthesis.getVoices();
      
      // Prefer enhanced/premium voices, then female English voices
      const bestVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        (voice.name.includes('Enhanced') || voice.name.includes('Premium') || voice.name.includes('Natural'))
      ) || voices.find(voice => 
        voice.lang.startsWith('en') && voice.name.includes('Female')
      ) || voices.find(voice => 
        voice.lang.startsWith('en') && !voice.name.includes('Male')
      ) || voices.find(voice => voice.lang.startsWith('en'));

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85; // Slightly slower for more natural, calming effect
      utterance.pitch = 1.1; // Slightly higher for warmth
      utterance.volume = 1;
      
      if (bestVoice) {
        utterance.voice = bestVoice;
        console.log('Using voice:', bestVoice.name);
      }
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
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
                <div className="flex flex-col items-center gap-2">
                  <Button
                    size="lg"
                    variant="destructive"
                    className="rounded-full w-16 h-16 animate-pulse"
                    disabled
                  >
                    <Mic className="w-6 h-6" />
                  </Button>
                  <p className="text-sm text-muted-foreground">Listening...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary/30">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                <strong>Important:</strong> This AI assistant is not a replacement for professional mental health care.
                If you're in crisis, please contact a crisis helpline or emergency services immediately.
              </p>
              
              <div className="text-xs text-muted-foreground text-center space-y-2 border-t pt-4">
                <p><strong>Microphone Troubleshooting:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Make sure your browser has microphone permissions enabled</li>
                  <li>Close other apps that might be using your microphone</li>
                  <li>Try refreshing the page if you see network errors</li>
                  <li>Use Chrome or Edge browser for best compatibility</li>
                  <li>Check that you have a stable internet connection</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AITherapy;
