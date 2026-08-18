-- ==============================================================================
-- SISTEMA DE CONTROL DE CAPACITACIÓN Y REGISTRO DE PARTICIPANTES
-- SCRIPT SQL DEFINITIVO Y A PRUEBA DE ERRORES PARA SUPABASE (POSTGRESQL)
-- ==============================================================================

-- 1. HABILITAR EXTENSIÓN PARA GENERACIÓN DE UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ELIMINAR TABLAS PREVIAS SI EXISTEN (PARA EMPEZAR 100% LIMPIO Y SIN ERRORES)
DROP TABLE IF EXISTS public.participantes CASCADE;
DROP TABLE IF EXISTS public.eventos CASCADE;
DROP TABLE IF EXISTS public.perfiles_usuario CASCADE;

-- 3. TABLA PRINCIPAL DE EVENTOS DE CAPACITACIÓN Y REUNIONES
CREATE TABLE public.eventos (
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
    hombres_count INTEGER NOT NULL DEFAULT 0,
    mujeres_count INTEGER NOT NULL DEFAULT 0,
    total_participantes INTEGER NOT NULL DEFAULT 0,
    instructor_tipo TEXT NOT NULL DEFAULT 'Interno' CHECK (instructor_tipo IN ('Interno', 'Externo')),
    instructor_nombre TEXT NOT NULL DEFAULT '',
    instructor_puesto TEXT DEFAULT '',
    instructor_empresa TEXT DEFAULT '',
    instructor_rfc TEXT DEFAULT '',
    instructor_firma TEXT DEFAULT '',
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
    estado TEXT NOT NULL DEFAULT 'Registrado' CHECK (estado IN ('Registrado', 'En Proceso', 'Completado')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. TABLA DE PARTICIPANTES (LISTA DE ASISTENCIA Y FIRMAS)
CREATE TABLE public.participantes (
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

-- 5. TABLA DE PERFILES DE USUARIO Y ASIGNACIÓN DE ROLES
CREATE TABLE public.perfiles_usuario (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    puesto TEXT DEFAULT '',
    departamento TEXT DEFAULT '',
    rfc TEXT DEFAULT '',
    telefono TEXT DEFAULT '',
    rol TEXT NOT NULL DEFAULT 'Administrador de Capacitación' CHECK (
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

-- 6. ÍNDICES DE BÚSQUEDA Y RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_participantes_evento_id ON public.participantes(evento_id);
CREATE INDEX IF NOT EXISTS idx_participantes_pos ON public.participantes(evento_id, pos);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha_inicio ON public.eventos(fecha_inicio DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_tipo_evento ON public.eventos(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_perfiles_email ON public.perfiles_usuario(email);

-- 7. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles_usuario ENABLE ROW LEVEL SECURITY;

-- 8. POLÍTICAS DE ACCESO COMPLETO (ANON / AUTHENTICATED)
DROP POLICY IF EXISTS "Permitir lectura publica de eventos" ON public.eventos;
CREATE POLICY "Permitir lectura publica de eventos" ON public.eventos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercion publica de eventos" ON public.eventos;
CREATE POLICY "Permitir insercion publica de eventos" ON public.eventos FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir actualizacion publica de eventos" ON public.eventos;
CREATE POLICY "Permitir actualizacion publica de eventos" ON public.eventos FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir eliminacion publica de eventos" ON public.eventos;
CREATE POLICY "Permitir eliminacion publica de eventos" ON public.eventos FOR DELETE USING (true);

DROP POLICY IF EXISTS "Permitir lectura publica de participantes" ON public.participantes;
CREATE POLICY "Permitir lectura publica de participantes" ON public.participantes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir insercion publica de participantes" ON public.participantes;
CREATE POLICY "Permitir insercion publica de participantes" ON public.participantes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir actualizacion publica de participantes" ON public.participantes;
CREATE POLICY "Permitir actualizacion publica de participantes" ON public.participantes FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permitir eliminacion publica de participantes" ON public.participantes;
CREATE POLICY "Permitir eliminacion publica de participantes" ON public.participantes FOR DELETE USING (true);

DROP POLICY IF EXISTS "Permitir acceso a perfiles" ON public.perfiles_usuario;
CREATE POLICY "Permitir acceso a perfiles" ON public.perfiles_usuario FOR ALL USING (true);

-- 9. TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA DE updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_eventos_updated_at ON public.eventos;
CREATE TRIGGER tr_eventos_updated_at BEFORE UPDATE ON public.eventos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_perfiles_updated_at ON public.perfiles_usuario;
CREATE TRIGGER tr_perfiles_updated_at BEFORE UPDATE ON public.perfiles_usuario FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 10. TRIGGER PARA CREACIÓN AUTOMÁTICA DE PERFIL AL REGISTRARSE EN SUPABASE AUTH
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
        fecha_ingreso
    )
    VALUES (
        NEW.id::text,
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
        LOWER(NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'puesto', 'Colaborador'),
        COALESCE(NEW.raw_user_meta_data->>'departamento', 'General'),
        COALESCE(NEW.raw_user_meta_data->>'rfc', 'XAXX010101000'),
        COALESCE(NEW.raw_user_meta_data->>'telefono', ''),
        COALESCE(NEW.raw_user_meta_data->>'rol', 'Administrador de Capacitación'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'),
        CURRENT_DATE
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
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. FUNCIÓN PARA ASIGNAR O CAMBIAR ROLES DE USUARIO FÁCILMENTE
CREATE OR REPLACE FUNCTION public.cambiar_rol_usuario(
    target_email text,
    nuevo_rol text
)
RETURNS json AS $$
DECLARE
    result_user public.perfiles_usuario%ROWTYPE;
BEGIN
    -- Actualizar el rol en la tabla de perfiles
    UPDATE public.perfiles_usuario
    SET rol = nuevo_rol,
        updated_at = timezone('utc'::text, now())
    WHERE LOWER(email) = LOWER(target_email)
    RETURNING * INTO result_user;

    -- Si el perfil aún no existe, crearlo
    IF NOT FOUND THEN
        INSERT INTO public.perfiles_usuario (id, nombre, email, rol)
        VALUES (gen_random_uuid()::text, split_part(target_email, '@', 1), LOWER(target_email), nuevo_rol)
        RETURNING * INTO result_user;
    END IF;

    -- Sincronizar metadatos en auth.users si existe usuario registrado
    BEGIN
        UPDATE auth.users
        SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('rol', nuevo_rol)
        WHERE LOWER(email) = LOWER(target_email);
    EXCEPTION WHEN OTHERS THEN
        -- Ignorar si no hay permisos directos sobre auth.users
    END;

    RETURN json_build_object(
        'success', true,
        'email', result_user.email,
        'nombre', result_user.nombre,
        'nuevo_rol', result_user.rol,
        'mensaje', 'Rol actualizado con éxito a: ' || nuevo_rol
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. CREAR PERFILES ADMINISTRADORES INICIALES
INSERT INTO public.perfiles_usuario (id, nombre, email, puesto, departamento, rfc, telefono, rol, avatar_url)
VALUES 
(
    'admin_harold',
    'Harold Ove',
    'haroldove90@gmail.com',
    'Administrador de Capacitación y Desarrollo',
    'Recursos Humanos / Formación',
    'XAXX010101000',
    '+52 (55) 1234-5678',
    'Administrador de Capacitación',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
),
(
    'admin_corp',
    'Administrador del Sistema',
    'registrodeparticipantes@appdesignsoftware.com',
    'Administrador de Capacitación',
    'Recursos Humanos y Capacitación',
    'MEGA890412HR4',
    '+52 (55) 8492-3021',
    'Administrador de Capacitación',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80'
)
ON CONFLICT (email) DO UPDATE SET
    rol = EXCLUDED.rol,
    updated_at = timezone('utc'::text, now());
