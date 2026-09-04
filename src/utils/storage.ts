import { EventoData, UserProfile, AuthSession, UserRole, Participant, ModuleType } from '../types';
import { INITIAL_EVENTOS, INITIAL_USER_PROFILE } from '../data/mockData';
import { getStoredCredentials, saveStoredCredentials } from './auth';
import {
  fetchEventosFromSupabase,
  upsertEventoToSupabase,
  deleteEventoFromSupabase,
  fetchUserProfileFromSupabase,
  saveUserProfileToSupabase,
} from '../lib/supabase';

const STORAGE_KEY_EVENTOS = 'registro_participantes_eventos_v1';
const STORAGE_KEY_PROFILE = 'registro_participantes_profile_v1';
const STORAGE_KEY_SESSION = 'registro_participantes_auth_session_v1';
const STORAGE_KEY_LOGGED_OUT = 'registro_participantes_explicitly_logged_out_v1';
const STORAGE_KEY_ACTIVE_MODULE = 'registro_participantes_active_module_v1';
const STORAGE_KEY_SELECTED_EVENTO = 'registro_participantes_selected_evento_v1';
export const STORAGE_KEY_CUSTOM_AVATAR = 'registro_participantes_user_avatar_v1';
const DATA_SYNC_BROADCAST_CHANNEL = 'sistema_capacitacion_data_sync_channel';

// Cross-tab broadcast channel for instant state sync
let dataBroadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    dataBroadcastChannel = new BroadcastChannel(DATA_SYNC_BROADCAST_CHANNEL);
  }
} catch {
  dataBroadcastChannel = null;
}

/**
 * Notifies all open tabs and windows that event data has changed
 */
export function broadcastEventosUpdated(eventos: EventoData[], source = 'local'): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('sistema_capacitacion_eventos_cambiados', {
        detail: { eventos, source },
      })
    );
  }
  if (dataBroadcastChannel) {
    try {
      dataBroadcastChannel.postMessage({
        type: 'EVENTOS_CHANGED',
        eventos,
        source,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.warn('Broadcast error on data sync channel:', e);
    }
  }
}

/**
 * Subscribes to real-time event updates across tabs, windows, and storage events
 */
export function subscribeToEventosChanges(callback: (eventos: EventoData[]) => void): () => void {
  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<{ eventos: EventoData[]; source: string }>;
    if (custom.detail?.eventos) {
      callback(custom.detail.eventos);
    }
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY_EVENTOS && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) {
          callback(parsed);
        }
      } catch {}
    }
  };

  const handleBroadcastMsg = (e: MessageEvent) => {
    if (e.data?.type === 'EVENTOS_CHANGED' && Array.isArray(e.data?.eventos)) {
      callback(e.data.eventos);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('sistema_capacitacion_eventos_cambiados', handleCustomEvent);
    window.addEventListener('storage', handleStorageEvent);
    if (dataBroadcastChannel) {
      dataBroadcastChannel.addEventListener('message', handleBroadcastMsg);
    }
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('sistema_capacitacion_eventos_cambiados', handleCustomEvent);
      window.removeEventListener('storage', handleStorageEvent);
      if (dataBroadcastChannel) {
        dataBroadcastChannel.removeEventListener('message', handleBroadcastMsg);
      }
    }
  };
}

/**
 * Calculates the next consecutive event ID for a given year (e.g. EVT-2026-1, EVT-2026-2, EVT-2027-1).
 */
export function getNextEventoId(year?: number): string {
  const targetYear = year || new Date().getFullYear();
  const eventos = getStoredEventos();
  
  // Find all events matching format EVT-YYYY-N for the target year
  const regex = new RegExp(`^EVT-${targetYear}-(\\d+)$`, 'i');
  let maxSeq = 0;

  eventos.forEach((evt) => {
    if (!evt.id) return;
    const match = evt.id.match(regex);
    if (match && match[1]) {
      const seq = parseInt(match[1], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  });

  return `EVT-${targetYear}-${maxSeq + 1}`;
}

export function getStoredEventos(): EventoData[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_EVENTOS);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_EVENTOS, JSON.stringify(INITIAL_EVENTOS));
      return INITIAL_EVENTOS;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading events from localStorage:', err);
    return INITIAL_EVENTOS;
  }
}

