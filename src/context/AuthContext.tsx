import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase, hashPassword } from "@/lib/supabaseClient";

interface AuthUser {
  supplier_id: string;
  name: string;
  category: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (supplier_id: string, password: string) => Promise<{ success: boolean; message: string }>;
  registerFirstAccess: (supplier_id: string, password: string, confirmPassword: string) => Promise<{ success: boolean; message: string }>;
  registerNewSupplier: (name: string, category: string, password: string, confirmPassword: string) => Promise<{ success: boolean; message: string; supplier_id?: string }>;
  logout: () => void;
  loginAdmin: (password: string) => { success: boolean; message: string };
  isFirstAccess: (supplier_id: string) => Promise<boolean>;
  supplierExists: (supplier_id: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// La SESIÓN sí puede vivir en localStorage (solo dice "quién eres", no la contraseña)
const SESSION_KEY = "supplier_auth_session_v3";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      try {
        setUser(JSON.parse(session));
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  async function supplierExists(supplier_id: string): Promise<boolean> {
    const { data, error } = await supabase.rpc("rpc_supplier_exists", { p_supplier_id: supplier_id });
    if (error) return false;
    return !!data;
  }

  async function isFirstAccess(supplier_id: string): Promise<boolean> {
    const { data, error } = await supabase.rpc("rpc_is_first_access", { p_supplier_id: supplier_id });
    if (error) return false;
    return !!data;
  }

  async function registerFirstAccess(
    supplier_id: string,
    password: string,
    confirmPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!(await supplierExists(supplier_id))) {
      return { success: false, message: "Código no encontrado o inactivo." };
    }
    if (!(await isFirstAccess(supplier_id))) {
      return { success: false, message: "Este código ya tiene una contraseña configurada. Use el acceso normal." };
    }
    if (password.length < 6) {
      return { success: false, message: "La contraseña debe tener al menos 6 caracteres." };
    }
    if (password !== confirmPassword) {
      return { success: false, message: "Las contraseñas no coinciden." };
    }

    const password_hash = await hashPassword(password);
    const { data, error } = await supabase.rpc("rpc_set_password", {
      p_supplier_id: supplier_id,
      p_password_hash: password_hash,
    });

    if (error || !data || data.length === 0) {
      return { success: false, message: "No se pudo guardar la contraseña. Intenta de nuevo." };
    }

    const found = data[0];
    const authUser: AuthUser = { supplier_id: found.supplier_id, name: found.name, category: found.category };
    localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
    setUser(authUser);

    return { success: true, message: "Contraseña creada exitosamente. Bienvenido al portal." };
  }

  async function registerNewSupplier(
    name: string,
    category: string,
    password: string,
    confirmPassword: string,
  ): Promise<{ success: boolean; message: string; supplier_id?: string }> {
    if (!name.trim()) {
      return { success: false, message: "Ingrese su nombre." };
    }
    if (password.length < 6) {
      return { success: false, message: "La contraseña debe tener al menos 6 caracteres." };
    }
    if (password !== confirmPassword) {
      return { success: false, message: "Las contraseñas no coinciden." };
    }

    const password_hash = await hashPassword(password);
    const { data, error } = await supabase.rpc("rpc_register_new", {
      p_name: name.trim(),
      p_category: category.trim().toLowerCase(),
      p_password_hash: password_hash,
    });

    if (error || !data || data.length === 0) {
      return { success: false, message: "No se pudo completar el registro. Intenta de nuevo." };
    }

    const found = data[0];
    const authUser: AuthUser = { supplier_id: found.supplier_id, name: found.name, category: found.category };
    localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
    setUser(authUser);

    return { success: true, message: "Registro exitoso. Bienvenido al portal.", supplier_id: found.supplier_id };
  }

  async function login(supplier_id: string, password: string): Promise<{ success: boolean; message: string }> {
    if (!(await supplierExists(supplier_id))) {
      return { success: false, message: "Código no encontrado o inactivo." };
    }
    if (await isFirstAccess(supplier_id)) {
      return { success: false, message: "Este es su primer acceso. Por favor, configure su contraseña primero." };
    }

    const password_hash = await hashPassword(password);
    const { data, error } = await supabase.rpc("rpc_login", {
      p_supplier_id: supplier_id,
      p_password_hash: password_hash,
    });

    if (error || !data || data.length === 0) {
      return { success: false, message: "Código o contraseña incorrectos." };
    }

    const found = data[0];
    const authUser: AuthUser = { supplier_id: found.supplier_id, name: found.name, category: found.category };
    localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
    setUser(authUser);

    return { success: true, message: "Inicio de sesión exitoso." };
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  const ADMIN_PASSWORD = "C0mpartoEsp26";

  function loginAdmin(password: string): { success: boolean; message: string } {
    if (password === ADMIN_PASSWORD) {
      const adminUser = { supplier_id: "ADMIN", name: "Administrador", category: "admin", isAdmin: true };
      setUser(adminUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(adminUser));
      return { success: true, message: "Bienvenido, Administrador" };
    }
    return { success: false, message: "Contraseña de administrador incorrecta" };
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, registerFirstAccess, registerNewSupplier, logout, isFirstAccess, supplierExists, loginAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext debe usarse dentro de AuthProvider");
  }
  return context;
}
