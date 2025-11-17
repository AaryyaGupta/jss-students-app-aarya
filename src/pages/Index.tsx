import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, TrendingUp } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center max-w-2xl">
        <div className="mb-8">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 className="mb-4 text-5xl font-bold text-primary">JSS Attendance</h1>
          <p className="text-xl text-muted-foreground">
            Track your attendance, manage your classes, and stay on top of your academic performance
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-card rounded-lg shadow-sm">
            <TrendingUp className="h-10 w-10 mx-auto mb-3 text-success" />
            <h3 className="font-semibold mb-2">Track Progress</h3>
            <p className="text-sm text-muted-foreground">
              Monitor your attendance percentage for each subject
            </p>
          </div>
          
          <div className="p-6 bg-card rounded-lg shadow-sm">
            <Calendar className="h-10 w-10 mx-auto mb-3 text-secondary" />
            <h3 className="font-semibold mb-2">View Calendar</h3>
            <p className="text-sm text-muted-foreground">
              Stay updated with holidays and important dates
            </p>
          </div>
          
          <div className="p-6 bg-card rounded-lg shadow-sm">
            <BookOpen className="h-10 w-10 mx-auto mb-3 text-accent" />
            <h3 className="font-semibold mb-2">Manage Classes</h3>
            <p className="text-sm text-muted-foreground">
              Quick swipe gestures to mark attendance
            </p>
          </div>
        </div>

        <Button 
          size="lg" 
          onClick={() => navigate("/auth")}
          className="text-lg px-8"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
};

export default Index;