export function saveStoredEventos(eventos: EventoData[], skipBroadcast = false): void {
  try {
    localStorage.setItem(STORAGE_KEY_EVENTOS, JSON.stringify(eventos));
    if (!skipBroadcast) {
      broadcastEventosUpdated(eventos);
    }
  } catch (err) {
    console.error('Error saving events to localStorage:', err);
  }
}

export function addEvento(nuevoEvento: EventoData): EventoData[] {
  const actuales = getStoredEventos();
  const actualizados = [nuevoEvento, ...actuales];
  saveStoredEventos(actualizados);
  // Async sync to Supabase in background
  upsertEventoToSupabase(nuevoEvento).catch((err) =>
    console.warn('Supabase sync background notice:', err)
  );
  return actualizados;
}

export function updateEvento(eventoActualizado: EventoData): EventoData[] {
  const actuales = getStoredEventos();
  const actualizados = actuales.map((evt) =>
    evt.id === eventoActualizado.id ? eventoActualizado : evt
  );
  saveStoredEventos(actualizados);
  // Async sync to Supabase in background
  upsertEventoToSupabase(eventoActualizado).catch((err) =>
    console.warn('Supabase sync background notice:', err)
  );
  return actualizados;
}

/**
 * Adds a new participant to a specific event and recalculates all metrics.
 */
export function addParticipantToEvento(eventoId: string, participant: Participant): EventoData[] {
  const actuales = getStoredEventos();
  let updatedEvento: EventoData | null = null;

  const actualizados = actuales.map((evt) => {
    if (evt.id !== eventoId) return evt;

    const list = [...evt.participantes, participant];
    const hombres = list.filter((p) => p.genero === 'H').length;
    const mujeres = list.filter((p) => p.genero === 'M').length;
    const total = list.length;
    const horas = evt.horasCapacitacion || 0;

    updatedEvento = {
      ...evt,
      participantes: list,
      totalParticipantes: total,
      hombresCount: hombres,
      mujeresCount: mujeres,
      horasHombreCapacitacion: total * horas,
    };
    return updatedEvento;
  });

  saveStoredEventos(actualizados);
  if (updatedEvento) {
    upsertEventoToSupabase(updatedEvento).catch((err) =>
      console.warn('Supabase sync notice upon adding participant:', err)
    );
  }
  return actualizados;
}

/**
 * Removes a participant from a specific event and recalculates metrics.
 */
export function removeParticipantFromEvento(eventoId: string, participantId: string): EventoData[] {
  const actuales = getStoredEventos();
  let updatedEvento: EventoData | null = null;

  const actualizados = actuales.map((evt) => {
    if (evt.id !== eventoId) return evt;

    const list = evt.participantes.filter((p) => p.id !== participantId);
    const reorderedList = list.map((p, idx) => ({ ...p, pos: idx + 1 }));
    const hombres = reorderedList.filter((p) => p.genero === 'H').length;
    const mujeres = reorderedList.filter((p) => p.genero === 'M').length;
    const total = reorderedList.length;
    const horas = evt.horasCapacitacion || 0;

    updatedEvento = {
      ...evt,
      participantes: reorderedList,
      totalParticipantes: total,
      hombresCount: hombres,
      mujeresCount: mujeres,
      horasHombreCapacitacion: total * horas,
    };
    return updatedEvento;
  });

  saveStoredEventos(actualizados);
  if (updatedEvento) {
    upsertEventoToSupabase(updatedEvento).catch((err) =>
      console.warn('Supabase sync notice upon removing participant:', err)
    );
  }
  return actualizados;
}

