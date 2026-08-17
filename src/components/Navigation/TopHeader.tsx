import React from 'react';
import { UserProfile, ModuleType } from '../../types';
import {
  Calendar,
  Bell,
  Building2,
  Database,
  LogIn,
  ShieldCheck,
  User,
} from 'lucide-react';

interface TopHeaderProps {
  activeModule: ModuleType;
  setActiveModule: (module: ModuleType) => void;
  userProfile: UserProfile;
  onOpenSupabaseModal?: () => void;
  onOpenAuthModal?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeModule,
  setActiveModule,
  userProfile,
  onOpenSupabaseModal,
  onOpenAuthModal,
}) => {
  const getModuleTitle = () => {
    switch (activeModule) {
      case 'registro':
        return {
          title: 'Registro de Participantes',
          subtitle: 'Formulario electrónico de control de capacitaciones y listas de asistencia',
        };
      case 'historial':
        return {
          title: 'Historial de Participantes',
          subtitle: 'Consulta de eventos registrados, asistencias y exportaciones en Excel/PDF',
        };
      case 'metricas':
        return {
          title: 'Módulo de Métricas e Indicadores',
          subtitle: 'Análisis estadístico, horas-hombre, costos y distribución de capacitación',
        };
      case 'perfil':
        return {
          title: 'Perfil de Usuario y Permisos',
          subtitle: 'Gestión de datos personales, roles, credenciales y preferencias',
        };
    }
  };

  const { title, subtitle } = getModuleTitle();
  const currentDate = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const getRoleBadgeStyle = (rol: string) => {
    if (rol.includes('Administrador')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    if (rol.includes('Instructor')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (rol.includes('Recursos Humanos')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-8 py-4 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Title & Subtitle */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>Sistema de Control de Capacitación</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-normal capitalize">{currentDate}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        {/* Top Right Info & Quick Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
          {/* Supabase Status & SQL Button */}
          {onOpenSupabaseModal && (
            <button
              type="button"
              onClick={onOpenSupabaseModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold transition-all shadow-2xs group"
              title="Configuración, SQL y Gestión de Roles en Supabase"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Supabase</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>
          )}

          {/* Login / Register Button */}
          {onOpenAuthModal && (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold transition-all shadow-2xs"
              title="Iniciar Sesión o Crear Nueva Cuenta"
            >
              <LogIn className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Acceder / Registro</span>
            </button>
          )}

          {/* User Profile Button */}
          <button
            onClick={() => setActiveModule('perfil')}
            className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 p-1.5 pr-3 rounded-xl transition-all"
            title="Ver Perfil y Configuración"
          >
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.nombre}
              className="w-8 h-8 rounded-lg object-cover border border-slate-200"
            />
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[130px]">
                {userProfile.nombre.split(' ')[0]} {userProfile.nombre.split(' ')[1] || ''}
              </p>
              <span
                className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${getRoleBadgeStyle(
                  userProfile.rol
                )}`}
              >
                {userProfile.rol.replace(' de Capacitación', '')}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
