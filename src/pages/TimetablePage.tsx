import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";

interface TimetableClass {
  id: string;
  subject: string;
  start_time: string;
  end_time: string;
  room: string;
  day: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TimetablePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState<{ [key: string]: TimetableClass[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchTimetable();
    }
  }, [user]);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      
      // Get user's batch
      const { data: profileData } = await supabase
        .from("profiles")
        .select("batch")
        .eq("id", user?.id)
        .single();

      if (!profileData) return;

      // Fetch all classes for the batch
      const { data, error } = await supabase
        .from("timetable")
        .select("*")
        .eq("batch", profileData.batch)
        .order("start_time");

      if (error) throw error;

      // Group by day
      const grouped = (data || []).reduce((acc, cls) => {
        if (!acc[cls.day]) acc[cls.day] = [];
        acc[cls.day].push(cls);
        return acc;
      }, {} as { [key: string]: TimetableClass[] });

      setTimetable(grouped);
    } catch (error: any) {
      console.error("Failed to fetch timetable:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-primary text-primary-foreground p-6">
        <h1 className="text-2xl font-bold">Timetable</h1>
        <p className="text-sm opacity-90">Your weekly class schedule</p>
      </div>

      <div className="p-4 space-y-4">
        {DAYS.map((day) => (
          <Card key={day}>
            <CardHeader>
              <CardTitle className="text-lg">{day}</CardTitle>
            </CardHeader>
            <CardContent>
              {timetable[day] && timetable[day].length > 0 ? (
                <div className="space-y-2">
                  {timetable[day].map((cls) => (
                    <div
                      key={cls.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold">{cls.subject}</h4>
                        <p className="text-sm text-muted-foreground">
                          {cls.start_time} - {cls.end_time}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{cls.room}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No classes scheduled
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