export function deleteEvento(id: string): EventoData[] {
  const actuales = getStoredEventos();
  const actualizados = actuales.filter((evt) => evt.id !== id);
  saveStoredEventos(actualizados);
  // Async delete from Supabase in background
  deleteEventoFromSupabase(id).catch((err) =>
    console.warn('Supabase delete background notice:', err)
  );
  return actualizados;
}

export function clearAllEventos(): EventoData[] {
  try {
    localStorage.removeItem(STORAGE_KEY_EVENTOS);
  } catch (err) {
    console.error('Error clearing events from localStorage:', err);
  }
  return [];
}

export function getStoredCustomAvatar(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    const direct = localStorage.getItem(STORAGE_KEY_CUSTOM_AVATAR);
    if (direct && direct.trim().length > 5) return direct.trim();
    const sessionAvatar = sessionStorage.getItem(STORAGE_KEY_CUSTOM_AVATAR);
    if (sessionAvatar && sessionAvatar.trim().length > 5) return sessionAvatar.trim();
  } catch {}
  return null;
}

export function saveStoredCustomAvatar(avatarUrl: string): void {
  try {
    if (typeof window === 'undefined') return;
    if (avatarUrl && avatarUrl.trim().length > 5) {
      localStorage.setItem(STORAGE_KEY_CUSTOM_AVATAR, avatarUrl.trim());
      sessionStorage.setItem(STORAGE_KEY_CUSTOM_AVATAR, avatarUrl.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_CUSTOM_AVATAR);
      sessionStorage.removeItem(STORAGE_KEY_CUSTOM_AVATAR);
    }
  } catch {}
}

export function getStoredUserProfile(): UserProfile {
  try {
    const customAvatar = getStoredCustomAvatar();
    const data = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (!data) {
      const initial = { ...INITIAL_USER_PROFILE };
      if (customAvatar) {
        initial.avatarUrl = customAvatar;
      }
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(initial));
      return initial;
    }
    const parsed: UserProfile = JSON.parse(data);

    // If the active user profile corresponds to Harold or has a generic/foreign admin name, ensure Harold's name
    const isHarold =
      !parsed.nombre ||
      parsed.nombre.toLowerCase() === 'admin' ||
      parsed.nombre.toLowerCase() === 'administrador' ||
      parsed.email?.toLowerCase().includes('harold') ||
      parsed.usuario?.toLowerCase().includes('harold') ||
      parsed.id === 'cred_harold_admin';

    if (isHarold) {
      parsed.nombre = 'Harold Anguiano Morales';
      if (!parsed.usuario) parsed.usuario = 'haroldo90';
      if (!parsed.email) parsed.email = 'haroldove90@gmail.com';
    }

    if (customAvatar && (!parsed.avatarUrl || parsed.avatarUrl.includes('unsplash') || customAvatar.startsWith('data:image'))) {
      parsed.avatarUrl = customAvatar;
    }
    return parsed;
  } catch (err) {
    console.error('Error loading profile from localStorage:', err);
    return INITIAL_USER_PROFILE;
  }
}

export function saveStoredUserProfile(profile: UserProfile): void {
  try {
    if (profile.avatarUrl && profile.avatarUrl.trim().length > 5) {
      saveStoredCustomAvatar(profile.avatarUrl);
    }
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));

    // Keep auth session user in sync if session exists
    try {
      const session = getStoredAuthSession();
      if (session && session.user) {
        session.user = { ...session.user, ...profile };
        saveStoredAuthSession(session);
      }
    } catch {}

    // Keep credentials directory in sync with updated profile photo and details
    try {
      const creds = getStoredCredentials();
      let updated = false;
      const updatedCreds = creds.map((c) => {
        const isMatch =
          (profile.email && c.email.toLowerCase() === profile.email.toLowerCase()) ||
          (profile.usuario && c.usuario.toLowerCase() === profile.usuario.toLowerCase()) ||
          (c.id === 'cred_harold_admin' && (profile.email?.toLowerCase().includes('haroldo90') || profile.usuario?.toLowerCase() === 'haroldo90'));
        if (isMatch) {
          updated = true;
          return {
            ...c,
            nombre: profile.nombre || c.nombre,
            avatarUrl: profile.avatarUrl || c.avatarUrl,
            telefono: profile.telefono || c.telefono,
            puesto: profile.puesto || c.puesto,
            departamento: profile.departamento || c.departamento,
          };
        }
        return c;
      });
      if (updated) {
        saveStoredCredentials(updatedCreds);
      }
    } catch {}

    // Async sync to Supabase in background
    saveUserProfileToSupabase(profile).catch((err) =>
      console.warn('Supabase profile save notice:', err)
    );
  } catch (err) {
    console.error('Error saving profile to localStorage:', err);
  }
}

