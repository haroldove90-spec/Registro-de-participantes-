import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  X,
  ExternalLink,
  Terminal,
  Shield,
  Layers,
  Users,
  ShieldAlert,
  Code2,
  Sparkles,
  Key,
} from 'lucide-react';
import {
  SUPABASE_PROJECT_CONFIG,
  testSupabaseConnection,
  updateUserRoleInSupabase,
  fetchAllUsersFromSupabase,
} from '../lib/supabase';
import { initializeSupabaseSync } from '../utils/storage';
import { EventoData, UserProfile, UserRole } from '../types';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataSynced?: (eventos: EventoData[], profile: UserProfile) => void;
}

const ROLES_LIST: UserRole[] = [
  'Administrador de Capacitación',
  'Coordinador de Capacitación',
  'Instructor / Capacitador',
  'Recursos Humanos (RH)',
  'Participante / Empleado',
  'Auditor / Consulta',
];

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onDataSynced,
}) => {
  const [activeTab, setActiveTab] = useState<'schema' | 'roles'>('roles');
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [copiedRoleSql, setCopiedRoleSql] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success?: boolean;
    tablesReady?: boolean;
    message?: string;
  }>({ tested: false });

  // Role Generator State
  const [targetEmail, setTargetEmail] = useState(
    'registrodeparticipantes@appdesignsoftware.com'
  );
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    'Administrador de Capacitación'
  );
  const [roleUpdateMsg, setRoleUpdateMsg] = useState<{
    success?: boolean;
    text?: string;
  } | null>(null);
  const [updatingRole, setUpdatingRole] = useState(false);

  // Full SQL script state
  const [sqlContent, setSqlContent] = useState<string>('');

  useEffect(() => {
    const rawSql = `-- ==============================================================================
-- SISTEMA DE CONTROL DE CAPACITACIÓN Y REGISTRO DE PARTICIPANTES
-- SUPABASE POSTGRESQL SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- Project: ${SUPABASE_PROJECT_CONFIG.projectName}
-- Project ID: ${SUPABASE_PROJECT_CONFIG.projectId}
-- URL: ${SUPABASE_PROJECT_CONFIG.url}
-- ==============================================================================

-- 1. HABILITAR EXTENSIONES NECESARIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. LIMPIEZA PREVIA SEGURA (PARA EMPEZAR 100% LIMPIO)
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

-- 3. TABLA DE PARTICIPANTES (LISTA DE ASISTENCIA Y ASIGNACIÓN)
CREATE TABLE IF NOT EXISTS public.participantes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    evento_id TEXT NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
    pos INTEGER NOT NULL,
    no_emp TEXT DEFAULT '',
    nombre TEXT NOT NULL,
    email TEXT,
    genero TEXT NOT NULL CHECK (genero IN ('H', 'M')),
    puesto TEXT DEFAULT '',
    depto TEXT DEFAULT '',
    firma TEXT DEFAULT '',
    confirmado BOOLEAN DEFAULT true,
    fecha_confirmacion TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. TABLA DE PERFILES DE USUARIO, FOTOGRAFÍA Y ROLES
CREATE TABLE IF NOT EXISTS public.perfiles_usuario (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    puesto TEXT DEFAULT '',
    departamento TEXT DEFAULT '',
    rfc TEXT DEFAULT '',
    telefono TEXT DEFAULT '',
    rol TEXT NOT NULL DEFAULT 'Participante / Empleado' CHECK (
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

-- 5. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_participantes_evento_id ON public.participantes(evento_id);
CREATE INDEX IF NOT EXISTS idx_participantes_pos ON public.participantes(evento_id, pos);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha_inicio ON public.eventos(fecha_inicio DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_tipo_evento ON public.eventos(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_perfiles_email ON public.perfiles_usuario(email);

-- 6. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles_usuario ENABLE ROW LEVEL SECURITY;

-- 7. POLÍTICAS DE ACCESO COMPLETO (ANON KEY / PUBLIC ACCESS)
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
CREATE TRIGGER tr_eventos_updated_at BEFORE UPDATE ON public.eventos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_perfiles_updated_at ON public.perfiles_usuario;
CREATE TRIGGER tr_perfiles_updated_at BEFORE UPDATE ON public.perfiles_usuario FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 9. TRIGGER PARA REGISTRO AUTOMÁTICO EN PERFILES AL CREAR USUARIO EN AUTH
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfiles_usuario (id, user_id, nombre, email, puesto, departamento, rfc, telefono, rol, avatar_url, fecha_ingreso)
    VALUES (
        NEW.id::text,
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'puesto', 'Colaborador'),
        COALESCE(NEW.raw_user_meta_data->>'departamento', 'General'),
        COALESCE(NEW.raw_user_meta_data->>'rfc', 'XAXX010101000'),
        COALESCE(NEW.raw_user_meta_data->>'telefono', ''),
        COALESCE(NEW.raw_user_meta_data->>'rol', 'Coordinador de Capacitación'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80'),
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
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. FUNCIÓN PARA CAMBIAR ROLES DE USUARIOS FÁCILMENTE
CREATE OR REPLACE FUNCTION public.cambiar_rol_usuario(target_email TEXT, nuevo_rol TEXT)
RETURNS JSON AS $$
DECLARE
    result_user public.perfiles_usuario%ROWTYPE;
BEGIN
    UPDATE public.perfiles_usuario
    SET rol = nuevo_rol, updated_at = timezone('utc'::text, now())
    WHERE LOWER(email) = LOWER(target_email)
    RETURNING * INTO result_user;

    IF NOT FOUND THEN
        INSERT INTO public.perfiles_usuario (id, nombre, email, rol)
        VALUES (gen_random_uuid()::text, split_part(target_email, '@', 1), target_email, nuevo_rol)
        RETURNING * INTO result_user;
    END IF;

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

-- 11. PERFIL INICIAL DE ADMINISTRADOR
INSERT INTO public.perfiles_usuario (id, nombre, email, puesto, departamento, rfc, telefono, rol, avatar_url)
VALUES (
    'admin_default',
    'Harold Ove',
    'haroldove90@gmail.com',
    'Administrador de Capacitación y Desarrollo',
    'Recursos Humanos / Formación',
    'XAXX010101000',
    '+52 (55) 1234-5678',
    'Administrador de Capacitación',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
)
ON CONFLICT (email) DO UPDATE SET
    rol = EXCLUDED.rol,
    updated_at = timezone('utc'::text, now());`;

    setSqlContent(rawSql);
  }, []);

  if (!isOpen) return null;

  const handleCopySchema = () => {
    navigator.clipboard.writeText(sqlContent);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  const dynamicRoleSql = `-- ==============================================================================
-- SQL PARA CAMBIAR EL ROL DE UN USUARIO EN SUPABASE
-- ==============================================================================

-- Opción 1: Ejecutar la función almacenada (Recomendado):
SELECT public.cambiar_rol_usuario('${targetEmail.trim()}', '${selectedRole}');

-- Opción 2: Actualización directa por UPDATE:
UPDATE public.perfiles_usuario
SET rol = '${selectedRole}',
    updated_at = timezone('utc'::text, now())
WHERE LOWER(email) = LOWER('${targetEmail.trim()}');

-- Opción 3: Actualizar también los metadatos de Auth (Opcional):
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"rol": "${selectedRole}"}'::jsonb
WHERE LOWER(email) = LOWER('${targetEmail.trim()}');

-- Verificar el cambio de rol:
SELECT email, nombre, puesto, rol, updated_at
FROM public.perfiles_usuario
WHERE LOWER(email) = LOWER('${targetEmail.trim()}');`;

  const handleCopyRoleSql = () => {
    navigator.clipboard.writeText(dynamicRoleSql);
    setCopiedRoleSql(true);
    setTimeout(() => setCopiedRoleSql(false), 2500);
  };

  const handleExecuteRoleChange = async () => {
    if (!targetEmail) return;
    setUpdatingRole(true);
    setRoleUpdateMsg(null);

    const res = await updateUserRoleInSupabase(targetEmail.trim(), selectedRole);
    setRoleUpdateMsg({
      success: res.success,
      text: res.message,
    });
    setUpdatingRole(false);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    const res = await testSupabaseConnection();
    setConnectionStatus({
      tested: true,
      success: res.success,
      tablesReady: res.tablesReady,
      message: res.message,
    });
    setTesting(false);
  };

  const handleManualSync = async () => {
    setSyncing(true);
    const result = await initializeSupabaseSync();
    if (onDataSynced) {
      onDataSynced(result.eventos, result.profile);
    }
    setSyncing(false);
    handleTestConnection();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-950 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-inner">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wide">
                  Supabase Cloud
                </span>
                <span className="text-xs text-slate-300">ID: {SUPABASE_PROJECT_CONFIG.projectId}</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Consola Supabase: Esquema SQL y Gestión de Roles
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'roles'
                ? 'bg-white text-blue-700 border-blue-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>SQL para Cambiar Roles</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'schema'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <Code2 className="w-4 h-4 text-emerald-600" />
            <span>Esquema Completo de Tablas</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">
          {/* ================= TAB 1: ROLES & SQL GENERATOR ================= */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              {/* Role Generator Card */}
              <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border border-blue-200/90 rounded-2xl p-5 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                  <ShieldAlert className="w-5 h-5 text-blue-600" />
                  <span>Generador de Consultas SQL para Asignación de Roles</span>
                </div>
                <p className="text-xs text-slate-600">
                  Selecciona el correo del usuario y el rol deseado para generar la sentencia SQL exacta que puedes ejecutar en el SQL Editor de Supabase o aplicar directamente.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Correo Electrónico del Usuario:
                    </label>
                    <input
                      type="email"
                      value={targetEmail}
                      onChange={(e) => setTargetEmail(e.target.value)}
                      placeholder="usuario@empresa.com"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Nuevo Rol a Asignar:
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-blue-900 focus:ring-2 focus:ring-blue-500/20"
                    >
                      {ROLES_LIST.map((r, idx) => (
                        <option key={idx} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    onClick={handleCopyRoleSql}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                      copiedRoleSql
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {copiedRoleSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedRoleSql ? '¡SQL Copiado!' : 'Copiar SQL de Cambio de Rol'}
                  </button>

                  <button
                    onClick={handleExecuteRoleChange}
                    disabled={updatingRole || !targetEmail}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${updatingRole ? 'animate-spin' : ''}`} />
                    {updatingRole ? 'Aplicando...' : 'Aplicar Rol en Supabase Ahora'}
                  </button>

                  <a
                    href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_CONFIG.projectId}/sql`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 ml-auto"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600" /> Abrir Supabase SQL
                  </a>
                </div>

                {/* Role Feedback Message */}
                {roleUpdateMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 border animate-fade-in ${
                      roleUpdateMsg.success
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        : 'bg-rose-50 text-rose-900 border-rose-200'
                    }`}
                  >
                    {roleUpdateMsg.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{roleUpdateMsg.text}</span>
                  </div>
                )}
              </div>

              {/* Dynamic SQL Code Window */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-blue-600" /> Código SQL para Ejecutar en Supabase:
                </span>
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                  <pre className="p-4 text-[11px] font-mono text-emerald-400 max-h-56 overflow-y-auto leading-relaxed scrollbar-thin">
                    {dynamicRoleSql}
                  </pre>
                </div>
              </div>

              {/* Roles Reference Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-600" /> Roles y Permisos Disponibles en el Sistema:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                    <p className="font-bold text-purple-700">Administrador de Capacitación</p>
                    <p className="text-[11px] text-slate-500">Acceso total, configuración, gestión de roles y auditoría.</p>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                    <p className="font-bold text-blue-700">Coordinador de Capacitación</p>
                    <p className="text-[11px] text-slate-500">Creación de eventos, presupuestos y control de participantes.</p>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                    <p className="font-bold text-emerald-700">Instructor / Capacitador</p>
                    <p className="text-[11px] text-slate-500">Control de asistencia de sus cursos y firma digital.</p>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                    <p className="font-bold text-amber-700">Recursos Humanos (RH)</p>
                    <p className="text-[11px] text-slate-500">Aprobación de constancias y validación de horas-hombre.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: FULL SCHEMA SQL ================= */}
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-600" /> Código SQL Completo de Tablas y Triggers
                </span>
                <button
                  onClick={handleCopySchema}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                    copiedSchema
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {copiedSchema ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSchema ? '¡Copiado!' : 'Copiar Script SQL'}
                </button>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                <pre className="p-4 text-[11px] font-mono text-emerald-400 max-h-72 overflow-y-auto leading-relaxed scrollbar-thin">
                  {sqlContent}
                </pre>
              </div>

              {/* Status & Sync buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                  {testing ? 'Comprobando...' : 'Probar Conexión Supabase'}
                </button>

                <button
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Layers className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Sincronizando...' : 'Sincronizar Base de Datos'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Archivo local disponible en: <code className="font-mono font-bold text-slate-700">/supabase-schema.sql</code>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
