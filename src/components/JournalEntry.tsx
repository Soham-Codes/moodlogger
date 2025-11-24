import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { BookOpen, Save } from "lucide-react";
import { toast } from "sonner";

const JournalEntry = () => {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    loadTodayEntry();
  }, []);

  const loadTodayEntry = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", today.toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setContent(data.content);
      setLastSaved(new Date(data.updated_at));
    }
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to save your journal");
      return;
    }

    if (!content.trim()) {
      toast.error("Journal entry cannot be empty");
      return;
    }

    setIsLoading(true);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if entry exists today
    const { data: existing } = await supabase
      .from("journal_entries")
      .select("id")
      .eq("user_id", user.id)
      .gte("created_at", today.toISOString())
      .maybeSingle();

    let error;
    if (existing) {
      // Update existing entry
      const result = await supabase
        .from("journal_entries")
        .update({ content })
        .eq("id", existing.id);
      error = result.error;
    } else {
      // Create new entry
      const result = await supabase
        .from("journal_entries")
        .insert({ user_id: user.id, content });
      error = result.error;
    }

    if (error) {
      toast.error("Failed to save journal entry");
    } else {
      toast.success("Journal entry saved!");
      setLastSaved(new Date());
    }

    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Daily Journal
        </CardTitle>
        <CardDescription>
          Your private space for thoughts and reflections (optional)
          {lastSaved && (
            <span className="block text-xs mt-1">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          maxLength={10000}
          placeholder="Write your thoughts here... This is your private journal space."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[200px] resize-none"
        />
        <Button onClick={handleSave} disabled={isLoading} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? "Saving..." : "Save Journal Entry"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default JournalEntry;
