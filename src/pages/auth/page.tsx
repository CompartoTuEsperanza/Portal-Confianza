import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

declare const __BASE_PATH__: string;

type AuthMode = "login" | "register" | "new" | "admin";

export default function Auth() {
  const navigate = useNavigate();
  const { login, registerFirstAccess, registerNewSupplier, isFirstAccess, supplierExists, loginAdmin } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [supplierId, setSupplierId] = useState(() => localStorage.getItem("confianza_last_supplier_id") || "");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSupplierId, setNewSupplierId] = useState("");

  function switchMode(newMode: AuthMode) {
    setMode(newMode);
    setError("");
    setSuccess("");
    setNewSupplierId("");
  }

  function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const result = loginAdmin(password);
    if (result.success) {
      navigate("/dashboard/admin");
    } else {
      setError(result.message);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    // Admin silencioso — solo quien sabe el usuario y contraseña puede entrar
    if (supplierId.trim().toUpperCase() === "ADMIN") {
      const result = loginAdmin(password);
      setIsSubmitting(false);
      if (result.success) {
        navigate("/dashboard/admin");
      } else {
        setError(result.message);
      }
      return;
    }

    localStorage.setItem("confianza_last_supplier_id", supplierId.trim().toUpperCase());
    const result = await login(supplierId.trim().toUpperCase(), password);
    if (result.success) {
      setSuccess(result.message);
      setTimeout(() => navigate("/dashboard"), 800);
    } else {
      setError(result.message);
    }
    setIsSubmitting(false);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    localStorage.setItem("confianza_last_supplier_id", supplierId.trim().toUpperCase());
    const result = await registerFirstAccess(supplierId.trim().toUpperCase(), password, confirmPassword);
    if (result.success) {
      setSuccess(result.message);
      setTimeout(() => navigate("/dashboard"), 1200);
    } else {
      setError(result.message);
    }
    setIsSubmitting(false);
  }

  async function handleNewSupplier(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    const result = await registerNewSupplier(name, "", password, confirmPassword);
    if (result.success) {
      setNewSupplierId(result.supplier_id || "");
      setSuccess(result.message);
      setTimeout(() => navigate("/dashboard"), 2000);
    } else {
      setError(result.message);
    }
    setIsSubmitting(false);
  }

  function handleSupplierIdChange(value: string) {
    setSupplierId(value);
    setError("");
    setSuccess("");
  }

  const id = supplierId.trim().toUpperCase();
  const [idExists, setIdExists] = useState(false);
  const [idIsFirstAccess, setIdIsFirstAccess] = useState(false);

  useEffect(() => {
    if (!id) {
      setIdExists(false);
      setIdIsFirstAccess(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const [exists, firstAccess] = await Promise.all([supplierExists(id), isFirstAccess(id)]);
      if (!cancelled) {
        setIdExists(exists);
        setIdIsFirstAccess(firstAccess);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const showFirstAccessHint = id && idExists && idIsFirstAccess && mode === "login";
  const showNormalAccessHint = id && idExists && !idIsFirstAccess && mode === "register";

  const categoryOptions = [
    { value: "café", label: "Café" },
    { value: "cacao", label: "Cacao" },
    { value: "té", label: "Té" },
    { value: "especias", label: "Especias" },
    { value: "otro", label: "Otro" },
  ];

  return (
    <div className="min-h-screen w-full bg-white/50 flex flex-col items-center justify-center px-4 py-8">
      {/* Background imagen1.jpg */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src={`${typeof __BASE_PATH__ !== 'undefined' ? __BASE_PATH__ : '/'}images/producers-bg.jpg`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0" style={{ background: 'rgba(40,22,8,0.42)' }} />
      </div>

      {/* Logo */}
      <div className="relative z-10 mb-8 flex flex-col items-center gap-3">
        <img
          src={`${typeof __BASE_PATH__ !== 'undefined' ? __BASE_PATH__ : '/'}images/hoja.png`}
          alt="Logo"
          className="h-14 w-auto"
        />
        <div className="flex flex-col items-center">
          <span
            className="uppercase leading-none"
            style={{
              fontFamily: "'Josefin Sans', sans-serif",
              fontWeight: 100,
              fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
              letterSpacing: '0.25em',
              color: '#FF1E1E',
              lineHeight: 1,
            }}
          >
            PΛCHΛ
          </span>
          <span
            className="uppercase leading-none mt-1"
            style={{
              fontFamily: "'Josefin Sans', sans-serif",
              fontWeight: 100,
              fontSize: 'clamp(0.6rem, 1.4vw, 0.9rem)',
              letterSpacing: '0.55em',
              color: '#FF1E1E',
            }}
          >
            ESPERANZA
          </span>
          <span
            className="mt-2 inline-block"
            style={{
              color: '#B8860B',
              fontFamily: "'Playfair Display', serif",
              fontWeight: 900,
              fontSize: '0.82rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 12px rgba(0,0,0,0.6)',
            }}
          >
            Portal para Miembros de la Familia
          </span>
        </div>
      </div>

      {/* Auth Card */}
      <div className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-md rounded-xl shadow-xl border border-rose-100/40 p-6 md:p-8">
        {/* Tabs */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {/* Columna Regístrate */}
          <div className="flex flex-col items-stretch gap-1.5">
            <div className="flex justify-center">
              <span
                className="inline-block text-center uppercase tracking-[0.12em] leading-none"
                style={{
                  color: '#1a5c2e',
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 800,
                  fontSize: '11px',
                }}
              >
                ¿Es tu primer acceso?
              </span>
            </div>
            <button
              onClick={() => switchMode("new")}
              className={`w-full py-2.5 px-3 rounded-full text-sm font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                mode === "new"
                  ? "bg-rose-800 text-white shadow-md"
                  : "bg-rose-50/60 text-rose-900/70 hover:text-rose-950 hover:bg-rose-100/70"
              }`}
            >
              Regístrate
            </button>
          </div>

          {/* Columna Iniciar Sesión */}
          <div className="flex flex-col items-stretch gap-1.5">
            <div className="flex justify-center">
              <span
                className="inline-block text-center uppercase tracking-[0.12em] leading-none"
                style={{
                  color: '#1a5c2e',
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 800,
                  fontSize: '11px',
                }}
              >
                ¿Ya tienes una cuenta?
              </span>
            </div>
            <button
              onClick={() => switchMode("login")}
              className={`w-full py-2.5 px-3 rounded-full text-sm font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                mode === "login"
                  ? "bg-rose-800 text-white shadow-md"
                  : "bg-rose-50/60 text-rose-900/70 hover:text-rose-950 hover:bg-rose-100/70"
              }`}
            >
              Iniciar Sesión
            </button>
          </div>
        </div>

        {/* Content with transition */}
        <div key={mode} className="animate-auth-fade-in">
          {/* Title */}
          <h2 className="text-xl font-serif font-bold text-rose-950 mb-1">
          {mode === "login"
            ? "Iniciar Sesión"
            : "Registrarse"}
        </h2>
        <p className="text-sm text-rose-800/60 mb-6">
          {mode === "login"
            ? "Ingrese su código y contraseña."
            : "Complete sus datos para obtener su código único."}
        </p>

        {/* Form */}
        <form
          onSubmit={
            mode === "login"
              ? handleLogin
              : mode === "register"
                ? handleRegister
                : handleNewSupplier
          }
          className="space-y-4"
        >
          {/* Código de proveedor - solo login y primer acceso */}
          {(mode === "login" || mode === "register") && (
            <div>
              <label htmlFor="supplier_id" className="block text-sm font-medium text-rose-900/80 mb-1.5">
                Código de Acceso
              </label>
              <input
                id="supplier_id"
                type="text"
                value={supplierId}
                onChange={(e) => handleSupplierIdChange(e.target.value)}
                placeholder="Ej: SUP-001"
                autoComplete="username"
                className="w-full px-4 py-3 rounded-md border border-rose-200/70 text-sm text-rose-950 placeholder:text-rose-700/50 focus:outline-none focus:ring-2 focus:ring-rose-600 focus:border-transparent transition-all bg-white/30"
                required
              />
            </div>
          )}

          {/* Nombre - solo nuevo registro */}
          {mode === "new" && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-rose-900/80 mb-1.5">
                Nombre Completo
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError("");
                }}
                placeholder="Ej: María García"
                className="w-full px-4 py-3 rounded-md border border-rose-200/70 text-sm text-rose-950 placeholder:text-rose-700/50 focus:outline-none focus:ring-2 focus:ring-rose-600 focus:border-transparent transition-all bg-white/30"
                required
              />
            </div>
          )}


          {/* Contraseña */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-rose-900/80 mb-1.5">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                mode === "login"
                  ? "Ingrese su contraseña"
                  : "Cree su contraseña (mín. 6 caracteres)"
              }
              className="w-full px-4 py-3 rounded-md border border-rose-200/70 text-sm text-rose-950 placeholder:text-rose-700/50 focus:outline-none focus:ring-2 focus:ring-rose-600 focus:border-transparent transition-all bg-white/30"
              required
              minLength={mode === "register" || mode === "new" ? 6 : undefined}
            />
          </div>

          {/* Confirmar contraseña - solo primer acceso y nuevo registro */}
          {(mode === "register" || mode === "new") && (
            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-rose-900/80 mb-1.5">
                Confirmar Contraseña
              </label>
              <input
                id="confirm_password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita su contraseña"
                className="w-full px-4 py-3 rounded-md border border-rose-200/70 text-sm text-rose-950 placeholder:text-rose-700/50 focus:outline-none focus:ring-2 focus:ring-rose-600 focus:border-transparent transition-all bg-white/30"
                required
              />
            </div>
          )}

          {/* Hints */}
          {showFirstAccessHint && (
            <div className="bg-white border border-rose-100 rounded-md p-3 flex items-start gap-2">
              <i className="ri-information-line text-rose-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-rose-800">
                Este es su primer acceso. Por favor, use la pestaña{" "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="font-semibold underline cursor-pointer"
                >
                  Primer Acceso
                </button>{" "}
                para configurar su contraseña.
              </p>
            </div>
          )}

          {showNormalAccessHint && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 flex items-start gap-2">
              <i className="ri-check-line text-emerald-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-emerald-700">
                Este código ya tiene contraseña configurada. Use la pestaña{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-semibold underline cursor-pointer"
                >
                  Acceso Normal
                </button>{" "}
                para ingresar.
              </p>
            </div>
          )}

          {/* Nuevo código mostrado tras registro exitoso */}
          {newSupplierId && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4 text-center">
              <p className="text-xs text-emerald-700 mb-1">Su código de acceso es:</p>
              <p className="text-lg font-bold font-mono text-emerald-800">{newSupplierId}</p>
              <p className="text-xs text-emerald-600 mt-1">Guárdelo para futuros accesos</p>
            </div>
          )}

          {/* Error / Success messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
              <i className="ri-error-warning-line text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {success && !newSupplierId && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 flex items-start gap-2">
              <i className="ri-check-line text-emerald-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-emerald-700">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-rose-800 text-white py-3 rounded-md font-sans font-medium text-sm hover:bg-rose-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
          >
            {isSubmitting
              ? "Procesando..."
              : mode === "login"
                ? "Ingresar al Portal"
                : mode === "register"
                  ? "Crear Contraseña e Ingresar"
                  : "Registrarme y Obtener Código"}
          </button>
        </form>

        {/* Back link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-rose-900/50 hover:text-rose-950 transition-colors cursor-pointer"
          >
            <i className="ri-arrow-left-line mr-1" />
            Volver al inicio
          </button>
        </div>
        </div>
      </div>

    </div>
  );
}