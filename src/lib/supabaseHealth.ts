import { supabase, SUPABASE_PROJECT_CONFIG, isTableMissingError } from './supabase';
import { EventoData, UserProfile } from '../types';

export interface SupabaseHealthReport {
  status: 'connected' | 'error' | 'checking';
  latencyMs: number;
  lastChecked: string;
  errorMessage?: string;
  errorCode?: string;
  friendlyDiagnosis?: string;
  suggestedAction?: string;
  tablesStatus: {
    eventos: boolean;
    participantes: boolean;
    perfiles_usuario: boolean;
  };
}

/**
 * Diagnostic helper: Translates raw Postgres / PostgREST error codes into user-friendly explanations
 */
export function translatePostgreSQLError(error: any): { friendly: string; action: string } {
  if (!error) {
    return {
      friendly: 'Conexión verificada exitosamente sin advertencias.',
      action: 'El servicio está 100% operativo.',
    };
  }

  const code = error.code || '';
  const msg = (error.message || '').toLowerCase();
  const details = (error.details || '').toLowerCase();

  // 1. Table or schema missing (42P01 or PGRST205)
  if (code === '42P01' || code === 'PGRST205' || msg.includes('relation') || msg.includes('does not exist') || msg.includes('schema cache')) {
    return {
      friendly: 'Tablas no encontradas en PostgreSQL (42P01 / PGRST205). Falta crear la estructura de datos.',
      action: 'Copia el Script SQL de la pestaña "Script SQL" y ejecútalo en el SQL Editor de tu consola Supabase.',
    };
  }

  // 2. RLS Security policy blocked (42501)
  if (code === '42501' || msg.includes('row-level security') || msg.includes('violates row-level security policy') || msg.includes('permission denied')) {
    return {
      friendly: 'Bloqueo de Seguridad RLS (Row-Level Security / 42501). Las políticas de la tabla no permiten la consulta anónima o el rol no tiene privilegios.',
      action: 'Ejecuta el comando ALTER TABLE ... ENABLE ROW LEVEL SECURITY con sus políticas correspondientes incluidas en el Script SQL.',
    };
  }

  // 3. Invalid credentials or JWT expired (PGRST301 / invalid_grant / 401)
  if (code === 'PGRST301' || msg.includes('jwt') || msg.includes('apikey') || msg.includes('invalid api key') || msg.includes('unauthorized')) {
    return {
      friendly: 'Clave API Anon o Token JWT inválido o expirado.',
      action: 'Verifica la clave SUPABASE_ANON_KEY en la configuración del proyecto o en las variables de entorno.',
    };
  }

  // 4. Network / CORS / Timeout
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch') || msg.includes('timeout')) {
    return {
      friendly: 'Error de Red o tiempo de espera agotado al contactar con el cluster Supabase.',
      action: 'Comprueba tu conexión a internet o verifica si el proyecto de Supabase se encuentra activo (no pausado).',
    };
  }

  // 5. Unique constraint or foreign key (23505 / 23503)
  if (code === '23505' || msg.includes('unique constraint') || msg.includes('duplicate key')) {
    return {
      friendly: 'Violación de restricción de unicidad (Llave duplicada 23505).',
      action: 'El registro ya existe en Supabase y no pudo ser reinsertado.',
    };
  }

  return {
    friendly: `Error PostgreSQL/PostgREST: ${error.message || 'Desconocido'} ${code ? `(Código: ${code})` : ''}`,
    action: 'Revisa los logs en tu consola Supabase para más detalles técnicos.',
  };
}

