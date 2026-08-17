-- ==============================================================================
-- SISTEMA DE CONTROL DE CAPACITACIÓN Y REGISTRO DE PARTICIPANTES
-- SUPABASE POSTGRESQL SCHEMA, AUTHENTICATION & ROLE MANAGEMENT (RLS)
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

-- 4. TABLA DE PERFILES DE USUARIO Y ROLES
CREATE TABLE IF NOT EXISTS public.perfiles_usuario (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    puesto TEXT DEFAULT '',
    departamento TEXT DEFAULT '',
    rfc TEXT DEFAULT '',
    telefono TEXT DEFAULT '',
    rol TEXT NOT NULL DEFAULT 'Coordinador de Capacitación' CHECK (
        rol IN (
            'Administrador de Capacitación',
            'Coordinador de Capacitación',
            'Instructor / Capacitador',
            'Recursos Humanos (RH)',
            'Participante / Empleado',
            'Auditor / Consulta'
        )
    ),
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
CREATE INDEX IF NOT EXISTS idx_perfiles_email ON public.perfiles_usuario(email);
CREATE INDEX IF NOT EXISTS idx_perfiles_rol ON public.perfiles_usuario(rol);

-- 6. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles_usuario ENABLE ROW LEVEL SECURITY;

-- 7. POLÍTICAS DE ACCESO COMPLETO (ANON KEY / AUTH USERS)
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

-- 9. TRIGGER PARA REGISTRO AUTOMÁTICO EN PERFILES AL CREAR USUARIO EN SUPABASE AUTH
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfiles_usuario (
        id,
        user_id,
        nombre,
        email,
        puesto,
        departamento,
        rfc,
        telefono,
        rol,
        avatar_url,
        fecha_ingreso,
        notificaciones_email,
        modo_oscuro
    )
    VALUES (
        NEW.id::text,
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'puesto', 'Colaborador'),
        COALESCE(NEW.raw_user_meta_data->>'departamento', 'General'),
        COALESCE(NEW.raw_user_meta_data->>'rfc', 'XAXX010101000'),
        COALESCE(NEW.raw_user_meta_data->>'telefono', ''),
        COALESCE(
            NEW.raw_user_meta_data->>'rol',
            'Coordinador de Capacitación'
        ),
        COALESCE(
            NEW.raw_user_meta_data->>'avatar_url',
            'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80'
        ),
        CURRENT_DATE,
        true,
        false
    )
    ON CONFLICT (email) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        nombre = EXCLUDED.nombre,
        updated_at = timezone('utc'::text, now());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 10. FUNCIONES SQL PARA CAMBIAR Y GESTIONAR ROLES DE USUARIO
-- ==============================================================================

-- Función 1: Cambiar rol de usuario por Email
CREATE OR REPLACE FUNCTION public.cambiar_rol_usuario(
    target_email TEXT,
    nuevo_rol TEXT
)
RETURNS JSON AS $$
DECLARE
    result_user public.perfiles_usuario%ROWTYPE;
BEGIN
    -- Validar que el rol sea uno de los permitidos
    IF nuevo_rol NOT IN (
        'Administrador de Capacitación',
        'Coordinador de Capacitación',
        'Instructor / Capacitador',
        'Recursos Humanos (RH)',
        'Participante / Empleado',
        'Auditor / Consulta'
    ) THEN
        RAISE EXCEPTION 'Rol no válido: %. Debe ser uno de los roles autorizados.', nuevo_rol;
    END IF;

    -- Actualizar rol en la tabla perfiles_usuario
    UPDATE public.perfiles_usuario
    SET rol = nuevo_rol,
        updated_at = timezone('utc'::text, now())
    WHERE LOWER(email) = LOWER(target_email)
    RETURNING * INTO result_user;

    IF NOT FOUND THEN
        -- Si no existe en perfiles_usuario, intentar crearlo
        INSERT INTO public.perfiles_usuario (
            id,
            nombre,
            email,
            rol
        )
        VALUES (
            gen_random_uuid()::text,
            split_part(target_email, '@', 1),
            target_email,
            nuevo_rol
        )
        RETURNING * INTO result_user;
    END IF;

    -- Sincronizar también con raw_user_meta_data en auth.users si existe
    UPDATE auth.users
    SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('rol', nuevo_rol)
    WHERE LOWER(email) = LOWER(target_email);

    RETURN json_build_object(
        'success', true,
        'email', result_user.email,
        'nombre', result_user.nombre,
        'nuevo_rol', result_user.rol,
        'mensaje', 'Rol actualizado con éxito a: ' || nuevo_rol
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. INSERTAR PERFIL ADMINISTRADOR POR DEFECTO
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
ON CONFLICT (email) DO NOTHING;

-- ==============================================================================
-- EJEMPLOS DE SENTENCIAS SQL PARA CAMBIAR ROLES DIRECTAMENTE EN SUPABASE SQL EDITOR:
-- ==============================================================================
--
-- Ejemplo 1: Cambiar rol usando la función helper:
-- SELECT public.cambiar_rol_usuario('usuario@empresa.com', 'Administrador de Capacitación');
--
-- Ejemplo 2: Cambiar rol con UPDATE directo por email:
-- UPDATE public.perfiles_usuario
-- SET rol = 'Administrador de Capacitación'
-- WHERE email = 'registrodeparticipantes@appdesignsoftware.com';
--
-- Ejemplo 3: Asignar rol de Instructor a un usuario:
-- UPDATE public.perfiles_usuario
-- SET rol = 'Instructor / Capacitador'
-- WHERE email = 'instructor@empresa.com';
--
-- Ejemplo 4: Asignar rol de Recursos Humanos (RH):
-- UPDATE public.perfiles_usuario
-- SET rol = 'Recursos Humanos (RH)'
-- WHERE email = 'rh@empresa.com';
--
-- Ejemplo 5: Consultar lista completa de usuarios y sus roles asignados:
-- SELECT email, nombre, puesto, departamento, rol, updated_at
-- FROM public.perfiles_usuario
-- ORDER BY created_at DESC;
