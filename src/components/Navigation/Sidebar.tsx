import React from 'react';
import { UserProfile, ModuleType } from '../../types';
import { ClipboardList, History, BarChart3, User, Building2, ShieldCheck, ChevronRight, Sparkles, LogOut } from 'lucide-react';

interface SidebarProps {
  activeModule: ModuleType;
  setActiveModule: (module: ModuleType) => void;
  userProfile: UserProfile;
  totalEventosCount: number;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  setActiveModule,
  userProfile,
  totalEventosCount,
  onLogout,
}) => {
  const navItems = [
    {
      id: 'metricas' as ModuleType,
      label: 'Módulo de Métricas',
      shortLabel: 'Métricas',
      description: 'Gráficas, KPIs e indicadores clave',
      icon: BarChart3,
      badge: 'KPIs',
      badgeColor: 'bg-purple-100 text-purple-700',
    },
    {
      id: 'registro' as ModuleType,
      label: 'Registro de Participantes',
      shortLabel: 'Registro',
      description: 'Formulario de eventos y participantes',
      icon: ClipboardList,
      badge: 'Nuevo',
      badgeColor: 'bg-blue-100 text-blue-700',
    },
    {
      id: 'historial' as ModuleType,
      label: 'Historial de Participantes',
      shortLabel: 'Historial',
      description: 'Consultas y exportaciones en Excel/PDF',
      icon: History,
      count: totalEventosCount,
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      id: 'perfil' as ModuleType,
      label: 'Perfil de Usuario',
      shortLabel: 'Perfil',
      description: 'Datos personales y configuración',
      icon: User,
      badgeColor: 'bg-emerald-100 text-emerald-700',
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-72 bg-slate-900 text-slate-100 border-r border-slate-800 shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 font-bold text-lg">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-semibold text-base text-white leading-tight tracking-wide">
            Registro de Participantes
          </h1>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Capacitación y Desarrollo
          </p>
        </div>
      </div>

      {/* Role Banner */}
      <div className="mx-4 mt-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
        <div className="text-slate-400 uppercase font-medium tracking-wider text-[10px]">
          Módulo de Acceso por Rol
        </div>
        <div className="font-semibold text-slate-200 mt-1 flex items-center justify-between">
          <span className="truncate pr-2">{userProfile.rol}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-5 space-y-1.5">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Módulos Principales
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full group flex items-start gap-3 p-3 rounded-xl transition-all text-left relative cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-medium'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Icon
                className={`w-5 h-5 mt-0.5 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-medium truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        isActive ? 'bg-white/20 text-white' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.count !== undefined && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs mt-0.5 truncate ${
                    isActive ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  {item.description}
                </p>
              </div>
              {isActive && (
                <ChevronRight className="w-4 h-4 self-center text-white shrink-0" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Info Card */}
      <div className="p-4 mx-3 mb-4 rounded-xl bg-gradient-to-br from-slate-800 to-slate-850 border border-slate-700/80 text-xs space-y-2">
        <div className="flex items-center gap-1.5 text-blue-400 font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Formulario de Asistencia</span>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          Cumple con la norma de 5 secciones y firma digital para participantes e instructores.
        </p>
      </div>

      {/* Bottom Profile & Logout Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between gap-2">
        <button
          onClick={() => setActiveModule('perfil')}
          className="flex items-center gap-3 flex-1 min-w-0 p-2 rounded-lg hover:bg-slate-800/80 transition-colors text-left cursor-pointer"
        >
          <img
            src={userProfile.avatarUrl}
            alt={userProfile.nombre}
            className="w-9 h-9 rounded-full object-cover border-2 border-blue-500/50"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{userProfile.nombre}</p>
            <p className="text-[11px] text-slate-400 truncate">{userProfile.departamento}</p>
          </div>
        </button>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};

