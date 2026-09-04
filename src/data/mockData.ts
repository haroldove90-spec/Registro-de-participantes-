import { EventoData, UserProfile } from '../types';

export const INITIAL_USER_PROFILE: UserProfile = {
  nombre: 'Harold Anguiano Morales',
  usuario: 'haroldo90',
  email: 'haroldove90@gmail.com',
  puesto: 'Director de Capacitación / Administrador General',
  departamento: 'Dirección de Recursos Humanos',
  rfc: 'AUMH900101XYZ',
  telefono: '+52 (55) 8912-3456',
  rol: 'Administrador de Capacitación',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  fechaIngreso: '2026-01-01',
  notificacionesEmail: true,
  modoOscuro: false,
};

// Lista limpia de eventos sin registros de muestra
export const INITIAL_EVENTOS: EventoData[] = [];
