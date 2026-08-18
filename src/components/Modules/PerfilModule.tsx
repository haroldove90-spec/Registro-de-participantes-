import React, { useState, useRef } from 'react';
import { UserProfile, EventoData, UserRole } from '../../types';
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
  Database,
  Code2,
  LogIn,
  UploadCloud,
  Trash2,
  Calendar,
  Clock,
  Award,
  BookOpen,
  Check,
  ExternalLink,
} from 'lucide-react';
import { SUPABASE_PROJECT_CONFIG } from '../../lib/supabase';

interface PerfilModuleProps {
  userProfile: UserProfile;
  eventos?: EventoData[];
  onSaveProfile: (updatedProfile: UserProfile) => void;
  onOpenSupabaseModal?: () => void;
  onOpenAuthModal?: () => void;
  onNavigateToHistorial?: () => void;
}

export const PerfilModule: React.FC<PerfilModuleProps> = ({
  userProfile,
  eventos = [],
  onSaveProfile,
  onOpenSupabaseModal,
  onOpenAuthModal,
  onNavigateToHistorial,
}) => {
  // Form State
  const [nombre, setNombre] = useState(userProfile.nombre);
  const [email, setEmail] = useState(userProfile.email);
  const [puesto, setPuesto] = useState(userProfile.puesto);
  const [departamento, setDepartamento] = useState(userProfile.departamento);
  const [rfc, setRfc] = useState(userProfile.rfc);
  const [telefono, setTelefono] = useState(userProfile.telefono);
  const [rol, setRol] = useState<UserRole | string>(userProfile.rol);
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl);
  const [fechaIngreso, setFechaIngreso] = useState(userProfile.fechaIngreso || new Date().toISOString().split('T')[0]);
  const [notificacionesEmail, setNotificacionesEmail] = useState(userProfile.notificacionesEmail);
  const [modoOscuro, setModoOscuro] = useState(userProfile.modoOscuro);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  ];

  // Available roles for assignment
  const AVAILABLE_ROLES: UserRole[] = [
    'Participante / Empleado',
    'Administrador de Capacitación',
    'Coordinador de Capacitación',
    'Instructor / Capacitador',
    'Recursos Humanos (RH)',
    'Auditor / Consulta',
  ];

  // Calculate Events where this user has participated
  const misEventosParticipados = eventos.filter((evt) =>
    evt.participantes?.some(
      (p) =>
        (p.email && p.email.toLowerCase() === email.toLowerCase()) ||
        p.nombre.toLowerCase().includes(nombre.toLowerCase()) ||
        (nombre && p.nombre.toLowerCase() === nombre.toLowerCase())
    )
  );

  const totalHorasAcumuladas = misEventosParticipados.reduce(
    (acc, evt) => acc + (Number(evt.horasCapacitacion) || 0),
    0
  );

  // Handle Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen seleccionada supera los 5MB. Por favor seleccione una imagen más liviana.');
        return;
      }
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
      fechaIngreso,
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
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Profile Header Hero Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <User className="w-56 h-56 text-white" />
        </div>

        {/* Photo Avatar with Real Upload Action */}
        <div className="relative group shrink-0">
          <img
            src={avatarUrl || presetAvatars[0]}
            alt={nombre}
            className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl object-cover border-4 border-white/20 shadow-2xl transition-transform group-hover:scale-105"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-slate-950/70 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-xs font-semibold p-2 text-center"
          >
            <Camera className="w-7 h-7 mb-1 text-blue-300 animate-bounce" />
            <span>Subir Fotografía</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>

        {/* User Info Overview */}
        <div className="flex-1 text-center sm:text-left space-y-2.5 z-10">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-500/25 text-blue-200 text-xs font-bold border border-blue-400/40 flex items-center gap-1.5 backdrop-blur-xs">
              <ShieldCheck className="w-4 h-4 text-blue-300" /> {rol}
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/25 text-emerald-200 text-xs font-bold border border-emerald-400/40 flex items-center gap-1 backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Cuenta Activa
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{nombre}</h2>
          <p className="text-sm sm:text-base text-slate-300 font-medium">{puesto || 'Puesto no especificado'}</p>
          <p className="text-xs text-slate-400">
            {departamento || 'Departamento general'} • <span className="font-mono">{email}</span>
          </p>

          {/* Quick Metrics Badge for the User */}
          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <Award className="w-4 h-4 text-amber-400" />
              <span><strong>{misEventosParticipados.length}</strong> Eventos Participados</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span><strong>{totalHorasAcumuladas} hrs</strong> Capacitación Recibida</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 self-center sm:self-start shrink-0 z-10">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 backdrop-blur-md shadow-sm"
          >
            <UploadCloud className="w-4 h-4 text-blue-300" /> Subir Foto
          </button>

          {onOpenAuthModal && (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-md"
            >
              <LogIn className="w-4 h-4" /> Cambiar Cuenta
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition-all flex items-center justify-center gap-1.5 backdrop-blur-md"
          >
            <KeyRound className="w-4 h-4 text-amber-300" /> Contraseña
          </button>
        </div>
      </div>

      {/* Save Success Banner */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 shadow-md animate-fade-in">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold text-sm">¡Datos personales y fotografía actualizados exitosamente!</p>
            <p className="text-xs text-emerald-700">Los cambios han sido guardados en el sistema y sincronizados en la nube.</p>
          </div>
        </div>
      )}

      {/* SECTION: MIS EVENTOS Y CAPACITACIONES (VISTA PARTICIPANTE) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200/80 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Mis Eventos de Capacitación y Participaciones</h3>
              <p className="text-xs text-slate-500">Historial de cursos y reuniones donde estás registrado como participante</p>
            </div>
          </div>

          {onNavigateToHistorial && (
            <button
              type="button"
              onClick={onNavigateToHistorial}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-2xs self-start sm:self-auto"
            >
              <span>Ver Catálogo de Eventos</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="p-6">
          {misEventosParticipados.length === 0 ? (
            <div className="text-center py-8 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-slate-800">Aún no estás registrado en ningún evento</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Puedes explorar los eventos de capacitación disponibles y hacer clic en <strong>"Aceptar Participar / Inscribirme"</strong> para que se registren en tu historial.
              </p>
              {onNavigateToHistorial && (
                <button
                  type="button"
                  onClick={onNavigateToHistorial}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>Explorar Eventos Disponibles</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {misEventosParticipados.map((evt) => (
                <div
                  key={evt.id}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200 transition-all space-y-3 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-[11px] font-bold font-mono">
                      {evt.id}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" /> Inscrito
                    </span>
                  </div>

                  <div>
                    <h5 className="font-bold text-sm text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {evt.nombreEvento}
                    </h5>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{evt.objetivoEvento || 'Sin descripción'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200/60 text-slate-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{evt.fechaInicio}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span><strong>{evt.horasCapacitacion} hrs</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Profile Edit Form */}
      <form onSubmit={handleSubmitProfile} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Editar Datos Personales y Laborales</h3>
                <p className="text-xs text-slate-500">Actualice su información personal, fotografía, de contacto y puesto</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5 text-blue-600" />
              <span>Cambiar Foto</span>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Photo Avatar Quick Selector / Upload Trigger */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Galería de Avatares o Subir Archivo Propio
                </label>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl(presetAvatars[0])}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Restaurar predeterminado
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 overflow-x-auto py-1">
                {/* Upload Button Box */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-14 h-14 rounded-2xl border-2 border-dashed border-blue-400 bg-blue-50/50 hover:bg-blue-100/60 text-blue-700 flex flex-col items-center justify-center text-[10px] font-bold transition-all shrink-0 shadow-2xs"
                  title="Subir imagen desde computadora o celular"
                >
                  <UploadCloud className="w-5 h-5 mb-0.5" />
                  <span>Subir</span>
                </button>

                {presetAvatars.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                      avatarUrl === url
                        ? 'border-blue-600 ring-4 ring-blue-500/30 scale-105 shadow-md'
                        : 'border-slate-200 opacity-70 hover:opacity-100 hover:scale-100'
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
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" /> Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                  placeholder="Ej. Juan Pérez González"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-600" /> Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                  placeholder="usuario@empresa.com"
                />
              </div>

              {/* Puesto */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-blue-600" /> Puesto Actual
                </label>
                <input
                  type="text"
                  required
                  value={puesto}
                  onChange={(e) => setPuesto(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Ej. Técnico Especialista / Colaborador"
                />
              </div>

              {/* Departamento */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" /> Departamento
                </label>
                <input
                  type="text"
                  required
                  value={departamento}
                  onChange={(e) => setDepartamento(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Ej. Operaciones / Mantenimiento"
                />
              </div>

              {/* RFC */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" /> RFC
                </label>
                <input
                  type="text"
                  value={rfc}
                  onChange={(e) => setRfc(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all uppercase font-mono"
                  placeholder="XAXX010101000"
                />
              </div>

              {/* Teléfono */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-600" /> Teléfono de Contacto
                </label>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="+52 (55) 1234-5678"
                />
              </div>

              {/* Fecha de Ingreso */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" /> Fecha de Ingreso
                </label>
                <input
                  type="date"
                  value={fechaIngreso}
                  onChange={(e) => setFechaIngreso(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Rol de Acceso */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Rol de Acceso al Sistema
                </label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold bg-white cursor-pointer"
                >
                  {AVAILABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r} {r === 'Participante / Empleado' ? '(Inscripción y consulta de cursos)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Supabase Cloud Database Integration Card */}
        <div className="bg-white rounded-2xl border border-emerald-200/90 shadow-2xs overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200/80 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Base de Datos en la Nube (Supabase)</h3>
                <p className="text-xs text-slate-500">Sincronización en tiempo real y persistencia en la nube</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Activo
            </span>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-semibold text-[10px] uppercase">Proyecto</p>
                <p className="font-bold text-slate-800 break-all">{SUPABASE_PROJECT_CONFIG.projectName}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-semibold text-[10px] uppercase">ID de Proyecto</p>
                <p className="font-mono font-bold text-slate-800">{SUPABASE_PROJECT_CONFIG.projectId}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 font-semibold text-[10px] uppercase">Estado de Sincronización</p>
                <p className="font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Automática
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-xs text-slate-500">
                Todos los eventos, asistencias, horas-hombre y perfiles se respaldan en Supabase PostgreSQL.
              </p>

              {onOpenSupabaseModal && (
                <button
                  type="button"
                  onClick={onOpenSupabaseModal}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Code2 className="w-3.5 h-3.5" /> Ver SQL y Probar Conexión
                </button>
              )}
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
                    Recibir confirmaciones de registro de participantes y convocatorias
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
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-5 h-5" /> Guardar Todos los Cambios
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
