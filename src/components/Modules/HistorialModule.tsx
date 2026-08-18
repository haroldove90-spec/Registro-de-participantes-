import React, { useState } from 'react';
import { EventoData, Participant, UserProfile } from '../../types';
import {
  exportEventoToExcel,
  exportAllEventosToExcel,
  exportEventoToPdf,
  exportAllEventosToPdf,
} from '../../utils/exporter';
import {
  Search,
  Filter,
  Users,
  Clock,
  DollarSign,
  Calendar,
  Eye,
  Trash2,
  Printer,
  Download,
  Building,
  UserCheck,
  FileSpreadsheet,
  FileText,
  X,
  Plus,
  Sparkles,
  CheckCircle2,
  Database,
  RefreshCw,
  AlertCircle,
  Check,
  UserPlus,
  BookmarkCheck,
  BookOpen,
  Award,
  PenTool,
} from 'lucide-react';
import { syncAllLocalEventsToSupabase, fetchEventosFromSupabase, upsertEventoToSupabase } from '../../lib/supabase';
import { SignatureCanvas } from '../SignatureCanvas';

interface HistorialModuleProps {
  eventos: EventoData[];
  userProfile?: UserProfile;
  onDeleteEvento: (id: string) => void;
  onUpdateEvento: (eventoActualizado: EventoData) => void;
  onSyncEventos?: (eventos: EventoData[]) => void;
}

