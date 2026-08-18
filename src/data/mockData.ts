import { EventoData, UserProfile } from '../types';

export const INITIAL_USER_PROFILE: UserProfile = {
  nombre: 'Harold Ove',
  email: 'haroldove90@gmail.com',
  puesto: 'Administrador de Capacitación y Desarrollo',
  departamento: 'Recursos Humanos / Capacitación',
  rfc: 'XAXX010101000',
  telefono: '+52 (55) 1234-5678',
  rol: 'Administrador de Capacitación',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  fechaIngreso: new Date().toISOString().split('T')[0],
  notificacionesEmail: true,
  modoOscuro: false,
};

// Lista limpia de eventos sin registros de muestra
export const INITIAL_EVENTOS: EventoData[] = [];
