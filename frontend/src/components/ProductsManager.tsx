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
import { Plus, Search, Edit, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import * as api from "../lib/api";
import { ImageWithFallback } from "./fallback/ImageWithFallback";

export function ProductsManager() {
  const [products, setProducts] = useState<api.Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<api.Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<api.Product | null>(null);
  const [selectedProductForUniform, setSelectedProductForUniform] = useState<api.Product | null>(null);
  const [isUniformDialogOpen, setIsUniformDialogOpen] = useState(false);
  const [uniforms, setUniforms] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    productName: "",
    productCategory: "ID & Cards",
    price: 0,
    quantity: 0,
    imageUrl: "",
  });
  const [uniformFormData, setUniformFormData] = useState({
    sizeType: "M",
    gender: "Unisex",
    type: "Standard Uniform",
    piece: "Shirt",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (error) {
      toast.error("Failed to load products");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUniforms = async (productId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/uniforms/${productId}`, {
        headers: {
          'X-Session-Id': localStorage.getItem('session_id') || '',
        },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUniforms(data);
      }
    } catch (error) {
      console.error("Failed to load uniforms:", error);
    }
  };

  const handleOpenUniformDialog = (product: api.Product) => {
    setSelectedProductForUniform(product);
    loadUniforms(product.productId);
    setUniformFormData({
      sizeType: "M",
      gender: "Unisex",
      type: "Standard Uniform",
      piece: "Shirt",
    });
    setIsUniformDialogOpen(true);
  };

  const handleSubmitUniform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForUniform) return;

    try {
      const response = await fetch('http://localhost:8000/uniforms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': localStorage.getItem('session_id') || '',
        },
        credentials: 'include',
        body: JSON.stringify({
          productId: selectedProductForUniform.productId,
          ...uniformFormData,
        }),
      });

      if (!response.ok) throw new Error('Failed to create uniform');
      
      toast.success("Uniform variant created successfully!");
      setUniformFormData({
        sizeType: "M",
        gender: "Unisex",
        type: "Standard Uniform",
        piece: "Shirt",
      });
      loadUniforms(selectedProductForUniform.productId);
    } catch (error) {
      toast.error("Failed to create uniform variant");
      console.error(error);
    }
  };

  const handleDeleteUniform = async (uniformId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/uniforms/${uniformId}`, {
        method: 'DELETE',
        headers: {
          'X-Session-Id': localStorage.getItem('session_id') || '',
        },
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete uniform');
      
      toast.success("Uniform variant deleted successfully!");
      if (selectedProductForUniform) {
        loadUniforms(selectedProductForUniform.productId);
      }
    } catch (error) {
      toast.error("Failed to delete uniform variant");
      console.error(error);
    }
  };

  const getStatus = (stock: number): string => {
    if (stock === 0) return "out of stock";
    if (stock <= 10) return "low stock";
    return "in stock";
  };

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.productCategory)))];
  const statuses = ["all", "in stock", "low stock", "out of stock"];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.productCategory.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.productCategory === categoryFilter;
    const productStatus = getStatus(product.quantity);
    const matchesStatus = statusFilter === "all" || productStatus === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleOpenDialog = (product?: api.Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        productName: product.productName,
        productCategory: product.productCategory,
        price: typeof product.price === "string" ? parseFloat(product.price) : product.price,
        quantity: product.quantity,
        imageUrl: product.imageUrl || "",
      });
      setImagePreview(product.imageUrl || "");
      setSelectedImage(null);
    } else {
      setEditingProduct(null);
      setFormData({
        productName: "",
        productCategory: "ID & Cards",
        price: 0,
        quantity: 0,
        imageUrl: "",
      });
      setImagePreview("");
      setSelectedImage(null);
      // Reset uniform form data for new product
      setUniformFormData({
        sizeType: "M",
        gender: "Unisex",
        type: "Standard Uniform",
        piece: "Shirt",
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setSelectedImage(null);
    setImagePreview("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload an image (JPEG, PNG, WebP, or GIF).');
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds 5MB limit.');
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage) return null;
    
    try {
      const formData = new FormData();
      formData.append('file', selectedImage);
      
      const sessionId = localStorage.getItem('session_id'); // Fixed: use 'session_id' not 'sessionId'
      const response = await fetch('http://localhost:8000/upload-image', {
        method: 'POST',
        headers: {
          'X-Session-Id': sessionId || '',
        },
        credentials: 'include',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let imageUrl = formData.imageUrl;
      
      // Upload image if a new one was selected
      if (selectedImage) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          // If upload failed, stop the submission
          return;
        }
      }

      // Auto-calculate status based on quantity
      const status = getStatus(formData.quantity);
      
      // Generate product name for uniforms
      let productName = formData.productName;
      if (formData.productCategory === "Uniform") {
        if (uniformFormData.type === "Standard Uniform") {
          productName = `${uniformFormData.gender} ${uniformFormData.type} ${uniformFormData.piece} ${uniformFormData.sizeType}`;
        } else {
          productName = `${uniformFormData.type} ${uniformFormData.piece} ${uniformFormData.sizeType}`;
        }
      }
      
      let newProduct = null;
      
      if (editingProduct) {
        await api.updateProduct(editingProduct.productId, { ...formData, status, imageUrl, productName });
        toast.success("Product updated successfully!");
      } else {
        const createdProduct = await api.createProduct(productName, formData.productCategory, formData.price, formData.quantity, status, imageUrl);
        newProduct = createdProduct;
        toast.success("Product created successfully!");
        
        // If it's a Uniform, also create a uniform variant
        if (formData.productCategory === "Uniform" && createdProduct) {
          try {
            const response = await fetch('http://localhost:8000/uniforms', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Session-Id': localStorage.getItem('session_id') || '',
              },
              credentials: 'include',
              body: JSON.stringify({
                productId: createdProduct.productId,
                sizeType: uniformFormData.sizeType,
                gender: uniformFormData.type === "PE" ? "Unisex" : uniformFormData.gender,
                type: uniformFormData.type,
              }),
            });

            if (response.ok) {
              toast.success("Uniform variant created!");
            }
          } catch (error) {
            console.error("Failed to create uniform variant:", error);
            // Don't fail the product creation if uniform variant fails
          }
        }
      }
      
      handleCloseDialog();
      loadProducts();
    } catch (error) {
      toast.error(editingProduct ? "Failed to update product" : "Failed to create product");
      console.error(error);
    }
  };

  const handleDeleteClick = (product: api.Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await api.deleteProduct(productToDelete.productId);
      toast.success("Product deleted successfully!");
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
      loadProducts();
    } catch (error) {
      toast.error("Failed to delete product");
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "available":
      case "in stock": return "default";
      case "limited stock":
      case "low stock": return "secondary";
      case "out of stock": return "destructive";
      default: return "default";
    }
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
          <h1 className="text-gray-900 mb-2">Inventory Management</h1>
          <p className="text-gray-600">Manage BAO inventory items, uniforms, documents, and supplies.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </div>

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
          <Label htmlFor="category-filter" className="whitespace-nowrap">Category:</Label>
          <select
            id="category-filter"
            className="px-3 py-2 border border-gray-300 rounded-md"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="status-filter" className="whitespace-nowrap">Status:</Label>
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
                <TableRow key={product.productId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {product.imageUrl ? (
                          <ImageWithFallback 
                            src={`http://localhost:8000${product.imageUrl}`}
                            alt={product.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-green-700" />
                        )}
                      </div>
                      <div>
                        <div className="text-gray-900">{product.productName}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.productCategory}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-900">₱{Number(product.price).toFixed(2)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-900">{product.quantity} units</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(product.status)}>{product.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(product)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      {product.productCategory === "Uniform" && (
                        <Button variant="ghost" size="sm" onClick={() => handleOpenUniformDialog(product)}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(product)}>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Inventory Item" : "Add New Item"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Update the item information below." : "Add a new item to BAO inventory."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {formData.productCategory !== "Uniform" && (
                <div className="space-y-2">
                  <Label htmlFor="product-name">Item Name</Label>
                  <Input
                    id="product-name"
                    placeholder="RTU Student ID Card"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    required
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₱)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.price || ""}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    placeholder="0"
                    value={formData.quantity || ""}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.productCategory}
                  onChange={(e) => setFormData({ ...formData, productCategory: e.target.value })}
                  required
                >
                  <option value="Book">Book</option>
                  <option value="Uniform">Uniform</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Uniform-specific fields */}
              {formData.productCategory === "Uniform" && (
                <div className="space-y-4 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900">Uniform Options</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="uniform-type">Type</Label>
                      <select
                        id="uniform-type"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        value={uniformFormData.type}
                        onChange={(e) => {
                          const newType = e.target.value;
                          setUniformFormData({
                            ...uniformFormData,
                            type: newType,
                            piece: (newType === "PE" || newType === "NSTP") ? "Shirt" : uniformFormData.piece
                          });
                        }}
                      >
                        <option value="Standard Uniform">Standard Uniform</option>
                        <option value="PE">PE</option>
                        <option value="NSTP">NSTP</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="uniform-piece">Piece Type</Label>
                      <select
                        id="uniform-piece"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        value={uniformFormData.piece}
                        onChange={(e) => setUniformFormData({ ...uniformFormData, piece: e.target.value })}
                      >
                        <option value="Shirt">Shirt</option>
                        <option value="Pants">Pants</option>
                        <option value="Polo">Polo</option>
                        <option value="Skirt">Skirt</option>
                      </select>
                    </div>
                    {uniformFormData.type === "Standard Uniform" && (
                      <div className="space-y-2">
                        <Label htmlFor="uniform-gender">Gender</Label>
                        <select
                          id="uniform-gender"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          value={uniformFormData.gender}
                          onChange={(e) => setUniformFormData({ ...uniformFormData, gender: e.target.value })}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="uniform-size">Size</Label>
                      <select
                        id="uniform-size"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        value={uniformFormData.sizeType}
                        onChange={(e) => setUniformFormData({ ...uniformFormData, sizeType: e.target.value })}
                      >
                        <option value="XS">XS</option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                        <option value="XXL">XXL</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="productImage">Product Image (Optional)</Label>
                <Input
                  id="productImage"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleImageChange}
                  className="cursor-pointer"
                />
                
                {/* Image Preview - Inline and small */}
                {imagePreview && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-16 h-16 border border-gray-300 rounded overflow-hidden bg-white flex-shrink-0">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-xs text-gray-500">Image selected</p>
                  </div>
                )}
                
                {!imagePreview && (
                  <p className="text-xs text-gray-500">Max 5MB. JPEG, PNG, WebP, GIF</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>Cancel</Button>
              <Button type="submit">{editingProduct ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-gray-900">"{productToDelete?.productName}"</span>? This action cannot be undone.
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

      {/* Uniform Variants Dialog */}
      <Dialog open={isUniformDialogOpen} onOpenChange={setIsUniformDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Uniform Variants - {selectedProductForUniform?.productName}</DialogTitle>
            <DialogDescription>
              Create and manage uniform variants with different sizes and styles.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Add New Variant Form */}
            <div className="border-b pb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Add New Variant</h3>
              <form onSubmit={handleSubmitUniform} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="size">Size</Label>
                    <select
                      id="size"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      value={uniformFormData.sizeType}
                      onChange={(e) => setUniformFormData({ ...uniformFormData, sizeType: e.target.value })}
                    >
                      <option value="XS">XS</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      id="gender"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      value={uniformFormData.gender}
                      onChange={(e) => setUniformFormData({ ...uniformFormData, gender: e.target.value })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Unisex">Unisex</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <select
                      id="type"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      value={uniformFormData.type}
                      onChange={(e) => setUniformFormData({ ...uniformFormData, type: e.target.value })}
                    >
                      <option value="Standard Uniform">Standard Uniform</option>
                      <option value="PE">PE</option>
                    </select>
                  </div>
                </div>
                <Button type="submit" className="w-full" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Variant
                </Button>
              </form>
            </div>

            {/* Existing Variants List */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Existing Variants ({uniforms.length})</h3>
              {uniforms.length === 0 ? (
                <p className="text-gray-500 text-sm">No variants yet. Create one above.</p>
              ) : (
                <div className="space-y-2">
                  {uniforms.map((uniform) => (
                    <div key={uniform.uniformId} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {uniform.type} • {uniform.gender} • Size {uniform.sizeType}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUniform(uniform.uniformId)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsUniformDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
