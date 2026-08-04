import { useState, useEffect } from 'react';
import { ModuleType, EventoData, UserProfile } from './types';
import {
  getStoredEventos,
  addEvento,
  updateEvento,
  deleteEvento,
  getStoredUserProfile,
  saveStoredUserProfile,
} from './utils/storage';
import { Sidebar } from './components/Navigation/Sidebar';
import { MobileBottomNav } from './components/Navigation/MobileBottomNav';
import { TopHeader } from './components/Navigation/TopHeader';
import { RegistroModule } from './components/Modules/RegistroModule';
import { HistorialModule } from './components/Modules/HistorialModule';
import { MetricasModule } from './components/Modules/MetricasModule';
import { PerfilModule } from './components/Modules/PerfilModule';

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleType>('registro');
  const [eventos, setEventos] = useState<EventoData[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(getStoredUserProfile());

  // Load initial eventos from storage
  useEffect(() => {
    const loadedEventos = getStoredEventos();
    setEventos(loadedEventos);
  }, []);

  // Event Handlers
  const handleSaveNuevoEvento = (nuevoEvento: EventoData) => {
    const actualizados = addEvento(nuevoEvento);
    setEventos(actualizados);
  };

  const handleUpdateEvento = (eventoActualizado: EventoData) => {
    const actualizados = updateEvento(eventoActualizado);
    setEventos(actualizados);
  };

  const handleDeleteEvento = (id: string) => {
    const actualizados = deleteEvento(id);
    setEventos(actualizados);
  };

  const handleSaveProfile = (updatedProfile: UserProfile) => {
    saveStoredUserProfile(updatedProfile);
    setUserProfile(updatedProfile);
  };

  return (
    <div className={`min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col md:flex-row antialiased ${userProfile.modoOscuro ? 'dark' : ''}`}>
      {/* Left Sidebar for Desktop / Tablet */}
      <Sidebar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        userProfile={userProfile}
        totalEventosCount={eventos.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Sticky Top Header */}
        <TopHeader
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          userProfile={userProfile}
        />

        {/* Dynamic Module Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mb-16 md:mb-0">
          {activeModule === 'registro' && (
            <RegistroModule
              onSaveEvento={(nuevoEvento) => {
                handleSaveNuevoEvento(nuevoEvento);
              }}
            />
          )}

          {activeModule === 'historial' && (
            <HistorialModule
              eventos={eventos}
              onDeleteEvento={handleDeleteEvento}
              onUpdateEvento={handleUpdateEvento}
            />
          )}

          {activeModule === 'metricas' && (
            <MetricasModule eventos={eventos} />
          )}

          {activeModule === 'perfil' && (
            <PerfilModule
              userProfile={userProfile}
              onSaveProfile={handleSaveProfile}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        totalEventosCount={eventos.length}
      />
    </div>
  );
}