export const HistorialModule: React.FC<HistorialModuleProps> = ({
  eventos,
  userProfile,
  onDeleteEvento,
  onUpdateEvento,
  onSyncEventos,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterModalidad, setFilterModalidad] = useState<string>('todos');
  const [activeTab, setActiveTab] = useState<'todos' | 'mis_inscripciones' | 'disponibles'>('todos');
  const [selectedEvento, setSelectedEvento] = useState<EventoData | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success?: boolean; text?: string } | null>(null);

  // Self-Enrollment Modal State
  const [enrollingEvento, setEnrollingEvento] = useState<EventoData | null>(null);
  const [enrollNoEmp, setEnrollNoEmp] = useState(userProfile?.rfc || 'EMP-');
  const [enrollGenero, setEnrollGenero] = useState<'H' | 'M'>('H');
  const [enrollPuesto, setEnrollPuesto] = useState(userProfile?.puesto || '');
  const [enrollDepto, setEnrollDepto] = useState(userProfile?.departamento || '');
  const [enrollFirma, setEnrollFirma] = useState<string>('');
  const [enrollSuccess, setEnrollSuccess] = useState<string | null>(null);

  // Manual Add Participant Modal inside Event Detail
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [newNoEmp, setNewNoEmp] = useState('');
  const [newNombre, setNewNombre] = useState('');
  const [newGenero, setNewGenero] = useState<'H' | 'M'>('H');
  const [newPuesto, setNewPuesto] = useState('');
  const [newDepto, setNewDepto] = useState('');

  // Signature Lightbox Preview Modal
  const [viewingSignature, setViewingSignature] = useState<{ title: string; signature: string } | null>(null);

  const handleSyncToSupabase = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    const res = await syncAllLocalEventsToSupabase(eventos);
    if (res.success) {
      setSyncStatus({
        success: true,
        text: `¡${res.syncedCount} evento(s) y sus participantes sincronizados con Supabase Cloud!`,
      });
      const remote = await fetchEventosFromSupabase();
      if (remote && onSyncEventos) {
        onSyncEventos(remote);
      }
    } else {
      setSyncStatus({
        success: false,
        text: `Error al guardar en Supabase: ${res.error || 'Verifica la conexión o el script SQL'}`,
      });
    }
    setIsSyncing(false);
  };

  // Check if current user is enrolled in an event
  const isUserEnrolled = (evt: EventoData): boolean => {
    if (!userProfile) return false;
    return evt.participantes?.some(
      (p) =>
        (p.email && p.email.toLowerCase() === userProfile.email.toLowerCase()) ||
        p.nombre.toLowerCase().trim() === userProfile.nombre.toLowerCase().trim()
    );
  };

  // Open enrollment modal
  const handleOpenEnrollModal = (evt: EventoData) => {
    setEnrollingEvento(evt);
    setEnrollNoEmp(userProfile?.rfc ? `EMP-${userProfile.rfc.slice(0, 4)}` : 'EMP-100');
    setEnrollPuesto(userProfile?.puesto || '');
    setEnrollDepto(userProfile?.departamento || '');
    setEnrollFirma('');
  };

  // Submit enrollment
  const handleConfirmEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollingEvento || !userProfile) return;

    // Check if already in
    if (isUserEnrolled(enrollingEvento)) {
      alert('Ya te encuentras registrado en este evento.');
      setEnrollingEvento(null);
      return;
    }

    const newParticipant: Participant = {
      id: `p_user_${Date.now()}`,
      pos: enrollingEvento.participantes.length + 1,
      noEmp: enrollNoEmp || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      nombre: userProfile.nombre,
      email: userProfile.email,
      genero: enrollGenero,
      puesto: enrollPuesto || userProfile.puesto || 'Colaborador',
      depto: enrollDepto || userProfile.departamento || 'General',
      firma: enrollFirma || `Firma_Digital_${userProfile.nombre.replace(/\s+/g, '_')}`,
      confirmado: true,
      fechaConfirmacion: new Date().toISOString(),
    };

    const updatedParticipantes = [...enrollingEvento.participantes, newParticipant];
    const hombresCount = updatedParticipantes.filter((p) => p.genero === 'H').length;
    const mujeresCount = updatedParticipantes.filter((p) => p.genero === 'M').length;
    const totalParticipantes = updatedParticipantes.length;
    const horasHombreCapacitacion = totalParticipantes * (Number(enrollingEvento.horasCapacitacion) || 0);

    const updatedEvento: EventoData = {
      ...enrollingEvento,
      participantes: updatedParticipantes,
      hombresCount,
      mujeresCount,
      totalParticipantes,
      horasHombreCapacitacion,
    };

    onUpdateEvento(updatedEvento);

    if (selectedEvento && selectedEvento.id === updatedEvento.id) {
      setSelectedEvento(updatedEvento);
    }

    setEnrollSuccess(`¡Te has inscrito exitosamente al evento "${enrollingEvento.nombreEvento}"!`);
    setEnrollingEvento(null);
    setTimeout(() => setEnrollSuccess(null), 5000);

    // Sync to cloud
    upsertEventoToSupabase(updatedEvento).catch(console.error);
  };

  // Filtering events
  const filteredEventos = eventos.filter((evt) => {
    const matchesSearch =
      evt.nombreEvento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.instructor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.objetivoEvento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.participantes.some(
        (p) =>
          p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.puesto.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.depto.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesTipo = filterTipo === 'todos' || evt.tipoEvento === filterTipo;
    const matchesModalidad =
      filterModalidad === 'todos' || evt.ubicacionModalidad === filterModalidad;

    const enrolled = isUserEnrolled(evt);
    const matchesTab =
      activeTab === 'todos' ||
      (activeTab === 'mis_inscripciones' && enrolled) ||
      (activeTab === 'disponibles' && !enrolled);

    return matchesSearch && matchesTipo && matchesModalidad && matchesTab;
  });

  const misInscripcionesCount = eventos.filter((evt) => isUserEnrolled(evt)).length;
  const disponiblesCount = eventos.length - misInscripcionesCount;

  // Handle Add Participant inside Modal
  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvento || !newNombre) return;

    const newParticipant: Participant = {
      id: `p_man_${Date.now()}`,
      pos: selectedEvento.participantes.length + 1,
      noEmp: newNoEmp || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      nombre: newNombre,
      genero: newGenero,
      puesto: newPuesto || 'Colaborador',
      depto: newDepto || 'General',
      firma: `firmado_${newNombre.replace(/\s+/g, '_')}`,
      confirmado: true,
    };

    const updatedParticipantes = [...selectedEvento.participantes, newParticipant];
    const hombresCount = updatedParticipantes.filter((p) => p.genero === 'H').length;
    const mujeresCount = updatedParticipantes.filter((p) => p.genero === 'M').length;
    const totalParticipantes = updatedParticipantes.length;
    const horasHombreCapacitacion = totalParticipantes * (Number(selectedEvento.horasCapacitacion) || 0);

    const updatedEvento: EventoData = {
      ...selectedEvento,
      participantes: updatedParticipantes,
      hombresCount,
      mujeresCount,
      totalParticipantes,
      horasHombreCapacitacion,
    };

    onUpdateEvento(updatedEvento);
    setSelectedEvento(updatedEvento);
    setShowAddParticipantModal(false);

    // Reset Form
    setNewNoEmp('');
    setNewNombre('');
    setNewPuesto('');
    setNewDepto('');

    upsertEventoToSupabase(updatedEvento).catch(console.error);
  };

  // Handle Delete Participant from selected event
  const handleDeleteParticipant = (participantId: string) => {
    if (!selectedEvento) return;

    const updatedParticipantes = selectedEvento.participantes
      .filter((p) => p.id !== participantId)
      .map((p, index) => ({ ...p, pos: index + 1 }));

    const hombresCount = updatedParticipantes.filter((p) => p.genero === 'H').length;
    const mujeresCount = updatedParticipantes.filter((p) => p.genero === 'M').length;
    const totalParticipantes = updatedParticipantes.length;
    const horasHombreCapacitacion = totalParticipantes * (Number(selectedEvento.horasCapacitacion) || 0);

    const updatedEvento: EventoData = {
      ...selectedEvento,
      participantes: updatedParticipantes,
      hombresCount,
      mujeresCount,
      totalParticipantes,
      horasHombreCapacitacion,
    };

    onUpdateEvento(updatedEvento);
    setSelectedEvento(updatedEvento);
    upsertEventoToSupabase(updatedEvento).catch(console.error);
  };

  const handlePrintEvent = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-blue-600" />
            <span>Historial y Convocatorias de Capacitación</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Consulta eventos registrados, inscríbete como participante o exporta reportes en Excel y PDF.
          </p>
        </div>

        {/* Global Summary Badge */}
        <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-sm text-xs font-semibold self-start sm:self-auto">
          <Award className="w-4 h-4 text-amber-400" />
          <span>{eventos.length} Eventos Publicados</span>
          <span className="text-slate-400">•</span>
          <span className="text-emerald-400">{misInscripcionesCount} Inscritos por ti</span>
        </div>
      </div>

      {/* Success Notification */}
      {enrollSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-3 shadow-md animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <span className="font-bold text-sm">{enrollSuccess}</span>
          </div>
          <button onClick={() => setEnrollSuccess(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TABS FOR FILTERING: ALL vs MY ENROLLMENTS vs AVAILABLE */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('todos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'todos'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Todos los Eventos ({eventos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('mis_inscripciones')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'mis_inscripciones'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <BookmarkCheck className="w-4 h-4" />
          <span>Mis Convocatorias Inscritas ({misInscripcionesCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('disponibles')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'disponibles'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Capacitaciones Disponibles para Unirse ({disponiblesCount})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por evento, instructor, participante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white font-medium cursor-pointer"
            >
              <option value="todos">Todos los Tipos</option>
              <option value="Capacitación">Solo Capacitaciones</option>
              <option value="Reunión de Trabajo">Solo Reuniones</option>
            </select>

            <select
              value={filterModalidad}
              onChange={(e) => setFilterModalidad(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white font-medium cursor-pointer"
            >
              <option value="todos">Todas las Modalidades</option>
              <option value="MM">Modalidad MM</option>
              <option value="OP">Modalidad OP</option>
              <option value="Campo">Modalidad Campo</option>
            </select>

            {/* Cloud Sync Button */}
            <button
              onClick={handleSyncToSupabase}
              disabled={isSyncing || eventos.length === 0}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
              title="Guardar y Sincronizar todos los eventos con Supabase"
            >
              <Database className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Guardar en Supabase'}</span>
            </button>

            {/* Global Export Buttons */}
            <button
              onClick={() => exportAllEventosToExcel(filteredEventos)}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Exportar todos los eventos a Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
            </button>

            <button
              onClick={() => exportAllEventosToPdf(filteredEventos)}
              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Exportar todos los eventos a PDF (.pdf)"
            >
              <FileText className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>

        {/* Sync Status Banner */}
        {syncStatus && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 border animate-fade-in ${
              syncStatus.success
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {syncStatus.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{syncStatus.text}</span>
            </div>
            <button
              onClick={() => setSyncStatus(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Events List / Cards */}
      <div className="space-y-4">
        {filteredEventos.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-base">No se encontraron eventos en esta vista</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Prueba cambiando la pestaña de filtro o buscando con otro término.
            </p>
          </div>
        ) : (
          filteredEventos.map((evt) => {
            const enrolled = isUserEnrolled(evt);

            return (
              <div
                key={evt.id}
                className={`bg-white rounded-2xl border shadow-2xs hover:shadow-md transition-all p-6 space-y-4 ${
                  enrolled ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200/90 hover:border-blue-300'
                }`}
              >
                {/* Event Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                        {evt.id}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {evt.tipoEvento}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                        Modalidad {evt.ubicacionModalidad}
                      </span>

                      {/* Enrolled Badge */}
                      {enrolled ? (
                        <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Inscrito / Asistencia Confirmada</span>
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          Convocatoria Abierta
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 leading-snug">
                      {evt.nombreEvento}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
                    {/* Enroll Action Button */}
                    {!enrolled ? (
                      <button
                        onClick={() => handleOpenEnrollModal(evt)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm animate-pulse cursor-pointer"
                        title="Inscribirme y aceptar participar en este evento de capacitación"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Aceptar Participar</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => exportEventoToPdf(evt)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Descargar Constancia / Lista de Participación"
                      >
                        <Award className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Mi Ficha</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedEvento(evt)}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Ver Detalle
                    </button>

                    <button
                      onClick={() => exportEventoToExcel(evt)}
                      title="Exportar este evento a Excel (.xlsx)"
                      className="px-2.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel
                    </button>

                    <button
                      onClick={() => exportEventoToPdf(evt)}
                      title="Exportar este evento a PDF (.pdf)"
                      className="px-2.5 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" /> PDF
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar de forma permanente el registro ${evt.id}?`)) {
                          onDeleteEvento(evt.id);
                        }
                      }}
                      title="Eliminar evento"
                      className="p-2 rounded-xl border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Event Body Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase">Instructor</p>
                    <p className="font-bold text-slate-800">{evt.instructor.nombre}</p>
                    <p className="text-slate-500">
                      {evt.instructor.tipo === 'Interno'
                        ? `Interno (${evt.instructor.puesto || 'General'})`
                        : `Externo (${evt.instructor.empresa || 'Proveedor'})`}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase">Fechas y Horas</p>
                    <p className="font-medium text-slate-800">
                      {evt.fechaInicio} al {evt.fechaTermino} ({evt.noDias} días)
                    </p>
                    <p className="text-slate-500">
                      {evt.horasCapacitacion} hrs totales • {evt.horasHombreCapacitacion} hrs-hombre
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase">Métricas Asistencia</p>
                    <p className="font-bold text-slate-900 text-sm">
                      {evt.totalParticipantes} Participantes Registrados
                    </p>
                    <p className="text-slate-500">
                      Hombres: <span className="text-blue-600 font-bold">{evt.hombresCount}</span> | Mujeres:{' '}
                      <span className="text-pink-600 font-bold">{evt.mujeresCount}</span>
                    </p>
                  </div>
                </div>

                {/* Participants Preview Pills */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
                    <span className="text-[11px] text-slate-400 shrink-0 font-medium">Asistentes:</span>
                    {evt.participantes.slice(0, 5).map((p) => (
                      <span
                        key={p.id}
                        className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 border ${
                          userProfile && (p.email === userProfile.email || p.nombre === userProfile.nombre)
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                            : 'bg-slate-100 text-slate-700 border-slate-200/80'
                        }`}
                      >
                        {p.nombre} {userProfile && p.email === userProfile.email ? '(Tú)' : ''}
                      </span>
                    ))}
                    {evt.participantes.length > 5 && (
                      <span className="text-[11px] font-semibold text-blue-600 shrink-0">
                        +{evt.participantes.length - 5} más
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-semibold text-slate-500 shrink-0 ml-2">
                    Costos: <strong className="text-emerald-700">${evt.costos.totalCostos.toLocaleString('es-MX')}</strong>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PARTICIPANT ENROLLMENT MODAL */}
      {enrollingEvento && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Inscripción y Aceptación de Participación</h3>
                  <p className="text-xs text-emerald-100">{enrollingEvento.nombreEvento}</p>
                </div>
              </div>
              <button
                onClick={() => setEnrollingEvento(null)}
                className="text-emerald-200 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmEnrollment} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
                <p className="font-bold">Datos del Participante (Registrado en el Sistema):</p>
                <p>
                  <strong>Nombre:</strong> {userProfile?.nombre} • <strong>Correo:</strong> {userProfile?.email}
                </p>
                <p>
                  <strong>Evento:</strong> {enrollingEvento.nombreEvento} ({enrollingEvento.horasCapacitacion} hrs)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">No. de Empleado / ID</label>
                  <input
                    type="text"
                    required
                    value={enrollNoEmp}
                    onChange={(e) => setEnrollNoEmp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Género</label>
                  <select
                    value={enrollGenero}
                    onChange={(e) => setEnrollGenero(e.target.value as 'H' | 'M')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                  >
                    <option value="H">Hombre (H)</option>
                    <option value="M">Mujer (M)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Puesto</label>
                  <input
                    type="text"
                    required
                    value={enrollPuesto}
                    onChange={(e) => setEnrollPuesto(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">Departamento</label>
                  <input
                    type="text"
                    required
                    value={enrollDepto}
                    onChange={(e) => setEnrollDepto(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Digital Signature */}
              <div className="space-y-1 pt-1">
                <label className="block font-bold text-slate-700 flex items-center justify-between">
                  <span>Firma Digital de Asistencia (Opcional)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Dibuja o confirma directamente</span>
                </label>
                <div className="border border-slate-300 rounded-xl overflow-hidden bg-slate-50">
                  <SignatureCanvas onSave={(sig) => setEnrollFirma(sig)} initialSignature={enrollFirma} />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setEnrollingEvento(null)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar mi Asistencia</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL INSPECTION MODAL */}
      {selectedEvento && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden my-auto border border-slate-200 max-h-[90vh] flex flex-col">
            {/* Modal Top Bar */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                    {selectedEvento.id}
                  </span>
                  <span className="text-xs text-slate-300 font-medium">
                    {selectedEvento.tipoEvento} • Modalidad {selectedEvento.ubicacionModalidad}
                  </span>
                  {isUserEnrolled(selectedEvento) && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-900 text-emerald-300 border border-emerald-700">
                      ✓ Estás inscrito
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white">{selectedEvento.nombreEvento}</h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!isUserEnrolled(selectedEvento) && (
                  <button
                    onClick={() => handleOpenEnrollModal(selectedEvento)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Inscribirme
                  </button>
                )}

                <button
                  onClick={handlePrintEvent}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5 border border-slate-700"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-400" /> Imprimir
                </button>
                <button
                  onClick={() => exportEventoToExcel(selectedEvento)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-xs font-medium transition-colors flex items-center gap-1.5 border border-emerald-700/60"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Excel
                </button>
                <button
                  onClick={() => exportEventoToPdf(selectedEvento)}
                  className="px-3 py-1.5 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-200 text-xs font-medium transition-colors flex items-center gap-1.5 border border-blue-700/60"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" /> PDF
                </button>
                <button
                  onClick={() => setSelectedEvento(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
              {/* Event Objectives & Instructor info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
                    Objetivo y Alcance
                  </h4>
                  <p className="text-slate-700 leading-relaxed">{selectedEvento.objetivoEvento}</p>
                  <p className="text-slate-500 font-medium">
                    Dirigido a: <span className="text-slate-800">{selectedEvento.dirigidoA}</span>
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">
                    Control de Instructor y Aprobación
                  </h4>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{selectedEvento.instructor.nombre}</p>
                      <p className="text-slate-600">
                        Tipo: {selectedEvento.instructor.tipo} | RFC: {selectedEvento.instructor.rfc || 'N/A'}
                      </p>
                      {selectedEvento.instructor.puesto && (
                        <p className="text-slate-600">Puesto: {selectedEvento.instructor.puesto}</p>
                      )}
                      {selectedEvento.instructor.empresa && (
                        <p className="text-slate-600">Empresa: {selectedEvento.instructor.empresa}</p>
                      )}
                    </div>

                    {/* Instructor Signature Box */}
                    {selectedEvento.instructor.firma && (
                      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs text-center shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Firma Instructor</span>
                        {selectedEvento.instructor.firma.startsWith('data:image') || selectedEvento.instructor.firma.startsWith('http') ? (
                          <img
                            src={selectedEvento.instructor.firma}
                            alt="Firma Instructor"
                            onClick={() => setViewingSignature({ title: `Firma del Instructor: ${selectedEvento.instructor.nombre}`, signature: selectedEvento.instructor.firma })}
                            className="h-10 max-w-[120px] object-contain mx-auto cursor-pointer hover:opacity-80 transition-opacity"
                            title="Clic para ampliar firma"
                          />
                        ) : (
                          <span className="text-[11px] font-serif italic text-slate-700 font-bold px-2 py-0.5 border-b border-slate-700">
                            {selectedEvento.instructor.firma}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Participants Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Lista de Participantes ({selectedEvento.participantes.length})</span>
                  </h4>

                  <button
                    onClick={() => setShowAddParticipantModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Participante
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3 w-12 text-center">#</th>
                        <th className="p-3">No. Emp</th>
                        <th className="p-3">Nombre Completo</th>
                        <th className="p-3 text-center">Género</th>
                        <th className="p-3">Puesto</th>
                        <th className="p-3">Departamento</th>
                        <th className="p-3 text-center min-w-[120px]">Firma Digital</th>
                        <th className="p-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {selectedEvento.participantes.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="p-3 text-center font-bold text-slate-400">{p.pos}</td>
                          <td className="p-3 font-mono font-semibold text-slate-900">{p.noEmp}</td>
                          <td className="p-3 font-medium text-slate-900">
                            {p.nombre}
                            {userProfile && (p.email === userProfile.email || p.nombre === userProfile.nombre) && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                Tú
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                p.genero === 'H' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                              }`}
                            >
                              {p.genero}
                            </span>
                          </td>
                          <td className="p-3">{p.puesto}</td>
                          <td className="p-3">{p.depto}</td>
                          <td className="p-3 text-center">
                            {p.firma && (p.firma.startsWith('data:image') || p.firma.startsWith('http')) ? (
                              <button
                                type="button"
                                onClick={() => setViewingSignature({ title: `Firma Digital de ${p.nombre} (${p.noEmp})`, signature: p.firma })}
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-bold transition-all cursor-pointer"
                                title="Clic para ampliar y autenticar firma digital"
                              >
                                <img
                                  src={p.firma}
                                  alt="Firma"
                                  className="h-4 max-w-[50px] object-contain bg-white rounded px-0.5 border border-emerald-200"
                                />
                                <span>Ver Trazo</span>
                              </button>
                            ) : p.firma ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Confirmada
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Pendiente</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteParticipant(p.id)}
                              className="text-rose-500 hover:text-rose-700 p-1"
                              title="Eliminar de la lista"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL ADD PARTICIPANT MODAL */}
      {showAddParticipantModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Registrar Participante</h3>
              <button
                onClick={() => setShowAddParticipantModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddParticipant} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">No. de Empleado</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. EMP-1050"
                  value={newNoEmp}
                  onChange={(e) => setNewNoEmp(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Nombre del participante"
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Género</label>
                <select
                  value={newGenero}
                  onChange={(e) => setNewGenero(e.target.value as 'H' | 'M')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="H">Hombre (H)</option>
                  <option value="M">Mujer (M)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Puesto</label>
                <input
                  type="text"
                  required
                  placeholder="Puesto u ocupación"
                  value={newPuesto}
                  onChange={(e) => setNewPuesto(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-slate-700">Departamento</label>
                <input
                  type="text"
                  required
                  placeholder="Departamento o área"
                  value={newDepto}
                  onChange={(e) => setNewDepto(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddParticipantModal(false)}
                  className="px-4 py-2 rounded-xl border text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
                >
                  Guardar Participante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL PARA VER FIRMA DIGITAL EN TAMAÑO COMPLETO */}
      {viewingSignature && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setViewingSignature(null)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <PenTool className="w-4 h-4 text-blue-600" />
                <span>{viewingSignature.title}</span>
              </div>
              <button
                onClick={() => setViewingSignature(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[160px]">
              {viewingSignature.signature.startsWith('data:image') || viewingSignature.signature.startsWith('http') ? (
                <img
                  src={viewingSignature.signature}
                  alt="Firma Digital"
                  className="max-h-40 max-w-full object-contain"
                />
              ) : (
                <div className="font-serif italic text-xl font-bold text-slate-800 border-b-2 border-slate-800 pb-1">
                  {viewingSignature.signature}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                <CheckCircle2 className="w-4 h-4" /> Firma Digital Válida
              </span>
              <button
                onClick={() => setViewingSignature(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
