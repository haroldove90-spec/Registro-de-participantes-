import { createClient } from '@supabase/supabase-js';
import { EventoData, Participant, UserProfile, UserRole } from '../types';

// Supabase project credentials provided by the user
export const SUPABASE_PROJECT_CONFIG = {
  projectName: 'registrodeparticipantes@appdesignsoftware.com',
  projectId: 'acjelqhrflkxnkttlrkr',
  url: ((import.meta as any).env?.VITE_SUPABASE_URL as string) || 'https://acjelqhrflkxnkttlrkr.supabase.co',
  anonKey:
    ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) ||
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
        email: p.email || undefined,
        genero: p.genero,
        puesto: p.puesto || '',
        depto: p.depto || '',
        firma: p.firma || undefined,
        confirmado: p.confirmado !== undefined ? p.confirmado : true,
        fechaConfirmacion: p.fecha_confirmacion || undefined,
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
export async function upsertEventoToSupabase(evento: EventoData): Promise<{ success: boolean; error?: string }> {
  try {
    const eventoRow = mapEventoToRow(evento);
    const { error: eventoError } = await supabase
      .from('eventos')
      .upsert(eventoRow, { onConflict: 'id' });

    if (eventoError) {
      console.error('Supabase upsert evento error:', eventoError);
      return { success: false, error: eventoError.message };
    }

    // Delete existing participants for this event then re-insert with unique IDs
    await supabase.from('participantes').delete().eq('evento_id', evento.id);

    if (evento.participantes && evento.participantes.length > 0) {
      const partRows = evento.participantes.map((p, idx) => ({
        id: `${evento.id}_p_${p.pos || idx + 1}_${p.id || Math.random().toString(36).substring(2, 6)}`,
        evento_id: evento.id,
        pos: p.pos || idx + 1,
        no_emp: p.noEmp || '',
        nombre: p.nombre,
        email: p.email || null,
        genero: p.genero,
        puesto: p.puesto || '',
        depto: p.depto || '',
        firma: p.firma || '',
        confirmado: p.confirmado !== undefined ? p.confirmado : true,
        fecha_confirmacion: p.fechaConfirmacion || new Date().toISOString(),
      }));

      const { error: partError } = await supabase.from('participantes').insert(partRows);
      if (partError) {
        console.error('Supabase insert participantes error:', partError);
        return { success: false, error: partError.message };
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Exception in upsertEventoToSupabase:', err);
    return { success: false, error: err?.message || 'Error de conexión' };
  }
}

/**
 * Uploads/Syncs all local events to Supabase cloud
 */
export async function syncAllLocalEventsToSupabase(eventos: EventoData[]): Promise<{
  success: boolean;
  syncedCount: number;
  error?: string;
}> {
  try {
    let syncedCount = 0;
    for (const evt of eventos) {
      const res = await upsertEventoToSupabase(evt);
      if (res.success) {
        syncedCount++;
      } else {
        return { success: false, syncedCount, error: res.error };
      }
    }
    return { success: true, syncedCount };
  } catch (err: any) {
    return { success: false, syncedCount: 0, error: err?.message };
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
 * Fetches user profile from Supabase by email or ID
 */
export async function fetchUserProfileFromSupabase(emailOrId?: string): Promise<UserProfile | null> {
  try {
    let query = supabase.from('perfiles_usuario').select('*');

    if (emailOrId && emailOrId.includes('@')) {
      query = query.ilike('email', emailOrId);
    } else if (emailOrId) {
      query = query.eq('id', emailOrId);
    } else {
      query = query.limit(1);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      if (isTableMissingError(error)) {
        return null;
      }
      console.warn('Supabase fetch profile notice:', error.message);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      nombre: data.nombre,
      email: data.email,
      puesto: data.puesto || '',
      departamento: data.departamento || '',
      rfc: data.rfc || '',
      telefono: data.telefono || '',
      rol: data.rol || 'Coordinador de Capacitación',
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
 * Fetches all registered users from Supabase (for Role management)
 */
export async function fetchAllUsersFromSupabase(): Promise<UserProfile[]> {
  try {
    const { data, error } = await supabase
      .from('perfiles_usuario')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      if (isTableMissingError(error)) return [];
      console.warn('Error fetching all users:', error.message);
      return [];
    }

    if (!data) return [];

    return data.map((item: any) => ({
      id: item.id,
      nombre: item.nombre,
      email: item.email,
      puesto: item.puesto || '',
      departamento: item.departamento || '',
      rfc: item.rfc || '',
      telefono: item.telefono || '',
      rol: item.rol || 'Coordinador de Capacitación',
      avatarUrl: item.avatar_url || '',
      fechaIngreso: item.fecha_ingreso || '',
      notificacionesEmail: item.notificaciones_email ?? true,
      modoOscuro: item.modo_oscuro ?? false,
    }));
  } catch (err) {
    return [];
  }
}

/**
 * Saves or updates user profile in Supabase
 */
export async function saveUserProfileToSupabase(profile: UserProfile): Promise<boolean> {
  try {
    const { error } = await supabase.from('perfiles_usuario').upsert(
      {
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
      { onConflict: 'email' }
    );

    if (error) {
      if (isTableMissingError(error)) {
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

/**
 * Updates a user role in Supabase
 */
export async function updateUserRoleInSupabase(
  email: string,
  newRole: UserRole
): Promise<{ success: boolean; message: string }> {
  try {
    // Try RPC function first
    const { data: rpcData, error: rpcError } = await supabase.rpc('cambiar_rol_usuario', {
      target_email: email,
      nuevo_rol: newRole,
    });

    if (!rpcError && rpcData) {
      return { success: true, message: `Rol actualizado a ${newRole} exitosamente.` };
    }

    // Fallback: Direct Table update
    const { error: tableError } = await supabase
      .from('perfiles_usuario')
      .update({ rol: newRole })
      .ilike('email', email);

    if (tableError) {
      if (isTableMissingError(tableError)) {
        return {
          success: false,
          message: 'La tabla perfiles_usuario no existe en Supabase aún. Ejecuta el script SQL en el SQL Editor.',
        };
      }
      return { success: false, message: tableError.message };
    }

    return { success: true, message: `Rol de ${email} actualizado a ${newRole}.` };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Error al actualizar el rol en Supabase.' };
  }
}

/**
 * Sign In with Supabase Auth
 */
export async function signInWithSupabase(
  email: string,
  password: string
): Promise<{
  success: boolean;
  user?: UserProfile;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'No se obtuvo usuario tras autenticación.' };
    }

    // Fetch user profile from perfiles_usuario
    const remoteProfile = await fetchUserProfileFromSupabase(data.user.email);

    const userProfile: UserProfile = remoteProfile || {
      id: data.user.id,
      nombre: (data.user.user_metadata?.nombre as string) || data.user.email?.split('@')[0] || 'Usuario',
      email: data.user.email || email,
      puesto: (data.user.user_metadata?.puesto as string) || 'Colaborador',
      departamento: (data.user.user_metadata?.departamento as string) || 'General',
      rfc: (data.user.user_metadata?.rfc as string) || 'XAXX010101000',
      telefono: (data.user.user_metadata?.telefono as string) || '',
      rol: (data.user.user_metadata?.rol as UserRole) || 'Coordinador de Capacitación',
      avatarUrl:
        (data.user.user_metadata?.avatarUrl as string) ||
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      fechaIngreso: new Date().toISOString().split('T')[0],
      notificacionesEmail: true,
      modoOscuro: false,
    };

    return {
      success: true,
      user: userProfile,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Error inesperado durante el inicio de sesión.',
    };
  }
}

/**
 * Sign Up with Supabase Auth
 */
export async function signUpWithSupabase(
  email: string,
  password: string,
  profileData: {
    nombre: string;
    puesto?: string;
    departamento?: string;
    rfc?: string;
    telefono?: string;
    rol?: UserRole;
    avatarUrl?: string;
  }
): Promise<{
  success: boolean;
  user?: UserProfile;
  needsEmailConfirmation?: boolean;
  error?: string;
}> {
  try {
    const formattedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: formattedEmail,
      password,
      options: {
        data: {
          nombre: profileData.nombre,
          puesto: profileData.puesto || 'Colaborador',
          departamento: profileData.departamento || 'General',
          rfc: profileData.rfc || 'XAXX010101000',
          telefono: profileData.telefono || '',
          rol: profileData.rol || 'Coordinador de Capacitación',
          avatarUrl:
            profileData.avatarUrl ||
            'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const newUser: UserProfile = {
      id: data.user?.id,
      nombre: profileData.nombre,
      email: formattedEmail,
      puesto: profileData.puesto || 'Colaborador',
      departamento: profileData.departamento || 'General',
      rfc: profileData.rfc || 'XAXX010101000',
      telefono: profileData.telefono || '',
      rol: profileData.rol || 'Coordinador de Capacitación',
      avatarUrl:
        profileData.avatarUrl ||
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      fechaIngreso: new Date().toISOString().split('T')[0],
      notificacionesEmail: true,
      modoOscuro: false,
    };

    // Try saving directly to perfiles_usuario table as well
    await saveUserProfileToSupabase(newUser).catch(() => {});

    const needsEmailConfirmation = !data.session && !!data.user;

    return {
      success: true,
      user: newUser,
      needsEmailConfirmation,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Error inesperado durante el registro.',
    };
  }
}

/**
 * Sign Out from Supabase Auth
 */
export async function signOutFromSupabase(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Error signing out from Supabase:', err);
  }
}

/**
 * Gets currently authenticated Supabase user session if active in browser
 */
export async function getCurrentSupabaseUser(): Promise<UserProfile | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const email = session.user.email;
    if (!email) return null;

    const remoteProfile = await fetchUserProfileFromSupabase(email);
    if (remoteProfile) return remoteProfile;

    return {
      id: session.user.id,
      nombre: (session.user.user_metadata?.nombre as string) || email.split('@')[0],
      email: email,
      puesto: (session.user.user_metadata?.puesto as string) || 'Colaborador',
      departamento: (session.user.user_metadata?.departamento as string) || 'General',
      rfc: (session.user.user_metadata?.rfc as string) || 'XAXX010101000',
      telefono: (session.user.user_metadata?.telefono as string) || '',
      rol: (session.user.user_metadata?.rol as UserRole) || 'Coordinador de Capacitación',
      avatarUrl:
        (session.user.user_metadata?.avatarUrl as string) ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      fechaIngreso: new Date().toISOString().split('T')[0],
      notificacionesEmail: true,
      modoOscuro: false,
    };
  } catch {
    return null;
  }
}
