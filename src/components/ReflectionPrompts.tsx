import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

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

  useEffect(() => {
    // Get a consistent prompt for today
    const today = new Date().toDateString();
    const seed = today.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = seed % prompts.length;
    setTodayPrompt(prompts[index]);
  }, []);

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          Daily Reflection
        </CardTitle>
        <CardDescription>Take a moment to reflect</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-medium text-center py-4">{todayPrompt}</p>
      </CardContent>
    </Card>
  );
};

export default ReflectionPrompts;
