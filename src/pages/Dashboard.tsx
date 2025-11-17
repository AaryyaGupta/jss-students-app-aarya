import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Calendar, User, BookOpen } from "lucide-react";
import { toast } from "sonner";
import ClassCard from "@/components/ClassCard";
import BottomNav from "@/components/BottomNav";
import { format } from "date-fns";

interface Profile {
  id: string;
  name: string;
  branch: string;
  batch: string;
}

interface TimetableClass {
  id: string;
  subject: string;
  start_time: string;
  end_time: string;
  room: string;
  day: string;
}

interface AttendanceRecord {
  subject: string;
  status: string;
  swapped_to?: string;
}

interface SubjectAttendance {
  subject: string;
  attended: number;
  total: number;
  percentage: number;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [todayClasses, setTodayClasses] = useState<TimetableClass[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [subjectAttendance, setSubjectAttendance] = useState<SubjectAttendance[]>([]);
  const [overallPercentage, setOverallPercentage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchProfile(),
        fetchTodayClasses(),
        fetchAttendanceData(),
      ]);
    } catch (error: any) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user?.id)
      .single();

    if (error) throw error;
    setProfile(data);
  };

  const fetchTodayClasses = async () => {
    if (!user) return;

    // Get user's batch
    const { data: profileData } = await supabase
      .from("profiles")
      .select("batch")
      .eq("id", user.id)
      .single();

    if (!profileData) return;

    // Get current day
    const today = format(new Date(), "EEEE"); // Returns day name like "Monday"
    const todayDate = format(new Date(), "yyyy-MM-dd");

    // Check for holidays
    const { data: holidays } = await supabase
      .from("calendar")
      .select("*")
      .eq("date", todayDate)
      .or(`is_institution_wide.eq.true,userid.eq.${user.id}`);

    if (holidays && holidays.length > 0) {
      setTodayClasses([]);
      return;
    }

    // Fetch classes
    const { data, error } = await supabase
      .from("timetable")
      .select("*")
      .eq("batch", profileData.batch)
      .eq("day", today)
      .order("start_time");

    if (error) throw error;
    setTodayClasses(data || []);

    // Fetch today's attendance records
    const { data: records } = await supabase
      .from("attendance_record")
      .select("*")
      .eq("userid", user.id)
      .eq("date", todayDate);

    setAttendanceRecords(records || []);
  };

  const fetchAttendanceData = async () => {
    if (!user) return;

    // Get all attendance records
    const { data: allRecords, error } = await supabase
      .from("attendance_record")
      .select("*")
      .eq("userid", user.id);

    if (error) throw error;

    // Calculate subject-wise attendance
    const subjectMap = new Map<string, { attended: number; total: number }>();

    allRecords?.forEach((record) => {
      const subject = record.swapped_to || record.subject;
      
      if (record.status !== "cancelled") {
        const current = subjectMap.get(subject) || { attended: 0, total: 0 };
        current.total++;
        if (record.status === "present") {
          current.attended++;
        }
        subjectMap.set(subject, current);
      }
    });

    const subjectData = Array.from(subjectMap.entries()).map(([subject, data]) => ({
      subject,
      attended: data.attended,
      total: data.total,
      percentage: data.total > 0 ? (data.attended / data.total) * 100 : 0,
    }));

    setSubjectAttendance(subjectData);

    // Calculate overall percentage
    const totalClasses = subjectData.reduce((sum, s) => sum + s.total, 0);
    const totalAttended = subjectData.reduce((sum, s) => sum + s.attended, 0);
    setOverallPercentage(
      totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0
    );
  };

  const getAttendanceStatus = (classItem: TimetableClass) => {
    return attendanceRecords.find((r) => r.subject === classItem.subject);
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 75) return "text-success";
    if (percentage >= 65) return "text-orange-500";
    return "text-destructive";
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
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6">
        <h1 className="text-2xl font-bold">Hello, {profile?.name?.split(" ")[0] || "Student"}!</h1>
        <p className="text-sm opacity-90">{profile?.batch} • {profile?.branch}</p>
      </div>

      {/* Overall Attendance */}
      <div className="p-4">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Overall Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className={`text-5xl font-bold ${getAttendanceColor(overallPercentage)}`}>
                {overallPercentage}%
              </div>
            </div>
            {overallPercentage < 75 && (
              <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm font-medium">
                  Your attendance is below 75%. Please attend more classes!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subject-wise Attendance */}
      <div className="px-4 space-y-3">
        <h2 className="text-lg font-semibold">Subject Attendance</h2>
        {subjectAttendance.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No attendance data yet
            </CardContent>
          </Card>
        ) : (
          subjectAttendance.map((subject) => (
            <Card key={subject.subject} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{subject.subject}</h3>
                    <p className="text-sm text-muted-foreground">
                      {subject.attended}/{subject.total} classes
                    </p>
                  </div>
                  <Badge 
                    variant={subject.percentage >= 75 ? "default" : "destructive"}
                    className={subject.percentage >= 75 ? "bg-success hover:bg-success/90" : ""}
                  >
                    {Math.round(subject.percentage)}%
                  </Badge>
                </div>
                <Progress 
                  value={subject.percentage} 
                  className="h-2"
                />
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Today's Classes */}
      <div className="px-4 py-6 space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Today's Classes - {format(new Date(), "MMMM d, yyyy")}
        </h2>
        {todayClasses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No classes today or it's a holiday!
            </CardContent>
          </Card>
        ) : (
          todayClasses.map((classItem) => (
            <ClassCard
              key={classItem.id}
              classItem={classItem}
              status={getAttendanceStatus(classItem)}
              onAttendanceMarked={fetchAttendanceData}
            />
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
