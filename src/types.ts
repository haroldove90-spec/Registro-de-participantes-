export type TipoEvento = 'Capacitación' | 'Reunión de Trabajo';
export type UbicacionModalidad = 'MM' | 'OP' | 'Campo';
export type TipoInstructor = 'Interno' | 'Externo';
export type Genero = 'H' | 'M';

export interface Participant {
  id: string;
  pos: number; // Posición / Consecutivo
  noEmp: string; // Número de Empleado
  nombre: string;
  genero: Genero;
  puesto: string;
  depto: string; // Departamento
  firma?: string; // Data URL or signature text
}

export interface Instructor {
  tipo: TipoInstructor;
  nombre: string;
  puesto?: string; // For Interno
  empresa?: string; // For Externo
  rfc: string;
  firma?: string; // Signature Data URL
}

export interface Costos {
  costoInstructor: number;
  costoMateriales: number;
  costoCafeteria: number;
  otrosCostos: number;
  totalCostos: number; // Calculated automatically
}

export interface EventoData {
  id: string;
  // 1. Datos Generales del Evento
  nombreEvento: string;
  objetivoEvento: string;
  dirigidoA: string;
  tipoEvento: TipoEvento;
  ubicacionModalidad: UbicacionModalidad;
  fechaInicio: string; // YYYY-MM-DD
  fechaTermino: string; // YYYY-MM-DD
  noDias: number;
  horarioDe: string; // e.g. "09:00"
  horarioA: string; // e.g. "17:00"
  horasCapacitacion: number;
  horasHombreCapacitacion: number; // Calculated (Horas * Total Participantes)

  // 2. Métricas de Participantes
  hombresCount: number;
  mujeresCount: number;
  totalParticipantes: number;

  // 3. Control de Instructores
  instructor: Instructor;

  // 4. Administración de Recursos y Costos
  contenidoTematico: string;
  nombreAdjunto?: string;
  anexoContenido: boolean;
  costos: Costos;
  firmaRH?: string;
  aprobadoRH: boolean;

  // 5. Lista de Asistencia / Colegas Participantes
  participantes: Participant[];

  // Meta
  fechaCreacion: string;
  estado: 'Registrado' | 'En Proceso' | 'Completado';
}

export interface UserProfile {
  nombre: string;
  email: string;
  puesto: string;
  departamento: string;
  rfc: string;
  telefono: string;
  rol: string;
  avatarUrl: string;
  fechaIngreso: string;
  notificacionesEmail: boolean;
  modoOscuro: boolean;
}

export type ModuleType = 'registro' | 'historial' | 'metricas' | 'perfil';
