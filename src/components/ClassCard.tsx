import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Clock, MapPin } from "lucide-react";
import { useSwipeable } from "react-swipeable";
import { format } from "date-fns";

interface ClassCardProps {
  classItem: {
    id: string;
    subject: string;
    start_time: string;
    end_time: string;
    room: string;
  };
  status?: {
    status: string;
    swapped_to?: string;
  };
  onAttendanceMarked: () => void;
}

export default function ClassCard({ classItem, status, onAttendanceMarked }: ClassCardProps) {
  const { user } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [showSwapDialog, setShowSwapDialog] = useState(false);
  const [swapSubject, setSwapSubject] = useState("");
  const [swapStatus, setSwapStatus] = useState<"present" | "absent" | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (!status) {
        setSwipeDirection("left");
        setTimeout(() => {
          markAttendance("absent");
          setSwipeDirection(null);
        }, 300);
      }
    },
    onSwipedRight: () => {
      if (!status) {
        setSwipeDirection("right");
        setTimeout(() => {
          markAttendance("present");
          setSwipeDirection(null);
        }, 300);
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
  });

  const markAttendance = async (attendanceStatus: string, swappedTo?: string) => {
    try {
      const { error } = await supabase.from("attendance_record").upsert({
        userid: user?.id,
        date: format(new Date(), "yyyy-MM-dd"),
        subject: classItem.subject,
        status: attendanceStatus,
        swapped_to: swappedTo || null,
      });

      if (error) throw error;

      const statusText = 
        attendanceStatus === "cancelled" ? "marked as cancelled" :
        attendanceStatus === "present" ? "marked present" :
        "marked absent";

      toast.success(`Class ${statusText}${swappedTo ? ` (swapped to ${swappedTo})` : ""}`);
      onAttendanceMarked();
      setShowDialog(false);
      setShowSwapDialog(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to mark attendance");
    }
  };

  const handleSwap = () => {
    if (!swapSubject || swapStatus === null) {
      toast.error("Please select subject and attendance");
      return;
    }
    markAttendance(swapStatus, swapSubject);
  };

  const getStatusBadge = () => {
    if (!status) return null;
    
    const variant = status.status === "present" ? "default" : 
                    status.status === "cancelled" ? "secondary" : 
                    "destructive";
    
    const className = status.status === "present" ? "bg-success hover:bg-success/90" : "";
    
    return (
      <Badge variant={variant} className={className}>
        {status.status === "cancelled" ? "Cancelled" :
         status.status === "present" ? "Present" : "Absent"}
        {status.swapped_to && ` (→ ${status.swapped_to})`}
      </Badge>
    );
  };

  const swipeClass = 
    swipeDirection === "right" ? "translate-x-4 bg-success/20" :
    swipeDirection === "left" ? "-translate-x-4 bg-destructive/20" :
    "";

  return (
    <>
      <Card
        {...handlers}
        className={`shadow-md transition-all duration-300 ${swipeClass} ${
          !status ? "cursor-pointer hover:shadow-lg" : ""
        }`}
        onClick={() => !status && setShowDialog(true)}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <h3 className="font-semibold text-lg">
                {status?.swapped_to || classItem.subject}
              </h3>
              {status?.swapped_to && (
                <p className="text-xs text-muted-foreground">
                  Original: {classItem.subject}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {classItem.start_time.slice(0, 5)} - {classItem.end_time.slice(0, 5)}
                  </span>
                </div>
                {classItem.room && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{classItem.room}</span>
                  </div>
                )}
              </div>
            </div>
            {getStatusBadge()}
          </div>
          {!status ? (
            <p className="text-xs text-muted-foreground mt-3">
              Swipe right for present, left for absent, or tap for more options
            </p>
          ) : (
            <Button
              onClick={() => setShowDialog(true)}
              variant="outline"
              size="sm"
              className="mt-3 w-full"
            >
              Edit Attendance
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{classItem.subject}</DialogTitle>
            <DialogDescription>
              {status ? "Edit your attendance for this class" : "Mark your attendance for this class"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            <Button
              onClick={() => markAttendance("present")}
              className="w-full bg-success hover:bg-success/90"
            >
              Mark Present
            </Button>
            <Button
              onClick={() => markAttendance("absent")}
              variant="destructive"
              className="w-full"
            >
              Mark Absent
            </Button>
            <Button
              onClick={() => {
                setShowDialog(false);
                setShowSwapDialog(true);
              }}
              variant="outline"
              className="w-full"
            >
              Class Swapped
            </Button>
            <Button
              onClick={() => markAttendance("cancelled")}
              variant="secondary"
              className="w-full"
            >
              Class Cancelled
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSwapDialog} onOpenChange={setShowSwapDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Class Swapped</DialogTitle>
            <DialogDescription>
              Which subject was taught instead of {classItem.subject}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Select value={swapSubject} onValueChange={setSwapSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
                <SelectItem value="Physics">Physics</SelectItem>
                <SelectItem value="Chemistry">Chemistry</SelectItem>
                <SelectItem value="Programming">Programming</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Did you attend?</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setSwapStatus("present")}
                  variant={swapStatus === "present" ? "default" : "outline"}
                  className={swapStatus === "present" ? "bg-success hover:bg-success/90" : ""}
                >
                  Present
                </Button>
                <Button
                  onClick={() => setSwapStatus("absent")}
                  variant={swapStatus === "absent" ? "destructive" : "outline"}
                >
                  Absent
                </Button>
              </div>
            </div>

            <Button onClick={handleSwap} className="w-full">
              Confirm Swap
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
