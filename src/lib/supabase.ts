import { createClient } from '@supabase/supabase-js';
import { EventoData, Participant, UserProfile } from '../types';

// Supabase project credentials provided by the user
export const SUPABASE_PROJECT_CONFIG = {
  projectName: 'registrodeparticipantes@appdesignsoftware.com',
  projectId: 'acjelqhrflkxnkttlrkr',
  url: import.meta.env.VITE_SUPABASE_URL || 'https://acjelqhrflkxnkttlrkr.supabase.co',
  anonKey:
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjamVscWhyZmxreG5rdHRscmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5OTg1MDMsImV4cCI6MjEwMjU3NDUwM30.5FCoWmIzNwHtQJ9snnClQLvZLNMGiBjL4XtDAZ_L3Kk',
};

// Initialize Supabase Client
export const supabase = createClient(
  SUPABASE_PROJECT_CONFIG.url,
  SUPABASE_PROJECT_CONFIG.anonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

/**
 * Checks if a Supabase PostgREST error is due to missing tables / unexecuted SQL schema
 */
export function isTableMissingError(error: any): boolean {
  if (!error) return false;
  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    (typeof error.message === 'string' &&
      (error.message.includes('schema cache') ||
        error.message.includes('does not exist') ||
        error.message.includes('relation "public.')))
  );
}

/**
 * Checks connection to the Supabase database
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  tablesReady?: boolean;
}> {
  try {
    const { data, error } = await supabase.from('eventos').select('id').limit(1);

    if (error) {
      if (isTableMissingError(error)) {
        return {
          success: true,
          tablesReady: false,
          message:
            'Conexión a Supabase exitosa, pero las tablas aún no se han creado en el Editor SQL. Copia el script SQL y ejecútalo.',
        };
      }
      return {
        success: false,
        tablesReady: false,
        message: `Error de conexión a Supabase: ${error.message}`,
      };
    }

    return {
      success: true,
      tablesReady: true,
      message: 'Conexión activa y todas las tablas están listas en Supabase.',
    };
  } catch (err: any) {
    return {
      success: false,
      tablesReady: false,
      message: err?.message || 'No se pudo conectar a Supabase.',
    };
  }
}

/**
 * Maps database row (snake_case) to EventoData (camelCase)
 */
function mapRowToEvento(row: any, participantes: Participant[] = []): EventoData {
  return {
    id: row.id,
    nombreEvento: row.nombre_evento,
    objetivoEvento: row.objetivo_evento || '',
    dirigidoA: row.dirigido_a || '',
    tipoEvento: row.tipo_evento,
    ubicacionModalidad: row.ubicacion_modalidad,
    fechaInicio: row.fecha_inicio,
    fechaTermino: row.fecha_termino,
    noDias: Number(row.no_dias) || 1,
    horarioDe: row.horario_de || '09:00',
    horarioA: row.horario_a || '17:00',
    horasCapacitacion: Number(row.horas_capacitacion) || 0,
    horasHombreCapacitacion: Number(row.horas_hombre_capacitacion) || 0,
    hombresCount: Number(row.hombres_count) || 0,
    mujeresCount: Number(row.mujeres_count) || 0,
    totalParticipantes: Number(row.total_participantes) || 0,
    instructor: {
      tipo: row.instructor_tipo || 'Interno',
      nombre: row.instructor_nombre || '',
      puesto: row.instructor_puesto || undefined,
      empresa: row.instructor_empresa || undefined,
      rfc: row.instructor_rfc || '',
      firma: row.instructor_firma || undefined,
    },
    contenidoTematico: row.contenido_tematico || '',
    nombreAdjunto: row.nombre_adjunto || undefined,
    anexoContenido: row.anexo_contenido ?? true,
    costos: {
      costoInstructor: Number(row.costo_instructor) || 0,
      costoMateriales: Number(row.costo_materiales) || 0,
      costoCafeteria: Number(row.costo_cafeteria) || 0,
      otrosCostos: Number(row.otros_costos) || 0,
      totalCostos: Number(row.total_costos) || 0,
    },
    firmaRH: row.firma_rh || undefined,
    aprobadoRH: row.aprobado_rh ?? false,
    participantes: participantes.sort((a, b) => a.pos - b.pos),
    fechaCreacion: row.created_at || new Date().toISOString(),
    estado: row.estado || 'Registrado',
  };
}

