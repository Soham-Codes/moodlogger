import { useState } from "react";
import { SurveyModal } from "@/components/SurveyModal";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SignUpInfo = () => {
  const [showModal, setShowModal] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Sign Up Information Preview</h1>
          <p className="text-muted-foreground">
            This is what users see after signing up. The survey is optional and can be skipped.
          </p>
        </div>

        <Button onClick={() => setShowModal(true)} className="mb-4">
          Show Survey Modal
        </Button>

        <SurveyModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          userId="preview-user-id"
        />
      </div>
    </div>
  );
};

export default SignUpInfo;
