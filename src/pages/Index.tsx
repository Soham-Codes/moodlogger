import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, TrendingUp, Shield, Sparkles } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto px-4 py-20 text-center text-white">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="inline-block mb-4 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto">
                <Heart className="w-10 h-10" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold animate-fade-in">
              Your Wellbeing Journey Starts Here
            </h1>
            <p className="text-xl md:text-2xl text-white/90 animate-fade-in">
              Track your mood, discover personalized tips, and build lasting wellbeing habits
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-fade-in">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8"
                onClick={() => navigate("/auth")}
              >
                Get Started Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 bg-white/10 border-white/30 text-white hover:bg-white/20"
                onClick={() => navigate("/auth")}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4" style={{ background: "var(--gradient-subtle)" }}>
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-12">Built for Student Success</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4 p-6 rounded-2xl bg-card shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold">Track Your Mood</h3>
              <p className="text-muted-foreground">
                Simple daily check-ins help you understand patterns and triggers in your emotional wellbeing
              </p>
            </div>
            <div className="text-center space-y-4 p-6 rounded-2xl bg-card shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-2xl font-semibold">Personalized Tips</h3>
              <p className="text-muted-foreground">
                Get instant, evidence-based recommendations tailored to how you're feeling each day
              </p>
            </div>
            <div className="text-center space-y-4 p-6 rounded-2xl bg-card shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-2xl font-semibold">Private & Secure</h3>
              <p className="text-muted-foreground">
                Your data is encrypted and protected. Share only what you want, when you want
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-white">
        <div className="container mx-auto max-w-3xl text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold">Ready to prioritize your wellbeing?</h2>
          <p className="text-xl text-white/90">
            Join students taking control of their mental health journey
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="text-lg px-8"
            onClick={() => navigate("/auth")}
          >
            Start Your Journey
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© 2025 Student Wellbeing. Supporting students, one day at a time.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