/**
 * Maps EventoData to Supabase row format
 */
function mapEventoToRow(evento: EventoData) {
  return {
    id: evento.id,
    nombre_evento: evento.nombreEvento,
    objetivo_evento: evento.objetivoEvento,
    dirigido_a: evento.dirigidoA,
    tipo_evento: evento.tipoEvento,
    ubicacion_modalidad: evento.ubicacionModalidad,
    fecha_inicio: evento.fechaInicio,
    fecha_termino: evento.fechaTermino,
    no_dias: evento.noDias,
    horario_de: evento.horarioDe,
    horario_a: evento.horarioA,
    horas_capacitacion: evento.horasCapacitacion,
    horas_hombre_capacitacion: evento.horasHombreCapacitacion,
    hombres_count: evento.hombresCount,
    mujeres_count: evento.mujeresCount,
    total_participantes: evento.totalParticipantes,
    instructor_tipo: evento.instructor.tipo,
    instructor_nombre: evento.instructor.nombre,
    instructor_puesto: evento.instructor.puesto || '',
    instructor_empresa: evento.instructor.empresa || '',
    instructor_rfc: evento.instructor.rfc || '',
    instructor_firma: evento.instructor.firma || '',
    contenido_tematico: evento.contenidoTematico || '',
    nombre_adjunto: evento.nombreAdjunto || '',
    anexo_contenido: evento.anexoContenido,
    costo_instructor: evento.costos.costoInstructor,
    costo_materiales: evento.costos.costoMateriales,
    costo_cafeteria: evento.costos.costoCafeteria,
    otros_costos: evento.costos.otrosCostos,
    total_costos: evento.costos.totalCostos,
    firma_rh: evento.firmaRH || '',
    aprobado_rh: evento.aprobadoRH,
    estado: evento.estado,
  };
}

/**
 * Fetches all events with their nested participants from Supabase
 */
export async function fetchEventosFromSupabase(): Promise<EventoData[] | null> {
  try {
    const { data: eventosData, error: eventosError } = await supabase
      .from('eventos')
      .select('*')
      .order('fecha_inicio', { ascending: false });

    if (eventosError) {
      if (isTableMissingError(eventosError)) {
        // Table not created yet in Supabase SQL editor; return null gracefully
        return null;
      }
      console.warn('Supabase fetch eventos notice:', eventosError.message);
      return null;
    }

    if (!eventosData) return null;

    const { data: partData, error: partError } = await supabase
      .from('participantes')
      .select('*')
      .order('pos', { ascending: true });

    if (partError && !isTableMissingError(partError)) {
      console.warn('Supabase fetch participantes notice:', partError.message);
    }

    const participantsByEvent: Record<string, Participant[]> = {};
    (partData || []).forEach((p: any) => {
      if (!participantsByEvent[p.evento_id]) {
        participantsByEvent[p.evento_id] = [];
      }
      participantsByEvent[p.evento_id].push({
        id: p.id,
        pos: p.pos,
        noEmp: p.no_emp || '',
        nombre: p.nombre,
        genero: p.genero,
        puesto: p.puesto || '',
        depto: p.depto || '',
        firma: p.firma || undefined,
      });
    });

    return eventosData.map((row: any) =>
      mapRowToEvento(row, participantsByEvent[row.id] || [])
    );
  } catch (err: any) {
    if (!isTableMissingError(err)) {
      console.warn('Notice in fetchEventosFromSupabase:', err?.message || err);
    }
    return null;
  }
}

/**
 * Inserts or updates an Evento and all its participants in Supabase
 */
