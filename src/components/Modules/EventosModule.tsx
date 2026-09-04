import React, { useState, useEffect, useId, useRef } from 'react';
import { EventoData, UserProfile, TipoEvento, UbicacionModalidad, TipoInstructor } from '../../types';
import {
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Calendar,
  Clock,
  UserCheck,
  DollarSign,
  FileText,
  Users,
  Sparkles,
  Paperclip,
  Building,
  User,
  PenTool,
  X,
  Check,
  Upload,
  Download,
  Eye,
  File,
  Calculator,
  Search,
  Filter,
  FileSpreadsheet,
  Printer,
  Edit3,
  Power,
  ShieldAlert,
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  UserPlus,
  Smartphone,
  Share2,
  Copy,
  Lock,
  ExternalLink,
} from 'lucide-react';
import {
  exportEventoToExcel,
  exportAllEventosToExcel,
  exportEventoToPdf,
  exportAllEventosToPdf,
} from '../../utils/exporter';
import { SignatureCanvas } from '../SignatureCanvas';
import { CurrencyInput } from '../CurrencyInput';
import { HojaAsistenciaOficialModal } from '../HojaAsistenciaOficialModal';
import { getNextEventoId } from '../../utils/storage';
import { notifyAdminCreatedEvent, notifySupervisorCreatedEvent } from '../../utils/notifications';
import { FirmaCoordinadorView } from './FirmaCoordinadorView';

interface EventosModuleProps {
  eventos: EventoData[];
  userProfile?: UserProfile;
  onSaveEvento: (nuevoEvento: EventoData) => void;
  onUpdateEvento: (eventoActualizado: EventoData) => void;
  onDeleteEvento: (id: string) => void;
  onSelectEventoParaInscripcion?: (eventoId: string) => void;
}

