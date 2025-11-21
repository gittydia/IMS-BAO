import { useState } from "react";
import { Button } from "./ui/button";
import { Users, Package, ShoppingCart, LogOut, LayoutDashboard, Calendar } from "lucide-react";
import { UsersManager } from "./UsersManager";
import { ProductsManager } from "./ProductsManager";
import { OrdersManager } from "./OrdersManager";
import { AppointmentsManager } from "./AppointmentsManager";
import { DashboardHome } from "./DashboardHome";

interface DashboardProps {
  currentUser: { email: string; name: string; role: string } | null;
  onLogout: () => void;
}

type ActiveView = "home" | "users" | "inventory" | "orders" | "appointments";

export function Dashboard({ currentUser, onLogout }: DashboardProps) {
  const [activeView, setActiveView] = useState<ActiveView>("home");

  // Filter menu items based on user role
  const allMenuItems = [
    { id: "home" as ActiveView, label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "staff", "student"] },
    { id: "inventory" as ActiveView, label: "Inventory", icon: Package, roles: ["admin", "staff"] },
    { id: "orders" as ActiveView, label: "Orders", icon: ShoppingCart, roles: ["admin", "staff", "student"] },
    { id: "appointments" as ActiveView, label: "Appointments", icon: Calendar, roles: ["admin", "staff", "student"] },
    { id: "users" as ActiveView, label: "Users", icon: Users, roles: ["admin"] },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(currentUser?.role || ""));

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <img src="/assets/BAO_LOGO.png" alt="BAO Logo" className="w-8 h-8" />
            <div>
              <span className="text-gray-900">RTU BAO</span>
              <p className="text-xs text-gray-500">Business Affairs Office</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-sm text-gray-900">{currentUser?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{currentUser?.role}</p>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveView(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={onLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {activeView === "home" && <DashboardHome userRole={currentUser?.role || "student"} />}
          {activeView === "users" && <UsersManager />}
          {activeView === "inventory" && <ProductsManager />}
          {activeView === "orders" && <OrdersManager userRole={currentUser?.role || "student"} userName={currentUser?.name || ""} />}
          {activeView === "appointments" && <AppointmentsManager userRole={currentUser?.role || "student"} userName={currentUser?.name || ""} />}
        </div>
      </main>
    </div>
  );
}
