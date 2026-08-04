import React from 'react';
import { ModuleType } from '../../types';
import { ClipboardList, History, BarChart3, User } from 'lucide-react';

interface MobileBottomNavProps {
  activeModule: ModuleType;
  setActiveModule: (module: ModuleType) => void;
  totalEventosCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeModule,
  setActiveModule,
  totalEventosCount,
}) => {
  const navItems = [
    {
      id: 'registro' as ModuleType,
      label: 'Registro',
      icon: ClipboardList,
    },
    {
      id: 'historial' as ModuleType,
      label: 'Historial',
      icon: History,
      count: totalEventosCount,
    },
    {
      id: 'metricas' as ModuleType,
      label: 'Métricas',
      icon: BarChart3,
    },
    {
      id: 'perfil' as ModuleType,
      label: 'Perfil',
      icon: User,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 text-slate-300 z-50 px-2 py-1.5 shadow-2xl backdrop-blur-lg bg-opacity-95">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-4 rounded-xl transition-all relative ${
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
                  <span className="absolute -top-1.5 -right-2 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-slate-900">
                    {item.count}
                  </span>
                )}
              </div>
              <span className={`text-[11px] mt-1 ${isActive ? 'text-blue-400' : 'text-slate-400'}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-blue-400 absolute -bottom-1" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
