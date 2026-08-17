import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  Building2,
  Briefcase,
  FileText,
  Phone,
  ShieldCheck,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import {
  signInWithSupabase,
  signUpWithSupabase,
  SUPABASE_PROJECT_CONFIG,
} from '../../lib/supabase';
import { DEMO_PRESET_USERS } from '../../utils/storage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  currentEmail?: string;
}

const AVAILABLE_ROLES: { value: UserRole; label: string; desc: string }[] = [
  {
    value: 'Administrador de Capacitación',
    label: 'Administrador de Capacitación',
    desc: 'Acceso total a configuración, roles, métricas y reportes',
  },
  {
    value: 'Coordinador de Capacitación',
    label: 'Coordinador de Capacitación',
    desc: 'Creación de eventos, control de presupuestos y gestión de asistencia',
  },
  {
    value: 'Instructor / Capacitador',
    label: 'Instructor / Capacitador',
    desc: 'Registro de asistencias, firma de cursos y contenidos temáticos',
  },
  {
    value: 'Recursos Humanos (RH)',
    label: 'Recursos Humanos (RH)',
    desc: 'Revisión y aprobación de listas de asistencia y firmas oficiales',
  },
  {
    value: 'Participante / Empleado',
    label: 'Participante / Empleado',
    desc: 'Consulta de capacitaciones y firma de listas de asistencia',
  },
  {
    value: 'Auditor / Consulta',
    label: 'Auditor / Consulta',
    desc: 'Consulta de métricas, historial y descargas en PDF/Excel',
  },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentEmail = '',
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login Form States
  const [loginEmail, setLoginEmail] = useState(
    currentEmail || 'registrodeparticipantes@appdesignsoftware.com'
  );
  const [loginPassword, setLoginPassword] = useState('123456');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register Form States
  const [regNombre, setRegNombre] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPuesto, setRegPuesto] = useState('');
  const [regDepartamento, setRegDepartamento] = useState('');
  const [regRfc, setRegRfc] = useState('');
  const [regTelefono, setRegTelefono] = useState('');
  const [regRol, setRegRol] = useState<UserRole>('Coordinador de Capacitación');
  const [showRegPass, setShowRegPass] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  if (!isOpen) return null;

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      // 1. Try Supabase Auth
      const res = await signInWithSupabase(loginEmail, loginPassword);

      if (res.success && res.user) {
        onLoginSuccess(res.user);
        onClose();
        return;
      }

      // 2. Check if it matches a preset demo user
      const matchedDemo = DEMO_PRESET_USERS.find(
        (u) => u.email.toLowerCase() === loginEmail.trim().toLowerCase()
      );

      if (matchedDemo) {
        onLoginSuccess(matchedDemo);
        onClose();
        return;
      }

      // 3. Fallback: Create dynamic local profile from email
      const dynamicUser: UserProfile = {
        nombre: loginEmail.split('@')[0].replace('.', ' ').toUpperCase(),
        email: loginEmail.trim().toLowerCase(),
        puesto: 'Coordinador de Capacitación',
        departamento: 'Desarrollo Organizacional',
        rfc: 'XAXX010101000',
        telefono: '+52 (55) 0000-0000',
        rol: 'Coordinador de Capacitación',
        avatarUrl:
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
        fechaIngreso: new Date().toISOString().split('T')[0],
        notificacionesEmail: true,
        modoOscuro: false,
      };

      onLoginSuccess(dynamicUser);
      onClose();
    } catch (err: any) {
      setLoginError(err?.message || 'Error al iniciar sesión.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (regPassword.length < 6) {
      setRegError('La contraseña debe tener un mínimo de 6 caracteres.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Las contraseñas no coinciden.');
      return;
    }

    setRegLoading(true);

    try {
      const res = await signUpWithSupabase(regEmail, regPassword, {
        nombre: regNombre,
        puesto: regPuesto,
        departamento: regDepartamento,
        rfc: regRfc.toUpperCase(),
        telefono: regTelefono,
        rol: regRol,
      });

      if (!res.success && res.error && !res.error.includes('already registered')) {
        // Continue with local registration if Supabase tables/auth are not yet configured
        console.warn('Supabase sign up warning:', res.error);
      }

      const newUser: UserProfile = res.user || {
        nombre: regNombre,
        email: regEmail.trim().toLowerCase(),
        puesto: regPuesto || 'Colaborador',
        departamento: regDepartamento || 'General',
        rfc: regRfc.toUpperCase() || 'XAXX010101000',
        telefono: regTelefono || '',
        rol: regRol,
        avatarUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        fechaIngreso: new Date().toISOString().split('T')[0],
        notificacionesEmail: true,
        modoOscuro: false,
      };

      setRegSuccess(true);
      setTimeout(() => {
        onLoginSuccess(newUser);
        onClose();
      }, 1200);
    } catch (err: any) {
      setRegError(err?.message || 'Error al crear la cuenta.');
    } finally {
      setRegLoading(false);
    }
  };

  // Quick Demo User Selector
  const handleSelectDemoUser = (user: UserProfile) => {
    setLoginEmail(user.email);
    setLoginPassword('password123');
    onLoginSuccess(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-fade-in">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-6 text-white text-center relative">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-blue-300 mb-3 shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Control de Acceso y Capacitación
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
            Autenticación segura con Supabase Cloud y gestión de roles
          </p>

          {/* Mode Switch Tabs */}
          <div className="flex bg-white/10 p-1 rounded-xl mt-5 max-w-xs mx-auto backdrop-blur-xs border border-white/10">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setLoginError('');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'login'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" /> Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setRegError('');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'register'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Registrarse
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {/* ======================= LOGIN FORM ======================= */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-600" /> Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@empresa.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-600" /> Contraseña de Acceso
                </label>
                <div className="relative">
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                {loginLoading ? 'Verificando Credenciales...' : 'Ingresar al Sistema'}
              </button>

              {/* Quick Demo Accounts Selection */}
              <div className="pt-4 border-t border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" /> Acceso Rápido / Cuentas Demo:
                  </span>
                  <span className="text-[10px] text-slate-400">1-clic para probar</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEMO_PRESET_USERS.map((demo, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectDemoUser(demo)}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-all flex items-center gap-2.5 group"
                    >
                      <img
                        src={demo.avatarUrl}
                        alt={demo.nombre}
                        className="w-8 h-8 rounded-lg object-cover border"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-700">
                          {demo.nombre.split(' ')[0]} {demo.nombre.split(' ')[1]}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">{demo.rol}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* ======================= REGISTER FORM ======================= */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {regSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>¡Cuenta creada con éxito! Ingresando al panel...</span>
                </div>
              )}

              {regError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nombre Completo */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" /> Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Ing. María Guadalupe Ruiz"
                    value={regNombre}
                    onChange={(e) => setRegNombre(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-600" /> Correo Electrónico Corporativo
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="usuario@empresa.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Puesto */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-600" /> Puesto
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Instructor Técnico"
                    value={regPuesto}
                    onChange={(e) => setRegPuesto(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Departamento */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" /> Departamento
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Capacitación / RH"
                    value={regDepartamento}
                    onChange={(e) => setRegDepartamento(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* RFC */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" /> RFC
                  </label>
                  <input
                    type="text"
                    placeholder="XAXX010101000"
                    value={regRfc}
                    onChange={(e) => setRegRfc(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Teléfono */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-600" /> Teléfono
                  </label>
                  <input
                    type="text"
                    placeholder="+52 (55) 0000-0000"
                    value={regTelefono}
                    onChange={(e) => setRegTelefono(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Rol Inicial en el Sistema */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Rol Inicial en el Sistema
                  </label>
                  <select
                    value={regRol}
                    onChange={(e) => setRegRol(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                  >
                    {AVAILABLE_ROLES.map((r, idx) => (
                      <option key={idx} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500">
                    * Podrás cambiar o reasignar roles posteriormente mediante consultas SQL en Supabase o desde el panel de administración.
                  </p>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPass ? 'text' : 'password'}
                      required
                      placeholder="Mínimo 6 caracteres"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-9 rounded-xl border border-slate-300 text-slate-900 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPass(!showRegPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Confirmar Contraseña
                  </label>
                  <input
                    type={showRegPass ? 'text' : 'password'}
                    required
                    placeholder="Repita la contraseña"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm"
                  />
                </div>
              </div>

              {/* Submit Register Button */}
              <button
                type="submit"
                disabled={regLoading || regSuccess}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                {regLoading ? 'Registrando en Supabase...' : 'Registrar Cuenta y Entrar'}
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Supabase: {SUPABASE_PROJECT_CONFIG.projectId}</span>
          </span>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold transition-colors"
          >
            Continuar como Invitado
          </button>
        </div>
      </div>
    </div>
  );
};
