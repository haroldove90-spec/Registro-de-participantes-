import { EventoData, UserProfile } from '../types';
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

export function saveStoredEventos(eventos: EventoData[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_EVENTOS, JSON.stringify(eventos));
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
 * Initializes and synchronizes local state with Supabase cloud database
 */
export async function initializeSupabaseSync(): Promise<{
  eventos: EventoData[];
  profile: UserProfile;
  synced: boolean;
}> {
  try {
    const remoteEventos = await fetchEventosFromSupabase();
    const remoteProfile = await fetchUserProfileFromSupabase();

    let eventos = getStoredEventos();
    let profile = getStoredUserProfile();
    let synced = false;

    if (remoteEventos && remoteEventos.length > 0) {
      eventos = remoteEventos;
      saveStoredEventos(eventos);
      synced = true;
    } else if (remoteEventos && remoteEventos.length === 0 && eventos.length > 0) {
      // Push local data up to Supabase so it seeds the cloud database
      for (const evt of eventos) {
        await upsertEventoToSupabase(evt);
      }
      synced = true;
    }

    if (remoteProfile) {
      profile = remoteProfile;
      saveStoredUserProfile(profile);
      synced = true;
    } else if (profile) {
      await saveUserProfileToSupabase(profile);
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