/**
 * Auth Session Storage with Multi-Tier Persistence
 * Guarantees that refreshing the browser never kicks the user out of their session.
 */
export function getStoredAuthSession(): AuthSession | null {
  try {
    if (typeof window === 'undefined') return null;

    // 1. If user explicitly clicked "Cerrar sesión", respect that until next explicit login
    const explicitlyLoggedOut = localStorage.getItem(STORAGE_KEY_LOGGED_OUT) === 'true';
    if (explicitlyLoggedOut) {
      return null;
    }

    // 2. Primary check: localStorage
    const localData = localStorage.getItem(STORAGE_KEY_SESSION);
    if (localData) {
      const parsed: AuthSession = JSON.parse(localData);
      if (parsed && parsed.user && (parsed.user.email || parsed.user.usuario)) {
        return parsed;
      }
    }

    // 3. Redundant check: sessionStorage (e.g. if localStorage was wiped or in sandboxed iframe)
    const sessionData = sessionStorage.getItem(STORAGE_KEY_SESSION);
    if (sessionData) {
      const parsed: AuthSession = JSON.parse(sessionData);
      if (parsed && parsed.user && (parsed.user.email || parsed.user.usuario)) {
        try {
          localStorage.setItem(STORAGE_KEY_SESSION, sessionData);
        } catch {}
        return parsed;
      }
    }

    // 4. Stored user profile fallback (if profile exists in localStorage and not explicitly logged out)
    const profile = getStoredUserProfile();
    if (profile && (profile.email || profile.usuario)) {
      const fallbackSession: AuthSession = {
        user: profile,
        isSupabaseAuth: true,
        lastLogin: new Date().toISOString(),
      };
      saveStoredAuthSession(fallbackSession);
      return fallbackSession;
    }
  } catch (err) {
    console.warn('Error reading stored auth session:', err);
  }
  return null;
}

export function saveStoredAuthSession(session: AuthSession): void {
  try {
    const serialized = JSON.stringify(session);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_SESSION, serialized);
      sessionStorage.setItem(STORAGE_KEY_SESSION, serialized);
      // Remove any explicit logged out flag on successful login/session save
      localStorage.removeItem(STORAGE_KEY_LOGGED_OUT);
      sessionStorage.removeItem(STORAGE_KEY_LOGGED_OUT);
    }
    saveStoredUserProfile(session.user);
  } catch (err) {
    console.error('Error saving auth session:', err);
  }
}

export function clearStoredAuthSession(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_SESSION);
      sessionStorage.removeItem(STORAGE_KEY_SESSION);
      // Flag explicitly that the user has chosen to log out
      localStorage.setItem(STORAGE_KEY_LOGGED_OUT, 'true');
    }
  } catch (err) {
    console.error('Error clearing auth session:', err);
  }
}

/**
 * Navigation & Active Module Persistence
 * Keeps the user exactly where they were upon refreshing the browser.
 */
function isValidModule(m: string): boolean {
  return [
    'eventos',
    'participantes',
    'metricas',
    'supervisores',
    'coordinadores',
    'perfil',
    'registro',
    'historial',
    'firmas',
  ].includes(m);
}

