import { useState, useEffect } from 'react';
import { ModuleType, EventoData, UserProfile, AuthSession } from './types';
import {
  getStoredEventos,
  addEvento,
  updateEvento,
  deleteEvento,
  getStoredUserProfile,
  saveStoredUserProfile,
  getStoredAuthSession,
  saveStoredAuthSession,
  clearStoredAuthSession,
  initializeSupabaseSync,
} from './utils/storage';
import { signOutFromSupabase, getCurrentSupabaseUser } from './lib/supabase';
import { Sidebar } from './components/Navigation/Sidebar';
import { MobileBottomNav } from './components/Navigation/MobileBottomNav';
import { TopHeader } from './components/Navigation/TopHeader';
import { RegistroModule } from './components/Modules/RegistroModule';
import { HistorialModule } from './components/Modules/HistorialModule';
import { MetricasModule } from './components/Modules/MetricasModule';
import { PerfilModule } from './components/Modules/PerfilModule';
import { LoginScreen } from './components/Auth/LoginScreen';

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleType>('metricas');
  const [eventos, setEventos] = useState<EventoData[]>([]);

  // Session state: check if valid user session is stored in localStorage
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const session = getStoredAuthSession();
    return !!(session && session.user && session.user.email);
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const session = getStoredAuthSession();
    return session?.user || getStoredUserProfile();
  });

  // Verify persistent session & sync data on initial load
  useEffect(() => {
    // 1. If not authenticated in local state, verify if Supabase has an active session
    if (!isAuthenticated) {
      getCurrentSupabaseUser().then((user) => {
        if (user && user.email) {
          const newSession: AuthSession = {
            user,
            isSupabaseAuth: true,
            lastLogin: new Date().toISOString(),
          };
          saveStoredAuthSession(newSession);
          setUserProfile(user);
          setIsAuthenticated(true);
        }
      });
    }

    // 2. Load stored events
    const loadedEventos = getStoredEventos();
    setEventos(loadedEventos);

    // 3. Background sync with Supabase Cloud
    initializeSupabaseSync().then((res) => {
      if (res.synced) {
        setEventos(res.eventos);
        if (res.profile) {
          setUserProfile(res.profile);
        }
      }
    });
  }, [isAuthenticated]);

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
    const newSession: AuthSession = {
      user: authenticatedUser,
      isSupabaseAuth: true,
      lastLogin: new Date().toISOString(),
    };
    saveStoredAuthSession(newSession);
    saveStoredUserProfile(authenticatedUser);
    setUserProfile(authenticatedUser);
    setIsAuthenticated(true);
    setActiveModule('metricas');
  };

  const handleLogout = async () => {
    await signOutFromSupabase();
    clearStoredAuthSession();
    setIsAuthenticated(false);
  };

  // IF NOT AUTHENTICATED: Display Login / Credentials Access Home Screen
  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        initialEmail={userProfile?.email || ''}
      />
    );
  }

  // IF AUTHENTICATED: Display Full Dashboard System
  return (
    <div
      className={`min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col md:flex-row antialiased ${
        userProfile.modoOscuro ? 'dark' : ''
      }`}
    >
      {/* Left Sidebar for Desktop / Tablet */}
      <Sidebar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        userProfile={userProfile}
        totalEventosCount={eventos.length}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Sticky Top Header */}
        <TopHeader
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          userProfile={userProfile}
          onLogout={handleLogout}
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

          {activeModule === 'metricas' && <MetricasModule eventos={eventos} />}

          {activeModule === 'perfil' && (
            <PerfilModule
              userProfile={userProfile}
              eventos={eventos}
              onSaveProfile={handleSaveProfile}
              onNavigateToHistorial={() => setActiveModule('historial')}
              onLogout={handleLogout}
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
