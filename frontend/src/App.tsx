import { useState, useEffect } from "react";
import { LoginForm } from "./components/LoginForm";
import { Dashboard } from "./components/Dashboard";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; role: string } | null>(null);

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (email: string, password: string) => {
    // Mock authentication - in real app, this would call an API
    const mockUsers = [
      { email: "admin@rtu.edu.ph", password: "admin123", name: "BAO Administrator", role: "admin" },
      { email: "staff@rtu.edu.ph", password: "staff123", name: "BAO Staff Member", role: "staff" },
      { email: "student@rtu.edu.ph", password: "student123", name: "Juan Dela Cruz", role: "student" },
    ];

    const user = mockUsers.find((u) => u.email === email && u.password === password);

    if (user) {
      const userData = { email: user.email, name: user.name, role: user.role };
      setCurrentUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem("currentUser", JSON.stringify(userData));
      return true;
    }

    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!isAuthenticated ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <Dashboard currentUser={currentUser} onLogout={handleLogout} />
      )}
      <Toaster />
    </div>
  );
}
