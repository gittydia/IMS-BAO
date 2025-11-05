/**
 * API Client for IMS-BAO Backend
 * Handles all HTTP requests to the FastAPI backend
 * Session ID stored in localStorage for authentication
 */

const API_BASE_URL = "http://localhost:8000";

// ============================================
// HELPER FUNCTIONS
// ============================================

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: `HTTP ${response.status}`,
    }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

function getSessionId(): string | null {
  return localStorage.getItem("session_id");
}

function getHeaders(contentType = "application/json"): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": contentType,
  };

  const sessionId = getSessionId();
  if (sessionId) {
    headers["X-Session-Id"] = sessionId;
  }

  return headers;
}

// ============================================
// TYPES / INTERFACES
// ============================================

export interface AuthUser {
  id: number;
  email: string;
  role: "admin" | "student";
}

export interface CurrentUser {
  user_id: number;
  email: string;
  role: "admin" | "student";
  entity_id: number;
  entity_data?: {
    firstname: string;
    lastname: string;
    college?: string;
    program?: string;
  };
}

export interface LoginResponse {
  message: string;
  session_id: string;
  user: CurrentUser;
}

export interface Student {
  studentId: number;
  firstname: string;
  lastname: string;
  college: string;
  program: string;
  userId?: number;
  createdAt?: string;
}

export interface Product {
  productId: number;
  productName: string;
  productCategory: string;
  price: number | string;
  status: string;
  quantity: number;
  createdAt?: string;
}

export interface Order {
  orderId: number;
  productId: number;
  dateToClaim: string;
  dateClaimed?: string | null;
  status: string;
  amount: number | string;
  createdAt?: string;
  product?: Product;
}

export interface Appointment {
  appointmentId: number;
  studentId: number;
  adminId?: number;
  dateApp: string;
  timeApp: string;
  purpose: string;
  status: string;
  createdAt?: string;
}

// ============================================
// AUTHENTICATION API
// ============================================

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  const data = await handleResponse<LoginResponse>(response);

  // Store session ID in localStorage
  if (data.session_id) {
    localStorage.setItem("session_id", data.session_id);
  }

  return data;
}

export async function register(
  email: string,
  password: string,
  firstname: string,
  lastname: string,
  role: "admin" | "student",
  college?: string,
  program?: string
): Promise<any> {
  const payload: any = {
    email,
    password,
    firstname,
    lastname,
    role,
  };

  if (role === "student") {
    payload.college = college;
    payload.program = program;
  }

  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function logout(): Promise<void> {
  const sessionId = getSessionId();
  if (sessionId) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: getHeaders(),
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  }
  localStorage.removeItem("session_id");
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const sessionId = getSessionId();
  if (!sessionId) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });

  return handleResponse<CurrentUser>(response);
}

// ============================================
// STUDENTS API
// ============================================

export async function getStudents(): Promise<Student[]> {
  const response = await fetch(`${API_BASE_URL}/students`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });

  return handleResponse<Student[]>(response);
}

export async function getStudent(studentId: number): Promise<Student> {
  const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });

  return handleResponse<Student>(response);
}

export async function createStudent(
  firstname: string,
  lastname: string,
  college: string,
  program: string
): Promise<Student> {
  const response = await fetch(`${API_BASE_URL}/students`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify({ firstname, lastname, college, program }),
  });

  return handleResponse<Student>(response);
}

export async function updateStudent(
  studentId: number,
  data: Partial<Omit<Student, "studentId" | "userId" | "createdAt">>
): Promise<Student> {
  const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
    method: "PUT",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  });

  return handleResponse<Student>(response);
}

export async function deleteStudent(studentId: number): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
    method: "DELETE",
    headers: getHeaders(),
    credentials: "include",
  });

  return handleResponse(response);
}

// ============================================
// PRODUCTS API
// ============================================

export async function getProducts(): Promise<Product[]> {
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });

  return handleResponse<Product[]>(response);
}

export async function getProduct(productId: number): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });

  return handleResponse<Product>(response);
}

export async function createProduct(
  productName: string,
  productCategory: string,
  price: number,
  quantity: number,
  status: string = "Available"
): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify({
      productName,
      productCategory,
      price,
      quantity,
      status,
    }),
  });

  return handleResponse<Product>(response);
}

export async function updateProduct(
  productId: number,
  data: Partial<Omit<Product, "productId" | "createdAt">>
): Promise<Product> {
  const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
    method: "PUT",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  });

  return handleResponse<Product>(response);
}

export async function deleteProduct(productId: number): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
    method: "DELETE",
    headers: getHeaders(),
    credentials: "include",
  });

  return handleResponse(response);
}

// ============================================
// ORDERS API
// ============================================

export async function getOrders(): Promise<Order[]> {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });

  return handleResponse<Order[]>(response);
}

export async function getOrder(orderId: number): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });

  return handleResponse<Order>(response);
}

export async function createOrder(
  productId: number,
  dateToClaim: string,
  amount: number,
  status: string = "Pending"
): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify({
      productId,
      dateToClaim,
      amount,
      status,
    }),
  });

  return handleResponse<Order>(response);
}

export async function updateOrder(
  orderId: number,
  data: Partial<Omit<Order, "orderId" | "productId" | "createdAt" | "product">>
): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
    method: "PUT",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  });

  return handleResponse<Order>(response);
}

export async function deleteOrder(orderId: number): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
    method: "DELETE",
    headers: getHeaders(),
    credentials: "include",
  });

  return handleResponse(response);
}

// ============================================
// APPOINTMENTS API (PLACEHOLDER - NOT YET IN BACKEND)
// ============================================

export async function getAppointments(): Promise<Appointment[]> {
  // TODO: Implement in backend
  return [];
}

export async function createAppointment(
  studentId: number,
  dateApp: string,
  timeApp: string,
  purpose: string,
  status: string = "Pending"
): Promise<Appointment> {
  // TODO: Implement in backend
  throw new Error("Appointments API not yet implemented");
}

export async function updateAppointment(
  appointmentId: number,
  data: Partial<Omit<Appointment, "appointmentId" | "createdAt">>
): Promise<Appointment> {
  // TODO: Implement in backend
  throw new Error("Appointments API not yet implemented");
}

export async function deleteAppointment(appointmentId: number): Promise<{ message: string }> {
  // TODO: Implement in backend
  throw new Error("Appointments API not yet implemented");
}
