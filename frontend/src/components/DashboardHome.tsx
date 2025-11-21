import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Users, Package, ShoppingCart, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import * as api from "../lib/api";

type ActiveView = "home" | "users" | "inventory" | "orders";

interface DashboardHomeProps {
  userRole: string;
  onNavigate: (view: ActiveView) => void;
}

export function DashboardHome({ userRole, onNavigate }: DashboardHomeProps) {
  const [stats, setStats] = useState({
    inventoryItems: 0,
    pendingOrders: 0,
    lowStockItems: 0,
  });
  const [salesData, setSalesData] = useState({
    totalRevenue: 0,
    completedOrders: 0,
    averageOrderValue: 0,
    recentOrders: [] as api.Order[],
  });
  const [recentActivity, setRecentActivity] = useState<Array<{
    action: string;
    time: string;
    type: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [salesPeriod, setSalesPeriod] = useState<string>("all");

  useEffect(() => {
    loadDashboardData();
  }, [salesPeriod]);

  const filterOrdersByPeriod = (orders: api.Order[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYearStart = new Date(now.getFullYear(), 0, 1);

    return orders.filter(order => {
      if (salesPeriod === "all") return true;
      if (!order.createdAt) return false;

      const orderDate = new Date(order.createdAt);
      
      switch(salesPeriod) {
        case "today":
          return orderDate >= today;
        case "week":
          return orderDate >= thisWeekStart;
        case "month":
          return orderDate >= thisMonthStart;
        case "year":
          return orderDate >= thisYearStart;
        default:
          return true;
      }
    });
  };

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

      // Fetch activity logs
      const activityLogs = await api.getActivityLogs(5);

      // Calculate sales data
      const completedOrders = orders.filter(o => 
        o.status.toLowerCase() === "claimed"
      );
      
      // Filter by selected period
      const filteredCompletedOrders = filterOrdersByPeriod(completedOrders);
      
      const totalRevenue = filteredCompletedOrders.reduce((sum, order) => sum + parseFloat(order.amount.toString()), 0);
      const averageOrderValue = filteredCompletedOrders.length > 0 ? totalRevenue / filteredCompletedOrders.length : 0;
      
      // Get recent orders (last 5)
      const recentOrders = [...orders]
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 5);

      setStats({
        inventoryItems: inventoryCount,
        pendingOrders: pendingCount,
        lowStockItems: lowStock,
      });

      setSalesData({
        totalRevenue,
        completedOrders: filteredCompletedOrders.length,
        averageOrderValue,
        recentOrders,
      });

      // Use real activity logs from database
      const activities = activityLogs.map(log => ({
        action: log.description,
        time: getTimeAgo(new Date(log.createdAt)),
        type: log.entityType
      }));

      setRecentActivity(activities);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const statsDisplay = [
    {
      title: "Inventory Items",
      value: stats.inventoryItems.toString(),
      change: "Total items",
      icon: Package,
      color: "bg-green-500",
      onClick: () => onNavigate("inventory"),
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders.toString(),
      change: "Awaiting processing",
      icon: ShoppingCart,
      color: "bg-blue-500",
      onClick: () => onNavigate("orders"),
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockItems.toString(),
      change: "Needs attention",
      icon: AlertCircle,
      color: "bg-orange-500",
      onClick: () => onNavigate("inventory"),
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
          {userRole === "admin" && "Manage inventory and student orders for the Business Affairs Office."}
          {userRole === "staff" && "Track orders and manage inventory for BAO."}
          {userRole === "student" && "Browse inventory and place orders for BAO items."}
        </p>
      </div>

      <div className="flex gap-6 mb-8">
        {statsDisplay.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={stat.title} 
              className="flex-1 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={stat.onClick}
            >
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
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => {
                  // Determine action type from description
                  const actionLower = activity.action.toLowerCase();
                  
                  // Check in specific order to avoid conflicts
                  const isDeleted = actionLower.includes('delet');
                  const isCreated = actionLower.includes('creat');
                  const isStatusChange = actionLower.includes('status changed');
                  const isUpdated = actionLower.includes('updat');
                  
                  // Set colors based on action type (hard-coded for reliability)
                  let bgStyle, iconBgStyle, badgeStyle;
                  
                  if (isDeleted) {
                    bgStyle = { background: 'linear-gradient(to right, #fee2e2, #fecaca)', borderColor: '#fca5a5' };
                    iconBgStyle = { backgroundColor: '#ef4444' };
                    badgeStyle = { backgroundColor: '#fecaca', color: '#b91c1c' };
                  } else if (isCreated) {
                    bgStyle = { background: 'linear-gradient(to right, #f0fdf4, #dcfce7)', borderColor: '#86efac' };
                    iconBgStyle = { backgroundColor: '#22c55e' };
                    badgeStyle = { backgroundColor: '#dcfce7', color: '#15803d' };
                  } else if (isStatusChange) {
                    bgStyle = { background: 'linear-gradient(to right, #faf5ff, #f3e8ff)', borderColor: '#d8b4fe' };
                    iconBgStyle = { backgroundColor: '#a855f7' };
                    badgeStyle = { backgroundColor: '#f3e8ff', color: '#7c3aed' };
                  } else if (isUpdated) {
                    bgStyle = { background: 'linear-gradient(to right, #eff6ff, #dbeafe)', borderColor: '#93c5fd' };
                    iconBgStyle = { backgroundColor: '#3b82f6' };
                    badgeStyle = { backgroundColor: '#dbeafe', color: '#1d4ed8' };
                  } else {
                    bgStyle = { background: 'linear-gradient(to right, #f9fafb, #f3f4f6)', borderColor: '#d1d5db' };
                    iconBgStyle = { backgroundColor: '#6b7280' };
                    badgeStyle = { backgroundColor: '#f3f4f6', color: '#374151' };
                  }
                  
                  const actionColor = '';
                  const iconBgColor = '';
                  const badgeColor = '';
                  
                  return (
                    <div 
                      key={index} 
                      style={bgStyle}
                      className="relative p-4 rounded-lg border hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div 
                            style={iconBgStyle}
                            className="p-2 rounded-lg"
                          >
                            {activity.type === 'product' ? (
                              <Package className="w-4 h-4 text-white" />
                            ) : activity.type === 'order' ? (
                              <ShoppingCart className="w-4 h-4 text-white" />
                            ) : (
                              <Users className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                              {activity.time}
                            </p>
                          </div>
                        </div>
                        <div 
                          style={badgeStyle}
                          className="px-2 py-1 rounded-full text-xs font-medium"
                        >
                          {isDeleted ? 'Deleted' : isCreated ? 'Created' : isStatusChange ? 'Status' : isUpdated ? 'Updated' : activity.type}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
                    <AlertCircle className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">No recent activity</p>
                  <p className="text-xs text-gray-400 mt-1">Admin actions will appear here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Sales Overview</CardTitle>
            <select
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md"
              value={salesPeriod}
              onChange={(e) => setSalesPeriod(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
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
                            order.status.toLowerCase() === 'claimed' ? 'bg-green-100 text-green-700' :
                            order.status.toLowerCase() === 'ready' ? 'bg-blue-100 text-blue-700' :
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
