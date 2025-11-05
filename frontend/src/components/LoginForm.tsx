import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Lock, Mail, AlertCircle, UserPlus } from "lucide-react";
import { toast } from "sonner";
import * as api from "../lib/api";

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    firstname: "",
    lastname: "",
    college: "",
    program: "",
  });
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegister = () => {
    const newErrors: Record<string, string> = {};

    if (!registerForm.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(registerForm.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!registerForm.password) {
      newErrors.password = "Password is required";
    } else if (registerForm.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (registerForm.role === "student") {
      if (!registerForm.firstname) newErrors.firstname = "First name is required";
      if (!registerForm.lastname) newErrors.lastname = "Last name is required";
      if (!registerForm.college) newErrors.college = "College is required";
      if (!registerForm.program) newErrors.program = "Program is required";
    }

    setRegisterErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterErrors({});

    if (!validateRegister()) {
      return;
    }

    setIsLoading(true);
    try {
      await api.register(
        registerForm.email,
        registerForm.password,
        registerForm.firstname || "User",
        registerForm.lastname || "Account",
        registerForm.role as "admin" | "student",
        registerForm.college,
        registerForm.program
      );

      toast.success("Account created successfully! Please log in.");
      setIsRegistering(false);
      setRegisterForm({
        email: "",
        password: "",
        confirmPassword: "",
        role: "student",
        firstname: "",
        lastname: "",
        college: "",
        program: "",
      });
      setEmail(registerForm.email);
      setPassword("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed";
      setRegisterErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const success = await onLogin(email, password);
      if (!success) {
        setErrors({ general: "Invalid email or password" });
      }
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : "Login failed" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mb-2">
            {isRegistering ? (
              <UserPlus className="w-8 h-8 text-white" />
            ) : (
              <Lock className="w-8 h-8 text-white" />
            )}
          </div>
          <CardTitle>{isRegistering ? "Create Account" : "RTU BAO System"}</CardTitle>
          <CardDescription>
            {isRegistering
              ? "Register as Admin or Student"
              : "Business Affairs Office - Inventory & Appointment Management"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isRegistering ? (
            // LOGIN FORM
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.general}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@rtu.edu.ph"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setIsRegistering(true)}
              >
                Create New Account
              </Button>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-gray-600 mb-2">Demo Credentials:</p>
                <p className="text-xs text-gray-700">
                  <strong>Admin:</strong> admin1@example.com / admin123
                </p>
                <p className="text-xs text-gray-700">
                  <strong>Student:</strong> student1@example.com / student123
                </p>
              </div>
            </form>
          ) : (
            // REGISTER FORM
            <form onSubmit={handleRegister} className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
              {registerErrors.general && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{registerErrors.general}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="reg-role">Account Type</Label>
                <select
                  id="reg-role"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={registerForm.role}
                  onChange={(e) =>
                    setRegisterForm({ ...registerForm, role: e.target.value })
                  }
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="reg-firstname">First Name</Label>
                  <Input
                    id="reg-firstname"
                    placeholder="John"
                    value={registerForm.firstname}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, firstname: e.target.value })
                    }
                  />
                  {registerErrors.firstname && (
                    <p className="text-xs text-red-600">{registerErrors.firstname}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-lastname">Last Name</Label>
                  <Input
                    id="reg-lastname"
                    placeholder="Doe"
                    value={registerForm.lastname}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, lastname: e.target.value })
                    }
                  />
                  {registerErrors.lastname && (
                    <p className="text-xs text-red-600">{registerErrors.lastname}</p>
                  )}
                </div>
              </div>

              {registerForm.role === "student" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="reg-college">College</Label>
                    <Input
                      id="reg-college"
                      placeholder="e.g., College of Engineering"
                      value={registerForm.college}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, college: e.target.value })
                      }
                    />
                    {registerErrors.college && (
                      <p className="text-xs text-red-600">{registerErrors.college}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-program">Program</Label>
                    <Input
                      id="reg-program"
                      placeholder="e.g., BS Computer Science"
                      value={registerForm.program}
                      onChange={(e) =>
                        setRegisterForm({ ...registerForm, program: e.target.value })
                      }
                    />
                    {registerErrors.program && (
                      <p className="text-xs text-red-600">{registerErrors.program}</p>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="reg-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="your.email@rtu.edu.ph"
                    value={registerForm.email}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, email: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>
                {registerErrors.email && (
                  <p className="text-sm text-red-600">{registerErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={registerForm.password}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, password: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>
                {registerErrors.password && (
                  <p className="text-sm text-red-600">{registerErrors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reg-confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="reg-confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={registerForm.confirmPassword}
                    onChange={(e) =>
                      setRegisterForm({ ...registerForm, confirmPassword: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>
                {registerErrors.confirmPassword && (
                  <p className="text-sm text-red-600">{registerErrors.confirmPassword}</p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsRegistering(false)}
                >
                  Back to Login
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Account"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
