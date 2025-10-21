import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Star, Target, Zap, Crown } from "lucide-react";

interface Achievement {
  id: string;
  achievement_type: string;
  earned_at: string;
}

const achievementConfig = {
  "first_entry": { icon: Star, label: "First Entry", color: "bg-yellow-500" },
  "7_day_streak": { icon: Zap, label: "7-Day Streak", color: "bg-orange-500" },
  "30_day_streak": { icon: Crown, label: "30-Day Streak", color: "bg-purple-500" },
  "first_month": { icon: Trophy, label: "First Month", color: "bg-blue-500" },
  "mood_warrior": { icon: Award, label: "Mood Warrior", color: "bg-green-500" },
  "consistent": { icon: Target, label: "Consistency King", color: "bg-indigo-500" },
};

const Achievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
    checkAndAwardAchievements();
  }, []);

  const fetchAchievements = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("achievements")
      .select("*")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false });

    if (data) {
      setAchievements(data);
    }
    setLoading(false);
  };

  const checkAndAwardAchievements = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check for achievements
    const { data: entries } = await supabase
      .from("mood_entries")
      .select("created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!entries) return;

    const achievementsToAward: string[] = [];

    // First entry
    if (entries.length >= 1) {
      achievementsToAward.push("first_entry");
    }

    // First month (30 entries)
    if (entries.length >= 30) {
      achievementsToAward.push("first_month");
    }

    // 50 entries = Mood Warrior
    if (entries.length >= 50) {
      achievementsToAward.push("mood_warrior");
    }

    // Calculate streak
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < entries.length; i++) {
      const entryDate = new Date(entries[i].created_at);
      entryDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }

    if (streak >= 7) achievementsToAward.push("7_day_streak");
    if (streak >= 30) achievementsToAward.push("30_day_streak");

    // Award achievements
    for (const type of achievementsToAward) {
      await supabase
        .from("achievements")
        .upsert({ user_id: user.id, achievement_type: type }, { onConflict: "user_id,achievement_type" });
    }

    fetchAchievements();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-12 bg-muted rounded"></div>
            <div className="h-12 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Achievements
        </CardTitle>
        <CardDescription>Your wellbeing milestones</CardDescription>
      </CardHeader>
      <CardContent>
        {achievements.length === 0 ? (
          <p className="text-sm text-muted-foreground">Start logging your mood to earn achievements!</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {achievements.map((achievement) => {
              const config = achievementConfig[achievement.achievement_type as keyof typeof achievementConfig];
              if (!config) return null;
              const Icon = config.icon;

              return (
                <div
                  key={achievement.id}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20 hover:scale-105 transition-transform"
                >
                  <div className={`w-12 h-12 rounded-full ${config.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {config.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Achievements;
