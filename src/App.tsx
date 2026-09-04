import { useState, useEffect } from 'react';
import { ModuleType, EventoData, UserProfile, AuthSession, UserRole, Participant } from './types';
import {
  getStoredEventos,
  saveStoredEventos,
  addEvento,
  updateEvento,
  deleteEvento,
  addParticipantToEvento,
  removeParticipantFromEvento,
  getStoredUserProfile,
  saveStoredUserProfile,
  getStoredAuthSession,
  saveStoredAuthSession,
  clearStoredAuthSession,
  initializeSupabaseSync,
  subscribeToEventosChanges,
} from './utils/storage';
import {
  signOutFromSupabase,
  getCurrentSupabaseUser,
  saveUserProfileToSupabase,
  fetchEventosFromSupabase,
  supabase,
} from './lib/supabase';
import { Sidebar } from './components/Navigation/Sidebar';
import { MobileBottomNav } from './components/Navigation/MobileBottomNav';
import { TopHeader } from './components/Navigation/TopHeader';
import { EventosModule } from './components/Modules/EventosModule';
import { ParticipantesModule } from './components/Modules/ParticipantesModule';
import { MetricasModule } from './components/Modules/MetricasModule';
import { PerfilModule } from './components/Modules/PerfilModule';
import { CoordinadoresModule } from './components/Modules/CoordinadoresModule';
import { LoginScreen } from './components/Auth/LoginScreen';
import { FloatingNotificationModal } from './components/Notifications/FloatingNotificationModal';
import { FirmaCoordinadorView } from './components/Modules/FirmaCoordinadorView';

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleType>('eventos');
  const [eventos, setEventos] = useState<EventoData[]>([]);
  const [selectedEventoIdParaInscripcion, setSelectedEventoIdParaInscripcion] = useState<string | null>(null);

  // Support direct standalone access for coordinators opening the signature link from WhatsApp
  const [standaloneFirmaEventoId, setStandaloneFirmaEventoId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('modulo') === 'firmas' && searchParams.get('eventoId')) {
        return searchParams.get('eventoId');
      }
      if (window.location.hash.includes('firmas')) {
        const match = window.location.hash.match(/eventoId=([^&]+)/);
        if (match && match[1]) return decodeURIComponent(match[1]);
      }
    }
    return null;
  });

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

  // Real-time synchronization without browser refresh:
  // 1. Cross-tab and local window live sync
  useEffect(() => {
    const unsubscribe = subscribeToEventosChanges((newEventos) => {
      setEventos(newEventos);
    });
    return unsubscribe;
  }, []);

  // 2. Cross-device live sync via Supabase Realtime channel and Postgres changes
  useEffect(() => {
    const liveChannel = supabase.channel('sistema_eventos_live_sync', {
      config: { broadcast: { self: false } },
    });

    const refreshFromCloud = async () => {
      try {
        const remote = await fetchEventosFromSupabase();
        if (remote && remote.length > 0) {
          setEventos(remote);
          saveStoredEventos(remote, true);
        }
      } catch (err) {
        console.warn('Realtime cloud sync notice:', err);
      }
    };

    liveChannel
      .on('broadcast', { event: 'evento_sync' }, () => {
        refreshFromCloud();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eventos' }, () => {
        refreshFromCloud();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participantes' }, () => {
        refreshFromCloud();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(liveChannel);
    };
  }, []);

  // 3. Heartbeat background polling (every 3.5 seconds) to ensure 100% sync even through firewalls/mobile networks
  useEffect(() => {
    const interval = setInterval(async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        try {
          const remote = await fetchEventosFromSupabase();
          if (remote && remote.length > 0) {
            setEventos((prev) => {
              const prevStr = JSON.stringify(prev);
              const nextStr = JSON.stringify(remote);
              if (prevStr !== nextStr) {
                saveStoredEventos(remote, true);
                return remote;
              }
              return prev;
            });
          }
        } catch {
          // Silent fallback
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  // Helper to notify cloud clients instantly
  const broadcastCloudSync = () => {
    try {
      supabase.channel('sistema_eventos_live_sync').send({
        type: 'broadcast',
        event: 'evento_sync',
        payload: { timestamp: Date.now() },
      });
    } catch {}
  };

  // Event Handlers
  const handleSaveNuevoEvento = (nuevoEvento: EventoData) => {
    const actualizados = addEvento(nuevoEvento);
    setEventos(actualizados);
    broadcastCloudSync();
  };

  const handleUpdateEvento = (eventoActualizado: EventoData) => {
    const actualizados = updateEvento(eventoActualizado);
    setEventos(actualizados);
    broadcastCloudSync();
  };

  const handleDeleteEvento = (id: string) => {
    const actualizados = deleteEvento(id);
    setEventos(actualizados);
    broadcastCloudSync();
  };

  const handleSaveProfile = (updatedProfile: UserProfile) => {
    saveStoredUserProfile(updatedProfile);
    saveStoredAuthSession({
      user: updatedProfile,
      isSupabaseAuth: true,
      lastLogin: new Date().toISOString(),
    });
    setUserProfile(updatedProfile);
    // Persist to Supabase cloud (table perfiles_usuario and auth metadata)
    saveUserProfileToSupabase(updatedProfile).catch((err) => {
      console.warn('Error syncing profile to Supabase:', err);
    });
  };

  // Switch role on the fly (for Admin role exploration)
  const handleRoleChange = (newRole: UserRole) => {
    const updated = {
      ...userProfile,
      rol: newRole,
    };
    handleSaveProfile(updated);
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
    // Coordinators are directed immediately to the Participant Registration module
    if (
      authenticatedUser.rol === 'Coordinadores' ||
      authenticatedUser.rol === 'Coordinador de Capacitación'
    ) {
      setActiveModule('registro');
    } else {
      setActiveModule('registro');
    }
  };

  const handleLogout = async () => {
    await signOutFromSupabase();
    clearStoredAuthSession();
    setIsAuthenticated(false);
  };

  // IF OPENED VIA WHATSAPP SIGNATURE LINK (Mobile/Tablet Coordinator Mode)
  const standaloneEvento = eventos.find((e) => e.id === standaloneFirmaEventoId);
  if (standaloneFirmaEventoId) {
    if (standaloneEvento) {
      return (
        <div className="min-h-screen bg-slate-900">
          <FirmaCoordinadorView
            evento={standaloneEvento}
            onUpdateEvento={(updated) => {
              handleUpdateEvento(updated);
            }}
            onClose={() => {
              setStandaloneFirmaEventoId(null);
              if (typeof window !== 'undefined') {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
            }}
          />
        </div>
      );
    }
  }

  // IF NOT AUTHENTICATED: Display Login / Credentials Access Home Screen
  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        initialIdentifier={userProfile?.usuario || userProfile?.email || ''}
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
        onRoleChange={handleRoleChange}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Sticky Top Header */}
        <TopHeader
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          userProfile={userProfile}
          eventos={eventos}
          onSyncedEventos={(synced) => setEventos(synced)}
          onLogout={handleLogout}
          onRoleChange={handleRoleChange}
        />

        {/* Dynamic Module Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mb-16 md:mb-0">
          {(activeModule === 'eventos' || activeModule === 'historial') && (
            <EventosModule
              eventos={eventos}
              userProfile={userProfile}
              onSaveEvento={(nuevoEvento) => {
                handleSaveNuevoEvento(nuevoEvento);
              }}
              onUpdateEvento={(eventoActualizado) => {
                handleUpdateEvento(eventoActualizado);
              }}
              onDeleteEvento={(id) => {
                handleDeleteEvento(id);
              }}
              onSelectEventoParaInscripcion={(eventoId) => {
                setSelectedEventoIdParaInscripcion(eventoId);
                setActiveModule('participantes');
              }}
            />
          )}

          {(activeModule === 'participantes' || activeModule === 'registro') && (
            <ParticipantesModule
              eventos={eventos}
              userProfile={userProfile}
              selectedEventoId={selectedEventoIdParaInscripcion}
              onSelectEvento={(id) => {
                setSelectedEventoIdParaInscripcion(id);
              }}
              onAddParticipant={(eventoId, participant) => {
                const updated = addParticipantToEvento(eventoId, participant);
                setEventos(updated);
                broadcastCloudSync();
              }}
              onRemoveParticipant={(eventoId, participantId) => {
                const updated = removeParticipantFromEvento(eventoId, participantId);
                setEventos(updated);
                broadcastCloudSync();
              }}
              onUpdateParticipant={(eventoId, participant) => {
                const evt = eventos.find((e) => e.id === eventoId);
                if (!evt) return;
                const list = evt.participantes.map((p) =>
                  p.id === participant.id ? participant : p
                );
                const updatedEvt: EventoData = {
                  ...evt,
                  participantes: list,
                };
                handleUpdateEvento(updatedEvt);
              }}
              onUpdateEvento={(updatedEvt) => {
                handleUpdateEvento(updatedEvt);
              }}
            />
          )}

          {activeModule === 'metricas' && <MetricasModule eventos={eventos} />}

          {activeModule === 'coordinadores' && <CoordinadoresModule />}

          {activeModule === 'perfil' && (
            <PerfilModule
              userProfile={userProfile}
              eventos={eventos}
              onSaveProfile={handleSaveProfile}
              onNavigateToHistorial={() => setActiveModule('eventos')}
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

      {/* Floating System Notifications with Sound */}
      <FloatingNotificationModal
        userProfile={userProfile}
        onNavigateToEvento={(eventoId) => {
          setSelectedEventoIdParaInscripcion(eventoId);
          setActiveModule('participantes');
        }}
      />
    </div>
  );
}