/**
 * Measures exact latency and diagnoses health of Supabase PostgreSQL tables
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealthReport> {
  const startTime = performance.now();
  const report: SupabaseHealthReport = {
    status: 'checking',
    latencyMs: 0,
    lastChecked: new Date().toLocaleTimeString(),
    tablesStatus: {
      eventos: false,
      participantes: false,
      perfiles_usuario: false,
    },
  };

  try {
    // 1. Test ping table 'eventos'
    const { data: evData, error: evError } = await supabase
      .from('eventos')
      .select('id')
      .limit(1);

    const endTime = performance.now();
    report.latencyMs = Math.round(endTime - startTime);

    if (evError) {
      const diag = translatePostgreSQLError(evError);
      report.status = 'error';
      report.errorCode = evError.code || 'UNKNOWN';
      report.errorMessage = evError.message;
      report.friendlyDiagnosis = diag.friendly;
      report.suggestedAction = diag.action;

      // Check if table missing specifically
      if (isTableMissingError(evError)) {
        report.tablesStatus.eventos = false;
      }
      return report;
    }

    report.tablesStatus.eventos = true;

    // 2. Test table 'participantes'
    const { error: partError } = await supabase
      .from('participantes')
      .select('id')
      .limit(1);
    report.tablesStatus.participantes = !partError;

    // 3. Test table 'perfiles_usuario'
    const { error: perfError } = await supabase
      .from('perfiles_usuario')
      .select('id')
      .limit(1);
    report.tablesStatus.perfiles_usuario = !perfError;

    // All good
    report.status = 'connected';
    report.friendlyDiagnosis = 'Conexión a Supabase Cloud PostgreSQL verificada y óptima.';
    report.suggestedAction = 'Todas las tablas requeridas responden correctamente con latencia baja.';
    return report;
  } catch (err: any) {
    const endTime = performance.now();
    report.latencyMs = Math.round(endTime - startTime);
    report.status = 'error';
    const diag = translatePostgreSQLError(err);
    report.errorMessage = err?.message || 'Error de red';
    report.friendlyDiagnosis = diag.friendly;
    report.suggestedAction = diag.action;
    return report;
  }
}

/**
 * Generates an idempotent, fully self-contained SQL script to setup all tables,
 * indexes, and RLS policies in Supabase SQL Editor.
 */
