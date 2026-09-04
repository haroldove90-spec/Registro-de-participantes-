import React from 'react';
import { ModuleType, UserProfile, UserRole } from '../../types';
import { CalendarDays, UserCheck, BarChart3, Users, User, Menu } from 'lucide-react';

interface MobileBottomNavProps {
  activeModule: ModuleType;
  setActiveModule: (module: ModuleType) => void;
  totalEventosCount: number;
  userProfile?: UserProfile;
  onOpenMobileMenu?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeModule,
  setActiveModule,
  totalEventosCount,
  userProfile,
  onOpenMobileMenu,
}) => {
  // Determine effective operating role identical to Sidebar.tsx
  const effectiveRole: UserRole =
    userProfile?.rol?.toLowerCase().includes('admin') ? 'Admin' : 'Supervisor';
  const isOperatingAsAdmin = effectiveRole === 'Admin';

  const allNavItems = [
    {
      id: 'eventos' as ModuleType,
      label: 'Eventos',
      shortLabel: 'Eventos',
      icon: CalendarDays,
      count: totalEventosCount,
      roles: ['all'],
    },
    {
      id: 'participantes' as ModuleType,
      label: 'Participantes',
      shortLabel: 'Partic.',
      icon: UserCheck,
      roles: ['all'],
    },
    {
      id: 'metricas' as ModuleType,
      label: 'Métricas',
      shortLabel: 'Métricas',
      icon: BarChart3,
      roles: ['admin'],
    },
    {
      id: 'coordinadores' as ModuleType,
      label: 'Supervisores',
      shortLabel: 'Superv.',
      icon: Users,
      roles: ['admin'],
    },
    {
      id: 'perfil' as ModuleType,
      label: 'Perfil',
      shortLabel: 'Perfil',
      icon: User,
      roles: ['all'],
    },
  ];

  // Strictly align with fullscreen sidebar navigation rules
  const navItems = allNavItems.filter((item) => {
    if (item.roles.includes('all')) return true;
    if (item.roles.includes('admin')) return isOperatingAsAdmin;
    return true;
  });

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/98 border-t border-slate-800 text-slate-300 z-40 px-1 py-1 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeModule === item.id ||
            (item.id === 'eventos' && (activeModule as string) === 'historial') ||
            (item.id === 'participantes' && (activeModule as string) === 'registro');

          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all relative cursor-pointer min-w-0 ${
                isActive
                  ? 'text-blue-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 text-blue-400' : 'text-slate-400'
                  }`}
                />
                {item.count !== undefined && item.count > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-slate-900 shadow-xs">
                    {item.count}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] mt-1 truncate max-w-[64px] text-center font-medium">
                <span className="sm:hidden">{item.shortLabel}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 absolute -bottom-0.5" />
              )}
            </button>
          );
        })}

        {/* Full Navigation Drawer Trigger */}
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-slate-400 hover:text-slate-200 transition-all relative cursor-pointer min-w-0"
            title="Ver menú completo de módulos"
          >
            <div className="relative">
              <Menu className="w-5 h-5 text-slate-400" />
            </div>
            <span className="text-[10px] sm:text-[11px] mt-1 truncate max-w-[64px] text-center font-medium">
              Menú
            </span>
          </button>
        )}
      </div>
    </nav>
  );
};
