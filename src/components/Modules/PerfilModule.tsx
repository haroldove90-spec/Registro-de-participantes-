import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, EventoData, UserRole } from '../../types';
import { updateUserPassword } from '../../utils/auth';
import { saveStoredCustomAvatar, getStoredCustomAvatar } from '../../utils/storage';
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
  UploadCloud,
  Trash2,
  Calendar,
  Clock,
  Award,
  BookOpen,
  Check,
  ExternalLink,
  LogOut,
} from 'lucide-react';

interface PerfilModuleProps {
  userProfile: UserProfile;
  eventos?: EventoData[];
  onSaveProfile: (updatedProfile: UserProfile) => void;
  onNavigateToHistorial?: () => void;
  onLogout?: () => void;
}

export const PerfilModule: React.FC<PerfilModuleProps> = ({
  userProfile,
  eventos = [],
  onSaveProfile,
  onNavigateToHistorial,
  onLogout,
}) => {
  // Form State
  const [nombre, setNombre] = useState(userProfile.nombre);
  const [email, setEmail] = useState(userProfile.email);
  const [puesto, setPuesto] = useState(userProfile.puesto);
  const [departamento, setDepartamento] = useState(userProfile.departamento);
  const [rfc, setRfc] = useState(userProfile.rfc);
  const [telefono, setTelefono] = useState(userProfile.telefono);
  const [rol, setRol] = useState<UserRole | string>(userProfile.rol);
  const [avatarUrl, setAvatarUrl] = useState(() => userProfile.avatarUrl || getStoredCustomAvatar() || '');
  const [fechaIngreso, setFechaIngreso] = useState(userProfile.fechaIngreso || new Date().toISOString().split('T')[0]);
  const [notificacionesEmail, setNotificacionesEmail] = useState(userProfile.notificacionesEmail);
  const [modoOscuro, setModoOscuro] = useState(userProfile.modoOscuro);

  // Sync state if userProfile changes from outside
  useEffect(() => {
    setNombre(userProfile.nombre);
    setEmail(userProfile.email);
    setPuesto(userProfile.puesto);
    setDepartamento(userProfile.departamento);
    setRfc(userProfile.rfc);
    setTelefono(userProfile.telefono);
    setRol(userProfile.rol);
    const custom = getStoredCustomAvatar();
    if (userProfile.avatarUrl && !userProfile.avatarUrl.includes('unsplash')) {
      setAvatarUrl(userProfile.avatarUrl);
    } else if (custom) {
      setAvatarUrl(custom);
    } else {
      setAvatarUrl(userProfile.avatarUrl);
    }
    setFechaIngreso(userProfile.fechaIngreso || new Date().toISOString().split('T')[0]);
    setNotificacionesEmail(userProfile.notificacionesEmail);
    setModoOscuro(userProfile.modoOscuro);
  }, [userProfile]);

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

  // Available roles for assignment (Strictly only 2 roles)
  const AVAILABLE_ROLES: UserRole[] = [
    'Admin',
    'Coordinadores',
  ];

  const isAccountAdmin =
    userProfile.email?.toLowerCase().includes('harold') ||
    userProfile.usuario?.toLowerCase().includes('harold') ||
    userProfile.nombre?.toLowerCase().includes('harold') ||
    userProfile.rol === 'Admin' ||
    Boolean(userProfile.rol?.toLowerCase().includes('admin'));

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

  // Handle Photo File Upload with square crop, lightweight compression & reliable DataURL
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert('La imagen seleccionada supera los 20MB. Por favor seleccione una imagen más liviana.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) return;

      const img = new Image();
      img.onload = () => {
        // High quality square avatar crop (256x256) - lightweight ~15KB, fast and durable
        const canvas = document.createElement('canvas');
        const targetDim = 256;
        canvas.width = targetDim;
        canvas.height = targetDim;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Center crop to preserve square aspect ratio without stretching
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetDim, targetDim);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setAvatarUrl(compressedDataUrl);

          // Save directly to dedicated custom avatar store
          saveStoredCustomAvatar(compressedDataUrl);

          // Inmediatamente guarda y sincroniza la foto en el perfil
          const updatedProfile: UserProfile = {
            ...userProfile,
            nombre,
            email,
            puesto,
            departamento,
            rfc,
            telefono,
            rol,
            avatarUrl: compressedDataUrl,
            fechaIngreso,
            notificacionesEmail,
            modoOscuro,
          };
          onSaveProfile(updatedProfile);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 4000);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    if (e.target) {
      e.target.value = '';
    }
  };

  // Handle Profile Save
  const handleSubmitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (avatarUrl) {
      saveStoredCustomAvatar(avatarUrl);
    }
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

    // Update in auth credential store
    updateUserPassword(userProfile.usuario || userProfile.email, newPassword);

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
            src={
              avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
            }
            alt={nombre}
            className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl object-cover border-4 border-white/20 shadow-2xl transition-transform group-hover:scale-105 bg-slate-800"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-slate-950/75 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-xs font-semibold p-2 text-center"
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
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" /> Subir Fotografía
          </button>

          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition-all flex items-center justify-center gap-1.5 backdrop-blur-md cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-amber-300" /> Contraseña
          </button>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="px-3.5 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-xs font-semibold text-white transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Cerrar Sesión
            </button>
          )}
        </div>
      </div>

      {/* Save Success Banner */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 shadow-md animate-fade-in">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold text-sm">¡Datos personales y fotografía guardados exitosamente!</p>
            <p className="text-xs text-emerald-700">Tu información ha sido sincronizada en la base de datos.</p>
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
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
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer"
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
                <p className="text-xs text-slate-500">Actualice su información personal, fotografía de perfil y datos laborales</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-blue-600" />
              <span>Cambiar Foto</span>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Direct Upload Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={
                    avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
                  }
                  alt="Vista previa"
                  className="w-16 h-16 rounded-xl object-cover border-2 border-blue-500 shadow-sm"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase">Fotografía de Identificación</h4>
                  <p className="text-xs text-slate-500">Soporta formatos JPG, PNG, WEBP (se optimiza y guarda automáticamente).</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Cargar Imagen</span>
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarUrl('');
                      saveStoredCustomAvatar('');
                      const updatedProfile: UserProfile = { ...userProfile, avatarUrl: '' };
                      onSaveProfile(updatedProfile);
                    }}
                    className="p-2 rounded-xl border border-slate-300 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs transition-colors cursor-pointer"
                    title="Quitar fotografía"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
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
                  disabled={!isAccountAdmin}
                  className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none font-semibold ${
                    !isAccountAdmin
                      ? 'bg-slate-100 text-slate-600 cursor-not-allowed'
                      : 'bg-white cursor-pointer focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                  }`}
                >
                  {AVAILABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r} {r === 'Admin' ? '(Control Total)' : '(Operativo)'}
                    </option>
                  ))}
                </select>
                {!isAccountAdmin && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Solo el rol Admin puede modificar la asignación de roles.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* System Preferences Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
              <Bell className="w-4 h-4" />
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
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
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
                    className="px-4 py-2 rounded-xl border text-slate-600 font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors cursor-pointer"
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