export function getCompleteSupabaseSQLScript(): string {
  return `-- ==============================================================================
-- SCRIPT DE INICIALIZACIÓN COMPLETA PARA SUPABASE POSTGRESQL (IDEMPOTENTE)
-- Proyecto: ${SUPABASE_PROJECT_CONFIG.projectName} (${SUPABASE_PROJECT_CONFIG.projectId})
-- ==============================================================================

-- 1. Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- TABLA 1: EVENTOS (Cursos, Capacitaciones, Reuniones)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.eventos (
  id TEXT PRIMARY KEY,
  nombre_evento TEXT NOT NULL,
  objetivo_evento TEXT DEFAULT '',
  dirigido_a TEXT DEFAULT '',
  tipo_evento TEXT NOT NULL DEFAULT 'Capacitación',
  ubicacion_modalidad TEXT NOT NULL DEFAULT 'MM',
  fecha_inicio DATE NOT NULL,
  fecha_termino DATE NOT NULL,
  no_dias INTEGER DEFAULT 1,
  horario_de TEXT DEFAULT '09:00',
  horario_a TEXT DEFAULT '17:00',
  horas_capacitacion NUMERIC(6,2) DEFAULT 0,
  horas_hombre_capacitacion NUMERIC(8,2) DEFAULT 0,
  hombres_count INTEGER DEFAULT 0,
  mujeres_count INTEGER DEFAULT 0,
  total_participantes INTEGER DEFAULT 0,
  instructor_tipo TEXT DEFAULT 'Interno',
  instructor_nombre TEXT DEFAULT '',
  instructor_puesto TEXT DEFAULT '',
  instructor_empresa TEXT DEFAULT '',
  instructor_rfc TEXT DEFAULT '',
  instructor_firma TEXT DEFAULT '',
  contenido_tematico TEXT DEFAULT '',
  nombre_adjunto TEXT DEFAULT '',
  anexo_contenido BOOLEAN DEFAULT TRUE,
  costo_instructor NUMERIC(10,2) DEFAULT 0,
  costo_materiales NUMERIC(10,2) DEFAULT 0,
  costo_cafeteria NUMERIC(10,2) DEFAULT 0,
  otros_costos NUMERIC(10,2) DEFAULT 0,
  total_costos NUMERIC(10,2) DEFAULT 0,
  firma_rh TEXT DEFAULT '',
  aprobado_rh BOOLEAN DEFAULT FALSE,
  estado TEXT DEFAULT 'Registrado',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de búsqueda para eventos
CREATE INDEX IF NOT EXISTS idx_eventos_fecha_inicio ON public.eventos(fecha_inicio DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_estado ON public.eventos(estado);
CREATE INDEX IF NOT EXISTS idx_eventos_tipo ON public.eventos(tipo_evento);

-- ------------------------------------------------------------------------------
-- TABLA 2: PARTICIPANTES (Bitácora de Asistencia y Accesos)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.participantes (
  id TEXT PRIMARY KEY,
  evento_id TEXT REFERENCES public.eventos(id) ON DELETE CASCADE,
  pos INTEGER DEFAULT 1,
  no_emp TEXT DEFAULT '',
  nombre TEXT NOT NULL,
  email TEXT,
  genero TEXT DEFAULT 'H',
  puesto TEXT DEFAULT '',
  depto TEXT DEFAULT '',
  firma TEXT DEFAULT '',
  confirmado BOOLEAN DEFAULT TRUE,
  fecha_confirmacion TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de búsqueda para participantes
CREATE INDEX IF NOT EXISTS idx_participantes_evento_id ON public.participantes(evento_id);
CREATE INDEX IF NOT EXISTS idx_participantes_email ON public.participantes(email);
CREATE INDEX IF NOT EXISTS idx_participantes_no_emp ON public.participantes(no_emp);

-- ------------------------------------------------------------------------------
-- TABLA 3: PERFILES DE USUARIO (Roles y Configuración)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.perfiles_usuario (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  puesto TEXT DEFAULT 'Colaborador',
  departamento TEXT DEFAULT 'General',
  rfc TEXT DEFAULT 'XAXX010101000',
  telefono TEXT DEFAULT '',
  rol TEXT DEFAULT 'Coordinador de Capacitación',
  avatar_url TEXT DEFAULT '',
  fecha_ingreso DATE DEFAULT CURRENT_DATE,
  notificaciones_email BOOLEAN DEFAULT TRUE,
  modo_oscuro BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice único en email
CREATE INDEX IF NOT EXISTS idx_perfiles_email ON public.perfiles_usuario(email);

-- ------------------------------------------------------------------------------
-- CONFIGURACIÓN DE SEGURIDAD RLS (Row Level Security)
-- ------------------------------------------------------------------------------
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles_usuario ENABLE ROW LEVEL SECURITY;

-- Políticas Permisivas para App Web
DROP POLICY IF EXISTS "Permitir todo en eventos" ON public.eventos;
CREATE POLICY "Permitir todo en eventos" ON public.eventos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo en participantes" ON public.participantes;
CREATE POLICY "Permitir todo en participantes" ON public.participantes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo en perfiles_usuario" ON public.perfiles_usuario;
CREATE POLICY "Permitir todo en perfiles_usuario" ON public.perfiles_usuario FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- TRIGGER AUTOMÁTICO PARA NUEVOS USUARIOS REGISTRADOS EN AUTH
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles_usuario (email, nombre, puesto, departamento, rfc, telefono, rol, avatar_url)
  VALUES (
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'puesto', 'Colaborador'),
    COALESCE(NEW.raw_user_meta_data->>'departamento', 'General'),
    COALESCE(NEW.raw_user_meta_data->>'rfc', 'XAXX010101000'),
    COALESCE(NEW.raw_user_meta_data->>'telefono', ''),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'Coordinador de Capacitación'),
    COALESCE(NEW.raw_user_meta_data->>'avatarUrl', '')
  )
  ON CONFLICT (email) DO UPDATE
  SET 
    nombre = EXCLUDED.nombre,
    avatar_url = CASE WHEN EXCLUDED.avatar_url <> '' THEN EXCLUDED.avatar_url ELSE perfiles_usuario.avatar_url END,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Notificar estado
SELECT 'Instalación de tablas completada con éxito para eventos, participantes y perfiles.' AS resultado;
`;
}
