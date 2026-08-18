import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Briefcase,
  Building,
  FileText,
  Phone,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Database,
  Building2,
  Sparkles,
  KeyRound,
  Check,
} from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import {
  signInWithSupabase,
  signUpWithSupabase,
  SUPABASE_PROJECT_CONFIG,
} from '../../lib/supabase';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  initialEmail?: string;
}

const AVAILABLE_ROLES: { value: UserRole; label: string; desc: string }[] = [
  {
    value: 'Administrador de Capacitación',
    label: 'Administrador de Capacitación',
    desc: 'Acceso total: crear, editar, eliminar eventos, métricas y firmas',
  },
  {
    value: 'Coordinador de Capacitación',
    label: 'Coordinador de Capacitación',
    desc: 'Creación y gestión operativa de listas y participantes',
  },
  {
    value: 'Instructor / Capacitador',
    label: 'Instructor / Capacitador',
    desc: 'Gestión de listas, firma de instructor y contenido temático',
  },
  {
    value: 'Recursos Humanos (RH)',
    label: 'Recursos Humanos (RH)',
    desc: 'Validación de horas-hombre, costos y firma de visto bueno',
  },
  {
    value: 'Participante / Empleado',
    label: 'Participante / Empleado',
    desc: 'Consulta de capacitaciones tomadas y auto-registro',
  },
  {
    value: 'Auditor / Consulta',
    label: 'Auditor / Consulta',
    desc: 'Modo solo lectura para auditorías de cumplimiento STPS / ISO',
  },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  initialEmail = '',
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState(initialEmail);
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register Form State
  const [regNombre, setRegNombre] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPuesto, setRegPuesto] = useState('');
  const [regDepto, setRegDepto] = useState('');
  const [regRfc, setRegRfc] = useState('');
  const [regTelefono, setRegTelefono] = useState('');
  const [regRol, setRegRol] = useState<UserRole>('Coordinador de Capacitación');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  // Handle Login Submit strictly with credentials
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail.trim()) {
      setLoginError('Por favor ingresa tu correo electrónico registrado.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Por favor ingresa tu contraseña de acceso.');
      return;
    }

    setLoginLoading(true);

    try {
      // Authenticate with Supabase Auth
      const res = await signInWithSupabase(loginEmail, loginPassword);

      if (res.success && res.user) {
        onLoginSuccess(res.user);
        return;
      }

      setLoginError(
        res.error ||
          'Credenciales inválidas. Verifica tu correo y contraseña o crea una nueva cuenta.'
      );
    } catch (err: any) {
      setLoginError(err?.message || 'Error al conectar con el servidor de autenticación.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess(false);

    if (!regNombre.trim()) {
      setRegError('El nombre completo es requerido.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setRegError('Ingresa un correo electrónico válido.');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('La contraseña debe contener al menos 6 caracteres.');
      return;
    }

    setRegLoading(true);

    try {
      const res = await signUpWithSupabase(regEmail, regPassword, {
        nombre: regNombre.trim(),
        puesto: regPuesto.trim() || 'Colaborador',
        departamento: regDepto.trim() || 'General',
        rfc: regRfc.trim().toUpperCase() || 'XAXX010101000',
        telefono: regTelefono.trim(),
        rol: regRol,
      });

      if (!res.success && res.error) {
        setRegError(res.error);
        setRegLoading(false);
        return;
      }

      const newUser: UserProfile = res.user || {
        nombre: regNombre.trim(),
        email: regEmail.trim().toLowerCase(),
        puesto: regPuesto.trim() || 'Colaborador',
        departamento: regDepto.trim() || 'General',
        rfc: regRfc.trim().toUpperCase() || 'XAXX010101000',
        telefono: regTelefono.trim(),
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
      }, 900);
    } catch (err: any) {
      setRegError(err?.message || 'Error al registrar la cuenta en Supabase.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Decorative Glow Background */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header Branding */}
      <div className="w-full max-w-xl text-center mb-6 z-10 animate-fade-in">
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-lg mb-4">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h1 className="text-xs sm:text-sm font-bold tracking-tight">
              SISTEMA DE CONTROL DE CAPACITACIONES
            </h1>
            <p className="text-[10px] text-blue-200 uppercase tracking-wider font-semibold">
              Registro de Participantes & Evidencias STPS
            </p>
          </div>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-fade-in">
        {/* Card Header & Switch Tabs */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-6 sm:p-7 text-white text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400 mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Portal de Acceso con Credenciales
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
            Ingresa con tu correo y contraseña para acceder a la gestión de cursos y eventos
          </p>

          {/* Mode Switch Tabs */}
          <div className="mt-5 flex p-1 rounded-xl bg-slate-800/90 border border-slate-700 max-w-xs mx-auto">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setLoginError('');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'login'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Iniciar Sesión</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setRegError('');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'register'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Crear Cuenta</span>
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-6 sm:p-8">
          {/* LOGIN VIEW */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              {loginError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="ejemplo: usuario@empresa.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Contraseña
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 rounded-2xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="font-medium">Mantener sesión iniciada en este navegador</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-2"
              >
                {loginLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verificando Credenciales...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Ingresar al Sistema</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* REGISTER VIEW */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {regSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>¡Cuenta creada con éxito! Iniciando sesión en el sistema...</span>
                </div>
              )}

              {regError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Nombre Completo *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Lic. Ana Mendoza"
                      value={regNombre}
                      onChange={(e) => setRegNombre(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Correo Electrónico *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="usuario@empresa.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                {/* Puesto */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Puesto / Cargo
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Coordinador de Capacitación"
                      value={regPuesto}
                      onChange={(e) => setRegPuesto(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Departamento */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Departamento
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Recursos Humanos"
                      value={regDepto}
                      onChange={(e) => setRegDepto(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* RFC */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    RFC
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={13}
                      placeholder="XAXX010101000"
                      value={regRfc}
                      onChange={(e) => setRegRfc(e.target.value.toUpperCase())}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                {/* Telefono */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="+52 (55) 0000-0000"
                      value={regTelefono}
                      onChange={(e) => setRegTelefono(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Rol Asignado */}
              <div className="space-y-1 pt-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Rol de Acceso en el Sistema
                </label>
                <select
                  value={regRol}
                  onChange={(e) => setRegRol(e.target.value as UserRole)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                >
                  {AVAILABLE_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label} — {r.desc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Password */}
              <div className="space-y-1 pt-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Contraseña de Acceso (mínimo 6 caracteres) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPass(!showRegPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Registration Button */}
              <button
                type="submit"
                disabled={regLoading}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-3"
              >
                {regLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creando Cuenta...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Crear Cuenta y Entrar</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>Supabase Cloud PostgreSQL</span>
          </span>
          <span className="text-[11px] text-slate-400">
            Sesión persistente y encriptada
          </span>
        </div>
      </div>
    </div>
  );
};
