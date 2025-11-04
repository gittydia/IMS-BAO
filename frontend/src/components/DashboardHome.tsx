import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Users, Package, ShoppingCart, Calendar, AlertCircle } from "lucide-react";

interface DashboardHomeProps {
  userRole: string;
}

export function DashboardHome({ userRole }: DashboardHomeProps) {
  const stats = [
    {
      title: "Inventory Items",
      value: "247",
      change: "+15 this month",
      icon: Package,
      color: "bg-green-500",
    },
    {
      title: "Pending Orders",
      value: "34",
      change: "12 today",
      icon: ShoppingCart,
      color: "bg-blue-500",
    },
    {
      title: "Appointments",
      value: "18",
      change: "5 upcoming",
      icon: Calendar,
      color: "bg-purple-500",
    },
    {
      title: "Low Stock Items",
      value: "8",
      change: "Needs attention",
      icon: AlertCircle,
      color: "bg-orange-500",
    },
  ];

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
        {stats.map((stat) => {
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
                <p className="text-sm text-green-600">{stat.change} from last month</p>
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
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full p-4 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-gray-900">Browse Inventory</p>
                    <p className="text-sm text-gray-600">View available items and supplies</p>
                  </div>
                </div>
              </button>
              <button className="w-full p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-gray-900">Place Order</p>
                    <p className="text-sm text-gray-600">Order uniforms, IDs, and supplies</p>
                  </div>
                </div>
              </button>
              <button className="w-full p-4 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-gray-900">Book Appointment</p>
                    <p className="text-sm text-gray-600">Schedule visit to BAO office</p>
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
