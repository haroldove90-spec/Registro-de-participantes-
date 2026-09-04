import React, { useState, useEffect } from 'react';
import { EventoData, Participant, UserProfile } from '../../types';
import {
  UserPlus,
  Users,
  Calendar,
  Clock,
  Building,
  UserCheck,
  Search,
  CheckCircle2,
  Trash2,
  Edit3,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Sparkles,
  AlertCircle,
  X,
  Save,
  PenTool,
  Check,
  ChevronDown,
  Building2,
  Mail,
  Briefcase,
  IdCard,
  Smartphone,
  Share2,
  Copy,
  Lock,
} from 'lucide-react';
import { SignatureCanvas } from '../SignatureCanvas';
import { exportEventoToExcel, exportEventoToPdf } from '../../utils/exporter';
import { HojaAsistenciaOficialModal } from '../HojaAsistenciaOficialModal';
import {
  notifySupervisorRegisteredParticipants,
  notifySupervisorGatheredSignature,
  notifySignaturesCompleted,
} from '../../utils/notifications';
import { FirmaCoordinadorView } from './FirmaCoordinadorView';

interface ParticipantesModuleProps {
  eventos: EventoData[];
  userProfile?: UserProfile;
  selectedEventoId?: string | null;
  onSelectEvento?: (eventoId: string) => void;
  onAddParticipant: (eventoId: string, participant: Participant) => void;
  onRemoveParticipant: (eventoId: string, participantId: string) => void;
  onUpdateParticipant?: (eventoId: string, participant: Participant) => void;
  onUpdateEvento?: (eventoActualizado: EventoData) => void;
}

