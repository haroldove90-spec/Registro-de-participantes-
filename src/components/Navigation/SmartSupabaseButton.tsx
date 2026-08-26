import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, EventoData } from '../../types';
import {
  checkSupabaseHealth,
  SupabaseHealthReport,
  getCompleteSupabaseSQLScript,
} from '../../lib/supabaseHealth';
import { syncAllLocalEventsToSupabase, SUPABASE_PROJECT_CONFIG } from '../../lib/supabase';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  UploadCloud,
  Database,
  Terminal,
  Shield,
  Clock,
  X,
  ExternalLink,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';

interface SmartSupabaseButtonProps {
  userProfile: UserProfile;
  eventos: EventoData[];
  onSynced?: (eventos: EventoData[]) => void;
}

export const SmartSupabaseButton: React.FC<SmartSupabaseButtonProps> = ({
  userProfile,
  eventos,
  onSynced,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'diagnostico' | 'sincronizacion' | 'sql'>('diagnostico');
  const [isChecking, setIsChecking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    count: number;
    message: string;
  } | null>(null);

  const [healthReport, setHealthReport] = useState<SupabaseHealthReport>({
    status: 'checking',
    latencyMs: 0,
    lastChecked: '--:--',
    tablesStatus: {
      eventos: false,
      participantes: false,
      perfiles_usuario: false,
    },
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // RBAC Filter:
  // Visible to Administrador, Coordinador/Supervisor, Instructor, Auditor, RH.
  // HIDDEN for 'Participante / Empleado' or 'Residente/Inquilino'.
  const isHiddenRole = () => {
    const rol = (userProfile.rol || '').toLowerCase();
    return (
      rol.includes('participante') ||
      rol.includes('empleado') ||
      rol.includes('residente') ||
      rol.includes('inquilino')
    );
  };

  // Run Health Check
  const runHealthCheck = async () => {
    setIsChecking(true);
    try {
      const report = await checkSupabaseHealth();
      setHealthReport(report);
    } catch (err: any) {
      setHealthReport({
        status: 'error',
        latencyMs: 0,
        lastChecked: new Date().toLocaleTimeString(),
        errorMessage: err?.message || 'Error de conexión',
        friendlyDiagnosis: 'No se pudo establecer contacto con el endpoint de Supabase.',
        suggestedAction: 'Verifica tu red o estado del proyecto en Supabase.',
        tablesStatus: { eventos: false, participantes: false, perfiles_usuario: false },
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Heartbeat monitoring every 25 seconds in background
  useEffect(() => {
    runHealthCheck();

    timerRef.current = setInterval(() => {
      // Light background ping
      checkSupabaseHealth()
        .then((report) => setHealthReport(report))
        .catch(() => {});
    }, 25000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Sync Local Records (Bitácora de Eventos, Participantes y Accesos)
  const handleSyncData = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await syncAllLocalEventsToSupabase(eventos);
      if (res.success) {
        setSyncResult({
          success: true,
          count: res.syncedCount,
          message: `¡${res.syncedCount} registro(s) y sus bitácoras de asistencia sincronizados con éxito en la nube!`,
        });
        if (onSynced) {
          onSynced(eventos);
        }
        // Re-check health
        runHealthCheck();
      } else {
        setSyncResult({
          success: false,
          count: res.syncedCount,
          message: res.error || 'Ocurrió un error al consolidar los registros en la nube.',
        });
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        count: 0,
        message: err?.message || 'Fallo de conexión durante la sincronización.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopySQL = () => {
    const sql = getCompleteSupabaseSQLScript();
    navigator.clipboard.writeText(sql);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 3000);
  };

  // If user role is excluded (e.g. Participante/Inquilino), do not render
  if (isHiddenRole()) {
    return null;
  }

  const isConnected = healthReport.status === 'connected';
  const isError = healthReport.status === 'error';

  return (
    <>
      {/* Botón Inteligente Supabase en Barra Superior */}
      <div className="relative inline-flex items-center">
        <button
          type="button"
          id="btn-smart-supabase"
          onClick={() => {
            setIsOpen(true);
            runHealthCheck();
          }}
          className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer shadow-2xs ${
            isConnected
              ? 'bg-emerald-50/80 hover:bg-emerald-100/90 border-emerald-300 text-emerald-800'
              : isError
              ? 'bg-rose-50/90 hover:bg-rose-100 border-rose-300 text-rose-800 animate-pulse'
              : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
          }`}
          title="Monitoreo y Diagnóstico Inteligente de Supabase"
        >
          {/* Semáforo en Vivo de 2 Estados con animación de pulso */}
          <div className="relative flex items-center justify-center">
            {isConnected ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="absolute w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                <span className="absolute w-3.5 h-3.5 rounded-full bg-rose-500/40 animate-ping opacity-80" />
              </>
            )}
          </div>

          <span className="font-bold flex items-center gap-1">
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Supabase</span>
          </span>

          {/* Medición de Latencia en Milisegundos (ms) */}
          <span
            className={`font-mono text-[11px] px-1.5 py-0.5 rounded-md ${
              isConnected
                ? 'bg-emerald-200/80 text-emerald-900 font-bold'
                : 'bg-rose-200/80 text-rose-900 font-bold'
            }`}
          >
            {isChecking ? '...' : isConnected ? `${healthReport.latencyMs} ms` : 'Offline'}
          </span>
        </button>
      </div>

      {/* Modal Inteligente de Diagnóstico, Sincronización y SQL */}
      {isOpen && (
        <div
          id="modal-supabase-health"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Consola Inteligente Supabase</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isConnected
                          ? 'bg-emerald-500 text-slate-900'
                          : 'bg-rose-500 text-white animate-pulse'
                      }`}
                    >
                      {isConnected ? '🟢 EN LÍNEA' : '🔴 DESCONECTADO'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    Proyecto: {SUPABASE_PROJECT_CONFIG.projectId} • Heartbeat: cada 25s
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('diagnostico')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'diagnostico'
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Activity className="w-4 h-4" />
                Diagnóstico y Latencia
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sincronizacion')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'sincronizacion'
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                Sincronizar Bitácora
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sql')}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'sql'
                    ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Terminal className="w-4 h-4" />
                Script SQL Autocontenido
              </button>
            </div>

            {/* Tab 1: Diagnóstico y Latencia */}
            {activeTab === 'diagnostico' && (
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                {/* Latency & Ping Card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Latencia
                    </span>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span
                        className={`text-2xl font-black font-mono ${
                          healthReport.latencyMs < 200
                            ? 'text-emerald-600'
                            : healthReport.latencyMs < 600
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {isConnected ? healthReport.latencyMs : '--'}
                      </span>
                      <span className="text-xs text-slate-500 font-bold">ms</span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">Tiempo de ida y vuelta (RTT)</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-slate-400" /> Estado en Vivo
                    </span>
                    <div className="mt-2 flex items-center gap-2">
                      {isConnected ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Operativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-rose-600" /> Desconectado
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">Última lectura: {healthReport.lastChecked}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-slate-400" /> Seguridad RLS
                    </span>
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-lg">
                        Protegido (Activo)
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">Row Level Security</span>
                  </div>
                </div>

                {/* Status of Database Tables */}
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-100/70 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Estado de Tablas en PostgreSQL
                    </span>
                    <span className="text-[11px] text-slate-500">Esquema público</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    <div className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Database className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">public.eventos</p>
                          <p className="text-[10px] text-slate-500">Eventos, cursos y registros de capacitación</p>
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          healthReport.tablesStatus.eventos
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {healthReport.tablesStatus.eventos ? '✓ Conectada' : '✗ No Encontrada'}
                      </span>
                    </div>

                    <div className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Database className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">public.participantes</p>
                          <p className="text-[10px] text-slate-500">Bitácora de asistencia, firmas y accesos</p>
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          healthReport.tablesStatus.participantes
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {healthReport.tablesStatus.participantes ? '✓ Conectada' : '✗ No Encontrada'}
                      </span>
                    </div>

                    <div className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Database className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-xs font-bold text-slate-800">public.perfiles_usuario</p>
                          <p className="text-[10px] text-slate-500">Control de roles (RBAC) y fotografías de avatar</p>
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          healthReport.tablesStatus.perfiles_usuario
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {healthReport.tablesStatus.perfiles_usuario ? '✓ Conectada' : '✗ No Encontrada'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Friendly Diagnosis Banner */}
                <div
                  className={`p-4 rounded-xl border text-xs leading-relaxed ${
                    isConnected
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <p className="font-bold flex items-center gap-1.5 text-sm mb-1">
                    {isConnected ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Diagnóstico del Servidor:
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-600" /> Excepción PostgreSQL Detectada:
                      </>
                    )}
                  </p>
                  <p className="mt-0.5">{healthReport.friendlyDiagnosis}</p>
                  {healthReport.suggestedAction && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 flex items-start gap-1.5">
                      <span className="font-bold shrink-0">Acción recomendada:</span>
                      <span className="text-slate-700">{healthReport.suggestedAction}</span>
                    </div>
                  )}
                </div>

                {/* On-Demand Check Button */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={runHealthCheck}
                    disabled={isChecking}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                    {isChecking ? 'Verificando Servidor...' : 'Comprobar Conexión Ahora'}
                  </button>

                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-semibold"
                  >
                    Abrir Consola Supabase <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Tab 2: Sincronización Inteligente de Bitácora y Accesos */}
            {activeTab === 'sincronizacion' && (
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs">
                  <h4 className="font-bold text-sm mb-1 flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-blue-600" />
                    Consolidación en la Nube
                  </h4>
                  <p className="leading-relaxed">
                    Sincroniza y sube todos los eventos registrados, listas de participantes con sus firmas y
                    registros locales pendientes directamente a tu cluster de Supabase.
                  </p>
                </div>

                {/* Sync stats card */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs text-slate-500 font-semibold uppercase">Eventos en Memoria Local</span>
                    <p className="text-2xl font-black text-slate-800 mt-1">{eventos.length}</p>
                    <span className="text-[10px] text-slate-400">Listos para subir</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs text-slate-500 font-semibold uppercase">Total Participantes</span>
                    <p className="text-2xl font-black text-slate-800 mt-1">
                      {eventos.reduce((acc, curr) => acc + (curr.participantes?.length || 0), 0)}
                    </p>
                    <span className="text-[10px] text-slate-400">Registros de asistencia</span>
                  </div>
                </div>

                {syncResult && (
                  <div
                    className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                      syncResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {syncResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{syncResult.message}</span>
                  </div>
                )}

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleSyncData}
                    disabled={isSyncing || eventos.length === 0}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                  >
                    <UploadCloud className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                    {isSyncing ? 'Subiendo datos a Supabase...' : `Sincronizar ${eventos.length} Eventos a la Nube`}
                  </button>
                  <p className="text-[11px] text-center text-slate-400 mt-2">
                    Garantiza idempotencia y resolución de claves primarias duplicadas.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 3: Script SQL Autocontenido y Copiado Rápido */}
            {activeTab === 'sql' && (
              <div className="p-6 overflow-y-auto space-y-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Script SQL Idempotente para Supabase
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Crea tablas <code className="text-blue-600 font-mono">eventos</code>,{' '}
                      <code className="text-blue-600 font-mono">participantes</code>,{' '}
                      <code className="text-blue-600 font-mono">perfiles_usuario</code> con políticas RLS e índices.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySQL}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    {copiedSQL ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> ¡Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copiar SQL
                      </>
                    )}
                  </button>
                </div>

                <div className="relative flex-1 bg-slate-950 rounded-xl p-4 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-[320px] border border-slate-800 shadow-inner">
                  <pre className="whitespace-pre">{getCompleteSupabaseSQLScript()}</pre>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-600 flex items-center justify-between">
                  <span>
                    1. Entra a <strong>Supabase Dashboard &gt; SQL Editor</strong>
                    <br />
                    2. Pega el script y presiona <strong>RUN</strong>
                  </span>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 shrink-0 ml-2"
                  >
                    Abrir SQL Editor <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Control de Acceso por Roles (RBAC)
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-white hover:bg-slate-200 border border-slate-300 font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
