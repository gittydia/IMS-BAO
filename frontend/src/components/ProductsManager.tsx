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
import { Plus, Search, Edit, Trash2, Package } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  status: "in stock" | "low stock" | "out of stock";
}

const initialProducts: Product[] = [
  {
    id: "1",
    name: "RTU Student ID Card",
    description: "Official RTU identification card with chip",
    price: 150.00,
    stock: 245,
    category: "ID & Cards",
    status: "in stock",
  },
  {
    id: "2",
    name: "University Uniform (Male)",
    description: "Standard male uniform - polo shirt and pants",
    price: 850.00,
    stock: 8,
    category: "Uniforms",
    status: "low stock",
  },
  {
    id: "3",
    name: "University Uniform (Female)",
    description: "Standard female uniform - blouse and skirt",
    price: 850.00,
    stock: 15,
    category: "Uniforms",
    status: "in stock",
  },
  {
    id: "4",
    name: "PE Uniform Set",
    description: "Complete PE uniform with RTU logo",
    price: 450.00,
    stock: 0,
    category: "Uniforms",
    status: "out of stock",
  },
  {
    id: "5",
    name: "Certificate of Enrollment",
    description: "Official enrollment certificate (per copy)",
    price: 50.00,
    stock: 500,
    category: "Documents",
    status: "in stock",
  },
  {
    id: "6",
    name: "Transcript of Records",
    description: "Official transcript (per copy)",
    price: 100.00,
    stock: 300,
    category: "Documents",
    status: "in stock",
  },
  {
    id: "7",
    name: "School Supplies Kit",
    description: "Basic school supplies bundle",
    price: 350.00,
    stock: 45,
    category: "Supplies",
    status: "in stock",
  },
  {
    id: "8",
    name: "RTU Lanyard",
    description: "Official RTU lanyard for ID card",
    price: 75.00,
    stock: 7,
    category: "ID & Cards",
    status: "low stock",
  },
];

export function ProductsManager() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Omit<Product, "id" | "status">>({
    name: "",
    description: "",
    price: 0,
    stock: 0,
    category: "Electronics",
  });

  const getStatus = (stock: number): "in stock" | "low stock" | "out of stock" => {
    if (stock === 0) return "out of stock";
    if (stock <= 10) return "low stock";
    return "in stock";
  };

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        category: product.category,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        price: 0,
        stock: 0,
        category: "Electronics",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const status = getStatus(formData.stock);

    if (editingProduct) {
      setProducts(
        products.map((p) =>
          p.id === editingProduct.id ? { ...formData, id: p.id, status } : p
        )
      );
      toast.success("Product updated successfully!");
    } else {
      const newProduct: Product = {
        ...formData,
        id: Date.now().toString(),
        status,
      };
      setProducts([...products, newProduct]);
      toast.success("Product created successfully!");
    }

    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
    toast.success("Product deleted successfully!");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in stock":
        return "default";
      case "low stock":
        return "secondary";
      case "out of stock":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-gray-900 mb-2">Inventory Management</h1>
          <p className="text-gray-600">Manage BAO inventory items, uniforms, documents, and supplies.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search inventory items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="category-filter" className="whitespace-nowrap">
            Category:
          </Label>
          <select
            id="category-filter"
            className="px-3 py-2 border border-gray-300 rounded-md"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price (₱)</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-green-700" />
                      </div>
                      <div>
                        <div className="text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.description}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-900">₱{product.price.toFixed(2)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-900">{product.stock} units</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(product.status)}>{product.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(product)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Inventory Item" : "Add New Item"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Update the item information below."
                : "Add a new item to BAO inventory."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">Item Name</Label>
                <Input
                  id="product-name"
                  placeholder="RTU Student ID Card"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Official RTU identification card..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₱)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.price || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    placeholder="0"
                    value={formData.stock || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="ID & Cards">ID & Cards</option>
                  <option value="Uniforms">Uniforms</option>
                  <option value="Documents">Documents</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">{editingProduct ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
