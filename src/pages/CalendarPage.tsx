import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Loader2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { format } from "date-fns";

interface Holiday {
  id: string;
  date: string;
  name: string;
  type: string;
  is_institution_wide: boolean;
}

export default function CalendarPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchHolidays();
    }
  }, [user]);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("calendar")
        .select("*")
        .or(`is_institution_wide.eq.true,userid.eq.${user?.id}`)
        .order("date");

      if (error) throw error;
      setHolidays(data || []);
    } catch (error: any) {
      console.error("Failed to fetch holidays:", error);
    } finally {
      setLoading(false);
    }
  };

  const getHolidayDates = () => {
    return holidays.map((h) => new Date(h.date));
  };

  const getHolidaysForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return holidays.filter((h) => h.date === dateStr);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedDateHolidays = selectedDate ? getHolidaysForDate(selectedDate) : [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-primary text-primary-foreground p-6">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="text-sm opacity-90">View holidays and events</p>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md"
              modifiers={{
                holiday: getHolidayDates(),
              }}
              modifiersStyles={{
                holiday: {
                  backgroundColor: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                  fontWeight: "bold",
                },
              }}
            />
          </CardContent>
        </Card>

        {selectedDate && selectedDateHolidays.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                {format(selectedDate, "MMMM d, yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {selectedDateHolidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className="p-3 bg-primary/10 rounded-lg"
                >
                  <h3 className="font-semibold">{holiday.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {holiday.is_institution_wide ? "Institution-wide" : "Personal"}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Holidays</CardTitle>
          </CardHeader>
          <CardContent>
            {holidays.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No holidays scheduled
              </p>
            ) : (
              <div className="space-y-2">
                {holidays
                  .filter((h) => new Date(h.date) >= new Date())
                  .slice(0, 5)
                  .map((holiday) => (
                    <div
                      key={holiday.id}
                      className="p-3 border rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{holiday.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(holiday.date), "MMMM d, yyyy")}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-primary/10 rounded">
                          {holiday.is_institution_wide ? "Institution" : "Personal"}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