export async function upsertEventoToSupabase(evento: EventoData): Promise<boolean> {
  try {
    const eventoRow = mapEventoToRow(evento);
    const { error: eventoError } = await supabase
      .from('eventos')
      .upsert(eventoRow, { onConflict: 'id' });

    if (eventoError) {
      if (isTableMissingError(eventoError)) {
        // Table not created yet; gracefully ignore
        return false;
      }
      console.warn('Supabase upsert evento notice:', eventoError.message);
      return false;
    }

    // Delete existing participants for this event then re-insert to maintain sequence
    await supabase.from('participantes').delete().eq('evento_id', evento.id);

    if (evento.participantes && evento.participantes.length > 0) {
      const partRows = evento.participantes.map((p) => ({
        id: p.id || undefined,
        evento_id: evento.id,
        pos: p.pos,
        no_emp: p.noEmp,
        nombre: p.nombre,
        genero: p.genero,
        puesto: p.puesto,
        depto: p.depto,
        firma: p.firma || '',
      }));

      const { error: partError } = await supabase.from('participantes').insert(partRows);
      if (partError && !isTableMissingError(partError)) {
        console.warn('Supabase insert participantes notice:', partError.message);
      }
    }

    return true;
  } catch (err: any) {
    if (!isTableMissingError(err)) {
      console.warn('Notice in upsertEventoToSupabase:', err?.message || err);
    }
    return false;
  }
}

/**
 * Deletes an event from Supabase (cascades to participants)
 */
export async function deleteEventoFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('eventos').delete().eq('id', id);
    if (error) {
      if (isTableMissingError(error)) {
        return false;
      }
      console.warn('Supabase delete evento notice:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    if (!isTableMissingError(err)) {
      console.warn('Notice in deleteEventoFromSupabase:', err?.message || err);
    }
    return false;
  }
}

/**
 * Fetches user profile from Supabase
 */
export async function fetchUserProfileFromSupabase(): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('perfiles_usuario')
      .select('*')
      .eq('id', 'default_user')
      .single();

    if (error) {
      if (isTableMissingError(error)) {
        return null;
      }
      // single() returns code PGRST116 when row not found
      if (error.code === 'PGRST116') {
        return null;
      }
      console.warn('Supabase fetch profile notice:', error.message);
      return null;
    }

    if (!data) return null;

    return {
      nombre: data.nombre,
      email: data.email,
      puesto: data.puesto || '',
      departamento: data.departamento || '',
      rfc: data.rfc || '',
      telefono: data.telefono || '',
      rol: data.rol || 'Administrador de Capacitación',
      avatarUrl: data.avatar_url || '',
      fechaIngreso: data.fecha_ingreso || '',
      notificacionesEmail: data.notificaciones_email ?? true,
      modoOscuro: data.modo_oscuro ?? false,
    };
  } catch (err: any) {
    if (!isTableMissingError(err)) {
      console.warn('Notice in fetchUserProfileFromSupabase:', err?.message || err);
    }
    return null;
  }
}

/**
 * Saves user profile to Supabase
 */
export async function saveUserProfileToSupabase(profile: UserProfile): Promise<boolean> {
  try {
    const { error } = await supabase.from('perfiles_usuario').upsert(
      {
        id: 'default_user',
        nombre: profile.nombre,
        email: profile.email,
        puesto: profile.puesto,
        departamento: profile.departamento,
        rfc: profile.rfc,
        telefono: profile.telefono,
        rol: profile.rol,
        avatar_url: profile.avatarUrl,
        fecha_ingreso: profile.fechaIngreso,
        notificaciones_email: profile.notificacionesEmail,
        modo_oscuro: profile.modoOscuro,
      },
      { onConflict: 'id' }
    );

    if (error) {
      if (isTableMissingError(error)) {
        // Table not created yet in Supabase SQL editor; return false cleanly without spamming console
        return false;
      }
      console.warn('Supabase save profile notice:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    if (!isTableMissingError(err)) {
      console.warn('Notice in saveUserProfileToSupabase:', err?.message || err);
    }
    return false;
  }
}
