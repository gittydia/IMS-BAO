import { useState, useEffect } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
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
import * as api from "../lib/api";

interface OrdersManagerProps {
  userRole: string;
  userName: string;
}

export function OrdersManager({ userRole, userName }: OrdersManagerProps) {
  const [orders, setOrders] = useState<api.Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<api.Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<api.Order | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<api.Order | null>(null);
  const [products, setProducts] = useState<api.Product[]>([]);
  const [formData, setFormData] = useState({
    productId: 0,
    dateToClaim: new Date().toISOString().split("T")[0],
    status: "pending",
    amount: 0,
  });

  const statuses = ["all", "pending", "processing", "ready", "claimed", "cancelled"];

  useEffect(() => {
    loadOrders();
    loadProducts();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const data = await api.getOrders();
      setOrders(data);
    } catch (error) {
      toast.error("Failed to load orders");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to load products", error);
    }
  };

  const filteredOrders = orders.filter((order) => {
    // If student, only show their own orders
    if (userRole === "student") {
      const isStudentOrder = order.transactions && order.transactions.length > 0 && 
        order.transactions.some(t => t.student && 
          t.student.firstname && 
          `${t.student.firstname} ${t.student.lastname}`.toLowerCase().includes(userName.toLowerCase())
        );
      if (!isStudentOrder) return false;
    }

    const matchesSearch =
      String(order.orderId).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || order.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const handleOpenDialog = (order?: api.Order) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        productId: order.productId,
        dateToClaim: order.dateToClaim,
        status: order.status,
        amount: typeof order.amount === "string" ? parseFloat(order.amount) : order.amount,
      });
    } else {
      setEditingOrder(null);
      setFormData({
        productId: 0,
        dateToClaim: new Date().toISOString().split("T")[0],
        status: "pending",
        amount: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingOrder(null);
  };

  const handleViewOrder = (order: api.Order) => {
    setViewingOrder(order);
    setIsViewDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOrder) {
        await api.updateOrder(editingOrder.orderId, {
          dateToClaim: formData.dateToClaim,
          status: formData.status,
          amount: formData.amount,
        });
        toast.success("Order updated successfully!");
      } else {
        await api.createOrder(formData.productId, formData.dateToClaim, formData.amount, formData.status);
        toast.success("Order created successfully!");
      }
      handleCloseDialog();
      loadOrders();
    } catch (error) {
      toast.error(editingOrder ? "Failed to update order" : "Failed to create order");
      console.error(error);
    }
  };

  const handleDeleteClick = (order: api.Order) => {
    setOrderToDelete(order);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    try {
      await api.deleteOrder(orderToDelete.orderId);
      toast.success("Order deleted successfully!");
      setIsDeleteDialogOpen(false);
      setOrderToDelete(null);
      loadOrders();
    } catch (error) {
      toast.error("Failed to delete order");
      console.error(error);
    }
  };

  const getStatusColor = (
    status: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status?.toLowerCase()) {
      case "claimed":
        return "default";
      case "ready":
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

  const getProductName = (productId: number) => {
    return products.find(p => p.productId === productId)?.productName || "Unknown Product";
  };

  const getStudentInfo = (order: api.Order) => {
    if (order.transactions && order.transactions.length > 0 && order.transactions[0].student) {
      const student = order.transactions[0].student;
      return `${student.firstname} ${student.lastname}`;
    }
    return "N/A";
  };

  const getStudentEmail = (order: api.Order) => {
    if (order.transactions && order.transactions.length > 0 && order.transactions[0].student?.authUser) {
      return order.transactions[0].student.authUser.email;
    }
    return "N/A";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-gray-900 mb-2">
            {userRole === "student" ? "My Orders" : "Orders Management"}
          </h1>
          <p className="text-gray-600">
            {userRole === "student" 
              ? "View and track your orders for uniforms, IDs, and documents."
              : "Track and process all student orders for BAO items."}
          </p>
        </div>
        {userRole !== "student" && (
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Order
          </Button>
        )}
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
              <TableHead>Order ID</TableHead>
              {userRole !== "student" && <TableHead>Student</TableHead>}
              <TableHead>Product</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Claim Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={userRole === "student" ? 6 : 7} className="text-center py-8 text-gray-500">
                  {userRole === "student" ? "No orders yet. Start shopping!" : "No orders found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.orderId}>
                  <TableCell>
                    <span className="text-gray-900 font-medium">BAO-{String(order.orderId).padStart(4, "0")}</span>
                  </TableCell>
                  {userRole !== "student" && (
                    <TableCell>
                      <div>
                        <p className="text-gray-900 font-medium">{getStudentInfo(order)}</p>
                        <p className="text-xs text-gray-500">{getStudentEmail(order)}</p>
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    <span className="text-gray-700">{getProductName(order.productId)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-900 font-medium">₱{Number(order.amount).toFixed(2)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600">
                      {new Date(order.dateToClaim).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(order.status)}>{order.status}</Badge>
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
                      {userRole !== "student" && (
                        <>
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
                            onClick={() => handleDeleteClick(order)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </>
                      )}
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
                  <Label className="text-gray-600">Order ID</Label>
                  <p className="text-gray-900 font-medium">BAO-{String(viewingOrder.orderId).padStart(4, "0")}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Claim Date</Label>
                  <p className="text-gray-900">{new Date(viewingOrder.dateToClaim).toLocaleDateString()}</p>
                </div>
              </div>
              {userRole !== "student" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Student Name</Label>
                    <p className="text-gray-900">{getStudentInfo(viewingOrder)}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Student Email</Label>
                    <p className="text-gray-900">{getStudentEmail(viewingOrder)}</p>
                  </div>
                </div>
              )}
              <div>
                <Label className="text-gray-600">Product</Label>
                <p className="text-gray-900">{getProductName(viewingOrder.productId)}</p>
              </div>
              <div>
                <Label className="text-gray-600">Amount</Label>
                <p className="text-gray-900 font-medium">₱{Number(viewingOrder.amount).toFixed(2)}</p>
              </div>
              {viewingOrder.dateClaimed && (
                <div>
                  <Label className="text-gray-600">Claimed Date</Label>
                  <p className="text-gray-900">{new Date(viewingOrder.dateClaimed).toLocaleDateString()}</p>
                </div>
              )}
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
                <Label htmlFor="order-product">Product</Label>
                <select
                  id="order-product"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: parseInt(e.target.value) })}
                  required
                >
                  <option value={0}>Select a product</option>
                  {products.map((product) => (
                    <option key={product.productId} value={product.productId}>
                      {product.productName} - ₱{Number(product.price).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="claim-date">Claim Date</Label>
                  <Input
                    id="claim-date"
                    type="date"
                    value={formData.dateToClaim}
                    onChange={(e) => setFormData({ ...formData, dateToClaim: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₱)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount || ""}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="order-status">Status</Label>
                <select
                  id="order-status"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value,
                    })
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="ready">Ready</option>
                  <option value="claimed">Claimed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-gray-900">order #{orderToDelete?.orderId}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
