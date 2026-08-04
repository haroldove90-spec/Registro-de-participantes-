import React, { useState } from 'react';
import { UserProfile } from '../../types';
import {
  User,
  Mail,
  Briefcase,
  Building2,
  FileText,
  Phone,
  ShieldCheck,
  Camera,
  KeyRound,
  Save,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Bell,
  Moon,
  Sun,
  Sparkles,
} from 'lucide-react';

interface PerfilModuleProps {
  userProfile: UserProfile;
  onSaveProfile: (updatedProfile: UserProfile) => void;
}

export const PerfilModule: React.FC<PerfilModuleProps> = ({
  userProfile,
  onSaveProfile,
}) => {
  // Form State
  const [nombre, setNombre] = useState(userProfile.nombre);
  const [email, setEmail] = useState(userProfile.email);
  const [puesto, setPuesto] = useState(userProfile.puesto);
  const [departamento, setDepartamento] = useState(userProfile.departamento);
  const [rfc, setRfc] = useState(userProfile.rfc);
  const [telefono, setTelefono] = useState(userProfile.telefono);
  const [rol, setRol] = useState(userProfile.rol);
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl);
  const [notificacionesEmail, setNotificacionesEmail] = useState(
    userProfile.notificacionesEmail
  );
  const [modoOscuro, setModoOscuro] = useState(userProfile.modoOscuro);

  // Password Change State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassToggle, setShowPassToggle] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Profile Save Success State
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Preset Avatar choices
  const presetAvatars = [
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  ];

  // Handle Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Profile Save
  const handleSubmitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...userProfile,
      nombre,
      email,
      puesto,
      departamento,
      rfc,
      telefono,
      rol,
      avatarUrl,
      notificacionesEmail,
      modoOscuro,
    };
    onSaveProfile(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  // Handle Password Submit
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Ingrese su contraseña actual.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Las nuevas contraseñas no coinciden.');
      return;
    }

    // Success
    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => {
      setPasswordSuccess(false);
      setShowPasswordModal(false);
    }, 2500);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <User className="w-48 h-48 text-white" />
        </div>

        {/* Avatar with Camera Overlay */}
        <div className="relative group shrink-0">
          <img
            src={avatarUrl}
            alt={nombre}
            className="w-28 h-28 rounded-2xl object-cover border-4 border-white/20 shadow-xl"
          />
          <label className="absolute inset-0 bg-slate-950/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-xs font-semibold">
            <Camera className="w-6 h-6 mb-1" />
            <span>Cambiar Foto</span>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* User Info Overview */}
        <div className="flex-1 text-center sm:text-left space-y-2 z-10">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> {rol}
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30">
              Activo
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white">{nombre}</h2>
          <p className="text-sm text-slate-300 font-medium">{puesto}</p>
          <p className="text-xs text-slate-400">{departamento} • {email}</p>
        </div>

        {/* Security Password Shortcut Button */}
        <button
          onClick={() => setShowPasswordModal(true)}
          className="self-center sm:self-start px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition-all flex items-center gap-1.5 backdrop-blur-md shrink-0"
        >
          <KeyRound className="w-4 h-4 text-amber-300" /> Cambiar Contraseña
        </button>
      </div>

      {/* Save Success Banner */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 shadow-2xs animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="font-bold text-sm">¡Datos personales guardados con éxito!</p>
        </div>
      )}

      {/* Main Profile Edit Form */}
      <form onSubmit={handleSubmitProfile} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Datos Personales y Laborales</h3>
              <p className="text-xs text-slate-500">Actualice su información personal, de contacto y puesto</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Preset Avatars Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Selección Rápida de Foto de Perfil
              </label>
              <div className="flex items-center gap-3 overflow-x-auto py-1">
                {presetAvatars.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      avatarUrl === url
                        ? 'border-blue-600 ring-2 ring-blue-500/30 scale-105'
                        : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              {/* Nombre */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" /> Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-600" /> Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Puesto */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-blue-600" /> Puesto Actual
                </label>
                <input
                  type="text"
                  required
                  value={puesto}
                  onChange={(e) => setPuesto(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Departamento */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" /> Departamento
                </label>
                <input
                  type="text"
                  required
                  value={departamento}
                  onChange={(e) => setDepartamento(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* RFC */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" /> RFC
                </label>
                <input
                  type="text"
                  value={rfc}
                  onChange={(e) => setRfc(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all uppercase"
                />
              </div>

              {/* Teléfono */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-600" /> Teléfono de Contacto
                </label>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Rol */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Rol del Sistema
                </label>
                <input
                  type="text"
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50 font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* System Preferences Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Preferencias del Sistema</h3>
              <p className="text-xs text-slate-500">Notificaciones y apariencia visual</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Notificaciones por Correo</p>
                  <p className="text-[11px] text-slate-500">
                    Recibir confirmaciones de registro de participantes
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notificacionesEmail}
                onChange={(e) => setNotificacionesEmail(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded border-slate-300 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                {modoOscuro ? (
                  <Moon className="w-5 h-5 text-indigo-600" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-500" />
                )}
                <div>
                  <p className="text-xs font-bold text-slate-800">Modo Oscuro Adaptativo</p>
                  <p className="text-[11px] text-slate-500">
                    Ajusta el contraste para ambientes de baja luz
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={modoOscuro}
                onChange={(e) => setModoOscuro(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded border-slate-300 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Submit Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" /> Guardar Datos Personales
          </button>
        </div>
      </form>

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Cambiar Contraseña</h3>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {passwordSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-bold text-sm">¡Contraseña actualizada correctamente!</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
                {passwordError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
                    {passwordError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Contraseña Actual</label>
                  <div className="relative">
                    <input
                      type={showPassToggle ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassToggle(!showPassToggle)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassToggle ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">Nueva Contraseña</label>
                  <input
                    type={showPassToggle ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-semibold text-slate-700">
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    type={showPassToggle ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 rounded-xl border text-slate-600 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
                  >
                    Actualizar Contraseña
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
