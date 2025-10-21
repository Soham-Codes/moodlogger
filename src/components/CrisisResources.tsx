import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, ExternalLink, AlertCircle, Heart } from "lucide-react";

interface CrisisResource {
  id: string;
  title: string;
  description: string;
  phone: string | null;
  url: string | null;
  available_hours: string | null;
  category: string;
  is_emergency: boolean;
}

const CrisisResources = () => {
  const [resources, setResources] = useState<CrisisResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    const { data } = await supabase
      .from("crisis_resources")
      .select("*")
      .order("is_emergency", { ascending: false });

    if (data) {
      setResources(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Crisis Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-200 dark:border-red-900">
      <CardHeader className="bg-red-50 dark:bg-red-950/20">
        <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
          <Heart className="w-5 h-5" />
          Crisis Resources & Support
        </CardTitle>
        <CardDescription>
          You're not alone. These resources are available to help you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {resources.map((resource) => (
          <div
            key={resource.id}
            className={`p-4 rounded-lg border ${
              resource.is_emergency
                ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
                : "border-border bg-card"
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm">{resource.title}</h3>
                  {resource.is_emergency && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Emergency
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{resource.description}</p>
                {resource.available_hours && (
                  <p className="text-xs text-muted-foreground">
                    Available: {resource.available_hours}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {resource.phone && (
                <Button
                  size="sm"
                  variant={resource.is_emergency ? "destructive" : "secondary"}
                  asChild
                >
                  <a href={`tel:${resource.phone}`}>
                    <Phone className="w-4 h-4 mr-2" />
                    {resource.phone}
                  </a>
                </Button>
              )}
              {resource.url && (
                <Button size="sm" variant="outline" asChild>
                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visit Website
                  </a>
                </Button>
              )}
            </div>
          </div>
        ))}

        <div className="mt-6 p-4 bg-primary/10 rounded-lg">
          <p className="text-sm text-center font-medium">
            If you're in immediate danger, please call 911 or go to your nearest emergency room.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CrisisResources;
