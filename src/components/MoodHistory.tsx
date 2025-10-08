import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";

const MoodHistory = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMoodHistory();
  }, []);

  const fetchMoodHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const thirtyDaysAgo = subDays(new Date(), 30);

      const { data, error } = await supabase
        .from("mood_entries")
        .select("mood_level, created_at")
        .eq("user_id", user.id)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;

      const formattedData = data?.map((entry) => ({
        date: format(new Date(entry.created_at), "MMM dd"),
        mood: entry.mood_level,
        fullDate: entry.created_at,
      })) || [];

      setChartData(formattedData);
    } catch (error) {
      console.error("Error fetching mood history:", error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const moodLabels = ["", "Very Low", "Low", "Neutral", "Good", "Great"];
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{payload[0].payload.date}</p>
          <p className="text-primary">{moodLabels[payload[0].value]}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="pt-6">
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader>
        <CardTitle className="text-2xl">Your Mood Journey</CardTitle>
        <CardDescription>Track your emotional wellbeing over the past 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center space-y-2">
            <p className="text-muted-foreground">No mood data yet</p>
            <p className="text-sm text-muted-foreground">Start logging your daily mood to see trends!</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default MoodHistory;
