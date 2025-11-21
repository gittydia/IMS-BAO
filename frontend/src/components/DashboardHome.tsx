import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Users, Package, ShoppingCart, Calendar, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import * as api from "../lib/api";

interface DashboardHomeProps {
  userRole: string;
}

export function DashboardHome({ userRole }: DashboardHomeProps) {
  const [stats, setStats] = useState({
    inventoryItems: 0,
    pendingOrders: 0,
    appointments: 0,
    lowStockItems: 0,
  });
  const [salesData, setSalesData] = useState({
    totalRevenue: 0,
    completedOrders: 0,
    averageOrderValue: 0,
    recentOrders: [] as api.Order[],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch products
      const products = await api.getProducts();
      const inventoryCount = products.length;
      const lowStock = products.filter(p => p.quantity < 10).length;

      // Fetch orders
      const orders = await api.getOrders();
      const pendingCount = orders.filter(o => o.status.toLowerCase() === "pending").length;

      // Calculate sales data
      const completedOrders = orders.filter(o => 
        o.status.toLowerCase() === "delivered" || o.status.toLowerCase() === "completed"
      );
      const totalRevenue = completedOrders.reduce((sum, order) => sum + parseFloat(order.amount.toString()), 0);
      const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
      
      // Get recent orders (last 5)
      const recentOrders = [...orders]
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 5);

      // TODO: Fetch appointments when backend is ready
      const appointmentCount = 0;

      setStats({
        inventoryItems: inventoryCount,
        pendingOrders: pendingCount,
        appointments: appointmentCount,
        lowStockItems: lowStock,
      });

      setSalesData({
        totalRevenue,
        completedOrders: completedOrders.length,
        averageOrderValue,
        recentOrders,
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statsDisplay = [
    {
      title: "Inventory Items",
      value: stats.inventoryItems.toString(),
      change: "Total items",
      icon: Package,
      color: "bg-green-500",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders.toString(),
      change: "Awaiting processing",
      icon: ShoppingCart,
      color: "bg-blue-500",
    },
    {
      title: "Appointments",
      value: stats.appointments.toString(),
      change: "Scheduled",
      icon: Calendar,
      color: "bg-purple-500",
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockItems.toString(),
      change: "Needs attention",
      icon: AlertCircle,
      color: "bg-orange-500",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">RTU BAO Dashboard</h1>
        <p className="text-gray-600">
          {userRole === "admin" && "Manage inventory, orders, and appointments for the Business Affairs Office."}
          {userRole === "staff" && "Track orders, manage inventory, and schedule appointments."}
          {userRole === "student" && "Browse inventory, place orders, and book appointments with BAO."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsDisplay.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-gray-600">{stat.title}</CardTitle>
                <div className={`${stat.color} p-2 rounded-lg`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl text-gray-900 mb-1">{stat.value}</div>
                <p className="text-sm text-gray-600">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: "Order #BAO-2025-045 completed", time: "2 minutes ago", type: "order" },
                { action: "Appointment scheduled for Nov 5", time: "15 minutes ago", type: "appointment" },
                { action: "Uniform supplies restocked", time: "1 hour ago", type: "inventory" },
                { action: "Student placed order #BAO-2025-046", time: "2 hours ago", type: "order" },
                { action: "Low stock alert: ID Cards", time: "3 hours ago", type: "alert" },
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-green-700">₱{salesData.totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">{salesData.completedOrders} completed orders</p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Average Order Value</p>
                <p className="text-2xl font-bold text-blue-700">₱{salesData.averageOrderValue.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Per completed order</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Recent Orders</p>
                <div className="space-y-2">
                  {salesData.recentOrders.length > 0 ? (
                    salesData.recentOrders.map((order) => (
                      <div key={order.orderId} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Order #{order.orderId}</p>
                          <p className="text-xs text-gray-500">{order.product?.productName || 'Product'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">₱{parseFloat(order.amount.toString()).toFixed(2)}</p>
                          <span className={`text-xs px-2 py-1 rounded ${
                            order.status.toLowerCase() === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.status.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            order.status.toLowerCase() === 'processing' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No orders yet</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
