import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Mail, User, Lock } from "lucide-react";

const MENTAL_HEALTH_OPTIONS = [
  "Depression",
  "Anxiety",
  "Stress",
  "Breakup/Relationship Issues",
  "Academic Pressure",
  "Family Issues",
  "Social Anxiety",
  "Sleep Issues",
  "Other",
];

export default function Account() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  
  // User info
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  
  // Survey data
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [hobbiesText, setHobbiesText] = useState("");
  const [surveyExists, setSurveyExists] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      setEmail(user.email || "");

      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || "");
      }

      // Fetch survey data
      const { data: survey } = await supabase
        .from("user_survey")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (survey) {
        setSurveyExists(true);
        setSelectedConditions(survey.mental_health_conditions || []);
        setHobbiesText((survey.hobbies_interests || []).join(", "));
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setLoading(false);
    }
  };

  const handleConditionToggle = (condition: string) => {
    setSelectedConditions(prev =>
      prev.includes(condition)
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const handleSaveSurvey = async () => {
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const hobbiesArray = hobbiesText
      .split(',')
      .map(h => h.trim())
      .filter(h => h.length > 0);

    const surveyData = {
      user_id: user.id,
      mental_health_conditions: selectedConditions,
      hobbies_interests: hobbiesArray,
    };

    let error;
    if (surveyExists) {
      ({ error } = await supabase
        .from('user_survey')
        .update(surveyData)
        .eq('user_id', user.id));
    } else {
      ({ error } = await supabase
        .from('user_survey')
        .insert(surveyData));
      if (!error) setSurveyExists(true);
    }

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save survey. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Your preferences have been updated.",
      });
    }

    setSaving(false);
  };

  const handlePasswordReset = async () => {
    setResettingPassword(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Check Your Email",
        description: "We've sent you a password reset link.",
      });
    }

    setResettingPassword(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="space-y-6">
          {/* Profile Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your basic account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={fullName}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed (student verification)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Password Reset Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Password
              </CardTitle>
              <CardDescription>
                Request a password reset link via email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handlePasswordReset}
                disabled={resettingPassword}
                variant="outline"
              >
                {resettingPassword ? "Sending..." : "Send Password Reset Email"}
              </Button>
            </CardContent>
          </Card>

          {/* Survey/Preferences Card */}
          <Card>
            <CardHeader>
              <CardTitle>Mental Health & Interests</CardTitle>
              <CardDescription>
                Help us personalize your experience by sharing what you're going through and what helps you relax
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mental Health Section */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  Current or Past Experiences (Select all that apply)
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {MENTAL_HEALTH_OPTIONS.map((condition) => (
                    <div key={condition} className="flex items-center space-x-2">
                      <Checkbox
                        id={`account-${condition}`}
                        checked={selectedConditions.includes(condition)}
                        onCheckedChange={() => handleConditionToggle(condition)}
                      />
                      <label
                        htmlFor={`account-${condition}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {condition}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hobbies Section */}
              <div className="space-y-3">
                <Label htmlFor="account-hobbies" className="text-base font-semibold">
                  What Helps You Relax?
                </Label>
                <p className="text-sm text-muted-foreground">
                  Share your hobbies and activities (separate with commas)
                </p>
                <Textarea
                  id="account-hobbies"
                  placeholder="e.g., Reading, Gaming, Music, Sports, Cooking, Art, Walking, Yoga..."
                  value={hobbiesText}
                  onChange={(e) => setHobbiesText(e.target.value)}
                  maxLength={1000}
                  rows={4}
                />
              </div>

              <Button onClick={handleSaveSurvey} disabled={saving}>
                {saving ? "Saving..." : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
