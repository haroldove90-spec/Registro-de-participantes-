import { EventoData, UserProfile, AuthSession, UserRole, Participant } from '../types';
import { INITIAL_EVENTOS, INITIAL_USER_PROFILE } from '../data/mockData';
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

export function getStoredUserProfile(): UserProfile {
  try {
    const data = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(INITIAL_USER_PROFILE));
      return INITIAL_USER_PROFILE;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading profile from localStorage:', err);
    return INITIAL_USER_PROFILE;
  }
}

export function saveStoredUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    // Async sync to Supabase in background
    saveUserProfileToSupabase(profile).catch((err) =>
      console.warn('Supabase profile save notice:', err)
    );
  } catch (err) {
    console.error('Error saving profile to localStorage:', err);
  }
}

/**
 * Auth Session Storage
 */
export function getStoredAuthSession(): AuthSession | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY_SESSION);
    if (!data) return null;
    return JSON.parse(data);
  } catch (err) {
    return null;
  }
}

export function saveStoredAuthSession(session: AuthSession): void {
  try {
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
    saveStoredUserProfile(session.user);
  } catch (err) {
    console.error('Error saving auth session:', err);
  }
}

export function clearStoredAuthSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_SESSION);
  } catch (err) {
    console.error('Error clearing auth session:', err);
  }
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
