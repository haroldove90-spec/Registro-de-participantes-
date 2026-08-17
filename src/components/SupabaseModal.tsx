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
} from 'lucide-react';
import {
  SUPABASE_PROJECT_CONFIG,
  testSupabaseConnection,
} from '../lib/supabase';
import { initializeSupabaseSync } from '../utils/storage';
import { EventoData, UserProfile } from '../types';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataSynced?: (eventos: EventoData[], profile: UserProfile) => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onDataSynced,
}) => {
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success?: boolean;
    tablesReady?: boolean;
    message?: string;
  }>({ tested: false });

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
    '${SUPABASE_PROJECT_CONFIG.projectName}',
    'Coordinadora de Desarrollo Organizacional & Capacitación',
    'Recursos Humanos y Formación Continua',
    'MEGA890412HR4',
    '+52 (55) 8492-3021',
    'Administrador de Capacitación',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    true,
    false
)
ON CONFLICT (id) DO NOTHING;`;

    setSqlContent(rawSql);
  }, []);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
        <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-950 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-inner">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wide">
                  Cloud Backend
                </span>
                <span className="text-xs text-slate-300">ID: {SUPABASE_PROJECT_CONFIG.projectId}</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Configuración y SQL de Supabase
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

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Project Credentials Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-600" /> Parámetros del Proyecto Configurado
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 font-semibold block text-[10px]">PROYECTO:</span>
                <span className="font-bold text-slate-800 break-all">{SUPABASE_PROJECT_CONFIG.projectName}</span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 font-semibold block text-[10px]">ID DEL PROYECTO:</span>
                <span className="font-mono font-bold text-slate-800">{SUPABASE_PROJECT_CONFIG.projectId}</span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 sm:col-span-2">
                <span className="text-slate-400 font-semibold block text-[10px]">URL ENDPOINT (REST API):</span>
                <span className="font-mono text-emerald-700 font-medium break-all">{SUPABASE_PROJECT_CONFIG.url}</span>
              </div>
            </div>

            {/* Test Connection & Actions */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
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

              <a
                href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_CONFIG.projectId}/sql`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 ml-auto"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" /> Abrir Supabase SQL Editor
              </a>
            </div>

            {/* Status Alert */}
            {connectionStatus.tested && (
              <div
                className={`p-3.5 rounded-xl text-xs font-medium flex items-start gap-2.5 border animate-fade-in ${
                  connectionStatus.success && connectionStatus.tablesReady
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : connectionStatus.success && !connectionStatus.tablesReady
                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                    : 'bg-rose-50 text-rose-900 border-rose-200'
                }`}
              >
                {connectionStatus.success && connectionStatus.tablesReady ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{connectionStatus.message}</p>
                  {!connectionStatus.tablesReady && (
                    <p className="text-[11px] mt-1 text-slate-600">
                      Copia el script SQL de abajo, ve a la sección <strong>SQL Editor</strong> en Supabase, pégalo y haz clic en <strong>RUN</strong>.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Step by Step Guide */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-blue-600" /> Pasos Rápidos para Ejecutar el SQL en Supabase:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-blue-50/60 border border-blue-200/80 p-3 rounded-xl">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold inline-flex items-center justify-center text-[10px] mr-1.5">1</span>
                <strong>Copiar SQL:</strong> Haz clic en el botón <em>"Copiar Script SQL"</em> abajo.
              </div>
              <div className="bg-blue-50/60 border border-blue-200/80 p-3 rounded-xl">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold inline-flex items-center justify-center text-[10px] mr-1.5">2</span>
                <strong>Abrir SQL Editor:</strong> Entra a tu proyecto en el panel de Supabase.
              </div>
              <div className="bg-blue-50/60 border border-blue-200/80 p-3 rounded-xl">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold inline-flex items-center justify-center text-[10px] mr-1.5">3</span>
                <strong>Ejecutar (Run):</strong> Pega el código y presiona <em>Run</em> para crear las tablas y RLS.
              </div>
            </div>
          </div>

          {/* SQL Code Block with Copy Button */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-600" /> Código SQL Completo para Supabase (PostgreSQL)
              </span>
              <button
                onClick={handleCopySql}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? '¡Copiado al Portapapeles!' : 'Copiar Script SQL'}
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
              <pre className="p-4 text-[11px] font-mono text-emerald-400 max-h-72 overflow-y-auto leading-relaxed scrollbar-thin">
                {sqlContent}
              </pre>
            </div>
          </div>
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
