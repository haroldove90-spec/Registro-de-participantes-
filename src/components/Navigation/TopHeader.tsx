import React from 'react';
import { UserProfile, ModuleType } from '../../types';
import { Calendar, Bell, Building2, Database } from 'lucide-react';

interface TopHeaderProps {
  activeModule: ModuleType;
  setActiveModule: (module: ModuleType) => void;
  userProfile: UserProfile;
  onOpenSupabaseModal?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeModule,
  setActiveModule,
  userProfile,
  onOpenSupabaseModal,
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
          title: 'Perfil de Usuario',
          subtitle: 'Gestión de datos personales, credenciales y preferencias',
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
        <div className="flex items-center gap-2.5 self-end sm:self-center">
          {/* Supabase Status Button */}
          {onOpenSupabaseModal && (
            <button
              type="button"
              onClick={onOpenSupabaseModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold transition-all shadow-2xs group"
              title="Configuración y SQL de Supabase"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Supabase:</span>
              <span className="font-mono text-[11px] text-emerald-900 font-bold">Conectado</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>
          )}

          <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Período 2026</span>
          </div>

          <button
            type="button"
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors relative"
            title="Notificaciones"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
          </button>

          <button
            onClick={() => setActiveModule('perfil')}
            className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 p-1.5 pr-3 rounded-xl transition-all"
          >
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.nombre}
              className="w-8 h-8 rounded-lg object-cover"
            />
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-slate-800 leading-tight">{userProfile.nombre.split(' ')[0]}</p>
              <p className="text-[10px] text-slate-500 leading-tight">{userProfile.rol}</p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

