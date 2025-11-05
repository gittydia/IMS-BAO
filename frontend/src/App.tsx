import { useState, useEffect } from "react";
import { LoginForm } from "./components/LoginForm";
import { Dashboard } from "./components/Dashboard";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import * as api from "./lib/api";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; role: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in via session
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await api.getCurrentUser();
        const name = userData.entity_data
          ? `${userData.entity_data.firstname} ${userData.entity_data.lastname}`
          : userData.email;

        setCurrentUser({
          email: userData.email,
          name,
          role: userData.role,
        });
        setIsAuthenticated(true);
      } catch (error) {
        // Not authenticated, clear any stale session data
        localStorage.removeItem("session_id");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.login(email, password);

      const name = response.user.entity_data
        ? `${response.user.entity_data.firstname} ${response.user.entity_data.lastname}`
        : response.user.email;

      setCurrentUser({
        email: response.user.email,
        name,
        role: response.user.role,
      });
      setIsAuthenticated(true);
      toast.success("Login successful!");
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      toast.error(errorMessage);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setIsAuthenticated(false);
      setCurrentUser(null);
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
