import { SystemNotification, EventoData, UserRole } from '../types';
import { supabase } from '../lib/supabase';

export const NOTIFICATION_SOUND_URL =
  'https://acjelqhrflkxnkttlrkr.supabase.co/storage/v1/object/public/sonidos/soundreality-notification-jump-455518.mp3';

const STORAGE_KEY_NOTIFICATIONS = 'sistema_capacitacion_notificaciones_v1';
const BROADCAST_CHANNEL_NAME = 'sistema_capacitacion_alertas_channel';

// Singleton Audio instance for rapid and reliable playback
let audioInstance: HTMLAudioElement | null = null;

/**
 * Plays the official alert sound requested by the user
 */
export async function playNotificationSound(): Promise<boolean> {
  try {
    if (!audioInstance) {
      audioInstance = new Audio(NOTIFICATION_SOUND_URL);
      audioInstance.preload = 'auto';
    }
    audioInstance.currentTime = 0;
    audioInstance.volume = 1.0;
    await audioInstance.play();
    return true;
  } catch (err) {
    // Autoplay restrictions or audio interruption
    console.warn('Audio notification notice (autoplay policy or network):', err);
    return false;
  }
}

/**
 * Broadcast channel for cross-tab realtime notification
 */
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch {
  broadcastChannel = null;
}

/**
 * Supabase Realtime Channel for instant cross-device notifications
 */
export const supabaseRealtimeAlerts = supabase.channel('sistema_capacitacion_alertas_cloud', {
  config: { broadcast: { self: false } },
});

try {
  supabaseRealtimeAlerts
    .on('broadcast', { event: 'nueva_notificacion' }, (payload) => {
      const notif = payload.payload as SystemNotification;
      if (notif && notif.id) {
        const current = getStoredNotifications();
        if (!current.some((n) => n.id === notif.id)) {
          saveStoredNotifications([notif, ...current]);
          playNotificationSound();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('sistema_notificacion_evento', { detail: notif })
            );
          }
        }
      }
    })
    .subscribe();
} catch (e) {
  console.warn('Supabase realtime alerts subscription notice:', e);
}

/**
 * Returns stored notifications from localStorage
 */
export function getStoredNotifications(): SystemNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Saves notifications list to localStorage
 */
export function saveStoredNotifications(list: SystemNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(list.slice(0, 50)));
  } catch (err) {
    console.warn('Error saving notifications:', err);
  }
}

/**
 * Publishes a new system notification, stores it, broadcasts it and plays the audio alert
 */
export function pushSystemNotification(notification: Omit<SystemNotification, 'id' | 'timestamp'>): SystemNotification {
  const newNotif: SystemNotification = {
    ...notification,
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    leido: false,
  };

  const current = getStoredNotifications();
  const updated = [newNotif, ...current];
  saveStoredNotifications(updated);

  // Play official sound
  playNotificationSound();

  // Dispatch locally
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('sistema_notificacion_evento', { detail: newNotif })
    );
  }

  // Dispatch to other tabs / windows
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(newNotif);
    } catch (e) {
      console.warn('Broadcast error:', e);
    }
  }

  // Dispatch to all connected devices in realtime via Supabase
  try {
    supabaseRealtimeAlerts.send({
      type: 'broadcast',
      event: 'nueva_notificacion',
      payload: newNotif,
    });
  } catch (e) {
    console.warn('Supabase realtime broadcast send notice:', e);
  }

  return newNotif;
}

/**
 * Notification: Admin created a new event -> Notify Supervisor
 */
export function notifyAdminCreatedEvent(evento: EventoData, adminName?: string): SystemNotification {
  return pushSystemNotification({
    titulo: '¡Nuevo Evento Registrado por el Administrador!',
    mensaje: `El Administrador ${adminName || 'Harold Anguiano'} ha registrado el evento "${evento.nombreEvento}". Ya puedes seleccionarlo para registrar participantes o supervisar las firmas.`,
    tipo: 'evento_admin',
    eventoId: evento.id,
    eventoNombre: evento.nombreEvento,
    destinatarioRol: 'Supervisor',
  });
}

/**
 * Notification: Supervisor created an event & participants -> Notify Admin
 */
export function notifySupervisorCreatedEvent(evento: EventoData, supervisorName?: string): SystemNotification {
  const numPart = evento.participantes?.length || 0;
  return pushSystemNotification({
    titulo: '¡Alerta: Supervisor ha registrado un Nuevo Evento!',
    mensaje: `El Supervisor ${supervisorName || 'Cesar Netro'} ha registrado el evento "${evento.nombreEvento}" con ${numPart} participante(s). Puedes supervisar y monitorear el estatus de firmas.`,
    tipo: 'evento_supervisor',
    eventoId: evento.id,
    eventoNombre: evento.nombreEvento,
    destinatarioRol: 'Admin',
  });
}

/**
 * Notification: Supervisor registered participants for an event -> Notify Admin
 */
export function notifySupervisorRegisteredParticipants(
  evento: EventoData,
  supervisorName?: string,
  participantCount?: number
): SystemNotification {
  const numPart = participantCount ?? (evento.participantes?.length || 0);
  return pushSystemNotification({
    titulo: '¡Alerta: Participantes Registrados por el Supervisor!',
    mensaje: `El Supervisor ${supervisorName || 'Cesar Netro'} ha inscrito a ${numPart} participante(s) en el evento "${evento.nombreEvento}".`,
    tipo: 'evento_supervisor',
    eventoId: evento.id,
    eventoNombre: evento.nombreEvento,
    destinatarioRol: 'Admin',
  });
}

/**
 * Notification: Supervisor collected a participant's signature -> Notify Admin
 */
export function notifySupervisorGatheredSignature(
  evento: EventoData,
  participanteNombre: string,
  supervisorName?: string,
  firmadosCount?: number,
  totalCount?: number
): SystemNotification {
  const total = totalCount ?? (evento.participantes?.length || 0);
  const firmados = firmadosCount ?? (evento.participantes?.filter((p) => !!p.firma).length || 0);
  return pushSystemNotification({
    titulo: '¡Firma Recabada por el Supervisor!',
    mensaje: `El Supervisor ${supervisorName || 'de Capacitación'} ha recabado la firma digital de "${participanteNombre}" en el evento "${evento.nombreEvento}" (${firmados}/${total} firmas listas).`,
    tipo: 'firmas_completadas',
    eventoId: evento.id,
    eventoNombre: evento.nombreEvento,
    destinatarioRol: 'Admin',
  });
}

/**
 * Notification: Supervisor has finished gathering 100% of signatures -> Notify Admin
 */
export function notifyEventSignaturesCompleted(
  evento: EventoData,
  firmadosCount?: number,
  totalCount?: number,
  supervisorName?: string
): SystemNotification {
  const total = totalCount ?? (evento.participantes?.length || 0);
  return pushSystemNotification({
    titulo: '¡Evento Firmado al 100% por los Participantes!',
    mensaje: `El Supervisor ${supervisorName || 'de Capacitación'} ha recabado exitosamente el 100% de las ${total} firmas digitales de los participantes en el evento "${evento.nombreEvento}".`,
    tipo: 'firmas_completadas',
    eventoId: evento.id,
    eventoNombre: evento.nombreEvento,
    destinatarioRol: 'Admin',
  });
}

export const notifySignaturesCompleted = notifyEventSignaturesCompleted;

/**
 * Dismiss a notification
 */
export function dismissNotification(id: string): void {
  const current = getStoredNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, leido: true } : n));
  saveStoredNotifications(updated);
}
