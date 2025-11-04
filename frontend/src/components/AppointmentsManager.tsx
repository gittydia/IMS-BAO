import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Plus, Search, Edit, Trash2, Eye, Calendar } from "lucide-react";
import { toast } from "sonner";

interface AppointmentsManagerProps {
  userRole: string;
  userName: string;
}

interface Appointment {
  id: string;
  appointmentNumber: string;
  studentName: string;
  email: string;
  purpose: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes: string;
}

const initialAppointments: Appointment[] = [
  {
    id: "1",
    appointmentNumber: "APT-2025-001",
    studentName: "Juan Dela Cruz",
    email: "juan.delacruz@rtu.edu.ph",
    purpose: "ID Card Pickup",
    date: "2025-11-05",
    time: "10:00 AM",
    status: "confirmed",
    notes: "Bring 2 valid IDs for verification",
  },
  {
    id: "2",
    appointmentNumber: "APT-2025-002",
    studentName: "Maria Santos",
    email: "maria.santos@rtu.edu.ph",
    purpose: "Uniform Fitting",
    date: "2025-11-06",
    time: "2:00 PM",
    status: "pending",
    notes: "Female uniform size measurement",
  },
  {
    id: "3",
    appointmentNumber: "APT-2025-003",
    studentName: "Pedro Reyes",
    email: "pedro.reyes@rtu.edu.ph",
    purpose: "Document Request",
    date: "2025-11-04",
    time: "9:00 AM",
    status: "completed",
    notes: "Transcript of records claimed",
  },
  {
    id: "4",
    appointmentNumber: "APT-2025-004",
    studentName: "Anna Cruz",
    email: "anna.cruz@rtu.edu.ph",
    purpose: "Payment Processing",
    date: "2025-11-07",
    time: "11:00 AM",
    status: "confirmed",
    notes: "School fees payment",
  },
  {
    id: "5",
    appointmentNumber: "APT-2025-005",
    studentName: "Carlo Mendoza",
    email: "carlo.mendoza@rtu.edu.ph",
    purpose: "ID Card Inquiry",
    date: "2025-11-03",
    time: "3:00 PM",
    status: "cancelled",
    notes: "Student cancelled - rescheduled",
  },
];

export function AppointmentsManager({ userRole, userName }: AppointmentsManagerProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState<Omit<Appointment, "id" | "appointmentNumber">>({
    studentName: "",
    email: "",
    purpose: "",
    date: new Date().toISOString().split("T")[0],
    time: "09:00 AM",
    status: "pending",
    notes: "",
  });

  const statuses = ["all", "pending", "confirmed", "completed", "cancelled"];
  
  const purposeOptions = [
    "ID Card Pickup",
    "ID Card Inquiry",
    "Uniform Fitting",
    "Uniform Pickup",
    "Document Request",
    "Payment Processing",
    "General Inquiry",
    "Other",
  ];

  const timeSlots = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM",
  ];

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.appointmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.purpose.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenDialog = (appointment?: Appointment) => {
    if (appointment) {
      setEditingAppointment(appointment);
      setFormData({
        studentName: appointment.studentName,
        email: appointment.email,
        purpose: appointment.purpose,
        date: appointment.date,
        time: appointment.time,
        status: appointment.status,
        notes: appointment.notes,
      });
    } else {
      setEditingAppointment(null);
      setFormData({
        studentName: userRole === "student" ? userName : "",
        email: "",
        purpose: "ID Card Pickup",
        date: new Date().toISOString().split("T")[0],
        time: "09:00 AM",
        status: "pending",
        notes: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAppointment(null);
  };

  const handleViewAppointment = (appointment: Appointment) => {
    setViewingAppointment(appointment);
    setIsViewDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingAppointment) {
      setAppointments(
        appointments.map((a) =>
          a.id === editingAppointment.id
            ? { ...formData, id: a.id, appointmentNumber: a.appointmentNumber }
            : a
        )
      );
      toast.success("Appointment updated successfully!");
    } else {
      const newAppointment: Appointment = {
        ...formData,
        id: Date.now().toString(),
        appointmentNumber: `APT-2025-${String(appointments.length + 1).padStart(3, "0")}`,
      };
      setAppointments([...appointments, newAppointment]);
      toast.success("Appointment booked successfully!");
    }

    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    setAppointments(appointments.filter((a) => a.id !== id));
    toast.success("Appointment cancelled successfully!");
  };

  const getStatusColor = (
    status: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "completed":
        return "default";
      case "confirmed":
        return "secondary";
      case "pending":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-gray-900 mb-2">Appointments Scheduling</h1>
          <p className="text-gray-600">
            {userRole === "student"
              ? "Schedule appointments for BAO services and visit bookings."
              : "Manage and track student appointments for BAO services."}
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          {userRole === "student" ? "Book Appointment" : "Add Appointment"}
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search appointments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="status-filter" className="whitespace-nowrap">
            Status:
          </Label>
          <select
            id="status-filter"
            className="px-3 py-2 border border-gray-300 rounded-md"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Appointment #</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAppointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No appointments found.
                </TableCell>
              </TableRow>
            ) : (
              filteredAppointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    <span className="text-gray-900">{appointment.appointmentNumber}</span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-gray-900">{appointment.studentName}</div>
                      <div className="text-sm text-gray-500">{appointment.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-700">{appointment.purpose}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-gray-900">{appointment.date}</div>
                      <div className="text-sm text-gray-500">{appointment.time}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewAppointment(appointment)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(appointment)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(appointment.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Appointment Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>Complete information about this appointment.</DialogDescription>
          </DialogHeader>
          {viewingAppointment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Appointment Number</Label>
                  <p className="text-gray-900">{viewingAppointment.appointmentNumber}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Status</Label>
                  <div className="mt-1">
                    <Badge variant={getStatusColor(viewingAppointment.status)}>
                      {viewingAppointment.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-gray-600">Student</Label>
                <p className="text-gray-900">{viewingAppointment.studentName}</p>
                <p className="text-sm text-gray-500">{viewingAppointment.email}</p>
              </div>
              <div>
                <Label className="text-gray-600">Purpose</Label>
                <p className="text-gray-900">{viewingAppointment.purpose}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Date</Label>
                  <p className="text-gray-900">{viewingAppointment.date}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Time</Label>
                  <p className="text-gray-900">{viewingAppointment.time}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-600">Notes</Label>
                <p className="text-gray-900">{viewingAppointment.notes || "No notes"}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAppointment ? "Edit Appointment" : "Book New Appointment"}
            </DialogTitle>
            <DialogDescription>
              {editingAppointment
                ? "Update the appointment information below."
                : "Schedule a new appointment with the BAO office."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="studentName">Student Name</Label>
                <Input
                  id="studentName"
                  placeholder="Juan Dela Cruz"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  required
                  disabled={userRole === "student"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apt-email">Student Email</Label>
                <Input
                  id="apt-email"
                  type="email"
                  placeholder="student@rtu.edu.ph"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose of Visit</Label>
                <select
                  id="purpose"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  required
                >
                  {purposeOptions.map((purpose) => (
                    <option key={purpose} value={purpose}>
                      {purpose}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apt-date">Date</Label>
                  <Input
                    id="apt-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <select
                    id="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  >
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {(userRole === "admin" || userRole === "staff") && (
                <div className="space-y-2">
                  <Label htmlFor="apt-status">Status</Label>
                  <select
                    id="apt-status"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as Appointment["status"],
                      })
                    }
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information or special requirements..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">{editingAppointment ? "Update" : "Book"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