export const EventosModule: React.FC<EventosModuleProps> = ({
  eventos,
  userProfile,
  onSaveEvento,
  onUpdateEvento,
  onDeleteEvento,
  onSelectEventoParaInscripcion,
}) => {
  const [viewMode, setViewMode] = useState<'catalogo' | 'formulario'>('catalogo');
  const [editingEventoId, setEditingEventoId] = useState<string | null>(null);

  // Filters & search for catalog
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterModalidad, setFilterModalidad] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<'todos' | 'activos' | 'desactivados'>('todos');

  // Modals
  const [selectedEvento, setSelectedEvento] = useState<EventoData | null>(null);
  const [officialSheetEvento, setOfficialSheetEvento] = useState<EventoData | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  // Admin permission check
  const isAdmin =
    userProfile?.rol === 'Admin' ||
    userProfile?.rol?.toLowerCase().includes('admin') ||
    userProfile?.email?.toLowerCase() === 'haroldo90@hotmail.com' ||
    userProfile?.usuario === 'haroldo90';

  // Form states
  const anexoCheckboxId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [idEvento, setIdEvento] = useState<string>(() => getNextEventoId(new Date().getFullYear()));
  const [nombreEvento, setNombreEvento] = useState('');
  const [objetivoEvento, setObjetivoEvento] = useState('');
  const [dirigidoA, setDirigidoA] = useState('');
  const [tipoEvento, setTipoEvento] = useState<TipoEvento>('Capacitación');
  const [ubicacionModalidad, setUbicacionModalidad] = useState<UbicacionModalidad>('OP');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaTermino, setFechaTermino] = useState(new Date().toISOString().split('T')[0]);
  const [noDias, setNoDias] = useState<number>(1);
  const [horasPorDia, setHorasPorDia] = useState<number>(8);
  const [horarioDe, setHorarioDe] = useState('09:00');
  const [horarioA, setHorarioA] = useState('17:00');
  const [horasCapacitacion, setHorasCapacitacion] = useState<number>(8);
  const [autoCalculateHours, setAutoCalculateHours] = useState<boolean>(true);

  // Instructor
  const [tipoInstructor, setTipoInstructor] = useState<TipoInstructor>('Interno');
  const [nombreInstructor, setNombreInstructor] = useState('');
  const [puestoInstructor, setPuestoInstructor] = useState('');
  const [empresaInstructor, setEmpresaInstructor] = useState('');
  const [rfcInstructor, setRfcInstructor] = useState('');
  const [firmaInstructor, setFirmaInstructor] = useState('');

  // Resources & Costs
  const [contenidoTematico, setContenidoTematico] = useState('');
  const [nombreAdjunto, setNombreAdjunto] = useState('');
  const [archivoAdjuntoData, setArchivoAdjuntoData] = useState<string>('');
  const [archivoAdjuntoTamano, setArchivoAdjuntoTamano] = useState<string>('');
  const [anexoContenido, setAnexoContenido] = useState(false);
  const [costoInstructor, setCostoInstructor] = useState<number>(0);
  const [costoMateriales, setCostoMateriales] = useState<number>(0);
  const [costoCafeteria, setCostoCafeteria] = useState<number>(0);
  const [otrosCostos, setOtrosCostos] = useState<number>(0);
  const [firmaRH, setFirmaRH] = useState('');
  const [aprobadoRH, setAprobadoRH] = useState(true);

  // Field Coordinator info
  const [coordinadorNombre, setCoordinadorNombre] = useState('');
  const [coordinadorPuesto, setCoordinadorPuesto] = useState('');
  const [coordinadorWhatsApp, setCoordinadorWhatsApp] = useState('');

  // Mobile / Field Signature collection modal
  const [viewingFirmaEvento, setViewingFirmaEvento] = useState<EventoData | null>(null);
  const [copiedLinkNotice, setCopiedLinkNotice] = useState<string | null>(null);

  // Helper to generate personalized event signature link
  const getEventSignatureLink = (eventoId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/?modulo=firmas&eventoId=${encodeURIComponent(eventoId)}`;
  };

  const handleShareLinkWhatsApp = (evt: EventoData) => {
    const link = getEventSignatureLink(evt.id);
    const cleanPhone = (evt.coordinadorWhatsApp || '').replace(/\D/g, '');
    const message = `📋 *SISTEMA DE CAPACITACIÓN - CONTROL DE ASISTENCIA Y FIRMAS*\n\n` +
      `Estimado/a *${evt.coordinadorNombre || 'Coordinador(a)'}*,\n` +
      `Se te ha asignado el evento *${evt.nombreEvento}* (Clave: ${evt.id}).\n\n` +
      `📅 Fecha: ${evt.fechaInicio} al ${evt.fechaTermino}\n` +
      `👥 Participantes programados: ${evt.participantes?.length || 0}\n\n` +
      `Por favor abre el siguiente enlace oficial desde tu celular o tablet para recabar las firmas digitales de los participantes:\n` +
      `🔗 ${link}\n\n` +
      `Las firmas se reflejan en tiempo real para el Administrador y el Supervisor.`;

    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone.startsWith('52') ? cleanPhone : '52' + cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(waUrl, '_blank');
  };

  const handleCopySignatureLink = (evt: EventoData) => {
    const link = getEventSignatureLink(evt.id);
    navigator.clipboard.writeText(link);
    setCopiedLinkNotice(`¡Enlace de firmas para el evento ${evt.id} copiado al portapapeles!`);
    setTimeout(() => setCopiedLinkNotice(null), 4000);
  };

  // Modal for viewing attachment
  const [viewingAttachment, setViewingAttachment] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Automatically calculate days and hours
  useEffect(() => {
    if (fechaInicio && fechaTermino) {
      const start = new Date(fechaInicio);
      const end = new Date(fechaTermino);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      const calculatedDays = isNaN(diffDays) || diffDays < 1 ? 1 : diffDays;
      setNoDias(calculatedDays);

      if (autoCalculateHours) {
        setHorasCapacitacion(calculatedDays * horasPorDia);
      }
    }
  }, [fechaInicio, fechaTermino, horasPorDia, autoCalculateHours]);

  const calculateHoursFromSchedule = () => {
    if (horarioDe && horarioA) {
      const [startH, startM] = horarioDe.split(':').map(Number);
      const [endH, endM] = horarioA.split(':').map(Number);
      let diffHours = endH - startH + (endM - startM) / 60;
      if (diffHours < 0) diffHours += 24;
      const hours = Math.round(diffHours * 10) / 10;
      setHorasPorDia(hours);
      if (autoCalculateHours) {
        setHorasCapacitacion(Math.round(hours * noDias * 10) / 10);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNombreAdjunto(file.name);
      setAnexoContenido(true);
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      setArchivoAdjuntoTamano(`${sizeInMB} MB`);

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setArchivoAdjuntoData(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setNombreAdjunto('');
    setArchivoAdjuntoData('');
    setArchivoAdjuntoTamano('');
    setAnexoContenido(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const totalCostos = costoInstructor + costoMateriales + costoCafeteria + otrosCostos;

  // Open form to create a new event
  const handleOpenCreateForm = () => {
    setEditingEventoId(null);
    setIdEvento(getNextEventoId(new Date().getFullYear()));
    setNombreEvento('');
    setObjetivoEvento('');
    setDirigidoA('');
    setTipoEvento('Capacitación');
    setUbicacionModalidad('OP');
    setFechaInicio(new Date().toISOString().split('T')[0]);
    setFechaTermino(new Date().toISOString().split('T')[0]);
    setNoDias(1);
    setHorasPorDia(8);
    setHorarioDe('09:00');
    setHorarioA('17:00');
    setHorasCapacitacion(8);
    setTipoInstructor('Interno');
    setNombreInstructor(userProfile?.nombre || '');
    setPuestoInstructor(userProfile?.puesto || '');
    setEmpresaInstructor('');
    setRfcInstructor(userProfile?.rfc || '');
    setFirmaInstructor('');
    setContenidoTematico('');
    setNombreAdjunto('');
    setArchivoAdjuntoData('');
    setArchivoAdjuntoTamano('');
    setAnexoContenido(false);
    setCostoInstructor(0);
    setCostoMateriales(0);
    setCostoCafeteria(0);
    setOtrosCostos(0);
    setFirmaRH('');
    setAprobadoRH(true);
    setCoordinadorNombre('');
    setCoordinadorPuesto('');
    setCoordinadorWhatsApp('');
    setFormErrors([]);
    setViewMode('formulario');
  };

  // Open form to edit existing event
  const handleOpenEditForm = (evt: EventoData) => {
    setEditingEventoId(evt.id);
    setIdEvento(evt.id);
    setNombreEvento(evt.nombreEvento);
    setObjetivoEvento(evt.objetivoEvento);
    setDirigidoA(evt.dirigidoA);
    setTipoEvento(evt.tipoEvento);
    setUbicacionModalidad(evt.ubicacionModalidad);
    setFechaInicio(evt.fechaInicio);
    setFechaTermino(evt.fechaTermino);
    setNoDias(evt.noDias);
    setHorarioDe(evt.horarioDe);
    setHorarioA(evt.horarioA);
    setHorasCapacitacion(evt.horasCapacitacion);
    setTipoInstructor(evt.instructor.tipo);
    setNombreInstructor(evt.instructor.nombre);
    setPuestoInstructor(evt.instructor.puesto);
    setEmpresaInstructor(evt.instructor.empresa || '');
    setRfcInstructor(evt.instructor.rfc || '');
    setFirmaInstructor(evt.instructor.firma || '');
    setContenidoTematico(evt.contenidoTematico || '');
    setNombreAdjunto(evt.nombreAdjunto || '');
    setArchivoAdjuntoData(evt.archivoAdjuntoData || '');
    setArchivoAdjuntoTamano(evt.archivoAdjuntoTamano || '');
    setAnexoContenido(evt.anexoContenido || false);
    setCostoInstructor(evt.costos?.costoInstructor || 0);
    setCostoMateriales(evt.costos?.costoMateriales || 0);
    setCostoCafeteria(evt.costos?.costoCafeteria || 0);
    setOtrosCostos(evt.costos?.otrosCostos || 0);
    setFirmaRH(evt.firmaRH || '');
    setAprobadoRH(evt.aprobadoRH ?? true);
    setCoordinadorNombre(evt.coordinadorNombre || '');
    setCoordinadorPuesto(evt.coordinadorPuesto || '');
    setCoordinadorWhatsApp(evt.coordinadorWhatsApp || '');
    setFormErrors([]);
    setViewMode('formulario');
  };

  // Save event (Create or Update)
  const handleSaveEventoForm = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];

    if (!nombreEvento.trim()) errs.push('El Nombre del Evento es obligatorio.');
    if (!objetivoEvento.trim()) errs.push('El Objetivo del Evento es obligatorio.');
    if (!fechaInicio) errs.push('La Fecha de Inicio es obligatoria.');
    if (!fechaTermino) errs.push('La Fecha de Término es obligatoria.');
    if (horasCapacitacion <= 0) errs.push('Las Horas de Capacitación deben ser mayores a 0.');
    if (!nombreInstructor.trim()) errs.push('El Nombre del Instructor es obligatorio.');

    if (errs.length > 0) {
      setFormErrors(errs);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setFormErrors([]);

    // Check if updating
    if (editingEventoId) {
      const existing = eventos.find((e) => e.id === editingEventoId);
      const existingParticipants = existing?.participantes || [];
      const totalPart = existingParticipants.length;
      const hombres = existingParticipants.filter((p) => p.genero === 'H').length;
      const mujeres = existingParticipants.filter((p) => p.genero === 'M').length;

      const updated: EventoData = {
        id: editingEventoId,
        nombreEvento,
        objetivoEvento,
        dirigidoA,
        tipoEvento,
        ubicacionModalidad,
        fechaInicio,
        fechaTermino,
        noDias,
        horarioDe,
        horarioA,
        horasCapacitacion,
        horasHombreCapacitacion: totalPart * horasCapacitacion,
        hombresCount: hombres,
        mujeresCount: mujeres,
        totalParticipantes: totalPart,
        instructor: {
          tipo: tipoInstructor,
          nombre: nombreInstructor,
          puesto: puestoInstructor,
          empresa: empresaInstructor,
          rfc: rfcInstructor,
          firma: firmaInstructor,
        },
        contenidoTematico,
        nombreAdjunto,
        archivoAdjuntoData,
        archivoAdjuntoTamano,
        anexoContenido,
        costos: {
          costoInstructor,
          costoMateriales,
          costoCafeteria,
          otrosCostos,
          totalCostos,
        },
        firmaRH,
        aprobadoRH,
        coordinadorNombre,
        coordinadorPuesto,
        coordinadorWhatsApp,
        registradoPor: existing?.registradoPor || (isAdmin ? 'Admin' : 'Supervisor'),
        registradoPorNombre: existing?.registradoPorNombre || userProfile?.nombre || (isAdmin ? 'Harold Anguiano' : 'Supervisor'),
        participantes: existingParticipants,
        fechaCreacion: existing?.fechaCreacion || new Date().toISOString(),
        estado: existing?.estado || 'Registrado',
        activo: existing?.activo ?? true,
      };

      onUpdateEvento(updated);
      setActionNotice({ type: 'success', text: `Evento ${updated.id} actualizado exitosamente.` });
    } else {
      // Creating a new event without participants
      const nuevoEvento: EventoData = {
        id: idEvento,
        nombreEvento,
        objetivoEvento,
        dirigidoA,
        tipoEvento,
        ubicacionModalidad,
        fechaInicio,
        fechaTermino,
        noDias,
        horarioDe,
        horarioA,
        horasCapacitacion,
        horasHombreCapacitacion: 0,
        hombresCount: 0,
        mujeresCount: 0,
        totalParticipantes: 0,
        instructor: {
          tipo: tipoInstructor,
          nombre: nombreInstructor,
          puesto: puestoInstructor,
          empresa: empresaInstructor,
          rfc: rfcInstructor,
          firma: firmaInstructor,
        },
        contenidoTematico,
        nombreAdjunto,
        archivoAdjuntoData,
        archivoAdjuntoTamano,
        anexoContenido,
        costos: {
          costoInstructor,
          costoMateriales,
          costoCafeteria,
          otrosCostos,
          totalCostos,
        },
        firmaRH,
        aprobadoRH,
        coordinadorNombre,
        coordinadorPuesto,
        coordinadorWhatsApp,
        registradoPor: isAdmin ? 'Admin' : 'Supervisor',
        registradoPorNombre: userProfile?.nombre || (isAdmin ? 'Harold Anguiano' : 'Supervisor'),
        participantes: [],
        fechaCreacion: new Date().toISOString(),
        estado: 'Registrado',
        activo: true,
      };

      onSaveEvento(nuevoEvento);

      // Trigger cross-role notification with sound
      if (isAdmin) {
        notifyAdminCreatedEvent(nuevoEvento, userProfile?.nombre || 'Harold Anguiano');
      } else {
        notifySupervisorCreatedEvent(nuevoEvento, userProfile?.nombre || 'Supervisor');
      }

      setActionNotice({
        type: 'success',
        text: `Evento ${nuevoEvento.id} registrado exitosamente. Notificación enviada y lista para recabar firmas.`,
      });
    }

    setViewMode('catalogo');
    setTimeout(() => setActionNotice(null), 5000);
  };

  // Toggle Suspend / Active status
  const handleToggleEstadoEvento = (evento: EventoData) => {
    const isCurrentlyActive = evento.activo !== false && evento.estado !== 'Desactivado';
    const nuevoEstado = isCurrentlyActive ? 'Desactivado' : 'Registrado';
    const nuevoActivo = !isCurrentlyActive;

    const eventoModificado: EventoData = {
      ...evento,
      estado: nuevoEstado,
      activo: nuevoActivo,
    };

    onUpdateEvento(eventoModificado);
    setActionNotice({
      type: 'info',
      text: isCurrentlyActive
        ? `Evento ${evento.id} suspendido temporalmente.`
        : `Evento ${evento.id} reactivado con éxito.`,
    });
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Delete event (Admin only)
  const handleDeleteEvento = (id: string, nombre: string) => {
    if (!isAdmin) {
      alert('Solo el rol Admin tiene autorización para eliminar eventos.');
      return;
    }
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el evento "${nombre}" (${id}) y sus participantes?`)) {
      onDeleteEvento(id);
      setActionNotice({
        type: 'success',
        text: `Evento ${id} eliminado del sistema.`,
      });
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  // Filtered Events
  const filteredEventos = eventos.filter((evt) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      evt.nombreEvento.toLowerCase().includes(term) ||
      evt.id.toLowerCase().includes(term) ||
      evt.instructor.nombre.toLowerCase().includes(term) ||
      evt.objetivoEvento.toLowerCase().includes(term) ||
      evt.participantes.some((p) => p.nombre.toLowerCase().includes(term));

    const matchesTipo = filterTipo === 'todos' || evt.tipoEvento === filterTipo;
    const matchesModalidad = filterModalidad === 'todos' || evt.ubicacionModalidad === filterModalidad;

    let matchesEstado = true;
    if (filterEstado === 'activos') {
      matchesEstado = evt.activo !== false && evt.estado !== 'Desactivado';
    } else if (filterEstado === 'desactivados') {
      matchesEstado = evt.activo === false || evt.estado === 'Desactivado';
    }

    return matchesSearch && matchesTipo && matchesModalidad && matchesEstado;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notice */}
      {actionNotice && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between shadow-md border animate-fade-in ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : actionNotice.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-blue-50 text-blue-900 border-blue-200'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : actionNotice.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span>{actionNotice.text}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= HEADER DEL MÓDULO ================= */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Módulo Oficial de Eventos
              </span>
              <span className="text-xs text-slate-300">
                {eventos.length} Eventos en Catálogo
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              {viewMode === 'catalogo'
                ? 'Catálogo y Administración de Eventos'
                : editingEventoId
                ? `Editando Evento: ${editingEventoId}`
                : 'Registro de Nuevo Evento de Capacitación'}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              {viewMode === 'catalogo'
                ? 'Administra, edita, suspende, elimina y exporta los eventos oficiales. Agrega participantes en cualquier momento desde el módulo "Registro de Participantes".'
                : 'Completa los datos generales, horarios, instructor, recursos y costos para dar de alta el evento.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {viewMode === 'catalogo' ? (
              <>
                <button
                  onClick={handleOpenCreateForm}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Registrar Nuevo Evento</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => exportAllEventosToExcel(eventos)}
                    className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer"
                    title="Descargar todos los eventos en Excel (Solo Administrador)"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span className="hidden sm:inline">Excel Total</span>
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => setViewMode('catalogo')}
                className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al Catálogo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= MODO 1: CATÁLOGO Y ADMINISTRACIÓN ================= */}
      {viewMode === 'catalogo' && (
        <div className="space-y-6">
          {/* Controls: Search and Filters */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por folio, nombre, instructor..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white"
              >
                <option value="todos">Todos los Tipos</option>
                <option value="Capacitación">Capacitación</option>
                <option value="Reunión de Trabajo">Reunión de Trabajo</option>
              </select>

              <select
                value={filterModalidad}
                onChange={(e) => setFilterModalidad(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white"
              >
                <option value="todos">Todas las Modalidades</option>
                <option value="OP">Modalidad OP</option>
                <option value="MM">Modalidad MM</option>
                <option value="Campo">Modalidad Campo</option>
              </select>

              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white"
              >
                <option value="todos">Todos los Estados</option>
                <option value="activos">Solo Activos</option>
                <option value="desactivados">Solo Desactivados</option>
              </select>
            </div>
          </div>

          {/* Cards Grid / List */}
          {filteredEventos.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
              <CalendarDays className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">No se encontraron eventos</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No hay eventos que coincidan con los filtros aplicados. Puedes limpiar los filtros o registrar un nuevo evento.
              </p>
              <button
                onClick={handleOpenCreateForm}
                className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                + Registrar Nuevo Evento
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEventos.map((evt) => {
                const isDesactivado = evt.activo === false || evt.estado === 'Desactivado';
                return (
                  <div
                    key={evt.id}
                    className={`bg-white rounded-2xl p-5 md:p-6 border transition-all shadow-sm hover:shadow-md ${
                      isDesactivado
                        ? 'border-slate-200 bg-slate-50/70 opacity-75'
                        : 'border-slate-200'
                    }`}
                  >
                    {/* Top Row: Tags & Main Action Buttons */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {evt.id}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {evt.tipoEvento}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                          Modalidad {evt.ubicacionModalidad}
                        </span>
                        {isDesactivado ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                            <Power className="w-3 h-3 text-amber-700" /> Suspendido
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Activo
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          Convocatoria Abierta
                        </span>
                        {evt.coordinadorNombre && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <Smartphone className="w-3 h-3 text-emerald-600" />
                            Coord: {evt.coordinadorNombre}
                          </span>
                        )}
                      </div>

                      {/* Action buttons (Ver Detalle, 1:1, Excel, PDF, WhatsApp, Link, Firmas, Editar, Suspender, Borrar) */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Aceptar Participar / Inscribir Participante */}
                        {onSelectEventoParaInscripcion && (
                          <button
                            onClick={() => onSelectEventoParaInscripcion(evt.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                            title="Ir al registro de participantes para este evento"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Inscribir Participantes</span>
                          </button>
                        )}

                        {/* Ver Detalle */}
                        <button
                          onClick={() => setSelectedEvento(evt)}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Detalle</span>
                        </button>

                        {/* Impresión y Exportación: Solo Admin */}
                        {isAdmin ? (
                          <>
                            {/* Formato 1:1 Oficial */}
                            <button
                              onClick={() => setOfficialSheetEvento(evt)}
                              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                              title="Generar formato oficial 1:1 para imprimir"
                            >
                              <Printer className="w-3.5 h-3.5 text-amber-400" />
                              <span>Formato 1:1</span>
                            </button>

                            {/* Excel */}
                            <button
                              onClick={() => exportEventoToExcel(evt)}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-emerald-700 text-xs font-medium transition-all flex items-center gap-1 cursor-pointer"
                              title="Exportar a Excel"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              <span>Excel</span>
                            </button>

                            {/* PDF */}
                            <button
                              onClick={() => exportEventoToPdf(evt)}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-rose-700 text-xs font-medium transition-all flex items-center gap-1 cursor-pointer"
                              title="Exportar a PDF"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </button>
                          </>
                        ) : (
                          <div
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 text-[11px] font-medium flex items-center gap-1"
                            title="Exportación e impresión reservada exclusivamente para el Administrador"
                          >
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Exportar: Solo Admin</span>
                          </div>
                        )}

                        {/* WhatsApp con Link Personalizado para el Coordinador */}
                        <button
                          onClick={() => handleShareLinkWhatsApp(evt)}
                          className="px-2.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                          title="Enviar WhatsApp con enlace del evento al coordinador para recabar firmas"
                        >
                          <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </button>

                        {/* Copiar Enlace de Firmas */}
                        <button
                          onClick={() => handleCopySignatureLink(evt)}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                          title="Copiar enlace personalizado de firmas"
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Link</span>
                        </button>

                        {/* Modo Firmas Táctil para Tablet / Móvil */}
                        <button
                          onClick={() => setViewingFirmaEvento(evt)}
                          className="px-2.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-800 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                          title="Abrir vista de recolección de firmas táctil para este evento"
                        >
                          <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Firmas</span>
                        </button>

                        {/* Editar */}
                        <button
                          onClick={() => handleOpenEditForm(evt)}
                          className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>

                        {/* Suspender / Reactivar */}
                        <button
                          onClick={() => handleToggleEstadoEvento(evt)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                            isDesactivado
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                              : 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                          }`}
                          title={isDesactivado ? 'Reactivar evento' : 'Suspender evento'}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>{isDesactivado ? 'Reactivar' : 'Desactivar'}</span>
                        </button>

                        {/* Borrar (Solo Admin) */}
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteEvento(evt.id, evt.nombreEvento)}
                            className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all cursor-pointer"
                            title="Eliminar evento permanentemente (Admin)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <div className="pt-3 pb-3">
                      <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                        {evt.nombreEvento}
                      </h2>
                      {evt.objetivoEvento && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                          {evt.objetivoEvento}
                        </p>
                      )}
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-3 bg-slate-50/80 rounded-xl px-4 border border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Instructor
                        </span>
                        <p className="font-bold text-slate-800 mt-0.5">{evt.instructor.nombre}</p>
                        <p className="text-[11px] text-slate-500">
                          {evt.instructor.tipo} {evt.instructor.puesto ? `(${evt.instructor.puesto})` : ''}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Fechas y Horas
                        </span>
                        <p className="font-bold text-slate-800 mt-0.5">
                          {evt.fechaInicio} al {evt.fechaTermino} ({evt.noDias} {evt.noDias === 1 ? 'día' : 'días'})
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {evt.horasCapacitacion} hrs totales • {evt.horasHombreCapacitacion} hrs-hombre
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Métricas Asistencia
                        </span>
                        <p className="font-bold text-slate-800 mt-0.5">
                          {evt.totalParticipantes} Participantes Registrados
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Hombres: <strong className="text-blue-700">{evt.hombresCount}</strong> | Mujeres:{' '}
                          <strong className="text-rose-700">{evt.mujeresCount}</strong>
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Presupuesto
                        </span>
                        <p className="font-bold text-emerald-700 mt-0.5">
                          ${(evt.costos?.totalCostos || 0).toLocaleString('es-MX')} MXN
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {evt.anexoContenido ? 'Temario adjunto' : 'Sin adjunto'}
                        </p>
                      </div>
                    </div>

                    {/* Participant Pills Preview */}
                    {evt.participantes.length > 0 && (
                      <div className="pt-3 flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-400">Asistentes:</span>
                        {evt.participantes.slice(0, 5).map((p) => (
                          <span
                            key={p.id}
                            className="px-2.5 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {p.nombre}
                          </span>
                        ))}
                        {evt.participantes.length > 5 && (
                          <span className="text-[11px] font-bold text-blue-600">
                            +{evt.participantes.length - 5} más
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= MODO 2: FORMULARIO DE REGISTRO / EDICIÓN ================= */}
      {viewMode === 'formulario' && (
        <form onSubmit={handleSaveEventoForm} className="space-y-6">
          {formErrors.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Por favor corrige los siguientes campos obligatorios:
              </p>
              <ul className="list-disc pl-5 space-y-0.5">
                {formErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* SECCIÓN 1: DATOS GENERALES */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">1. Datos Generales del Evento</h2>
                <p className="text-xs text-slate-500">Información principal, fechas, objetivos y modalidad</p>
              </div>
            </div>

            {/* Folio */}
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  FOLIO / ID OFICIAL DEL EVENTO:
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px]">
                    Consecutivo Anual Oficial
                  </span>
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Numeración oficial consecutiva (ej: EVT-2026-1, EVT-2026-2...).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={idEvento}
                  onChange={(e) => setIdEvento(e.target.value)}
                  disabled={!!editingEventoId}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-mono font-bold text-sm bg-white text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
                {!editingEventoId && (
                  <button
                    type="button"
                    onClick={() => setIdEvento(getNextEventoId(new Date().getFullYear()))}
                    className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    Auto
                  </button>
                )}
              </div>
            </div>

            {/* Nombre del Evento */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nombre del Evento *
              </label>
              <input
                type="text"
                value={nombreEvento}
                onChange={(e) => setNombreEvento(e.target.value)}
                placeholder="Ej: Capacitación en Protocolos de Seguridad Industrial"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Objetivo del Evento */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Objetivo del Evento *
              </label>
              <textarea
                value={objetivoEvento}
                onChange={(e) => setObjetivoEvento(e.target.value)}
                rows={2}
                placeholder="Describa el propósito general y resultados esperados..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Dirigido a */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Dirigido a
              </label>
              <input
                type="text"
                value={dirigidoA}
                onChange={(e) => setDirigidoA(e.target.value)}
                placeholder="Ej: Personal operativo, supervisores y coordinadores de área"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Tipo y Modalidad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tipo de Evento *
                </label>
                <select
                  value={tipoEvento}
                  onChange={(e) => setTipoEvento(e.target.value as TipoEvento)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="Capacitación">Capacitación</option>
                  <option value="Reunión de Trabajo">Reunión de Trabajo</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Ubicación / Modalidad *
                </label>
                <select
                  value={ubicacionModalidad}
                  onChange={(e) => setUbicacionModalidad(e.target.value as UbicacionModalidad)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="OP">Modalidad OP (Oficinas Principales)</option>
                  <option value="MM">Modalidad MM (Mixta / Remota)</option>
                  <option value="Campo">Modalidad Campo (Instalaciones / Patio)</option>
                </select>
              </div>
            </div>

            {/* Fechas y Horarios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Fecha de Inicio *</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Fecha de Término *</label>
                <input
                  type="date"
                  value={fechaTermino}
                  onChange={(e) => setFechaTermino(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Horario De / A</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="time"
                    value={horarioDe}
                    onChange={(e) => setHorarioDe(e.target.value)}
                    onBlur={calculateHoursFromSchedule}
                    className="w-full px-2 py-2 rounded-xl border border-slate-200 text-xs font-medium text-center"
                  />
                  <span className="text-xs text-slate-400">-</span>
                  <input
                    type="time"
                    value={horarioA}
                    onChange={(e) => setHorarioA(e.target.value)}
                    onBlur={calculateHoursFromSchedule}
                    className="w-full px-2 py-2 rounded-xl border border-slate-200 text-xs font-medium text-center"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Horas Capacitación *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={horasCapacitacion}
                    onChange={(e) => {
                      setHorasCapacitacion(parseFloat(e.target.value) || 0);
                      setAutoCalculateHours(false);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-blue-700 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="text-xs text-slate-500">hrs</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: CONTROL DE INSTRUCTORES */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">2. Control de Instructores</h2>
                <p className="text-xs text-slate-500">Asignación del facilitador y firma digital</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tipo de Instructor *
                </label>
                <select
                  value={tipoInstructor}
                  onChange={(e) => setTipoInstructor(e.target.value as TipoInstructor)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium bg-white"
                >
                  <option value="Interno">Interno (Personal de la empresa)</option>
                  <option value="Externo">Externo (Consultor / Capacitador)</option>
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nombre Completo del Instructor *
                </label>
                <input
                  type="text"
                  value={nombreInstructor}
                  onChange={(e) => setNombreInstructor(e.target.value)}
                  placeholder="Ej: Lic. Harlan Anguiano"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Puesto</label>
                <input
                  type="text"
                  value={puestoInstructor}
                  onChange={(e) => setPuestoInstructor(e.target.value)}
                  placeholder="Ej: Director de Capacitación"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Empresa / Institución</label>
                <input
                  type="text"
                  value={empresaInstructor}
                  onChange={(e) => setEmpresaInstructor(e.target.value)}
                  placeholder="Ej: Consultoría en Procesos SC"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">RFC del Instructor</label>
                <input
                  type="text"
                  value={rfcInstructor}
                  onChange={(e) => setRfcInstructor(e.target.value.toUpperCase())}
                  placeholder="RFC oficial"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium uppercase font-mono"
                />
              </div>
            </div>

            {/* Instructor Signature */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Firma Digital del Instructor
              </label>
              <div className="max-w-md">
                <SignatureCanvas
                  title="Firma del Instructor Facilitador"
                  onSave={(firma) => setFirmaInstructor(firma)}
                  initialSignature={firmaInstructor}
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: RECURSOS, COSTOS Y CONTENIDO TEMÁTICO */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  3. Administración de Recursos, Costos y Temario
                </h2>
                <p className="text-xs text-slate-500">Temario, documentos adjuntos, presupuesto y firmas</p>
              </div>
            </div>

            {/* Contenido Temático */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Contenido Temático / Agenda del Evento
              </label>
              <textarea
                value={contenidoTematico}
                onChange={(e) => setContenidoTematico(e.target.value)}
                rows={3}
                placeholder="Módulo 1: Introducción... Módulo 2: Casos prácticos... Módulo 3: Evaluación final..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Archivo Adjunto */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-blue-600" />
                  Documento Adjunto Oficial (PDF / Word / Imagen)
                </span>
                <p className="text-[11px] text-slate-500">
                  {nombreAdjunto
                    ? `Archivo: ${nombreAdjunto} (${archivoAdjuntoTamano || 'Cargado'})`
                    : 'Puedes anexar el programa detallado o la presentación del curso.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  className="hidden"
                />
                {nombreAdjunto ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setViewingAttachment(true)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Ver Adjunto
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold"
                    >
                      Quitar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Subir Documento</span>
                  </button>
                )}
              </div>
            </div>

            {/* Desglose de Costos */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Presupuesto y Desglose de Costos (MXN)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600">Costo Instructor</label>
                  <CurrencyInput
                    value={costoInstructor}
                    onChange={(val) => setCostoInstructor(val)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600">Materiales</label>
                  <CurrencyInput
                    value={costoMateriales}
                    onChange={(val) => setCostoMateriales(val)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600">Cafetería / Coffee</label>
                  <CurrencyInput
                    value={costoCafeteria}
                    onChange={(val) => setCostoCafeteria(val)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-600">Otros Costos</label>
                  <CurrencyInput
                    value={otrosCostos}
                    onChange={(val) => setOtrosCostos(val)}
                  />
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center justify-between mt-3">
                <span className="text-xs font-bold text-emerald-900">Total Presupuestado del Evento:</span>
                <span className="text-base font-extrabold text-emerald-700">
                  ${totalCostos.toLocaleString('es-MX')} MXN
                </span>
              </div>
            </div>

            {/* Coordinador Asignado para Recabar Firmas */}
            <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/50 rounded-2xl p-5 border border-emerald-200 space-y-4">
              <div className="flex items-center gap-2 border-b border-emerald-100 pb-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    Coordinador de Campo / Responsable de Recabar Firmas (Opcional)
                  </h3>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Registra al coordinador (nombre, puesto y WhatsApp) para enviarle el enlace oficial y recabar las firmas digitales de los participantes en su celular o tablet.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Nombre del Coordinador</label>
                  <input
                    type="text"
                    value={coordinadorNombre}
                    onChange={(e) => setCoordinadorNombre(e.target.value)}
                    placeholder="Ej. Ing. Carlos Mendoza"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Puesto o Cargo</label>
                  <input
                    type="text"
                    value={coordinadorPuesto}
                    onChange={(e) => setCoordinadorPuesto(e.target.value)}
                    placeholder="Ej. Coordinador de Capacitación"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">WhatsApp (10 dígitos)</label>
                  <input
                    type="tel"
                    value={coordinadorWhatsApp}
                    onChange={(e) => setCoordinadorWhatsApp(e.target.value)}
                    placeholder="Ej. 8711234567"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Firma RH */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Firma de Aprobación de Recursos Humanos (RH)
              </label>
              <div className="max-w-md">
                <SignatureCanvas
                  title="Firma Digital Representante de RH"
                  onSave={(firma) => setFirmaRH(firma)}
                  initialSignature={firmaRH}
                />
              </div>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setViewMode('catalogo')}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-all cursor-pointer"
            >
              Cancelar y Volver al Catálogo
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{editingEventoId ? 'Guardar Cambios del Evento' : 'Guardar y Registrar Evento'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ================= MODAL: DETALLE DEL EVENTO ================= */}
      {selectedEvento && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-scale-up">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white rounded-t-3xl">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {selectedEvento.id}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">{selectedEvento.nombreEvento}</h3>
              </div>
              <button
                onClick={() => setSelectedEvento(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs text-slate-700">
              <div className="space-y-1">
                <span className="font-bold text-slate-900 uppercase tracking-wider block">Objetivo:</span>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {selectedEvento.objetivoEvento || 'Sin objetivo especificado.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="font-bold text-slate-500 block">Tipo:</span>
                  <span className="font-semibold text-slate-800">{selectedEvento.tipoEvento}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 block">Modalidad:</span>
                  <span className="font-semibold text-slate-800">Modalidad {selectedEvento.ubicacionModalidad}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 block">Fechas:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedEvento.fechaInicio} al {selectedEvento.fechaTermino}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 block">Instructor:</span>
                  <span className="font-semibold text-slate-800">{selectedEvento.instructor.nombre}</span>
                </div>
              </div>

              {/* Participants summary */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 uppercase tracking-wider">
                    Participantes Inscritos ({selectedEvento.participantes.length})
                  </span>
                  {onSelectEventoParaInscripcion && (
                    <button
                      onClick={() => {
                        const id = selectedEvento.id;
                        setSelectedEvento(null);
                        onSelectEventoParaInscripcion(id);
                      }}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      + Inscribir más participantes
                    </button>
                  )}
                </div>

                {selectedEvento.participantes.length === 0 ? (
                  <p className="text-slate-400 italic bg-slate-50 p-3 rounded-xl text-center">
                    Aún no hay participantes registrados en este evento.
                  </p>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                    {selectedEvento.participantes.map((p, idx) => (
                      <div key={p.id || idx} className="p-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800">{p.nombre}</p>
                          <p className="text-[10px] text-slate-500">
                            {p.puesto || 'Puesto no esp.'} • {p.depto || 'Depto no esp.'}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {p.noEmp || `#${p.pos}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Coordinador Asignado y Enlace WhatsApp */}
              <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/50 rounded-2xl p-4 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                      <Smartphone className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                        Coordinador de Campo / Recolección de Firmas
                      </span>
                      <p className="font-bold text-emerald-950 text-xs">
                        {selectedEvento.coordinadorNombre || 'Sin coordinador asignado'}
                        {selectedEvento.coordinadorPuesto && ` • ${selectedEvento.coordinadorPuesto}`}
                      </p>
                    </div>
                  </div>
                  {selectedEvento.coordinadorWhatsApp && (
                    <span className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-800 text-xs font-mono font-bold">
                      WA: {selectedEvento.coordinadorWhatsApp}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <button
                    onClick={() => handleShareLinkWhatsApp(selectedEvento)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Enviar WhatsApp</span>
                  </button>
                  <button
                    onClick={() => handleCopySignatureLink(selectedEvento)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Enlace</span>
                  </button>
                  <button
                    onClick={() => {
                      const evt = selectedEvento;
                      setSelectedEvento(null);
                      setViewingFirmaEvento(evt);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Recabar Firmas Táctil</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons inside Modal */}
              <div className="flex items-center gap-2 pt-2 flex-wrap">
                {isAdmin ? (
                  <>
                    <button
                      onClick={() => {
                        const evt = selectedEvento;
                        setSelectedEvento(null);
                        setOfficialSheetEvento(evt);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-amber-400" />
                      <span>Hoja Oficial 1:1</span>
                    </button>
                    <button
                      onClick={() => exportEventoToPdf(selectedEvento)}
                      className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-4 h-4" /> PDF
                    </button>
                    <button
                      onClick={() => exportEventoToExcel(selectedEvento)}
                      className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Excel
                    </button>
                  </>
                ) : (
                  <div className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-semibold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Impresión y Exportación restringidas al Administrador</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TOAST: ENLACE COPIADO ================= */}
      {copiedLinkNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{copiedLinkNotice}</span>
        </div>
      )}

      {/* ================= MODAL: FIRMA TÁCTIL DEL COORDINADOR ================= */}
      {viewingFirmaEvento && (
        <FirmaCoordinadorView
          evento={viewingFirmaEvento}
          onUpdateEvento={(updated) => {
            onUpdateEvento(updated);
            setViewingFirmaEvento(updated);
          }}
          onClose={() => setViewingFirmaEvento(null)}
        />
      )}

      {/* ================= MODAL: HOJA OFICIAL 1:1 ================= */}
      {officialSheetEvento && (
        <HojaAsistenciaOficialModal
          evento={officialSheetEvento}
          onClose={() => setOfficialSheetEvento(null)}
        />
      )}

      {/* ================= MODAL: VISOR DE ADJUNTO ================= */}
      {viewingAttachment && archivoAdjuntoData && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <span className="text-xs font-bold">{nombreAdjunto}</span>
              <button
                onClick={() => setViewingAttachment(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-100">
              {archivoAdjuntoData.startsWith('data:image') ? (
                <img
                  src={archivoAdjuntoData}
                  alt={nombreAdjunto}
                  className="max-h-[70vh] rounded-xl shadow-md object-contain"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <File className="w-16 h-16 text-blue-500 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">{nombreAdjunto}</p>
                  <p className="text-xs text-slate-500">Documento cargado correctamente.</p>
                  <a
                    href={archivoAdjuntoData}
                    download={nombreAdjunto}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
                  >
                    <Download className="w-4 h-4" /> Descargar Archivo
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
