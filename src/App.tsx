import { useState, useEffect } from 'react';
import { ModuleType, EventoData, UserProfile } from './types';
import {
  getStoredEventos,
  addEvento,
  updateEvento,
  deleteEvento,
  getStoredUserProfile,
  saveStoredUserProfile,
  getStoredAuthSession,
  saveStoredAuthSession,
  initializeSupabaseSync,
} from './utils/storage';
import { Sidebar } from './components/Navigation/Sidebar';
import { MobileBottomNav } from './components/Navigation/MobileBottomNav';
import { TopHeader } from './components/Navigation/TopHeader';
import { RegistroModule } from './components/Modules/RegistroModule';
import { HistorialModule } from './components/Modules/HistorialModule';
import { MetricasModule } from './components/Modules/MetricasModule';
import { PerfilModule } from './components/Modules/PerfilModule';
import { SupabaseModal } from './components/SupabaseModal';
import { AuthModal } from './components/Auth/AuthModal';

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleType>('metricas');
  const [eventos, setEventos] = useState<EventoData[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const session = getStoredAuthSession();
    return session?.user || getStoredUserProfile();
  });
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Load initial eventos from storage and synchronize with Supabase Cloud
  useEffect(() => {
    const loadedEventos = getStoredEventos();
    setEventos(loadedEventos);

    // Background sync with Supabase
    initializeSupabaseSync().then((res) => {
      if (res.synced) {
        setEventos(res.eventos);
        setUserProfile(res.profile);
      }
    });
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
    saveStoredAuthSession({
      user: updatedProfile,
      isSupabaseAuth: true,
      lastLogin: new Date().toISOString(),
    });
    setUserProfile(updatedProfile);
  };

  const handleLoginSuccess = (authenticatedUser: UserProfile) => {
    handleSaveProfile(authenticatedUser);
  };

  return (
    <div className={`min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col md:flex-row antialiased ${userProfile.modoOscuro ? 'dark' : ''}`}>
      {/* Left Sidebar for Desktop / Tablet */}
      <Sidebar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        userProfile={userProfile}
        totalEventosCount={eventos.length}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Sticky Top Header */}
        <TopHeader
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          userProfile={userProfile}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
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
              userProfile={userProfile}
              onDeleteEvento={handleDeleteEvento}
              onUpdateEvento={handleUpdateEvento}
              onSyncEventos={(synced) => setEventos(synced)}
            />
          )}

          {activeModule === 'metricas' && (
            <MetricasModule eventos={eventos} />
          )}

          {activeModule === 'perfil' && (
            <PerfilModule
              userProfile={userProfile}
              eventos={eventos}
              onSaveProfile={handleSaveProfile}
              onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onNavigateToHistorial={() => setActiveModule('historial')}
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

      {/* Supabase Configuration, SQL and Role Management Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onDataSynced={(syncedEventos, syncedProfile) => {
          setEventos(syncedEventos);
          setUserProfile(syncedProfile);
        }}
      />

      {/* Access Login & Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        currentEmail={userProfile.email}
      />
    </div>
  );
}