export const ParticipantesModule: React.FC<ParticipantesModuleProps> = ({
  eventos,
  userProfile,
  selectedEventoId,
  onSelectEvento,
  onAddParticipant,
  onRemoveParticipant,
  onUpdateParticipant,
  onUpdateEvento,
}) => {
  const isAdmin =
    userProfile?.rol === 'Admin' ||
    userProfile?.rol?.toLowerCase().includes('admin') ||
    userProfile?.email?.toLowerCase().includes('harold') ||
    userProfile?.usuario?.toLowerCase().includes('harold') ||
    userProfile?.nombre?.toLowerCase().includes('harold');

  // Modal for supervisor touch signature collection
  const [viewingFirmaEvento, setViewingFirmaEvento] = useState<EventoData | null>(null);

  // Default to first active event or first event in list
  const [activeEventoId, setActiveEventoId] = useState<string>(() => {
    if (selectedEventoId && eventos.some((e) => e.id === selectedEventoId)) {
      return selectedEventoId;
    }
    const firstActive = eventos.find((e) => e.activo !== false && e.estado !== 'Desactivado');
    return firstActive?.id || eventos[0]?.id || '';
  });

  useEffect(() => {
    if (selectedEventoId && eventos.some((e) => e.id === selectedEventoId)) {
      setActiveEventoId(selectedEventoId);
    }
  }, [selectedEventoId, eventos]);

  const currentEvento = eventos.find((e) => e.id === activeEventoId) || null;

  // New Participant Form State
  const [noEmp, setNoEmp] = useState('');
  const [nombre, setNombre] = useState('');
  const [genero, setGenero] = useState<'H' | 'M'>('H');
  const [email, setEmail] = useState('');
  const [puesto, setPuesto] = useState('');
  const [depto, setDepto] = useState('');
  const [firma, setFirma] = useState<string>('');
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);

  // Search inside participant table
  const [participantSearch, setParticipantSearch] = useState('');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);
  const [officialSheetEvento, setOfficialSheetEvento] = useState<EventoData | null>(null);

  // Digital Signature modal for editing
  const [signingModalParticipant, setSigningModalParticipant] = useState<Participant | null>(null);

  const handleSelectEventChange = (newId: string) => {
    setActiveEventoId(newId);
    if (onSelectEvento) {
      onSelectEvento(newId);
    }
    // Reset form
    setNoEmp('');
    setNombre('');
    setEmail('');
    setPuesto('');
    setDepto('');
    setFirma('');
    setEditingParticipantId(null);
    setFormErrors([]);
  };

  const handleSaveParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvento) {
      setFormErrors(['Selecciona primero un evento de la lista.']);
      return;
    }

    const errs: string[] = [];
    if (!nombre.trim()) errs.push('El Nombre Completo del participante es obligatorio.');
    if (!puesto.trim()) errs.push('El Puesto es obligatorio.');
    if (!depto.trim()) errs.push('El Departamento es obligatorio.');

    if (errs.length > 0) {
      setFormErrors(errs);
      return;
    }

    setFormErrors([]);

    if (editingParticipantId) {
      // Editing existing participant
      const updatedParticipant: Participant = {
        id: editingParticipantId,
        pos: currentEvento.participantes.find((p) => p.id === editingParticipantId)?.pos || 1,
        noEmp: noEmp.trim() || `EMP-${Date.now().toString().slice(-4)}`,
        nombre: nombre.trim(),
        email: email.trim() || undefined,
        genero,
        puesto: puesto.trim(),
        depto: depto.trim(),
        firma: firma || 'firmado',
        confirmado: true,
      };

      if (onUpdateParticipant) {
        onUpdateParticipant(currentEvento.id, updatedParticipant);
      }

      // If updated by supervisor with a digital signature, alert Admin
      if (!isAdmin && updatedParticipant.firma) {
        notifySupervisorGatheredSignature(
          currentEvento,
          updatedParticipant.nombre,
          userProfile?.nombre || 'Supervisor'
        );
      }

      setToastMessage({
        type: 'success',
        text: `Datos de ${updatedParticipant.nombre} actualizados con éxito.`,
      });
      setEditingParticipantId(null);
    } else {
      // Adding brand new participant to current event
      const newPos = (currentEvento.participantes?.length || 0) + 1;
      const newParticipant: Participant = {
        id: `part_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        pos: newPos,
        noEmp: noEmp.trim() || `EMP-${1000 + newPos}`,
        nombre: nombre.trim(),
        email: email.trim() || undefined,
        genero,
        puesto: puesto.trim(),
        depto: depto.trim(),
        firma: firma || 'firmado',
        confirmado: true,
        fechaConfirmacion: new Date().toISOString(),
      };

      onAddParticipant(currentEvento.id, newParticipant);

      // If registered by supervisor, alert admin
      if (!isAdmin) {
        if (newParticipant.firma) {
          notifySupervisorGatheredSignature(
            currentEvento,
            newParticipant.nombre,
            userProfile?.nombre || 'Supervisor',
            (currentEvento.participantes?.filter((p) => !!p.firma).length || 0) + 1,
            (currentEvento.participantes?.length || 0) + 1
          );
        } else {
          notifySupervisorRegisteredParticipants(
            currentEvento,
            userProfile?.nombre || 'Supervisor',
            (currentEvento.participantes?.length || 0) + 1
          );
        }
      }

      setToastMessage({
        type: 'success',
        text: `Participante ${newParticipant.nombre} agregado exitosamente al evento ${currentEvento.id}.`,
      });
    }

    // Reset form for next participant
    setNoEmp('');
    setNombre('');
    setEmail('');
    setPuesto('');
    setDepto('');
    setFirma('');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleStartEdit = (p: Participant) => {
    setEditingParticipantId(p.id);
    setNoEmp(p.noEmp || '');
    setNombre(p.nombre);
    setGenero(p.genero);
    setEmail(p.email || '');
    setPuesto(p.puesto || '');
    setDepto(p.depto || '');
    setFirma(p.firma || '');
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingParticipantId(null);
    setNoEmp('');
    setNombre('');
    setEmail('');
    setPuesto('');
    setDepto('');
    setFirma('');
  };

  const filteredParticipants = (currentEvento?.participantes || []).filter((p) => {
    const term = participantSearch.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(term) ||
      (p.noEmp && p.noEmp.toLowerCase().includes(term)) ||
      (p.puesto && p.puesto.toLowerCase().includes(term)) ||
      (p.depto && p.depto.toLowerCase().includes(term)) ||
      (p.email && p.email.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Notification Toast */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-md animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= HEADER DEL MÓDULO ================= */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Registro y Asistencia de Participantes
              </span>
              <span className="text-xs text-slate-300">
                {eventos.length} Eventos Disponibles
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Registro de Participantes por Evento
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Selecciona el evento al cual acudirán o se inscribirán los asistentes. Registra nuevos participantes en cualquier momento con su firma digital y datos completos.
            </p>
          </div>

          {currentEvento && (
            <div className="flex items-center gap-2 flex-wrap">
              {isAdmin ? (
                <>
                  <button
                    onClick={() => setOfficialSheetEvento(currentEvento)}
                    className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-amber-400" />
                    <span>Hoja Oficial 1:1</span>
                  </button>

                  <button
                    onClick={() => exportEventoToExcel(currentEvento)}
                    className="px-3.5 py-2.5 rounded-2xl bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Excel</span>
                  </button>

                  <button
                    onClick={() => exportEventoToPdf(currentEvento)}
                    className="px-3.5 py-2.5 rounded-2xl bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>PDF</span>
                  </button>
                </>
              ) : (
                <div
                  className="px-3.5 py-2.5 rounded-2xl bg-white/10 border border-white/10 text-slate-300 text-xs flex items-center gap-1.5"
                  title="Exportación e impresión reservadas al Administrador"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Impresión/Exportación: Solo Admin</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ================= SECCIÓN 1: SELECTOR DE EVENTO REGISTRADO ================= */}
      <div className="bg-white rounded-3xl p-6 md:p-7 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Selecciona el Evento al cual se registrarán participantes:
            </label>
            <p className="text-xs text-slate-500 mt-0.5">
              Elige el curso o reunión de trabajo registrado en el sistema.
            </p>
          </div>

          <div className="w-full md:w-96">
            <select
              value={activeEventoId}
              onChange={(e) => handleSelectEventChange(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border-2 border-blue-500 bg-blue-50/40 text-blue-900 font-bold text-xs shadow-xs focus:ring-2 focus:ring-blue-500/20"
            >
              {eventos.length === 0 ? (
                <option value="">No hay eventos registrados</option>
              ) : (
                eventos.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    [{evt.id}] {evt.nombreEvento} — ({evt.participantes.length} asistentes)
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Ficha Resumen del Evento Seleccionado */}
        {currentEvento ? (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-2xl p-4 md:p-5 border border-blue-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Evento Seleccionado
                </span>
                <p className="font-extrabold text-blue-900 text-sm mt-0.5">{currentEvento.nombreEvento}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                    {currentEvento.id}
                  </span>
                  <span className="text-[11px] text-slate-600 font-medium">
                    Modalidad {currentEvento.ubicacionModalidad}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Instructor Asignado
                </span>
                <p className="font-bold text-slate-800 mt-0.5">{currentEvento.instructor.nombre}</p>
                <p className="text-[11px] text-slate-500">
                  {currentEvento.instructor.tipo} {currentEvento.instructor.puesto ? `• ${currentEvento.instructor.puesto}` : ''}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Fechas y Horario
                </span>
                <p className="font-bold text-slate-800 mt-0.5">
                  {currentEvento.fechaInicio} al {currentEvento.fechaTermino}
                </p>
                <p className="text-[11px] text-slate-500">
                  {currentEvento.horarioDe} a {currentEvento.horarioA} ({currentEvento.horasCapacitacion} hrs)
                </p>
              </div>

              <div className="bg-white rounded-xl p-3 border border-blue-200/80 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-blue-600 block tracking-wider">
                  Participantes Registrados
                </span>
                <p className="text-lg font-extrabold text-blue-950 mt-0.5">
                  {currentEvento.participantes.length} Asistentes
                </p>
                <p className="text-[11px] text-slate-500">
                  Hombres: <strong className="text-blue-700">{currentEvento.hombresCount}</strong> | Mujeres:{' '}
                  <strong className="text-rose-700">{currentEvento.mujeresCount}</strong>
                </p>
              </div>
            </div>

            {/* Barra de Progreso de Firmas Digitales en Tiempo Real */}
            {(() => {
              const total = currentEvento.participantes.length;
              const firmados = currentEvento.participantes.filter(
                (p) => p.firma && p.firma.trim() !== ''
              ).length;
              const porcentaje = total > 0 ? Math.round((firmados / total) * 100) : 0;
              return (
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Monitoreo de Firmas en Tiempo Real:
                      </span>
                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {firmados} de {total} firmados ({porcentaje}%)
                      </span>
                    </div>
                    {total > 0 && firmados === total && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> 100% de Firmas Recabadas
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-slate-200/70 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Panel de Recolección de Firmas del Supervisor */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-4 md:p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-400/20 text-blue-300 text-[10px] font-bold uppercase tracking-wider border border-blue-400/30">
                    Recolección de Firmas en Campo
                  </span>
                  <span className="text-xs text-blue-200 font-semibold">
                    {currentEvento.participantes?.filter((p) => !!p.firma).length || 0} de {currentEvento.participantes?.length || 0} participantes firmados
                  </span>
                </div>
                <p className="text-sm font-bold text-white">
                  El supervisor recaba directamente las firmas de los participantes en su dispositivo
                </p>
                <p className="text-xs text-blue-200/90">
                  Cada firma recabada notificará automáticamente al Administrador para mantenerlo informado en tiempo real.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setViewingFirmaEvento(currentEvento)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
                  title="Abrir pantalla táctil de recolección de firmas para participantes"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Recabar Firmas de Participantes (Táctil)</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <p className="text-xs text-slate-500 font-medium">
              No hay ningún evento seleccionado. Registra un evento primero en el módulo "Eventos".
            </p>
          </div>
        )}
      </div>

      {/* ================= SECCIÓN 2: FORMULARIO PARA REGISTRAR NUEVO PARTICIPANTE ================= */}
      {currentEvento && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingParticipantId
                    ? 'Editar Datos del Participante'
                    : `Inscribir Nuevo Participante en "${currentEvento.nombreEvento}"`}
                </h2>
                <p className="text-xs text-slate-500">
                  Completa los datos del trabajador y captura su firma digital de asistencia.
                </p>
              </div>
            </div>

            {editingParticipantId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
              >
                Cancelar Edición
              </button>
            )}
          </div>

          {formErrors.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Por favor completa los siguientes campos:
              </p>
              <ul className="list-disc pl-5 space-y-0.5">
                {formErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSaveParticipant} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* No. Empleado */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  No. Empleado
                </label>
                <div className="relative">
                  <IdCard className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={noEmp}
                    onChange={(e) => setNoEmp(e.target.value)}
                    placeholder="Ej. EMP-1045"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Nombre Completo */}
              <div className="space-y-1 lg:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Lic. Fernando Gómez Salas"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Género Toggle */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Género *
                </label>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setGenero('H')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      genero === 'H'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    H (Hombre)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenero('M')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      genero === 'M'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    M (Mujer)
                  </button>
                </div>
              </div>

              {/* Puesto */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Puesto *
                </label>
                <div className="relative">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={puesto}
                    onChange={(e) => setPuesto(e.target.value)}
                    placeholder="Ej. Supervisor de Planta"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Departamento */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Departamento *
                </label>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={depto}
                    onChange={(e) => setDepto(e.target.value)}
                    placeholder="Ej. Mantenimiento"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Email y Firma Digital */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Correo Electrónico (Opcional)
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@empresa.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Para envío automático de su constancia y notificación de registro.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Firma Digital del Asistente
                </label>
                <div className="rounded-xl border border-slate-300 bg-slate-50 p-2">
                  <SignatureCanvas
                    title="Firma del Participante"
                    onSave={(sig) => setFirma(sig)}
                    initialSignature={firma}
                  />
                </div>
              </div>
            </div>

            {/* Botón para Guardar Participante */}
            <div className="flex items-center justify-end pt-3">
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>
                  {editingParticipantId
                    ? 'Guardar Cambios del Participante'
                    : `+ Inscribir Participante en ${currentEvento.id}`}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= SECCIÓN 3: TABLA DE PARTICIPANTES EN TIEMPO REAL ================= */}
      {currentEvento && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Lista Oficial de Participantes de "{currentEvento.nombreEvento}"
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                  {currentEvento.participantes.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Participantes confirmados para este evento. Puedes editar datos o remover participantes si es necesario.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={participantSearch}
                onChange={(e) => setParticipantSearch(e.target.value)}
                placeholder="Buscar por nombre, no. emp..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {filteredParticipants.length === 0 ? (
            <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">
                {participantSearch
                  ? 'No se encontraron participantes con ese criterio de búsqueda.'
                  : 'Aún no se han registrado participantes para este evento.'}
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Usa el formulario de arriba para dar de alta y firmar a los asistentes de este curso.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">No.</th>
                    <th className="px-4 py-3">No. Emp</th>
                    <th className="px-4 py-3">Nombre Completo</th>
                    <th className="px-4 py-3">Género</th>
                    <th className="px-4 py-3">Puesto</th>
                    <th className="px-4 py-3">Departamento</th>
                    <th className="px-4 py-3">Firma Digital</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredParticipants.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-400">
                        {p.pos || idx + 1}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">
                        {p.noEmp || 'S/N'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{p.nombre}</span>
                        {p.email && <span className="text-[10px] text-slate-400">{p.email}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.genero === 'H'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {p.genero === 'H' ? 'Hombre' : 'Mujer'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{p.puesto || '—'}</td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{p.depto || '—'}</td>
                      <td className="px-4 py-3">
                        {p.firma && p.firma.startsWith('data:image') ? (
                          <img
                            src={p.firma}
                            alt="Firma"
                            className="h-7 max-w-[90px] object-contain border border-slate-200 rounded px-1 bg-white"
                          />
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                            <Check className="w-3 h-3" /> Firmado
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleStartEdit(p)}
                          className="p-1.5 rounded-lg border border-slate-200 text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Editar participante"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar a ${p.nombre} de la lista de asistencia de este evento?`)) {
                              onRemoveParticipant(currentEvento.id, p.id);
                              setToastMessage({
                                type: 'info',
                                text: `Participante ${p.nombre} removido de la lista.`,
                              });
                              setTimeout(() => setToastMessage(null), 3000);
                            }
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
          )}
        </div>
      )}

      {/* Modal Hoja Oficial 1:1 */}
      {officialSheetEvento && (
        <HojaAsistenciaOficialModal
          evento={officialSheetEvento}
          onClose={() => setOfficialSheetEvento(null)}
        />
      )}

      {/* ================= MODAL: FIRMA TÁCTIL DEL COORDINADOR ================= */}
      {viewingFirmaEvento && (
        <FirmaCoordinadorView
          evento={viewingFirmaEvento}
          onUpdateEvento={(updated) => {
            if (onUpdateEvento) onUpdateEvento(updated);
            setViewingFirmaEvento(updated);
          }}
          onClose={() => setViewingFirmaEvento(null)}
        />
      )}
    </div>
  );
};
