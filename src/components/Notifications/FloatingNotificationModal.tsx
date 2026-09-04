import React, { useEffect, useState } from 'react';
import {
  Bell,
  BellRing,
  CheckCircle2,
  X,
  Volume2,
  CalendarDays,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { SystemNotification, UserProfile, UserRole } from '../../types';
import {
  playNotificationSound,
  getStoredNotifications,
  dismissNotification,
  NOTIFICATION_SOUND_URL,
} from '../../utils/notifications';

interface FloatingNotificationModalProps {
  userProfile: UserProfile;
  onNavigateToEvento?: (eventoId: string) => void;
}

export const FloatingNotificationModal: React.FC<FloatingNotificationModalProps> = ({
  userProfile,
  onNavigateToEvento,
}) => {
  const [activeNotification, setActiveNotification] = useState<SystemNotification | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Normalize user role
  const isUserAdmin =
    userProfile.rol === 'Admin' ||
    userProfile.email?.toLowerCase() === 'haroldo90@hotmail.com' ||
    userProfile.usuario === 'haroldo90';

  const userRoleCategory: 'Admin' | 'Supervisor' = isUserAdmin ? 'Admin' : 'Supervisor';

  // Listen for local and cross-tab notifications
  useEffect(() => {
    const handleNotificationEvent = (e: Event) => {
      const customEvent = e as CustomEvent<SystemNotification>;
      const notif = customEvent.detail;
      if (!notif) return;

      // Filter: Show if recipient matches or is 'Todos'
      if (
        notif.destinatarioRol === 'Todos' ||
        notif.destinatarioRol === userRoleCategory
      ) {
        setActiveNotification(notif);
      }
    };

    window.addEventListener('sistema_notificacion_evento', handleNotificationEvent);

    // Cross-tab broadcast receiver
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('sistema_capacitacion_alertas_channel');
        channel.onmessage = (event) => {
          const notif = event.data as SystemNotification;
          if (
            notif &&
            (notif.destinatarioRol === 'Todos' || notif.destinatarioRol === userRoleCategory)
          ) {
            playNotificationSound();
            setActiveNotification(notif);
          }
        };
      }
    } catch (err) {
      console.warn('Broadcast channel init notice:', err);
    }

    return () => {
      window.removeEventListener('sistema_notificacion_evento', handleNotificationEvent);
      if (channel) {
        channel.close();
      }
    };
  }, [userRoleCategory]);

  const handleClose = () => {
    if (activeNotification) {
      dismissNotification(activeNotification.id);
    }
    setActiveNotification(null);
  };

  const handleAction = () => {
    if (activeNotification?.eventoId && onNavigateToEvento) {
      onNavigateToEvento(activeNotification.eventoId);
    }
    handleClose();
  };

  const handleReplaySound = () => {
    setIsAudioPlaying(true);
    playNotificationSound().finally(() => {
      setTimeout(() => setIsAudioPlaying(false), 800);
    });
  };

  if (!activeNotification) return null;

  const isEventoAdmin = activeNotification.tipo === 'evento_admin';
  const isEventoSupervisor = activeNotification.tipo === 'evento_supervisor';
  const isFirmasCompletadas = activeNotification.tipo === 'firmas_completadas';

  return (
    <aside
      aria-label="Notificación del sistema"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-scale-up">
        {/* Header Ribbon */}
        <div
          className={`p-5 text-white flex items-center justify-between ${
            isFirmasCompletadas
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700'
              : isEventoAdmin
              ? 'bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800'
              : 'bg-gradient-to-r from-purple-700 via-violet-700 to-indigo-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 shadow-inner">
              <BellRing className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/25 text-white">
                {isFirmasCompletadas
                  ? 'Firma Digital Completada'
                  : isEventoAdmin
                  ? 'Alerta para Supervisor'
                  : 'Alerta para Administrador'}
              </span>
              <h3 className="font-black text-base leading-tight mt-1 text-white">
                {activeNotification.titulo}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
            title="Cerrar notificación"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-slate-700 text-sm leading-relaxed">
            <p className="font-medium text-slate-800">{activeNotification.mensaje}</p>

            {activeNotification.eventoNombre && (
              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-600 font-semibold">
                <CalendarDays className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-slate-500">Evento:</span>
                <span className="text-slate-900 font-bold underline">
                  {activeNotification.eventoNombre}
                </span>
              </div>
            )}
          </div>

          {/* Sound playback control */}
          <div className="flex items-center justify-between text-xs text-slate-500 bg-blue-50/60 border border-blue-100 rounded-xl px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <Volume2 className={`w-4 h-4 text-blue-600 ${isAudioPlaying ? 'animate-pulse' : ''}`} />
              <span>Tono de alerta reproducido automáticamente</span>
            </div>
            <button
              type="button"
              onClick={handleReplaySound}
              className="text-blue-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Repetir sonido</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
            >
              Entendido / Cerrar
            </button>

            {activeNotification.eventoId && onNavigateToEvento && (
              <button
                type="button"
                onClick={handleAction}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Ver Evento y Participantes</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
