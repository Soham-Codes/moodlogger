import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp, Shield, Sparkles } from "lucide-react";
import moodLoggerLogo from "@/assets/mood-logger-logo.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-16 md:py-24">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-block mb-6 animate-fade-in">
              <img
                src={moodLoggerLogo}
                alt="MoodLogger - Track your mental wellbeing"
                className="w-24 h-24 md:w-32 md:h-32 mx-auto drop-shadow-lg"
              />
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold animate-fade-in leading-tight">
              Your Mental Wellbeing,
              <span className="block text-primary mt-2">Simplified</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in leading-relaxed">
              Track your daily mood, journal your thoughts, and get personalized wellness tips. Built for students who
              want to prioritize their mental health.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 animate-fade-in">
              <Button
                size="lg"
                className="text-lg px-10 py-6 h-auto font-semibold shadow-lg hover:shadow-xl transition-all"
                onClick={() => navigate("/auth")}
              >
                Get Started Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-10 py-6 h-auto font-semibold border-2"
                onClick={() => navigate("/auth")}
              >
                Sign In
              </Button>
            </div>

            <p className="text-sm text-muted-foreground animate-fade-in pt-2">
              ✨ Free forever • No credit card required • Privacy first
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything You Need for Better Wellbeing</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple tools designed to help you understand and improve your mental health journey
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group text-center space-y-4 p-8 rounded-2xl bg-card border-2 border-transparent hover:border-primary/20 shadow-md hover:shadow-xl transition-all duration-300">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <TrendingUp className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold">Track Your Mood</h3>
              <p className="text-muted-foreground leading-relaxed">
                Quick daily check-ins help you identify patterns, triggers, and what truly impacts your wellbeing
              </p>
            </div>

            <div className="group text-center space-y-4 p-8 rounded-2xl bg-card border-2 border-transparent hover:border-secondary/20 shadow-md hover:shadow-xl transition-all duration-300">
              <div className="w-20 h-20 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Sparkles className="w-10 h-10 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold">Personalized Tips</h3>
              <p className="text-muted-foreground leading-relaxed">
                Receive evidence-based wellness recommendations tailored to how you're feeling each day
              </p>
            </div>

            <div className="group text-center space-y-4 p-8 rounded-2xl bg-card border-2 border-transparent hover:border-accent/20 shadow-md hover:shadow-xl transition-all duration-300">
              <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Shield className="w-10 h-10 text-accent" />
              </div>
              <h3 className="text-2xl font-bold">Private & Secure</h3>
              <p className="text-muted-foreground leading-relaxed">
                Your mental health data stays yours. Encrypted, protected, and never shared without permission
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto max-w-3xl text-center space-y-8 relative z-10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            Ready to Prioritize Your Wellbeing?
          </h2>
          <p className="text-xl md:text-2xl text-primary-foreground/90 max-w-2xl mx-auto leading-relaxed">
            Join thousands of students taking control of their mental health journey. Start tracking today—it's free,
            private, and takes less than a minute.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="text-lg px-12 py-6 h-auto font-bold shadow-2xl hover:shadow-xl transition-all"
            onClick={() => navigate("/auth")}
          >
            Start Your Journey Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t bg-muted/20">
        <div className="container mx-auto text-center space-y-4">
          <img src={moodLoggerLogo} alt="MoodLogger" className="w-12 h-12 mx-auto opacity-80" />
          <p className="text-muted-foreground text-sm">© 2025 MoodLogger. Supporting students, one day at a time.</p>
          <p className="text-xs text-muted-foreground">
            Your mental health matters. Track with care, reflect with kindness.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
