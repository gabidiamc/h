import React, { useState, useRef, useEffect } from "react";
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Bell,
  Shield,
  LogOut,
  Save,
  CheckCircle2,
  Lock,
  Camera,
  Trash2,
  Sparkles,
  Building2,
  Navigation,
  Loader2,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { CustomerNotificationPreferences } from "../../types";
import { avatarFileToOptimizedImage } from "../../lib/imageUpload";

// Quick artistic preset avatars
const PRESET_AVATARS = [
  {
    label: "Rosa Eterna",
    emoji: "🌸",
    url: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=150&auto=format&fit=crop&q=80",
  },
  {
    label: "Corona Dorada",
    emoji: "👑",
    url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  },
  {
    label: "Mariposa Rosa",
    emoji: "🦋",
    url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
  },
  {
    label: "Ramo Satín",
    emoji: "💐",
    url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  },
  {
    label: "Destellos de Luz",
    emoji: "✨",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
];

export const MiMonceCuenta: React.FC = () => {
  const { currentUser, updateUserProfile, updateNotificationPreferences, changePassword, logout } =
    useApp();

  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState<string>(currentUser?.name || "");
  const [nickname, setNickname] = useState<string>(currentUser?.nickname || "");
  const [phone, setPhone] = useState<string>(currentUser?.phone || "");
  const [avatar, setAvatar] = useState<string | undefined>(currentUser?.avatar);

  // Structured Address fields
  const [address, setAddress] = useState<string>(currentUser?.address || "");
  const [city, setCity] = useState<string>(currentUser?.city || "");
  const [state, setState] = useState<string>(currentUser?.state || "");
  const [postalCode, setPostalCode] = useState<string>(currentUser?.postalCode || "");

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [showSavedToast, setShowSavedToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>(
    "¡Tu perfil y datos han sido actualizados!",
  );
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Synchronize state when currentUser changes or loads
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setNickname(currentUser.nickname || "");
      setPhone(currentUser.phone || "");
      setAvatar(currentUser.avatar);
      setAddress(currentUser.address || "");
      setCity(currentUser.city || "");
      setState(currentUser.state || "");
      setPostalCode(currentUser.postalCode || "");
    }
  }, [currentUser]);

  // Notification preferences
  const currentPrefs: CustomerNotificationPreferences = currentUser?.notificationPreferences || {
    orderStatusUpdates: true,
    paymentAlerts: true,
    upcomingDatesReminders: true,
    promotionsAndCoupons: true,
    loyaltyLevelUp: true,
  };

  const [prefs, setPrefs] = useState<CustomerNotificationPreferences>(currentPrefs);

  if (!currentUser) return null;

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setIsUploadingPhoto(true);
    try {
      const optimized = await avatarFileToOptimizedImage(file);
      setAvatar(optimized);
      // Immediately persist to user profile and database
      await updateUserProfile({ avatar: optimized });
      setToastMessage("¡Foto de perfil actualizada y guardada permanentemente! ✨");
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3500);
    } catch (err: unknown) {
      setUploadError((err as Error)?.message || "No se pudo procesar la foto.");
    } finally {
      setIsUploadingPhoto(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSelectPresetAvatar = async (url: string) => {
    setUploadError(null);
    setAvatar(url);
    setIsSaving(true);
    try {
      await updateUserProfile({ avatar: url });
      setToastMessage("¡Foto de perfil actualizada con éxito! 🌸");
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3500);
    } catch (err: unknown) {
      setUploadError("No se pudo guardar la imagen seleccionada.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadError(null);
    setAvatar(undefined);
    setIsSaving(true);
    try {
      await updateUserProfile({ avatar: undefined });
      setToastMessage("Foto de perfil eliminada.");
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3500);
    } catch (err: unknown) {
      setUploadError("No se pudo eliminar la foto de perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUserProfile({
        name: name.trim(),
        nickname: nickname.trim() || undefined,
        phone: phone.trim(),
        avatar: avatar || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        postalCode: postalCode.trim() || undefined,
      });
      setToastMessage(
        "¡Tu perfil y dirección han sido actualizados y guardados correctamente en la nube!",
      );
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3500);
    } catch (err: unknown) {
      setUploadError((err as Error)?.message || "Error al guardar el perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMessage(null);
    if (newPassword.length < 6) {
      setPasswordMessage({
        type: "error",
        text: "La contraseña debe tener al menos 6 caracteres.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Las contraseñas no coinciden." });
      return;
    }
    setIsChangingPassword(true);
    const result = await changePassword(newPassword);
    setIsChangingPassword(false);
    if (!result.ok) {
      setPasswordMessage({
        type: "error",
        text: result.message || "No pudimos actualizar tu contraseña.",
      });
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage({
      type: "ok",
      text: result.message || "Tu contraseña ha sido actualizada correctamente.",
    });
  };

  const handleTogglePref = (key: keyof CustomerNotificationPreferences) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    updateNotificationPreferences(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-rose-600" />
          <h2 className="font-serif text-2xl font-bold text-stone-900">Mi Cuenta & Perfil</h2>
        </div>
        <p className="text-xs text-stone-500 mt-0.5">
          Personaliza tu foto de perfil, apodo, datos de contacto, dirección desglosada y
          preferencias de cuenta.
        </p>
      </div>

      {showSavedToast && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {uploadError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <span>{uploadError}</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleProfileSubmit} className="space-y-6">
        {/* 1. Avatar & Nickname Section */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-rose-100 shadow-xs space-y-5">
          <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-600" />
            <span>Foto de Perfil & Apodo</span>
          </h3>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar Preview */}
            <div className="relative group shrink-0">
              {isUploadingPhoto ? (
                <div className="w-24 h-24 rounded-3xl bg-rose-50 border-2 border-rose-300 flex flex-col items-center justify-center text-rose-700 shadow-md ring-4 ring-rose-50">
                  <Loader2 className="w-6 h-6 animate-spin text-rose-600 mb-1" />
                  <span className="text-[10px] font-bold">Guardando...</span>
                </div>
              ) : avatar ? (
                <img
                  src={avatar}
                  alt={name || "Perfil"}
                  className="w-24 h-24 rounded-3xl object-cover border-2 border-rose-300 shadow-md ring-4 ring-rose-50"
                />
              ) : (
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-rose-500 via-rose-600 to-pink-500 text-white flex items-center justify-center font-bold text-3xl shadow-md border-2 border-white ring-4 ring-rose-50">
                  {(name || currentUser.name).charAt(0).toUpperCase()}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Cambiar foto desde tu dispositivo"
                disabled={isUploadingPhoto || isSaving}
                className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white shadow-md cursor-pointer transition-transform hover:scale-105 disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileChange}
            />

            <div className="space-y-3 flex-1 text-center sm:text-left">
              <div>
                <p className="text-xs font-bold text-stone-900">Personaliza tu foto de perfil</p>
                <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                  Sube una foto desde tu teléfono o computadora, o elige una ilustración
                  prediseñada. Tus cambios se guardan permanentemente.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto || isSaving}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isUploadingPhoto ? (
                    <Loader2 className="w-3.5 h-3.5 text-rose-600 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5 text-rose-600" />
                  )}
                  <span>{isUploadingPhoto ? "Guardando foto..." : "Subir Foto"}</span>
                </button>

                {avatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={isSaving || isUploadingPhoto}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-60"
                  >
                    <Trash2 className="w-3 h-3 text-stone-500" />
                    <span>Quitar foto</span>
                  </button>
                )}
              </div>

              {/* Presets */}
              <div className="pt-1">
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                  O elige un estilo rápido:
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  {PRESET_AVATARS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleSelectPresetAvatar(preset.url)}
                      title={preset.label}
                      disabled={isSaving || isUploadingPhoto}
                      className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-all border ${
                        avatar === preset.url
                          ? "bg-rose-100 border-rose-400 text-rose-900 font-bold ring-2 ring-rose-200"
                          : "bg-stone-50 hover:bg-rose-50 border-stone-200 hover:border-rose-300 text-stone-700"
                      }`}
                    >
                      <span>{preset.emoji}</span>
                      <span className="text-[10px] font-medium">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Nickname field */}
          <div className="pt-2 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Apodo o Nombre de Cariño
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Ej. Monchi, Sofi, Princesa, Gaby"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <Sparkles className="w-4 h-4 text-rose-400 absolute left-3 top-3" />
              </div>
              <p className="text-[10px] text-stone-400 mt-1">
                Tu nombre cariñoso favorito con el que te saludaremos en tu espacio personal.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Nombre Completo *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Contact & Identity Section */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-rose-100 shadow-xs space-y-4">
          <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
            <Phone className="w-4 h-4 text-rose-600" />
            <span>Datos de Contacto</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Teléfono / WhatsApp de Contacto
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej. +52 871 123 4567"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Correo Electrónico (Identidad protegida)
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-100/80 text-stone-500 text-xs cursor-not-allowed"
                />
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              </div>
              <p className="text-[10px] text-stone-400 mt-1">
                El correo está vinculado a tu cuenta y sirve para restablecer tu contraseña.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Detailed Address Breakdown */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-rose-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-600" />
              <span>Dirección Completa de Ubicación</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
              Desglose detallado
            </span>
          </div>
          <p className="text-xs text-stone-500">
            Mantén tu ubicación actualizada con calle, número, estado, ciudad y código postal para
            tener una mejor perspectiva de tus registros.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Calle y Número */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Dirección (Calle, Número Exterior / Interior, Colonia)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej. Av. Hidalgo #1240 Pte., Col. Centro, Entre Calles 12 y 14"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Ciudad */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Ciudad / Municipio
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ej. Torreón"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <Building2 className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Estado / Provincia
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Ej. Coahuila"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <Navigation className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Código Postal */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Código Postal (C.P.)
              </label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="Ej. 27000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-1">
            <p className="text-[11px] font-bold text-stone-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-600" />
              <span>Vista previa de tu dirección registrada:</span>
            </p>
            <p className="text-xs text-stone-600 font-medium">
              {address || city || state || postalCode ? (
                [address, city, state, postalCode ? `C.P. ${postalCode}` : null]
                  .filter(Boolean)
                  .join(", ")
              ) : (
                <span className="italic text-stone-400">
                  Aún no has ingresado tu dirección completa.
                </span>
              )}
            </p>
          </div>

          {/* Delivery policy reminder */}
          <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/70 text-[11px] text-amber-900 leading-snug">
            📌 <strong>Nota de Entrega:</strong> Todos los pedidos se entregan{" "}
            <strong>exclusivamente para recoger en persona</strong> en nuestro taller artesanal para
            garantizar que tu ramo eterno se te entregue en óptimas condiciones.
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white rounded-2xl text-xs font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Guardando..." : "Guardar Perfil y Dirección"}</span>
          </button>
        </div>
      </form>

      {/* Notification Preferences */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-rose-100 shadow-xs space-y-4">
        <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
          <Bell className="w-4 h-4 text-rose-600" />
          <span>Preferencias de Notificaciones</span>
        </h3>

        <div className="divide-y divide-stone-100">
          <div className="py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-stone-900">
                Actualizaciones del Estado del Pedido
              </p>
              <p className="text-[11px] text-stone-500">
                Avisos cuando el pedido entra a taller, se empaqueta o está listo para recoger en
                persona.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleTogglePref("orderStatusUpdates")}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                prefs.orderStatusUpdates ? "bg-rose-700" : "bg-stone-200"
              }`}
            >
              <span
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  prefs.orderStatusUpdates ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          <div className="py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-stone-900">Validación de Comprobantes de Pago</p>
              <p className="text-[11px] text-stone-500">
                Confirmación inmediata cuando Monce apruebe tu transferencia.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleTogglePref("paymentAlerts")}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                prefs.paymentAlerts ? "bg-rose-700" : "bg-stone-200"
              }`}
            >
              <span
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  prefs.paymentAlerts ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          <div className="py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-stone-900">Recordatorios de Fechas Especiales</p>
              <p className="text-[11px] text-stone-500">
                Alertas con días de anticipación para cumpleaños y aniversarios.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleTogglePref("upcomingDatesReminders")}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                prefs.upcomingDatesReminders ? "bg-rose-700" : "bg-stone-200"
              }`}
            >
              <span
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  prefs.upcomingDatesReminders ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          <div className="py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-stone-900">Cupones Exclusivos y Promociones</p>
              <p className="text-[11px] text-stone-500">
                Descuentos de temporada y beneficios VIP de tu nivel.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleTogglePref("promotionsAndCoupons")}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                prefs.promotionsAndCoupons ? "bg-rose-700" : "bg-stone-200"
              }`}
            >
              <span
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  prefs.promotionsAndCoupons ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-rose-100 shadow-xs space-y-4">
        <div>
          <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-600" />
            <span>Cambiar Contraseña</span>
          </h3>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Escribe tu nueva contraseña. No necesitas recordar la anterior.
          </p>
        </div>

        {passwordMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
              passwordMessage.type === "ok"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <CheckCircle2
              className={`w-4 h-4 shrink-0 ${
                passwordMessage.type === "ok" ? "text-emerald-600" : "text-rose-600"
              }`}
            />
            <span>{passwordMessage.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Nueva Contraseña
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contraseña"
              autoComplete="new-password"
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleChangePassword}
          disabled={isChangingPassword}
          className="w-full sm:w-auto px-5 py-3 bg-rose-700 hover:bg-rose-800 disabled:opacity-70 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Lock className="w-4 h-4" />
          <span>{isChangingPassword ? "Actualizando..." : "Actualizar Contraseña"}</span>
        </button>
      </div>

      {/* Privacy & Security */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-rose-100 shadow-xs space-y-3">
        <h3 className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>Privacidad & Seguridad de tus Datos</span>
        </h3>
        <p className="text-xs text-stone-600 leading-relaxed">
          Toda tu información personal, dedicatorias y fechas especiales están sincronizadas en
          tiempo real mediante base de datos segura y cifrada. La verificación de correo se reserva
          exclusivamente para restablecer tu contraseña en caso de olvido.
        </p>
      </div>

      {/* Logout Action */}
      <div className="pt-2">
        <button
          type="button"
          onClick={logout}
          className="w-full py-3.5 rounded-2xl bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-900 border border-stone-200 hover:border-rose-200 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-rose-600" />
          <span>Cerrar Sesión en Mi Monce</span>
        </button>
      </div>
    </div>
  );
};
