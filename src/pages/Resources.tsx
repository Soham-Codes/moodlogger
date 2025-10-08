import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Wind, Heart, Brain, Moon, Coffee, Phone, Dumbbell, Clock } from "lucide-react";

const iconMap: Record<string, any> = {
  Wind,
  Heart,
  Brain,
  Moon,
  Coffee,
  Phone,
  Dumbbell,
  Clock,
};

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string | null;
  icon: string;
}

const Resources = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .order("category");

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error("Error fetching resources:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-subtle)" }}>
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8 text-center space-y-2">
          <h1 className="text-4xl font-bold">Wellbeing Resources</h1>
          <p className="text-muted-foreground text-lg">
            Curated tools and support to help you thrive
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => {
            const IconComponent = iconMap[resource.icon] || Heart;
            const isEmergency = resource.category === "Emergency Support";

            return (
              <Card
                key={resource.id}
                className={`shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 ${
                  isEmergency ? "border-destructive border-2" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isEmergency ? "bg-destructive/10" : "bg-primary/10"
                      }`}
                    >
                      <IconComponent
                        className={`w-6 h-6 ${
                          isEmergency ? "text-destructive" : "text-primary"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{resource.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">{resource.category}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4 leading-relaxed">
                    {resource.description}
                  </CardDescription>
                  {resource.url && (
                    <Button
                      variant={isEmergency ? "destructive" : "default"}
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(resource.url!, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {isEmergency ? "Get Help Now" : "Learn More"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Need Immediate Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              If you're experiencing a mental health crisis, please reach out for immediate support:
            </p>
            <ul className="text-sm space-y-1 ml-4">
              <li>• Call 988 for the Suicide & Crisis Lifeline (24/7)</li>
              <li>• Text "HELLO" to 741741 for Crisis Text Line</li>
              <li>• Visit your campus emergency services</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Resources;
