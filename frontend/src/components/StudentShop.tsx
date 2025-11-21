import { Card, CardContent } from "./ui/card";
import { useState, useEffect } from "react";
import { Package } from "lucide-react";
import * as api from "../lib/api";
import { toast } from "sonner";

const API_BASE_URL = "http://localhost:8000";

export function StudentShop() {
  const [products, setProducts] = useState<api.Product[]>([]);
  const [uniforms, setUniforms] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [uniformType, setUniformType] = useState<string>("all");
  const [uniformGender, setUniformGender] = useState<string>("all");
  const [uniformSize, setUniformSize] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

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

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.productCategory)))];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.productCategory.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.productCategory === categoryFilter;
    const isInStock = product.quantity > 0; // Only show in-stock items to students
    return matchesSearch && matchesCategory && isInStock && product.productCategory !== "Uniform";
  });

  // Filter uniforms with special filters
  const filteredUniforms = uniforms.filter((uniform) => {
    const matchesSearch =
      uniform.product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      uniform.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = uniformType === "all" || uniform.type === uniformType;
    const matchesGender = uniformGender === "all" || uniform.gender === uniformGender;
    const matchesSize = uniformSize === "all" || uniform.sizeType === uniformSize;
    return matchesSearch && matchesType && matchesGender && matchesSize;
  });

  const uniformTypes = ["all", ...Array.from(new Set(uniforms.map((u) => u.type)))];
  const uniformGenders = ["all", ...Array.from(new Set(uniforms.map((u) => u.gender)))];
  const uniformSizes = ["all", ...Array.from(new Set(uniforms.map((u) => u.sizeType)))];

  const handleOrder = async (product: api.Product) => {
    // TODO: Implement order functionality
    toast.success(`Added ${product.productName} to cart`);
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
      <div className="mb-6 space-y-4">
        <input
          type="text"
          placeholder="Search inventory items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
        
        {/* Category Filter - shows for non-uniform items */}
        {categoryFilter !== "Uniform" && (
          <div className="flex gap-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Categories</option>
              {categories
                .filter((cat) => cat !== "all" && cat !== "Uniform")
                .map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Uniform Filters - shows when viewing uniforms or uniform category */}
        {(categoryFilter === "Uniform" || uniforms.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Uniform Type</label>
              <select
                value={uniformType}
                onChange={(e) => setUniformType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                {uniformTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Gender</label>
              <select
                value={uniformGender}
                onChange={(e) => setUniformGender(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                {uniformGenders.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Size</label>
              <select
                value={uniformSize}
                onChange={(e) => setUniformSize(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                {uniformSizes.map((size) => (
                  <option key={size} value={size}>
                    {size === "all" ? "All Sizes" : size}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Show Uniforms Section */}
      {filteredUniforms.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Uniforms</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredUniforms.map((uniform) => (
              <Card key={uniform.uniformId} className="flex flex-col overflow-hidden rounded-lg shadow hover:shadow-lg transition-shadow" style={{ height: "600px" }}>
                <div className="relative bg-gray-100 overflow-hidden flex-shrink-0" style={{ height: "400px" }}>
                  {uniform.product.imageUrl ? (
                    <img
                      src={`${API_BASE_URL}${uniform.product.imageUrl}`}
                      alt={uniform.product.productName}
                      className="w-full h-full object-cover absolute inset-0"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                  ) : null}
                  {!uniform.product.imageUrl && (
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
                <CardContent className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{uniform.product.productName}</h3>
                    <div className="space-y-1 mb-2">
                      <p className="text-xs text-gray-600">Type: {uniform.type}</p>
                      <p className="text-xs text-gray-600">Gender: {uniform.gender}</p>
                      <p className="text-xs text-gray-600">Size: {uniform.sizeType}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-blue-600">
                        ₱{parseFloat(uniform.product.price.toString()).toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleOrder(uniform.product)}
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

      {/* Regular Products Section */}
      {filteredProducts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Other Items</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
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
                      onClick={() => handleOrder(product)}
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
      {filteredProducts.length === 0 && filteredUniforms.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No products available matching your filters</p>
        </div>
      )}
    </div>
  );
}
