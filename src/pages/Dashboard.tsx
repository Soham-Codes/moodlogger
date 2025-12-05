import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { LogOut, BookOpen, Flame, AlertCircle, Brain, Music, UserCircle } from "lucide-react";
import { toast } from "sonner";
import MoodLogger from "@/components/MoodLogger";
import MoodHistory from "@/components/MoodHistory";
import MoodSummary from "@/components/MoodSummary";
import Achievements from "@/components/Achievements";
import JournalEntry from "@/components/JournalEntry";
import CrisisResources from "@/components/CrisisResources";

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState<string>("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        calculateStreak(session.user.id);
        fetchUserProfile(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        calculateStreak(session.user.id);
        fetchUserProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      return;
    }

    if (data?.full_name) {
      const firstName = data.full_name.trim().split(" ")[0];
      setFirstName(firstName);
    }
  };

  const calculateStreak = async (userId: string) => {
    const { data, error } = await supabase
      .from("mood_entries")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error || !data) return;

    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < data.length; i++) {
      const entryDate = new Date(data[i].created_at);
      entryDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === currentStreak) {
        currentStreak++;
      } else {
        break;
      }
    }

    setStreak(currentStreak);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };


  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-subtle)" }}>
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl">💛</span>
            </div>
            <h1 className="text-xl font-bold">MoodLogger</h1>
          </div>
          <div className="flex items-center gap-4">
            {streak > 0 && (
              <div className="flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-full">
                <Flame className="w-5 h-5 text-accent" />
                <span className="font-semibold">{streak} day streak!</span>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate("/resources")}>
              <BookOpen className="w-4 h-4 mr-2" />
              Resources
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/account")}>
              <UserCircle className="w-4 h-4 mr-2" />
              Account
            </Button>
            <Button variant="destructive" size="sm" onClick={() => {
              const element = document.getElementById("crisis-resources");
              element?.scrollIntoView({ behavior: "smooth" });
            }}>
              <AlertCircle className="w-4 h-4 mr-2" />
              Crisis Help
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        {/* Welcome Section */}
        {firstName && (
          <div className="text-center space-y-4 py-4">
            <h2 className="text-3xl font-bold">Hi {firstName}! 👋</h2>
            <p className="text-muted-foreground">Glad you stopped by. How are you feeling today?</p>
            <div className="flex gap-4 justify-center mt-4">
              <Button onClick={() => navigate("/meditation")} className="gap-2">
                <Music className="w-4 h-4" />
                Meditation
              </Button>
              <Button onClick={() => navigate("/ai-therapy")} className="gap-2">
                <Brain className="w-4 h-4" />
                AI Therapy
              </Button>
              <Button onClick={() => navigate("/mood-support")} className="gap-2" variant="secondary">
                I am not feeling well 😔
              </Button>
            </div>
          </div>
        )}
        {/* Top Section: Mood Summary & Achievements */}
        <div className="grid gap-6 lg:grid-cols-2">
          <MoodSummary />
          <Achievements />
        </div>

        {/* Main Mood Section */}
        <div className="grid gap-8 lg:grid-cols-2">
          <MoodLogger onMoodLogged={() => calculateStreak(session?.user.id || "")} />
          <MoodHistory />
        </div>

        {/* Journal Entry */}
        <JournalEntry />

        {/* Crisis Resources */}
        <div id="crisis-resources">
          <CrisisResources />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
