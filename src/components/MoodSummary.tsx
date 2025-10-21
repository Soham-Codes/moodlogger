import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";

interface MoodStats {
  weeklyAverage: number;
  monthlyAverage: number;
  weeklyChange: number;
  bestDay: string;
  moodCounts: { [key: number]: number };
}

const MoodSummary = () => {
  const [stats, setStats] = useState<MoodStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMoodStats();
  }, []);

  const fetchMoodStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get this week's data
    const { data: thisWeek } = await supabase
      .from("mood_entries")
      .select("mood_level, created_at")
      .eq("user_id", user.id)
      .gte("created_at", weekAgo.toISOString());

    // Get last week's data
    const { data: lastWeek } = await supabase
      .from("mood_entries")
      .select("mood_level")
      .eq("user_id", user.id)
      .gte("created_at", twoWeeksAgo.toISOString())
      .lt("created_at", weekAgo.toISOString());

    // Get this month's data
    const { data: thisMonth } = await supabase
      .from("mood_entries")
      .select("mood_level")
      .eq("user_id", user.id)
      .gte("created_at", monthAgo.toISOString());

    if (thisWeek && thisMonth) {
      const weeklyAvg = thisWeek.reduce((acc, e) => acc + e.mood_level, 0) / (thisWeek.length || 1);
      const lastWeekAvg = lastWeek?.reduce((acc, e) => acc + e.mood_level, 0) / (lastWeek?.length || 1) || 0;
      const monthlyAvg = thisMonth.reduce((acc, e) => acc + e.mood_level, 0) / (thisMonth.length || 1);
      const weeklyChange = lastWeekAvg > 0 ? ((weeklyAvg - lastWeekAvg) / lastWeekAvg) * 100 : 0;

      // Find best day of week
      const dayMoods: { [key: string]: number[] } = {};
      thisWeek.forEach((entry) => {
        const day = new Date(entry.created_at).toLocaleDateString("en-US", { weekday: "long" });
        if (!dayMoods[day]) dayMoods[day] = [];
        dayMoods[day].push(entry.mood_level);
      });

      let bestDay = "N/A";
      let bestAvg = 0;
      Object.entries(dayMoods).forEach(([day, moods]) => {
        const avg = moods.reduce((a, b) => a + b, 0) / moods.length;
        if (avg > bestAvg) {
          bestAvg = avg;
          bestDay = day;
        }
      });

      // Count moods by level
      const moodCounts: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      thisMonth.forEach((e) => {
        moodCounts[e.mood_level] = (moodCounts[e.mood_level] || 0) + 1;
      });

      setStats({
        weeklyAverage: Number(weeklyAvg.toFixed(1)),
        monthlyAverage: Number(monthlyAvg.toFixed(1)),
        weeklyChange: Number(weeklyChange.toFixed(0)),
        bestDay,
        moodCounts,
      });
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mood Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mood Summary</CardTitle>
          <CardDescription>Start logging your mood to see insights!</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Mood Summary
        </CardTitle>
        <CardDescription>Your wellbeing insights</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
            <span className="text-sm font-medium">Weekly Average</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{stats.weeklyAverage}</span>
              {stats.weeklyChange !== 0 && (
                <span className={`flex items-center text-sm ${stats.weeklyChange > 0 ? "text-green-600" : "text-red-600"}`}>
                  {stats.weeklyChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {Math.abs(stats.weeklyChange)}%
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
            <span className="text-sm font-medium">Monthly Average</span>
            <span className="text-2xl font-bold">{stats.monthlyAverage}</span>
          </div>

          {stats.bestDay !== "N/A" && (
            <div className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg">
              <p className="text-sm text-muted-foreground">✨ Mood Pattern</p>
              <p className="text-sm font-medium mt-1">
                You tend to feel better on <span className="text-primary font-bold">{stats.bestDay}s</span>!
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">This Month's Moods</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <div key={level} className="flex-1 text-center">
                <div className="text-2xl mb-1">
                  {level === 1 && "😢"}
                  {level === 2 && "😕"}
                  {level === 3 && "😐"}
                  {level === 4 && "😊"}
                  {level === 5 && "😄"}
                </div>
                <div className="text-xs font-semibold">{stats.moodCounts[level]}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MoodSummary;
