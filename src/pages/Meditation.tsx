import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Play, Square } from "lucide-react";
import { useNavigate } from "react-router-dom";

type MeditationType = "guided" | "nature" | "calming" | "breathing";

const Meditation = () => {
  const [meditationType, setMeditationType] = useState<MeditationType>("guided");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [moodBefore, setMoodBefore] = useState(5);
  const [moodAfter, setMoodAfter] = useState(5);
  const [reflectionNotes, setReflectionNotes] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const meditationContent = {
    guided: {
      title: "Guided Meditation",
      description: "Follow along with a calming voice guiding your meditation practice",
      text: `Close your eyes and take a deep breath in... Hold it for a moment... Now slowly exhale.\n\nFeel your body relaxing with each breath. Let go of any tension in your shoulders, your jaw, your hands.\n\nBring your attention to the present moment. Notice the sounds around you, the sensation of your breath, the feeling of peace.\n\nStay here for a few moments, breathing naturally and feeling calm.\n\nWhen you're ready, slowly open your eyes and notice how you feel.`
    },
    nature: {
      title: "Nature Sounds",
      description: "Immerse yourself in peaceful nature sounds",
      text: null
    },
    calming: {
      title: "Calming Music",
      description: "Relax with gentle, soothing melodies",
      text: null
    },
    breathing: {
      title: "Breathing Exercises",
      description: "Practice mindful breathing techniques",
      text: `Box Breathing Exercise:\n\n1. Breathe in slowly through your nose for 4 counts\n2. Hold your breath for 4 counts\n3. Exhale slowly through your mouth for 4 counts\n4. Hold your breath for 4 counts\n\nRepeat this cycle 4-5 times.\n\nFeel your body and mind becoming calmer with each cycle.\n\nNotice how your heart rate slows and your muscles relax.`
    }
  };

  const handleStart = async () => {
    setIsPlaying(true);
    setStartTime(new Date());
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to track your meditation sessions",
        variant: "destructive"
      });
      return;
    }

    // Create meditation session
    const { data, error } = await supabase
      .from('meditation_sessions')
      .insert({
        user_id: user.id,
        meditation_type: meditationType
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
    } else {
      setSessionId(data.id);
    }

    toast({
      title: "Meditation Started",
      description: "Take your time and enjoy the practice"
    });
  };

  const handleStop = async () => {
    setIsPlaying(false);
    
    if (sessionId && startTime) {
      const duration = Math.round((new Date().getTime() - startTime.getTime()) / 60000);
      
      await supabase
        .from('meditation_sessions')
        .update({ duration_minutes: duration })
        .eq('id', sessionId);
    }

    setShowReflection(true);
  };

  const handleSubmitReflection = async () => {
    if (!sessionId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('meditation_reflections')
      .insert({
        user_id: user.id,
        session_id: sessionId,
        mood_before: moodBefore,
        mood_after: moodAfter,
        notes: reflectionNotes || null
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save reflection",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Reflection Saved",
        description: "Thank you for completing your meditation"
      });
      setShowReflection(false);
      setSessionId(null);
      setReflectionNotes("");
    }
  };

  const handleSkipReflection = () => {
    setShowReflection(false);
    setSessionId(null);
    setReflectionNotes("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Meditation</h1>
            <p className="text-muted-foreground mt-2">Find your inner peace and calm</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        {!showReflection ? (
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Meditation Type</CardTitle>
              <CardDescription>Select the practice that resonates with you today</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={meditationType} onValueChange={(v) => setMeditationType(v as MeditationType)}>
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="guided">Guided</TabsTrigger>
                  <TabsTrigger value="nature">Nature</TabsTrigger>
                  <TabsTrigger value="calming">Music</TabsTrigger>
                  <TabsTrigger value="breathing">Breathing</TabsTrigger>
                </TabsList>

                {Object.entries(meditationContent).map(([type, content]) => (
                  <TabsContent key={type} value={type} className="space-y-4 mt-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{content.title}</h3>
                      <p className="text-muted-foreground mb-4">{content.description}</p>
                    </div>

                    {content.text && (
                      <div className="bg-secondary/30 p-6 rounded-lg whitespace-pre-line">
                        {content.text}
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-4 py-8">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                          <span className="text-2xl">🎵</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Audio placeholder</p>
                        <p className="text-xs text-muted-foreground mt-1">Ready for your music files</p>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      {!isPlaying ? (
                        <Button onClick={handleStart} size="lg" className="gap-2">
                          <Play className="w-5 h-5" />
                          Start Meditation
                        </Button>
                      ) : (
                        <Button onClick={handleStop} variant="destructive" size="lg" className="gap-2">
                          <Square className="w-5 h-5" />
                          End Session
                        </Button>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Meditation Reflection</CardTitle>
              <CardDescription>How do you feel after your practice? (Optional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Mood Before Meditation</label>
                  <Slider
                    value={[moodBefore]}
                    onValueChange={(v) => setMoodBefore(v[0])}
                    min={1}
                    max={10}
                    step={1}
                    className="mb-2"
                  />
                  <p className="text-sm text-center text-muted-foreground">Rating: {moodBefore}/10</p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Mood After Meditation</label>
                  <Slider
                    value={[moodAfter]}
                    onValueChange={(v) => setMoodAfter(v[0])}
                    min={1}
                    max={10}
                    step={1}
                    className="mb-2"
                  />
                  <p className="text-sm text-center text-muted-foreground">Rating: {moodAfter}/10</p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Notes (Optional)</label>
                  <Textarea
                    value={reflectionNotes}
                    onChange={(e) => setReflectionNotes(e.target.value)}
                    placeholder="How did this meditation make you feel? Any insights?"
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSubmitReflection} className="flex-1">
                  Save Reflection
                </Button>
                <Button onClick={handleSkipReflection} variant="outline" className="flex-1">
                  Skip
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Meditation;
