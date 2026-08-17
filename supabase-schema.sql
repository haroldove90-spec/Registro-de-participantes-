-- ==============================================================================
-- SISTEMA DE CONTROL DE CAPACITACIÓN Y REGISTRO DE PARTICIPANTES
-- SUPABASE POSTGRESQL SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- Project: registrodeparticipantes@appdesignsoftware.com (ID: acjelqhrflkxnkttlrkr)
-- URL: https://acjelqhrflkxnkttlrkr.supabase.co
-- ==============================================================================

-- 1. HABILITAR EXTENSIONES NECESARIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA PRINCIPAL DE EVENTOS DE CAPACITACIÓN Y REUNIONES
CREATE TABLE IF NOT EXISTS public.eventos (
    id TEXT PRIMARY KEY,
    nombre_evento TEXT NOT NULL,
    objetivo_evento TEXT DEFAULT '',
    dirigido_a TEXT DEFAULT '',
    tipo_evento TEXT NOT NULL CHECK (tipo_evento IN ('Capacitación', 'Reunión de Trabajo')),
    ubicacion_modalidad TEXT NOT NULL CHECK (ubicacion_modalidad IN ('MM', 'OP', 'Campo')),
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_termino DATE NOT NULL DEFAULT CURRENT_DATE,
    no_dias INTEGER NOT NULL DEFAULT 1,
    horario_de TEXT DEFAULT '09:00',
    horario_a TEXT DEFAULT '17:00',
    horas_capacitacion NUMERIC NOT NULL DEFAULT 0,
    horas_hombre_capacitacion NUMERIC NOT NULL DEFAULT 0,
    
    -- Métricas y Conteos de Participantes
    hombres_count INTEGER NOT NULL DEFAULT 0,
    mujeres_count INTEGER NOT NULL DEFAULT 0,
    total_participantes INTEGER NOT NULL DEFAULT 0,
    
    -- Control de Instructores
    instructor_tipo TEXT NOT NULL DEFAULT 'Interno' CHECK (instructor_tipo IN ('Interno', 'Externo')),
    instructor_nombre TEXT NOT NULL DEFAULT '',
    instructor_puesto TEXT DEFAULT '',
    instructor_empresa TEXT DEFAULT '',
    instructor_rfc TEXT DEFAULT '',
    instructor_firma TEXT DEFAULT '',
    
    -- Administración de Recursos y Costos
    contenido_tematico TEXT DEFAULT '',
    nombre_adjunto TEXT DEFAULT '',
    anexo_contenido BOOLEAN NOT NULL DEFAULT true,
    costo_instructor NUMERIC NOT NULL DEFAULT 0,
    costo_materiales NUMERIC NOT NULL DEFAULT 0,
    costo_cafeteria NUMERIC NOT NULL DEFAULT 0,
    otros_costos NUMERIC NOT NULL DEFAULT 0,
    total_costos NUMERIC NOT NULL DEFAULT 0,
    firma_rh TEXT DEFAULT '',
    aprobado_rh BOOLEAN NOT NULL DEFAULT false,
    
    -- Estado y Metadatos
    estado TEXT NOT NULL DEFAULT 'Registrado' CHECK (estado IN ('Registrado', 'En Proceso', 'Completado')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. TABLA DE PARTICIPANTES (LISTA DE ASISTENCIA / COLEGA PARTICIPANTE)
CREATE TABLE IF NOT EXISTS public.participantes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    evento_id TEXT NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
    pos INTEGER NOT NULL,
    no_emp TEXT DEFAULT '',
    nombre TEXT NOT NULL,
    genero TEXT NOT NULL CHECK (genero IN ('H', 'M')),
    puesto TEXT DEFAULT '',
    depto TEXT DEFAULT '',
    firma TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. TABLA DE PERFILES DE USUARIO
CREATE TABLE IF NOT EXISTS public.perfiles_usuario (
    id TEXT PRIMARY KEY DEFAULT 'default_user',
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    puesto TEXT DEFAULT '',
    departamento TEXT DEFAULT '',
    rfc TEXT DEFAULT '',
    telefono TEXT DEFAULT '',
    rol TEXT DEFAULT 'Administrador de Capacitación',
    avatar_url TEXT DEFAULT '',
    fecha_ingreso DATE DEFAULT CURRENT_DATE,
    notificaciones_email BOOLEAN DEFAULT true,
    modo_oscuro BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. ÍNDICES DE RENDIMIENTO Y CONSULTA RÁPIDA
CREATE INDEX IF NOT EXISTS idx_participantes_evento_id ON public.participantes(evento_id);
CREATE INDEX IF NOT EXISTS idx_participantes_pos ON public.participantes(evento_id, pos);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha_inicio ON public.eventos(fecha_inicio DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_tipo_evento ON public.eventos(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_eventos_modalidad ON public.eventos(ubicacion_modalidad);

-- 6. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles_usuario ENABLE ROW LEVEL SECURITY;

-- 7. POLÍTICAS DE ACCESO COMPLETO (ANON KEY / PUBLIC ACCESS)
-- Eventos
DROP POLICY IF EXISTS "Permitir lectura publica de eventos" ON public.eventos;
CREATE POLICY "Permitir lectura publica de eventos" ON public.eventos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercion publica de eventos" ON public.eventos;
CREATE POLICY "Permitir insercion publica de eventos" ON public.eventos FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir actualizacion publica de eventos" ON public.eventos;
CREATE POLICY "Permitir actualizacion publica de eventos" ON public.eventos FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir eliminacion publica de eventos" ON public.eventos;
CREATE POLICY "Permitir eliminacion publica de eventos" ON public.eventos FOR DELETE USING (true);

-- Participantes
DROP POLICY IF EXISTS "Permitir lectura publica de participantes" ON public.participantes;
CREATE POLICY "Permitir lectura publica de participantes" ON public.participantes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercion publica de participantes" ON public.participantes;
CREATE POLICY "Permitir insercion publica de participantes" ON public.participantes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir actualizacion publica de participantes" ON public.participantes;
CREATE POLICY "Permitir actualizacion publica de participantes" ON public.participantes FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir eliminacion publica de participantes" ON public.participantes;
CREATE POLICY "Permitir eliminacion publica de participantes" ON public.participantes FOR DELETE USING (true);

-- Perfiles de usuario
DROP POLICY IF EXISTS "Permitir lectura publica de perfiles" ON public.perfiles_usuario;
CREATE POLICY "Permitir lectura publica de perfiles" ON public.perfiles_usuario FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir modificacion de perfiles" ON public.perfiles_usuario;
CREATE POLICY "Permitir modificacion de perfiles" ON public.perfiles_usuario FOR ALL USING (true);

-- 8. TRIGGER PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_eventos_updated_at ON public.eventos;
CREATE TRIGGER tr_eventos_updated_at
    BEFORE UPDATE ON public.eventos
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_perfiles_updated_at ON public.perfiles_usuario;
CREATE TRIGGER tr_perfiles_updated_at
    BEFORE UPDATE ON public.perfiles_usuario
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 9. INSERTAR PERFIL INICIAL POR DEFECTO
INSERT INTO public.perfiles_usuario (id, nombre, email, puesto, departamento, rfc, telefono, rol, avatar_url, notificaciones_email, modo_oscuro)
VALUES (
    'default_user',
    'Lic. Ana Gabriela Mendoza',
    'registrodeparticipantes@appdesignsoftware.com',
    'Coordinadora de Desarrollo Organizacional & Capacitación',
    'Recursos Humanos y Formación Continua',
    'MEGA890412HR4',
    '+52 (55) 8492-3021',
    'Administrador de Capacitación',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    true,
    false
)
ON CONFLICT (id) DO NOTHING;
