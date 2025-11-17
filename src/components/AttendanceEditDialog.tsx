import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface AttendanceEditDialogProps {
  subject: string;
  attended: number;
  total: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (attended: number, total: number) => void;
}

export default function AttendanceEditDialog({
  subject,
  attended,
  total,
  open,
  onOpenChange,
  onSave,
}: AttendanceEditDialogProps) {
  const [newAttended, setNewAttended] = useState(attended);
  const [newTotal, setNewTotal] = useState(total);

  const handleSave = () => {
    if (newAttended > newTotal) {
      toast.error("Attended classes cannot exceed total classes");
      return;
    }
    if (newAttended < 0 || newTotal < 0) {
      toast.error("Values cannot be negative");
      return;
    }
    onSave(newAttended, newTotal);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Attendance</DialogTitle>
          <DialogDescription>
            Update attendance records for {subject}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="attended">Classes Attended</Label>
            <Input
              id="attended"
              type="number"
              min="0"
              value={newAttended}
              onChange={(e) => setNewAttended(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="total">Total Classes</Label>
            <Input
              id="total"
              type="number"
              min="0"
              value={newTotal}
              onChange={(e) => setNewTotal(parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
