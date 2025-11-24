import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

interface SurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

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

export const SurveyModal = ({ isOpen, onClose, userId }: SurveyModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [hobbiesText, setHobbiesText] = useState("");
  const [otherText, setOtherText] = useState("");

  const handleConditionToggle = (condition: string) => {
    setSelectedConditions(prev =>
      prev.includes(condition)
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    // Convert hobbies text to array
    const hobbiesArray = hobbiesText
      .split(',')
      .map(h => h.trim())
      .filter(h => h.length > 0);

    // If "Other" is selected and otherText is provided, add it to conditions
    const conditionsToSave = [...selectedConditions];
    if (selectedConditions.includes("Other") && otherText.trim()) {
      const otherIndex = conditionsToSave.indexOf("Other");
      conditionsToSave[otherIndex] = `Other: ${otherText.trim()}`;
    }

    const { error } = await supabase
      .from('user_survey')
      .insert({
        user_id: userId,
        mental_health_conditions: conditionsToSave,
        hobbies_interests: hobbiesArray,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save survey responses. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Survey Complete",
        description: "Thank you for sharing! This helps us personalize your experience.",
      });
      onClose();
    }
    
    setLoading(false);
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Welcome! Let's Get to Know You</DialogTitle>
          <DialogDescription>
            Help us personalize your mental health journey. You can skip this and fill it out later in your account settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Mental Health Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Have you experienced any of these? (Select all that apply)
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {MENTAL_HEALTH_OPTIONS.map((condition) => (
                <div key={condition} className="flex items-center space-x-2">
                  <Checkbox
                    id={condition}
                    checked={selectedConditions.includes(condition)}
                    onCheckedChange={() => handleConditionToggle(condition)}
                  />
                  <label
                    htmlFor={condition}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {condition}
                  </label>
                </div>
              ))}
            </div>
            
            {selectedConditions.includes("Other") && (
              <Textarea
                placeholder="Please specify..."
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                maxLength={200}
                rows={2}
                className="mt-3"
              />
            )}
          </div>

          {/* Hobbies Section */}
          <div className="space-y-3">
            <Label htmlFor="hobbies" className="text-base font-semibold">
              What helps you relax and feel better?
            </Label>
            <p className="text-sm text-muted-foreground">
              Share your hobbies, activities, or things that take your mind off stress (separate with commas)
            </p>
            <Textarea
              id="hobbies"
              placeholder="e.g., Reading, Gaming, Music, Sports, Cooking, Art, Walking, Yoga..."
              value={hobbiesText}
              onChange={(e) => setHobbiesText(e.target.value)}
              maxLength={1000}
              rows={4}
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={handleSkip}>
            Skip for Now
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Complete Survey"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
