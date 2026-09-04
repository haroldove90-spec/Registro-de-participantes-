import React, { useState } from 'react';
import { UserProfile, ModuleType, UserRole, EventoData } from '../../types';
import {
  Building2,
  LogOut,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { SmartSupabaseButton } from './SmartSupabaseButton';

interface TopHeaderProps {
  activeModule: ModuleType;
  setActiveModule: (module: ModuleType) => void;
  userProfile: UserProfile;
  eventos?: EventoData[];
  onSyncedEventos?: (eventos: EventoData[]) => void;
  onLogout?: () => void;
  onRoleChange?: (newRole: UserRole) => void;
}

const AVAILABLE_ROLES: { role: UserRole; label: string }[] = [
  { role: 'Administrador de Capacitación', label: 'Administrador' },
  { role: 'Coordinadores', label: 'Coordinadores' },
  { role: 'Coordinador de Capacitación', label: 'Coordinador de Capacitación' },
  { role: 'Instructor / Capacitador', label: 'Instructor' },
  { role: 'Recursos Humanos (RH)', label: 'Recursos Humanos' },
  { role: 'Participante / Empleado', label: 'Participante / Empleado' },
  { role: 'Auditor / Consulta', label: 'Auditor' },
];

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeModule,
  setActiveModule,
  userProfile,
  eventos = [],
  onSyncedEventos,
  onLogout,
  onRoleChange,
}) => {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const isAdmin =
    userProfile.rol === 'Administrador de Capacitación' ||
    userProfile.rol.toLowerCase().includes('admin') ||
    userProfile.email.toLowerCase() === 'haroldo90@hotmail.com' ||
    userProfile.usuario === 'haroldo90';

  const getModuleTitle = () => {
    switch (activeModule) {
      case 'registro':
        return {
          title: 'Registro de Participantes',
          subtitle: 'Formulario electrónico de control de capacitaciones y listas de asistencia con firmas digitales',
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
      case 'coordinadores':
        return {
          title: 'Registro de Coordinadores',
          subtitle: 'Alta de cuentas, asignación de roles y distribución de credenciales por WhatsApp',
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

        {/* Top Right Info & Actions */}
        <div className="flex items-center gap-2.5 self-end sm:self-center flex-wrap">
          {/* Smart Supabase Button (Live status semaphore, ping ms, heartbeat, diagnostics, sync, SQL) */}
          <SmartSupabaseButton
            userProfile={userProfile}
            eventos={eventos}
            onSynced={onSyncedEventos}
          />

          {/* Admin Role Navigation Switcher (Visible ONLY for Admin) */}
          {isAdmin && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="Cambiar rol para navegar como otro tipo de usuario"
              >
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden md:inline">Vista de Rol:</span>
                <span className="bg-purple-200 text-purple-900 px-2 py-0.5 rounded-md font-mono text-[11px] truncate max-w-[130px]">
                  {userProfile.rol.split(' / ')[0]}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-purple-600 transition-transform ${
                    showRoleDropdown ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showRoleDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-1.5 border-b border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Navegar en Sistema como:
                    </p>
                  </div>
                  <div className="p-1 space-y-0.5">
                    {AVAILABLE_ROLES.map((r) => {
                      const isCurrent = userProfile.rol === r.role;
                      return (
                        <button
                          key={r.role}
                          type="button"
                          onClick={() => {
                            if (onRoleChange) {
                              onRoleChange(r.role);
                            }
                            setShowRoleDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            isCurrent
                              ? 'bg-purple-600 text-white font-bold'
                              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <span className="truncate">{r.label}</span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded-sm">
                              Activo
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile Button */}
          <button
            onClick={() => setActiveModule('perfil')}
            className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 p-1.5 pr-3 rounded-xl transition-all cursor-pointer shadow-2xs"
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

          {/* Active Logout Button */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 hover:text-rose-800 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Cerrar sesión de forma segura"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

