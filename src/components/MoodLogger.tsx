import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

const moods = [
  { level: 1, emoji: "😢", label: "Very Low", color: "hsl(var(--mood-very-low))" },
  { level: 2, emoji: "😟", label: "Low", color: "hsl(var(--mood-low))" },
  { level: 3, emoji: "😐", label: "Neutral", color: "hsl(var(--mood-neutral))" },
  { level: 4, emoji: "🙂", label: "Good", color: "hsl(var(--mood-good))" },
  { level: 5, emoji: "😊", label: "Great", color: "hsl(var(--mood-great))" },
];

const tips = {
  1: "Remember: tough times are temporary. Consider reaching out to campus counseling or talking with a trusted friend. You're not alone. 💙",
  2: "It's okay to not be okay. Try a short breathing exercise or take a mindful walk. Small steps can make a difference.",
  3: "You're doing just fine! Sometimes neutral is exactly where we need to be. Keep taking care of yourself.",
  4: "Great to see you're doing well! Keep up the positive momentum with activities you enjoy.",
  5: "Wonderful! Your positive energy is inspiring. Consider sharing your joy with others or noting what's working well for you today.",
};

interface MoodLoggerProps {
  onMoodLogged: () => void;
}

const MoodLogger = ({ onMoodLogged }: MoodLoggerProps) => {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoggedToday, setHasLoggedToday] = useState(false);
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    checkTodayEntry();
  }, []);

  const checkTodayEntry = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("mood_entries")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", today.toISOString())
      .single();

    if (data) {
      setHasLoggedToday(true);
      setSelectedMood(data.mood_level);
      setNote(data.note || "");
      setShowTip(true);
    }
  };

  const handleSubmit = async () => {
    if (selectedMood === null) {
      toast.error("Please select a mood");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("mood_entries").insert({
        user_id: user.id,
        mood_level: selectedMood,
        note: note.trim() || null,
      });

      if (error) throw error;

      toast.success("Mood logged successfully!");
      setShowTip(true);
      setHasLoggedToday(true);
      onMoodLogged();
    } catch (error: any) {
      toast.error(error.message || "Failed to log mood");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader>
        <CardTitle className="text-2xl">How are you feeling today?</CardTitle>
        <CardDescription>
          {hasLoggedToday ? "You've already logged your mood today! Come back tomorrow." : "Take a moment to check in with yourself"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-5 gap-2">
          {moods.map((mood) => (
            <button
              key={mood.level}
              onClick={() => !hasLoggedToday && setSelectedMood(mood.level)}
              disabled={hasLoggedToday}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                selectedMood === mood.level
                  ? "border-primary bg-primary/5 scale-105"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              } ${hasLoggedToday ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
              style={selectedMood === mood.level ? { boxShadow: `0 0 20px ${mood.color}30` } : {}}
            >
              <span className="text-4xl">{mood.emoji}</span>
              <span className="text-xs font-medium text-center">{mood.label}</span>
            </button>
          ))}
        </div>

        {selectedMood !== null && !hasLoggedToday && (
          <div className="space-y-4 animate-fade-in">
            <Textarea
              placeholder="How's your day going? (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none"
              rows={3}
            />
            <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
              {isLoading ? "Logging..." : "Log Mood"}
            </Button>
          </div>
        )}

        {showTip && selectedMood !== null && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2 animate-fade-in">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Sparkles className="w-5 h-5" />
              <span>Tip for You</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {tips[selectedMood as keyof typeof tips]}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MoodLogger;
