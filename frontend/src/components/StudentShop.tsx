import { Card, CardContent } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useState, useEffect, useRef } from "react";
import { Package, Download } from "lucide-react";
import * as api from "../lib/api";
import { toast } from "sonner";

const API_BASE_URL = "http://localhost:8000";

interface OrderData {
  productId: number;
  quantity: number;
  claimDate: string;
  selectedSize?: string;
}

interface ConfirmedOrder {
  orderId: number;
  productName: string;
  quantity: number;
  totalAmount: number;
  claimDate: string;
  selectedSize?: string;
}

export function StudentShop() {
  const [products, setProducts] = useState<api.Product[]>([]);
  const [uniforms, setUniforms] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUniformGroup, setSelectedUniformGroup] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<api.Product | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);
  const [orderData, setOrderData] = useState<OrderData>({
    productId: 0,
    quantity: 1,
    claimDate: new Date().toISOString().split("T")[0],
    selectedSize: "",
  });
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProducts();
    loadUniforms();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to load products:", error);
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  const loadUniforms = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/uniforms`, {
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

  const categories = ["all", "Uniform", ...Array.from(new Set(products.filter(p => p.productCategory !== "Uniform").map((p) => p.productCategory)))];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.productCategory.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.productCategory === categoryFilter;
    const isInStock = product.quantity > 0;
    return matchesSearch && matchesCategory && isInStock && product.productCategory !== "Uniform";
  });

  // Separate books from other items
  const filteredBooks = filteredProducts.filter((product) => product.productCategory.toLowerCase() === "books");
  const filteredOtherItems = filteredProducts.filter((product) => product.productCategory.toLowerCase() !== "books");

  const filteredUniforms = uniforms.filter((uniform) => {
    const matchesSearch =
      uniform.product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      uniform.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || categoryFilter === "Uniform";
    return matchesSearch && matchesCategory;
  });

  // Group uniforms by type + gender combination
  const groupedUniforms = filteredUniforms.reduce((acc: any, uniform) => {
    const key = `${uniform.type}-${uniform.gender}`;
    if (!acc[key]) {
      acc[key] = {
        type: uniform.type,
        gender: uniform.gender,
        product: uniform.product,
        variants: []
      };
    }
    acc[key].variants.push(uniform);
    return acc;
  }, {});

  const uniformGroups = Object.values(groupedUniforms);

  const handleProductOrder = (product: api.Product) => {
    setSelectedProduct(product);
    setSelectedUniformGroup(null);
    setOrderData({
      productId: product.productId,
      quantity: 1,
      claimDate: new Date().toISOString().split("T")[0],
    });
    setShowOrderModal(true);
  };

  const handleUniformOrder = (uniformGroup: any) => {
    setSelectedUniformGroup(uniformGroup);
    setSelectedProduct(null);
    setOrderData({
      productId: uniformGroup.product.productId,
      quantity: 1,
      claimDate: new Date().toISOString().split("T")[0],
      selectedSize: "",
    });
    setShowOrderModal(true);
  };

  const handleSubmitOrder = async () => {
    if (selectedUniformGroup && !orderData.selectedSize) {
      toast.error("Please select a size");
      return;
    }

    try {
      const totalAmount = (selectedProduct?.price || selectedUniformGroup?.product.price) * orderData.quantity;
      
      const createdOrder = await api.createOrder(
        orderData.productId,
        orderData.claimDate,
        totalAmount,
        "pending"
      );

      // Store confirmed order details to display in ticket
      setConfirmedOrder({
        orderId: createdOrder.orderId,
        productName: selectedProduct?.productName || `${selectedUniformGroup?.gender} ${selectedUniformGroup?.type}`,
        quantity: orderData.quantity,
        totalAmount: totalAmount,
        claimDate: orderData.claimDate,
        selectedSize: orderData.selectedSize,
      });

      setShowOrderModal(false);
      setShowTicket(true);
      setSelectedProduct(null);
      setSelectedUniformGroup(null);
    } catch (error) {
      toast.error("Failed to place order");
      console.error(error);
    }
  };

  const handleDownloadTicket = async () => {
    if (!confirmedOrder || !ticketRef.current) return;

    try {
      // Import html2pdf dynamically
      const html2pdf = (await import('html2pdf.js')).default;
      const element = ticketRef.current;
      
      const options = {
        margin: 10,
        filename: `Order-${confirmedOrder.orderId.toString().padStart(6, '0')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { orientation: 'portrait' as const, unit: 'mm', format: 'a4' }
      };

      await html2pdf().set(options).from(element).save();
      toast.success('Ticket downloaded as PDF!');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download ticket. Please try again.');
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">RTU BAO Inventory</h1>
        <p className="text-gray-600">Get updates on PG product inventory from the Business Affairs Office.</p>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Search inventory items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="all">All Categories</option>
          {categories
            .filter((cat) => cat !== "all")
            .map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
        </select>
      </div>

      {/* Uniforms Section */}
      {uniformGroups.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Uniforms</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {uniformGroups.map((group: any) => (
              <Card
                key={`${group.type}-${group.gender}`}
                className="flex flex-col overflow-hidden rounded-lg shadow hover:shadow-lg transition-shadow"
                style={{ height: "600px" }}
              >
                {/* Image Container */}
                <div className="relative bg-gray-100 overflow-hidden flex-shrink-0" style={{ height: "400px" }}>
                  {group.product.imageUrl ? (
                    <img
                      src={`${API_BASE_URL}${group.product.imageUrl}`}
                      alt={`${group.type} ${group.gender}`}
                      className="w-full h-full object-cover absolute inset-0"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div
                      className="text-gray-400"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        width: "100%"
                      }}
                    >
                      <Package className="w-16 h-16 mb-2" />
                      <p className="text-sm">No Image</p>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <CardContent className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{group.gender} {group.type}</h3>
                    <p className="text-sm text-gray-600 mb-2">{group.product.productCategory}</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-blue-600">
                        ₱{parseFloat(group.product.price.toString()).toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleUniformOrder(group)}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Order Now
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Books Section */}
      {filteredBooks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Books</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredBooks.map((product) => (
              <Card
                key={product.productId}
                className="flex flex-col overflow-hidden rounded-lg shadow hover:shadow-lg transition-shadow"
                style={{ height: "600px" }}
              >
                {/* Image Container */}
                <div className="relative bg-gray-100 overflow-hidden flex-shrink-0" style={{ height: "400px" }}>
                  {product.imageUrl ? (
                    <img
                      src={`${API_BASE_URL}${product.imageUrl}`}
                      alt={product.productName}
                      className="w-full h-full object-cover absolute inset-0"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div 
                      className="text-gray-400"
                      style={{ 
                        display: "flex", 
                        flexDirection: "column",
                        alignItems: "center", 
                        justifyContent: "center",
                        height: "100%",
                        width: "100%"
                      }}
                    >
                      <Package className="w-16 h-16 mb-2" />
                      <p className="text-sm">No Image</p>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <CardContent className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{product.productName}</h3>
                    <p className="text-sm text-gray-600 mb-2">{product.productCategory}</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-blue-600">
                        ₱{parseFloat(product.price.toString()).toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500">{product.quantity} available</span>
                    </div>
                    <button
                      onClick={() => handleProductOrder(product)}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Order Now
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Other Items Section */}
      {filteredOtherItems.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Other Items</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredOtherItems.map((product) => (
              <Card
                key={product.productId}
                className="flex flex-col overflow-hidden rounded-lg shadow hover:shadow-lg transition-shadow"
                style={{ height: "600px" }}
              >
                {/* Image Container */}
                <div className="relative bg-gray-100 overflow-hidden flex-shrink-0" style={{ height: "400px" }}>
                  {product.imageUrl ? (
                    <img
                      src={`${API_BASE_URL}${product.imageUrl}`}
                      alt={product.productName}
                      className="w-full h-full object-cover absolute inset-0"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div 
                      className="text-gray-400"
                      style={{ 
                        display: "flex", 
                        flexDirection: "column",
                        alignItems: "center", 
                        justifyContent: "center",
                        height: "100%",
                        width: "100%"
                      }}
                    >
                      <Package className="w-16 h-16 mb-2" />
                      <p className="text-sm">No Image</p>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <CardContent className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{product.productName}</h3>
                    <p className="text-sm text-gray-600 mb-2">{product.productCategory}</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-blue-600">
                        ₱{parseFloat(product.price.toString()).toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500">{product.quantity} available</span>
                    </div>
                    <button
                      onClick={() => handleProductOrder(product)}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Order Now
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No products message */}
      {filteredBooks.length === 0 && filteredOtherItems.length === 0 && uniformGroups.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No products available matching your filters</p>
        </div>
      )}

      {/* Order Modal - Works for both uniforms and regular products */}
      <Dialog open={showOrderModal} onOpenChange={(open: boolean) => !open && setShowOrderModal(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedUniformGroup 
                ? `Order - ${selectedUniformGroup.gender} ${selectedUniformGroup.type}`
                : `Order - ${selectedProduct?.productName}`
              }
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Product Info */}
            <div className="flex gap-4 pb-2">
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                {(selectedProduct?.imageUrl || selectedUniformGroup?.product.imageUrl) ? (
                  <img
                    src={`${API_BASE_URL}${selectedProduct?.imageUrl || selectedUniformGroup?.product.imageUrl}`}
                    alt="product"
                    className="max-w-12 max-h-12 object-contain"
                  />
                ) : (
                  <Package className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedProduct?.productName || `${selectedUniformGroup?.gender} ${selectedUniformGroup?.type}`}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  ₱{parseFloat(((selectedProduct?.price || selectedUniformGroup?.product?.price) || 0).toString()).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Size Selection for Uniforms */}
            {selectedUniformGroup && (
              <div className="space-y-3 pt-4">
                <Label className="text-base font-semibold">Select Size & Stock</Label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedUniformGroup.variants.map((variant: any) => (
                    <button
                      key={variant.uniformId}
                      onClick={() => setOrderData({ ...orderData, selectedSize: variant.sizeType })}
                      className={`p-3 border-2 rounded-lg transition-colors text-left ${
                        orderData.selectedSize === variant.sizeType
                          ? "border-blue-600 bg-blue-50"
                          : "bg-gray-50 border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      <div className="font-medium text-sm">{variant.sizeType}</div>
                      <div className="text-xs text-gray-600">{variant.product?.quantity || 0} in stock</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-base font-semibold">Quantity</Label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOrderData({ ...orderData, quantity: Math.max(1, orderData.quantity - 1) })}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  −
                </button>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={orderData.quantity}
                  onChange={(e) => setOrderData({ ...orderData, quantity: parseInt(e.target.value) || 1 })}
                  className="w-16 text-center"
                />
                <button
                  onClick={() => setOrderData({ ...orderData, quantity: orderData.quantity + 1 })}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>

            {/* Claim Date */}
            <div className="space-y-3 pb-6 border-b border-gray-200">
              <Label htmlFor="claim-date" className="text-base font-semibold">Pickup Date</Label>
              <Input
                id="claim-date"
                type="date"
                value={orderData.claimDate}
                onChange={(e) => setOrderData({ ...orderData, claimDate: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 p-6 rounded-lg space-y-4 border">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Unit Price:</span>
                <span className="text-gray-900 font-medium">₱{parseFloat(((selectedProduct?.price || selectedUniformGroup?.product?.price) || 0).toString()).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Quantity:</span>
                <span className="text-gray-900 font-medium">{orderData.quantity}x</span>
              </div>
              <div className="border-t pt-4 flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total:</span>
                <span className="text-lg font-bold text-blue-600">
                  ₱{(parseFloat(((selectedProduct?.price || selectedUniformGroup?.product?.price) || 0).toString()) * orderData.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
            <Button variant="outline" onClick={() => setShowOrderModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitOrder} className="bg-blue-600 hover:bg-blue-700">
              Place Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Ticket/Confirmation Dialog */}
      <Dialog open={showTicket} onOpenChange={(open: boolean) => !open && setShowTicket(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold text-green-600">Order Confirmed!</DialogTitle>
          </DialogHeader>

          {confirmedOrder && (
            <div className="space-y-6 py-6" ref={ticketRef}>
              {/* Ticket Header */}
              <div className="border-2 border-green-500 rounded-lg p-6 bg-green-50">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 mb-2">Order Code</p>
                  <p className="text-4xl font-bold text-green-600 font-mono tracking-widest">
                    #{confirmedOrder.orderId.toString().padStart(6, '0')}
                  </p>
                </div>
              </div>

              {/* Order Details */}
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div className="border-b pb-3">
                  <p className="text-sm text-gray-600">Item</p>
                  <p className="font-semibold text-gray-900">{confirmedOrder.productName}</p>
                  {confirmedOrder.selectedSize && (
                    <p className="text-sm text-gray-600">Size: {confirmedOrder.selectedSize}</p>
                  )}
                </div>

                <div className="border-b pb-3">
                  <p className="text-sm text-gray-600">Quantity</p>
                  <p className="font-semibold text-gray-900">{confirmedOrder.quantity}x</p>
                </div>

                <div className="border-b pb-3">
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="font-semibold text-lg text-blue-600">₱{parseFloat(confirmedOrder.totalAmount.toString()).toFixed(2)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Pickup Date</p>
                  <p className="font-semibold text-gray-900">{new Date(confirmedOrder.claimDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-blue-600">Important:</span> Please use your order code <span className="font-mono font-bold">#{confirmedOrder.orderId.toString().padStart(6, '0')}</span> when picking up your order.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <Button 
              variant="outline"
              onClick={handleDownloadTicket}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button 
              onClick={() => setShowTicket(false)} 
              className="bg-green-600 hover:bg-green-700 px-8"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
