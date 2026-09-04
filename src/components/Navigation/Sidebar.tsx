import React, { useState } from 'react';
import { UserProfile, ModuleType, UserRole } from '../../types';
import {
  ClipboardList,
  History,
  BarChart3,
  User,
  Building2,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  LogOut,
  ChevronDown,
  Layers,
  Users,
  CalendarDays,
  UserCheck,
  X,
} from 'lucide-react';

interface SidebarProps {
  activeModule: ModuleType;
  setActiveModule: (module: ModuleType) => void;
  userProfile: UserProfile;
  totalEventosCount: number;
  onLogout?: () => void;
  onRoleChange?: (newRole: UserRole) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const AVAILABLE_ROLES: { role: UserRole; label: string; desc: string }[] = [
  {
    role: 'Admin',
    label: 'Admin',
    desc: 'Control total, edición, borrado, exportaciones oficiales e impresión',
  },
  {
    role: 'Supervisor',
    label: 'Supervisor',
    desc: 'Registro de eventos y participantes con alertas sonoras en vivo',
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  setActiveModule,
  userProfile,
  totalEventosCount,
  onLogout,
  onRoleChange,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  // Check if account has Admin privileges to switch roles
  const isAccountAdmin =
    userProfile.email?.toLowerCase().includes('harold') ||
    userProfile.usuario?.toLowerCase().includes('harold') ||
    userProfile.nombre?.toLowerCase().includes('harold') ||
    userProfile.rol === 'Admin' ||
    Boolean(userProfile.rol?.toLowerCase().includes('admin'));

  // Currently simulated / active operating role
  const rawRole = userProfile.rol || (isAccountAdmin ? 'Admin' : 'Supervisor');
  const effectiveRole: UserRole = rawRole.toLowerCase().includes('admin') ? 'Admin' : 'Supervisor';
  const isOperatingAsAdmin = effectiveRole === 'Admin';

  const allNavItems = [
    {
      id: 'eventos' as ModuleType,
      label: 'Módulo Eventos',
      shortLabel: 'Eventos',
      description: 'Alta, edición, catálogo, suspensión y exportación',
      icon: CalendarDays,
      count: totalEventosCount,
      badgeColor: 'bg-blue-100 text-blue-700',
      roles: ['all'],
    },
    {
      id: 'participantes' as ModuleType,
      label: 'Registro de Participantes',
      shortLabel: 'Participantes',
      description: 'Selecciona evento y registra participantes',
      icon: UserCheck,
      badge: 'Asistencia',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      roles: ['all'],
    },
    {
      id: 'metricas' as ModuleType,
      label: 'Módulo de Métricas',
      shortLabel: 'Métricas',
      description: 'Gráficas, KPIs e indicadores clave',
      icon: BarChart3,
      badge: 'KPIs',
      badgeColor: 'bg-purple-100 text-purple-700',
      roles: ['admin'],
    },
    {
      id: 'coordinadores' as ModuleType,
      label: 'Registro de Supervisores',
      shortLabel: 'Supervisores',
      description: 'Gestión de cuentas y accesos de supervisores',
      icon: Users,
      badge: 'Admin',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      roles: ['admin'],
    },
    {
      id: 'perfil' as ModuleType,
      label: 'Perfil de Usuario',
      shortLabel: 'Perfil',
      description: 'Foto, datos personales y clave',
      icon: User,
      badgeColor: 'bg-emerald-100 text-emerald-700',
      roles: ['all'],
    },
  ];

  // Filter items according to role
  const navItems = allNavItems.filter((item) => {
    if (item.roles.includes('all')) return true;
    if (item.roles.includes('admin')) return isOperatingAsAdmin;
    return true;
  });

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-950/75 z-50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar: Desktop Sticky + Mobile Slide-over Drawer */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-slate-900 text-slate-100 border-r border-slate-800 z-50 md:z-20 shrink-0 flex flex-col overflow-y-auto transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        } ${!isMobileOpen ? 'hidden md:flex' : 'flex'}`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 font-bold text-lg shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold text-base text-white leading-tight tracking-wide truncate">
                Registro de Participantes
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Capacitación y Desarrollo
              </p>
            </div>
          </div>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Cerrar navegación"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

      {/* Role Banner / Admin Role Switcher */}
      <div className="mx-3 mt-4 relative">
        <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/70 text-xs shadow-inner">
          <div className="flex items-center justify-between text-slate-400 font-medium tracking-wider text-[10px]">
            <span className="uppercase flex items-center gap-1">
              <Layers className="w-3 h-3 text-blue-400" />
              {isAccountAdmin ? 'Navegación de Roles (Admin)' : 'Rol de Acceso'}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          </div>

          {isAccountAdmin ? (
            <div className="mt-2 space-y-1.5">
              <button
                type="button"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-950 border border-slate-700 hover:border-blue-500/50 text-left transition-all cursor-pointer group"
                title="Cambiar vista de rol para navegar en el sistema (Admin o Coordinadores)"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-white truncate group-hover:text-blue-300 transition-colors">
                    {effectiveRole} {effectiveRole === 'Supervisor' ? '(Vista Supervisor)' : '(Control Total)'}
                  </p>
                  <p className="text-[9px] text-slate-400">Clic para cambiar de rol</p>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform shrink-0 ${
                    showRoleMenu ? 'rotate-180 text-blue-400' : ''
                  }`}
                />
              </button>

              {showRoleMenu && (
                <div className="mt-2 pt-2 border-t border-slate-700/80 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <p className="text-[10px] text-slate-400 px-1 font-semibold">
                    Seleccionar Rol Activo:
                  </p>
                  {AVAILABLE_ROLES.map((r) => {
                    const isCurrent = effectiveRole === r.role;
                    return (
                      <button
                        key={r.role}
                        type="button"
                        onClick={() => {
                          if (onRoleChange) {
                            onRoleChange(r.role);
                          }
                          setShowRoleMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer ${
                          isCurrent
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : 'text-slate-300 hover:bg-slate-700/80 hover:text-white'
                        }`}
                      >
                        <div className="min-w-0 pr-1">
                          <p className="font-semibold text-[11px] truncate">{r.label}</p>
                          <p
                            className={`text-[9px] truncate ${
                              isCurrent ? 'text-blue-100' : 'text-slate-400'
                            }`}
                          >
                            {r.desc}
                          </p>
                        </div>
                        {isCurrent && <span className="text-[10px] font-bold shrink-0">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="font-semibold text-slate-200 mt-2 flex items-center justify-between bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
              <span className="truncate pr-2 font-bold text-white text-xs">Coordinadores</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                Operativo
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-5 space-y-1.5">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Módulos Principales
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeModule === item.id ||
            (item.id === 'eventos' && (activeModule as string) === 'historial') ||
            (item.id === 'participantes' && (activeModule as string) === 'registro');

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveModule(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
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
          onClick={() => {
            setActiveModule('perfil');
            if (onCloseMobile) onCloseMobile();
          }}
          className="flex items-center gap-3 flex-1 min-w-0 p-2 rounded-lg hover:bg-slate-800/80 transition-colors text-left cursor-pointer"
        >
          <img
            src={
              userProfile.avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
            }
            alt={userProfile.nombre}
            className="w-9 h-9 rounded-full object-cover border-2 border-blue-500/50"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate" title={userProfile.nombre}>
              {userProfile.nombre}
            </p>
            <p className="text-[11px] text-slate-400 truncate" title={userProfile.puesto || userProfile.departamento}>
              {userProfile.puesto || userProfile.departamento}
            </p>
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
  </>
  );
};

