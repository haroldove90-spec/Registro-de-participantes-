import React, { useState } from 'react';
import {
  Building2,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Sparkles,
  Check,
  UserPlus,
} from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import { authenticateWithCredentials, getStoredCredentials, saveStoredCredentials } from '../../utils/auth';
import { signInWithSupabase, fetchCoordinatorsFromSupabase, fetchUserProfileFromSupabase } from '../../lib/supabase';

interface LoginScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  initialIdentifier?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  initialIdentifier = '',
}) => {
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [rememberSession, setRememberSession] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanId = identifier.trim();
    if (!cleanId) {
      setErrorMessage('Ingresa tu nombre de usuario o correo electrónico.');
      return;
    }
    if (!password) {
      setErrorMessage('Ingresa tu contraseña de acceso.');
      return;
    }

    setLoading(true);

    try {
      // 0. Sync freshest credentials from Supabase before checking password if reachable
      try {
        const remote = await fetchCoordinatorsFromSupabase();
        if (remote && remote.length > 0) {
          const current = getStoredCredentials();
          const merged = [...current];
          remote.forEach((rc) => {
            const idx = merged.findIndex(
              (m) =>
                m.usuario.toLowerCase() === rc.usuario.toLowerCase() ||
                m.email.toLowerCase() === rc.email.toLowerCase()
            );
            if (idx >= 0) {
              merged[idx] = {
                ...merged[idx],
                ...rc,
                rol: rc.rol?.toLowerCase().includes('admin') ? 'Admin' : (rc.rol || merged[idx].rol),
              };
            } else {
              merged.push(rc);
            }
          });
          saveStoredCredentials(merged);
        }
      } catch (err) {
        // Offline or warning, continue with local credentials
      }

      // 1. Authenticate with local credentials repository (Harold Anguiano, Cesar Netro, & new Coordinators)
      const localAuth = authenticateWithCredentials(cleanId, password);
      if (localAuth.success && localAuth.user) {
        let finalUser = localAuth.user;

        // Check if user has updated role in Supabase cloud
        try {
          const remoteProfile = await fetchUserProfileFromSupabase(cleanId);
          if (remoteProfile) {
            finalUser = {
              ...finalUser,
              rol: remoteProfile.rol,
              puesto: remoteProfile.puesto || finalUser.puesto,
              nombre: remoteProfile.nombre || finalUser.nombre,
            };
          }
        } catch {}

        onLoginSuccess(finalUser);
        return;
      }

      // 2. If it is an email and local check didn't match, attempt Supabase Auth if online
      if (cleanId.includes('@')) {
        const remoteAuth = await signInWithSupabase(cleanId, password);
        if (remoteAuth.success && remoteAuth.user) {
          const isHarold =
            cleanId.toLowerCase().includes('harold') ||
            remoteAuth.user.email?.toLowerCase().includes('harold') ||
            remoteAuth.user.usuario?.toLowerCase().includes('harold') ||
            remoteAuth.user.nombre?.toLowerCase().includes('harold');
          const resolvedUser = isHarold
            ? {
                ...remoteAuth.user,
                nombre: 'Harold Anguiano Morales',
                usuario: remoteAuth.user.usuario || 'haroldo90',
                rol: 'Admin' as const,
              }
            : remoteAuth.user;
          onLoginSuccess(resolvedUser);
          return;
        }
      }

      setErrorMessage(
        'Usuario, correo o contraseña incorrectos. Verifica tus datos de acceso con el Administrador.'
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al validar las credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Subtle Ambient Glow */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Home Container: ONLY Logo, System Name, and Access Form */}
      <div className="w-full max-w-md z-10 flex flex-col items-center">
        {/* 1. LOGO */}
        <div className="mb-3 flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/25 border border-blue-400/30">
            <Building2 className="w-9 h-9" />
          </div>
        </div>

        {/* 2. NOMBRE DEL SISTEMA */}
        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight uppercase">
            Sistema de Control de Capacitaciones
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-blue-400 mt-1 uppercase tracking-wider">
            Registro de Participantes & Evidencias
          </p>
        </div>

        {/* 3. FORMULARIO DE ACCESO AL SISTEMA */}
        <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60">
          <div className="text-center mb-6">
            <h2 className="text-base font-bold text-white flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 text-blue-400" />
              <span>Acceso al Sistema</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Ingresa con tus credenciales de Administrador o Coordinador
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input: Usuario o Correo */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Usuario o Correo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ingresa tu usuario o correo electrónico"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Input: Contraseña */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                  title={showPass ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember session checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberSession}
                  onChange={(e) => setRememberSession(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <span>Mantener sesión iniciada</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Validando Credenciales...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Ingresar al Sistema</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="mt-4 text-center text-slate-500 text-[11px] flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Acceso privado y seguro • Sistema de Control de Capacitaciones</span>
        </div>
      </div>
    </div>
  );
};