export function getStoredActiveModule(): ModuleType {
  try {
    if (typeof window !== 'undefined') {
      // 1. Priority: URL search parameter (?modulo=participantes)
      const searchParams = new URLSearchParams(window.location.search);
      const qMod = searchParams.get('modulo');
      if (qMod && isValidModule(qMod)) {
        return qMod as ModuleType;
      }

      // 2. Hash (#participantes)
      const hash = window.location.hash.replace('#', '').trim();
      if (hash && isValidModule(hash)) {
        return hash as ModuleType;
      }

      // 3. LocalStorage persistence
      const stored = localStorage.getItem(STORAGE_KEY_ACTIVE_MODULE);
      if (stored && isValidModule(stored)) {
        return stored as ModuleType;
      }
    }
  } catch {}
  return 'eventos';
}

export function saveStoredActiveModule(modulo: ModuleType): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_ACTIVE_MODULE, modulo);
    }
  } catch {}
}

export function getStoredSelectedEventoId(): string | null {
  try {
    if (typeof window !== 'undefined') {
      // 1. Priority: URL query parameter (?eventoId=EVT-2026-1)
      const searchParams = new URLSearchParams(window.location.search);
      const qId = searchParams.get('eventoId');
      if (qId) return qId;

      // 2. LocalStorage persistence
      const stored = localStorage.getItem(STORAGE_KEY_SELECTED_EVENTO);
      if (stored) return stored;
    }
  } catch {}
  return null;
}

export function saveStoredSelectedEventoId(eventoId: string | null): void {
  try {
    if (typeof window !== 'undefined') {
      if (eventoId) {
        localStorage.setItem(STORAGE_KEY_SELECTED_EVENTO, eventoId);
      } else {
        localStorage.removeItem(STORAGE_KEY_SELECTED_EVENTO);
      }
    }
  } catch {}
}

/**
 * Initializes and synchronizes local state with Supabase cloud database
 */
export async function initializeSupabaseSync(): Promise<{
  eventos: EventoData[];
  profile: UserProfile;
  synced: boolean;
}> {
  try {
    const remoteEventos = await fetchEventosFromSupabase();
    const currentProfile = getStoredUserProfile();
    const remoteProfile = await fetchUserProfileFromSupabase(currentProfile?.email);

    let eventos = getStoredEventos();
    let profile = currentProfile;
    let synced = false;

    if (remoteEventos && remoteEventos.length > 0) {
      eventos = remoteEventos;
      saveStoredEventos(eventos);
      synced = true;
    } else if (remoteEventos && remoteEventos.length === 0 && eventos.length > 0) {
      for (const evt of eventos) {
        await upsertEventoToSupabase(evt);
      }
      synced = true;
    }

    if (remoteProfile) {
      const localCustomAvatar = getStoredCustomAvatar();
      // Protect local custom uploaded avatar from being overridden by blank/old remote value
      if (
        localCustomAvatar &&
        (!remoteProfile.avatarUrl ||
          remoteProfile.avatarUrl.includes('unsplash') ||
          localCustomAvatar.startsWith('data:image'))
      ) {
        remoteProfile.avatarUrl = localCustomAvatar;
      }

      // If the current active user is Harold, protect Harold's name from being replaced by another admin name
      const isCurrentHarold =
        currentProfile.email?.toLowerCase().includes('harold') ||
        currentProfile.usuario?.toLowerCase().includes('harold') ||
        currentProfile.nombre?.toLowerCase().includes('harold') ||
        currentProfile.id === 'cred_harold_admin';

      if (isCurrentHarold && !remoteProfile.nombre?.toLowerCase().includes('harold')) {
        remoteProfile.nombre = 'Harold Anguiano Morales';
      }

      profile = remoteProfile;
      saveStoredUserProfile(profile);
      synced = true;
    }

    return { eventos, profile, synced };
  } catch (err) {
    console.warn('Supabase initial sync fallback to local storage:', err);
    return {
      eventos: getStoredEventos(),
      profile: getStoredUserProfile(),
      synced: false,
    };
  }
}
