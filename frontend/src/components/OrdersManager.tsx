import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
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
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

interface OrdersManagerProps {
  userRole: string;
  userName: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  email: string;
  product: string;
  quantity: number;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  date: string;
}

const initialOrders: Order[] = [
  {
    id: "1",
    orderNumber: "BAO-2025-001",
    customer: "Juan Dela Cruz",
    email: "juan.delacruz@rtu.edu.ph",
    product: "RTU Student ID Card",
    quantity: 1,
    total: 150.00,
    status: "delivered",
    date: "2025-10-28",
  },
  {
    id: "2",
    orderNumber: "BAO-2025-002",
    customer: "Maria Santos",
    email: "maria.santos@rtu.edu.ph",
    product: "University Uniform (Female)",
    quantity: 2,
    total: 1700.00,
    status: "shipped",
    date: "2025-11-01",
  },
  {
    id: "3",
    orderNumber: "BAO-2025-003",
    customer: "Pedro Reyes",
    email: "pedro.reyes@rtu.edu.ph",
    product: "Certificate of Enrollment",
    quantity: 3,
    total: 150.00,
    status: "processing",
    date: "2025-11-02",
  },
  {
    id: "4",
    orderNumber: "BAO-2025-004",
    customer: "Anna Cruz",
    email: "anna.cruz@rtu.edu.ph",
    product: "Transcript of Records",
    quantity: 2,
    total: 200.00,
    status: "pending",
    date: "2025-11-04",
  },
  {
    id: "5",
    orderNumber: "BAO-2025-005",
    customer: "Carlo Mendoza",
    email: "carlo.mendoza@rtu.edu.ph",
    product: "PE Uniform Set",
    quantity: 1,
    total: 450.00,
    status: "cancelled",
    date: "2025-10-30",
  },
];

export function OrdersManager({ userRole, userName }: OrdersManagerProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState<Omit<Order, "id" | "orderNumber">>({
    customer: "",
    email: "",
    product: "",
    quantity: 1,
    total: 0,
    status: "pending",
    date: new Date().toISOString().split("T")[0],
  });

  const statuses = ["all", "pending", "processing", "shipped", "delivered", "cancelled"];

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenDialog = (order?: Order) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        customer: order.customer,
        email: order.email,
        product: order.product,
        quantity: order.quantity,
        total: order.total,
        status: order.status,
        date: order.date,
      });
    } else {
      setEditingOrder(null);
      setFormData({
        customer: "",
        email: "",
        product: "",
        quantity: 1,
        total: 0,
        status: "pending",
        date: new Date().toISOString().split("T")[0],
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingOrder(null);
  };

  const handleViewOrder = (order: Order) => {
    setViewingOrder(order);
    setIsViewDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingOrder) {
      setOrders(
        orders.map((o) =>
          o.id === editingOrder.id
            ? { ...formData, id: o.id, orderNumber: o.orderNumber }
            : o
        )
      );
      toast.success("Order updated successfully!");
    } else {
      const newOrder: Order = {
        ...formData,
        id: Date.now().toString(),
        orderNumber: `BAO-2025-${String(orders.length + 1).padStart(3, "0")}`,
      };
      setOrders([...orders, newOrder]);
      toast.success("Order placed successfully!");
    }

    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    setOrders(orders.filter((o) => o.id !== id));
    toast.success("Order deleted successfully!");
  };

  const getStatusColor = (
    status: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "delivered":
        return "default";
      case "shipped":
        return "secondary";
      case "processing":
        return "outline";
      case "pending":
        return "secondary";
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
          <h1 className="text-gray-900 mb-2">Orders Management</h1>
          <p className="text-gray-600">
            {userRole === "student" 
              ? "View and track your BAO orders for uniforms, IDs, and documents."
              : "Track and process student orders for BAO items."}
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          {userRole === "student" ? "Place Order" : "Add Order"}
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search orders..."
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

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <span className="text-gray-900">{order.orderNumber}</span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-gray-900">{order.customer}</div>
                      <div className="text-sm text-gray-500">{order.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-700">{order.product}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-900">{order.quantity}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-900">₱{order.total.toFixed(2)}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(order.status)}>{order.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600">{order.date}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewOrder(order)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(order)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(order.id)}
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

      {/* View Order Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>Complete information about this order.</DialogDescription>
          </DialogHeader>
          {viewingOrder && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Order Number</Label>
                  <p className="text-gray-900">{viewingOrder.orderNumber}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Date</Label>
                  <p className="text-gray-900">{viewingOrder.date}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-600">Customer</Label>
                <p className="text-gray-900">{viewingOrder.customer}</p>
                <p className="text-sm text-gray-500">{viewingOrder.email}</p>
              </div>
              <div>
                <Label className="text-gray-600">Product</Label>
                <p className="text-gray-900">{viewingOrder.product}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Quantity</Label>
                  <p className="text-gray-900">{viewingOrder.quantity} units</p>
                </div>
                <div>
                  <Label className="text-gray-600">Total</Label>
                  <p className="text-gray-900">₱{viewingOrder.total.toFixed(2)}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-600">Status</Label>
                <div className="mt-1">
                  <Badge variant={getStatusColor(viewingOrder.status)}>
                    {viewingOrder.status}
                  </Badge>
                </div>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingOrder ? "Edit Order" : "Create New Order"}</DialogTitle>
            <DialogDescription>
              {editingOrder
                ? "Update the order information below."
                : "Add a new order to the system."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Student Name</Label>
                <Input
                  id="customer"
                  placeholder="Juan Dela Cruz"
                  value={formData.customer}
                  onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order-email">Student Email</Label>
                <Input
                  id="order-email"
                  type="email"
                  placeholder="student@rtu.edu.ph"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order-product">Item</Label>
                <select
                  id="order-product"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  required
                >
                  <option value="">Select an item</option>
                  <option value="RTU Student ID Card">RTU Student ID Card - ₱150.00</option>
                  <option value="University Uniform (Male)">University Uniform (Male) - ₱850.00</option>
                  <option value="University Uniform (Female)">University Uniform (Female) - ₱850.00</option>
                  <option value="PE Uniform Set">PE Uniform Set - ₱450.00</option>
                  <option value="Certificate of Enrollment">Certificate of Enrollment - ₱50.00</option>
                  <option value="Transcript of Records">Transcript of Records - ₱100.00</option>
                  <option value="School Supplies Kit">School Supplies Kit - ₱350.00</option>
                  <option value="RTU Lanyard">RTU Lanyard - ₱75.00</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={formData.quantity || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total">Total (₱)</Label>
                  <Input
                    id="total"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.total || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, total: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="order-status">Status</Label>
                  <select
                    id="order-status"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as Order["status"],
                      })
                    }
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order-date">Date</Label>
                  <Input
                    id="order-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">{editingOrder ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
