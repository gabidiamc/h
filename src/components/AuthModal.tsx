import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Lock,
  Phone,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { formatPhoneOnBlur } from "../utils/phoneFormatter";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register" | "forgot_password";
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = "login" }) => {
  const { login, register, resetPassword, setActiveTab, showToast, siteSettings } = useApp();

  const [mode, setMode] = useState<"login" | "register" | "forgot_password">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Login form fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Forgot password field
  const [forgotEmail, setForgotEmail] = useState("");

  // Synchronize mode when initialMode changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const email = loginEmail.trim().toLowerCase();
    if (!email) {
      setError("Por favor ingresa tu correo electrónico.");
      return;
    }
    if (!loginPassword) {
      setError("Por favor ingresa tu contraseña.");
      return;
    }

    setIsLoading(true);
    const result = await login(email, loginPassword);

    if (!result.ok) {
      setIsLoading(false);
      setError(result.message ?? "No pudimos iniciar sesión con los datos proporcionados.");
      return;
    }

    setSuccess(
      result.isOwner
        ? "¡Bienvenida! Accediendo al Panel de Dueña..."
        : "¡Inicio de sesión exitoso!",
    );
    showToast({
      title: result.isOwner
        ? "👑 Sesión de Dueña Iniciada"
        : `🌸 Bienvenido a ${siteSettings.businessName}`,
      subtitle: result.isOwner ? "Acceso administrativo concedido." : `Hola ${email.split("@")[0]}`,
    });

    setTimeout(() => {
      setIsLoading(false);
      onClose();
      setActiveTab(result.isOwner ? "admin" : "cuenta");
    }, 500);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!regName.trim()) {
      setError("Por favor ingresa tu nombre completo.");
      return;
    }
    if (!regEmail.trim()) {
      setError("Por favor ingresa un correo electrónico válido.");
      return;
    }
    if (regPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setIsLoading(true);
    const result = await register(regName.trim(), regEmail.trim(), regPhone.trim(), regPassword);

    if (!result.ok) {
      setIsLoading(false);
      setError(result.message ?? "Hubo un error al crear la cuenta. Intenta de nuevo.");
      return;
    }

    if (result.needsConfirmation) {
      setIsLoading(false);
      setSuccess(
        result.message ??
          "Te enviamos un correo de confirmación. Abre el enlace para activar tu cuenta y luego inicia sesión.",
      );
      showToast({
        title: "📧 Confirma tu correo",
        subtitle: `Te enviamos un enlace de verificación a ${regEmail.trim()}.`,
      });
      return;
    }

    setSuccess("¡Tu cuenta ha sido creada exitosamente! Iniciando sesión...");
    showToast({
      title: `🌸 ¡Bienvenido a ${siteSettings.businessName}!`,
      subtitle: "Tu cuenta ha sido creada exitosamente. ¡Bienvenido a Mi Monce!",
    });

    setTimeout(() => {
      setIsLoading(false);
      onClose();
      setActiveTab("cuenta");
    }, 400);
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const email = forgotEmail.trim().toLowerCase();
    if (!email) {
      setError("Por favor ingresa tu correo electrónico.");
      return;
    }

    setIsLoading(true);
    const result = await resetPassword(email);
    setIsLoading(false);

    if (!result.ok) {
      setError(
        result.message ?? "No pudimos enviar el correo de restablecimiento. Intenta de nuevo.",
      );
      return;
    }

    setSuccess(
      result.message ||
        "Te hemos enviado un enlace de verificación a tu correo para restablecer tu contraseña.",
    );
    showToast({
      title: "✉️ Enlace de restablecimiento enviado",
      subtitle: `Revisa la bandeja de entrada o spam de ${email}`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-rose-100 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-100/60 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-rose-50 transition-colors cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Icon & Heading */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-2xs">
            <Sparkles className="w-6 h-6 text-rose-600" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-stone-900">
            {mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
            {mode === "login"
              ? "Accede para dar seguimiento a tus pedidos, consultar cotizaciones y acumular puntos de lealtad."
              : "Regístrate para guardar tus ramos favoritos, gestionar envíos y recibir beneficios exclusivos."}
          </p>
        </div>

        {/* Tabs: Iniciar Sesión / Registrarse */}
        {mode !== "forgot_password" ? (
          <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl mb-5 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setSuccess(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === "login"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
                setSuccess(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === "register"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Crear Cuenta
            </button>
          </div>
        ) : (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-between">
            <span className="text-xs font-bold text-rose-900">Restablecer Contraseña</span>
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setSuccess(null);
              }}
              className="text-xs font-bold text-rose-700 hover:underline cursor-pointer"
            >
              Volver a Iniciar Sesión
            </button>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-700">Contraseña</label>
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot_password");
                    setError(null);
                    setSuccess(null);
                    setForgotEmail(loginEmail);
                  }}
                  className="text-[11px] text-rose-700 hover:text-rose-900 hover:underline cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-rose-700 hover:bg-rose-800 disabled:opacity-70 text-white rounded-xl text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>{isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === "forgot_password" && (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <p className="text-xs text-stone-600 leading-relaxed">
              Ingresa el correo electrónico asociado a tu cuenta. Te enviaremos un enlace de
              verificación para que restablezcas tu contraseña de forma segura.
            </p>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-rose-700 hover:bg-rose-800 disabled:opacity-70 text-white rounded-xl text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isLoading ? "Enviando enlace..." : "Enviar Enlace de Verificación"}</span>
              <Mail className="w-4 h-4" />
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setSuccess(null);
                }}
                className="text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                ← Volver a Iniciar Sesión
              </button>
            </div>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === "register" && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nombre Completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Tu nombre y apellido"
                  className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Teléfono / WhatsApp{" "}
                <span className="text-stone-400 font-normal">(Para actualizaciones del ramo)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  onBlur={() => setRegPhone(formatPhoneOnBlur(regPhone))}
                  placeholder="(515) 123-4567"
                  className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Crear Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-rose-700 hover:bg-rose-800 disabled:opacity-70 text-white rounded-xl text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>{isLoading ? "Creando cuenta..." : "Registrar Mi Cuenta"}</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Mode Toggle Footer */}
        <div className="mt-4 text-center">
          {mode === "login" ? (
            <p className="text-xs text-stone-500">
              ¿No tienes una cuenta aún?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
                className="font-bold text-rose-700 hover:text-rose-800 hover:underline cursor-pointer"
              >
                Regístrate gratis
              </button>
            </p>
          ) : mode === "register" ? (
            <p className="text-xs text-stone-500">
              ¿Ya tienes cuenta registrada?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className="font-bold text-rose-700 hover:text-rose-800 hover:underline cursor-pointer"
              >
                Inicia sesión aquí
              </button>
            </p>
          ) : (
            <p className="text-xs text-stone-500">
              ¿Recordaste tu contraseña?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className="font-bold text-rose-700 hover:text-rose-800 hover:underline cursor-pointer"
              >
                Inicia sesión aquí
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
