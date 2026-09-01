import React, { useState, useEffect, useId, useRef } from 'react';
import { EventoData, Participant, TipoEvento, UbicacionModalidad, TipoInstructor, Genero } from '../../types';
import { SignatureCanvas } from '../SignatureCanvas';
import { CurrencyInput } from '../CurrencyInput';
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
  Zap,
  PenTool,
  X,
  Check,
  Upload,
  Download,
  Eye,
  File,
  Calculator,
  HelpCircle,
} from 'lucide-react';

interface RegistroModuleProps {
  onSaveEvento: (nuevoEvento: EventoData) => void;
}

export const RegistroModule: React.FC<RegistroModuleProps> = ({ onSaveEvento }) => {
  // Checkbox field IDs for proper label association
  const anexoCheckboxId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Datos Generales del Evento
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

  // 2. Control de Instructores
  const [tipoInstructor, setTipoInstructor] = useState<TipoInstructor>('Interno');
  const [nombreInstructor, setNombreInstructor] = useState('');
  const [puestoInstructor, setPuestoInstructor] = useState('');
  const [empresaInstructor, setEmpresaInstructor] = useState('');
  const [rfcInstructor, setRfcInstructor] = useState('');
  const [firmaInstructor, setFirmaInstructor] = useState('');

  // 3. Administración de Recursos y Costos
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

  // 4. Lista de Asistencia / Colegas Participantes
  const [participantes, setParticipantes] = useState<Participant[]>([
    { id: '1', pos: 1, noEmp: 'EMP-1001', nombre: 'Carlos Eduardo Ramírez', genero: 'H', puesto: 'Analista Sr.', depto: 'Operaciones', firma: 'firmado' },
    { id: '2', pos: 2, noEmp: 'EMP-1002', nombre: 'Ana Isabel Mendoza', genero: 'M', puesto: 'Especialista de Procesos', depto: 'Calidad', firma: 'firmado' },
    { id: '3', pos: 3, noEmp: 'EMP-1003', nombre: 'Jorge Luis Morales', genero: 'H', puesto: 'Técnico de Planta', depto: 'Mantenimiento', firma: 'firmado' },
  ]);

  // Modal for digital signature of an individual participant
  const [signingParticipant, setSigningParticipant] = useState<Participant | null>(null);
  const [tempSignature, setTempSignature] = useState<string>('');

  // Modal for viewing attached file
  const [viewingAttachment, setViewingAttachment] = useState<boolean>(false);

  // Success Notification state
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Calculate Days difference from dates
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

  // Suggest hours per day based on schedule De / A
  const calculateHoursFromSchedule = () => {
    if (horarioDe && horarioA) {
      const [startH, startM] = horarioDe.split(':').map(Number);
      const [endH, endM] = horarioA.split(':').map(Number);
      let diffHours = endH - startH + (endM - startM) / 60;
      if (diffHours < 0) diffHours += 24;
      // Round to 1 decimal place
      const rounded = Math.round(diffHours * 10) / 10;
      if (rounded > 0) {
        setHorasPorDia(rounded);
        setHorasCapacitacion(Math.round(noDias * rounded));
      }
    }
  };

  // Calculated Metrics from Participants Table
  const hombresCount = participantes.filter((p) => p.genero === 'H').length;
  const mujeresCount = participantes.filter((p) => p.genero === 'M').length;
  const totalParticipantes = participantes.length;
  const horasHombreCapacitacion = horasCapacitacion * totalParticipantes;
  const totalCostos = costoInstructor + costoMateriales + costoCafeteria + otrosCostos;

  // File Upload Handlers (Clip / Drag and Drop)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    // Format size
    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      setNombreAdjunto(file.name);
      setArchivoAdjuntoData(base64Data);
      setArchivoAdjuntoTamano(sizeStr);
      setAnexoContenido(true);
    };
    reader.readAsDataURL(file);
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

  const handleDownloadAttachedFile = () => {
    if (!archivoAdjuntoData) return;
    const link = document.createElement('a');
    link.href = archivoAdjuntoData;
    link.download = nombreAdjunto || 'documento_adjunto';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Participant Handlers
  const addParticipantRow = () => {
    const nextPos = participantes.length + 1;
    const newP: Participant = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      pos: nextPos,
      noEmp: `EMP-${1000 + nextPos}`,
      nombre: '',
      genero: nextPos % 2 === 0 ? 'M' : 'H',
      puesto: '',
      depto: '',
      firma: 'firmado',
    };
    setParticipantes([...participantes, newP]);
  };

  const addMultipleRows = (count: number) => {
    const newRows: Participant[] = [];
    const basePos = participantes.length;
    for (let i = 1; i <= count; i++) {
      const pos = basePos + i;
      newRows.push({
        id: Date.now().toString() + i + Math.random().toString(36).substring(2, 5),
        pos,
        noEmp: `EMP-${1000 + pos}`,
        nombre: '',
        genero: pos % 2 === 0 ? 'M' : 'H',
        puesto: '',
        depto: '',
        firma: 'firmado',
      });
    }
    setParticipantes([...participantes, ...newRows]);
  };

  const updateParticipant = (id: string, field: keyof Participant, value: any) => {
    setParticipantes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const removeParticipant = (id: string) => {
    if (participantes.length <= 1) return;
    const filtered = participantes.filter((p) => p.id !== id);
    const reordered = filtered.map((p, idx) => ({ ...p, pos: idx + 1 }));
    setParticipantes(reordered);
  };

  // Pre-fill sample data for instant testing
  const prefillSampleData = () => {
    setNombreEvento('Curso de Prevención de Riesgos y Seguridad Operativa 2026');
    setObjetivoEvento('Capacitar al personal operativo en protocolos de seguridad laboral, uso correcto de EPP y prevención de incidentes.');
    setDirigidoA('Técnicos de mantenimiento, supervisores y operadores de planta.');
    setTipoEvento('Capacitación');
    setUbicacionModalidad('OP');
    setFechaInicio('2026-08-10');
    setFechaTermino('2026-08-12');
    setNoDias(3);
    setHorasPorDia(8);
    setHorarioDe('08:30');
    setHorarioA('16:30');
    setHorasCapacitacion(24);

    setTipoInstructor('Interno');
    setNombreInstructor('Ing. Roberto Carlos Fuentes');
    setPuestoInstructor('Jefe de Seguridad e Higiene Industrial');
    setRfcInstructor('FUER820415HV3');

    setContenidoTematico('Módulo 1: Identificación de actos inseguros. Módulo 2: Procedimientos LOTO. Módulo 3: Primeros Auxilios.');
    setNombreAdjunto('Programa_Seguridad_Agosto_2026.pdf');
    setArchivoAdjuntoTamano('245 KB');
    setAnexoContenido(true);
    setCostoInstructor(0);
    setCostoMateriales(3500);
    setCostoCafeteria(2200);
    setOtrosCostos(800);

    setParticipantes([
      { id: 's1', pos: 1, noEmp: 'EMP-1011', nombre: 'Fernando Morales Silva', genero: 'H', puesto: 'Técnico de Mantenimiento', depto: 'Mantenimiento', firma: 'firmado' },
      { id: 's2', pos: 2, noEmp: 'EMP-1012', nombre: 'Patricia Hernández Ríos', genero: 'M', puesto: 'Supervisora de Turno', depto: 'Producción', firma: 'firmado' },
      { id: 's3', pos: 3, noEmp: 'EMP-1013', nombre: 'Gabriel Domínguez Castro', genero: 'H', puesto: 'Operador de Maquinaria', depto: 'Operaciones', firma: 'firmado' },
      { id: 's4', pos: 4, noEmp: 'EMP-1014', nombre: 'Sofia Guadalupe Aguilar', genero: 'M', puesto: 'Inspectora de Calidad', depto: 'Calidad', firma: 'firmado' },
      { id: 's5', pos: 5, noEmp: 'EMP-1015', nombre: 'Ricardo Salgado Peña', genero: 'H', puesto: 'Montacarguista', depto: 'Almacén', firma: 'firmado' },
      { id: 's6', pos: 6, noEmp: 'EMP-1016', nombre: 'Claudia Rosas Méndez', genero: 'M', puesto: 'Auxiliar Logística', depto: 'Logística', firma: 'firmado' },
    ]);

    setErrors([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: string[] = [];

    if (!nombreEvento.trim()) newErrors.push('El Nombre del Evento es obligatorio.');
    if (!objetivoEvento.trim()) newErrors.push('El Objetivo del Evento es obligatorio.');
    if (!nombreInstructor.trim()) newErrors.push('El Nombre del Instructor es obligatorio.');
    if (participantes.some((p) => !p.nombre.trim())) {
      newErrors.push('Todos los participantes registrados deben tener un Nombre asignado.');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErrors([]);

    const nuevoEvento: EventoData = {
      id: `EVT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      nombreEvento,
      objetivoEvento,
      dirigidoA,
      tipoEvento,
      ubicacionModalidad,
      fechaInicio,
      fechaTermino,
      noDias,
      horasPorDia,
      horarioDe,
      horarioA,
      horasCapacitacion,
      horasHombreCapacitacion,
      hombresCount,
      mujeresCount,
      totalParticipantes,
      instructor: {
        tipo: tipoInstructor,
        nombre: nombreInstructor,
        puesto: tipoInstructor === 'Interno' ? puestoInstructor : undefined,
        empresa: tipoInstructor === 'Externo' ? empresaInstructor : undefined,
        rfc: rfcInstructor,
        firma: firmaInstructor || 'firmado',
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
      participantes,
      fechaCreacion: new Date().toISOString().split('T')[0],
      estado: 'Registrado',
    };

    onSaveEvento(nuevoEvento);
    setSavedSuccess(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setTimeout(() => {
      setSavedSuccess(false);
    }, 5000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Hidden Real File Input for the Paperclip */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.txt"
        className="hidden"
      />

      {/* Banner & Actions Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" /> Checklist Oficial RH
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Formulario Electrónico de Registro
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Complete los campos correspondientes a los 5 módulos del checklist para registrar el evento y la lista de asistencia.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <button
            type="button"
            onClick={prefillSampleData}
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold transition-all flex items-center justify-center gap-2 backdrop-blur-md cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-300" /> Cargar Ejemplo
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold text-sm">¡Evento y Participantes Registrados Exitosamente!</p>
            <p className="text-xs text-emerald-700">
              El evento ha sido guardado en el sistema y se ha sincronizado con el Historial de Participantes.
            </p>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
          <p className="font-bold text-sm">Por favor corrija los siguientes campos:</p>
          <ul className="list-disc list-inside text-xs space-y-0.5 text-rose-700">
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: DATOS GENERALES DEL EVENTO */}
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">1. Datos Generales del Evento</h3>
              <p className="text-xs text-slate-500">Información principal, fechas, objetivos y modalidad</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Nombre del Evento */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Nombre del Evento <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nombreEvento}
                  onChange={(e) => setNombreEvento(e.target.value)}
                  placeholder="Ej: Capacitación en Protocolos de Seguridad Industrial"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Objetivo del Evento */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Objetivo del Evento <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={objetivoEvento}
                  onChange={(e) => setObjetivoEvento(e.target.value)}
                  placeholder="Describa el propósito general y resultados esperados..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                />
              </div>

              {/* Dirigido a */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Dirigido a
                </label>
                <input
                  type="text"
                  value={dirigidoA}
                  onChange={(e) => setDirigidoA(e.target.value)}
                  placeholder="Ej: Operadores, supervisores y personal técnico de planta"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Tipo de Evento */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Tipo de Evento (Selección única)
                </label>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {(['Capacitación', 'Reunión de Trabajo'] as TipoEvento[]).map((tipo) => (
                    <label
                      key={tipo}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        tipoEvento === tipo
                          ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tipoEvento"
                        checked={tipoEvento === tipo}
                        onChange={() => setTipoEvento(tipo)}
                        className="sr-only"
                      />
                      <span>{tipo}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Ubicación / Modalidad */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Ubicación / Modalidad
                </label>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { id: 'MM' as UbicacionModalidad, label: 'MM (Macro)', sub: 'Sede Principal' },
                    { id: 'OP' as UbicacionModalidad, label: 'OP (Oficina)', sub: 'Planta/Oficina' },
                    { id: 'Campo' as UbicacionModalidad, label: 'Campo', sub: 'Trabajo Exterior' },
                  ].map((mod) => (
                    <label
                      key={mod.id}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all text-center ${
                        ubicacionModalidad === mod.id
                          ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="ubicacionModalidad"
                        checked={ubicacionModalidad === mod.id}
                        onChange={() => setUbicacionModalidad(mod.id)}
                        className="sr-only"
                      />
                      <span>{mod.label}</span>
                      <span className="text-[10px] font-normal text-slate-500">{mod.sub}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rango de Fechas */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" /> Fecha de Inicio (Día / Mes / Año)
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" /> Fecha de Término (Día / Mes / Año)
                </label>
                <input
                  type="date"
                  value={fechaTermino}
                  onChange={(e) => setFechaTermino(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Horarios De / A */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" /> Horario De
                  </label>
                  <input
                    type="time"
                    value={horarioDe}
                    onChange={(e) => setHorarioDe(e.target.value)}
                    onBlur={calculateHoursFromSchedule}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" /> Horario A
                  </label>
                  <input
                    type="time"
                    value={horarioA}
                    onChange={(e) => setHorarioA(e.target.value)}
                    onBlur={calculateHoursFromSchedule}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm"
                  />
                </div>
              </div>

              {/* Días y Horas diarias con cálculo automático */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    No. Días
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={noDias}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setNoDias(val);
                      if (autoCalculateHours) {
                        setHorasCapacitacion(val * horasPorDia);
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-semibold bg-slate-50 text-center"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Hrs / Día
                  </label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={horasPorDia}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setHorasPorDia(val);
                      if (autoCalculateHours) {
                        setHorasCapacitacion(Math.round(noDias * val));
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-semibold text-center"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Hrs Totales
                    </label>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={horasCapacitacion}
                    onChange={(e) => {
                      setAutoCalculateHours(false);
                      setHorasCapacitacion(parseInt(e.target.value) || 1);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-blue-300 bg-blue-50/40 text-blue-900 text-sm font-bold text-center"
                  />
                </div>
              </div>

              {/* Explicación y desglose de Horas y Horas-Hombre */}
              <div className="md:col-span-2 p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/80">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-600 text-white">
                      <Calculator className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                        Cálculo Preciso de Horas y Horas-Hombre
                      </span>
                      <p className="text-xs text-slate-300">
                        {noDias} día(s) × {horasPorDia} hrs/día = <strong className="text-white">{horasCapacitacion} horas totales de capacitación</strong>
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Total Horas-Hombre</span>
                    <p className="text-2xl font-black text-emerald-400">
                      {horasHombreCapacitacion} <span className="text-xs font-normal text-slate-300">hrs-hombre</span>
                    </p>
                  </div>
                </div>

                {/* Formula Breakdown explanation card */}
                <div className="bg-slate-950/60 rounded-xl p-3 text-[11px] text-slate-300 flex flex-wrap items-center justify-between gap-2 border border-slate-700/50">
                  <span className="flex items-center gap-1.5 text-slate-200">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                    <strong>Fórmula Oficial:</strong> ({horasCapacitacion} hrs evento) × ({totalParticipantes} participantes registrados) = {horasHombreCapacitacion} Horas-Hombre
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800">
                    {hombresCount} Hombres + {mujeresCount} Mujeres
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: CONTROL DE INSTRUCTORES */}
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">2. Control de Instructores</h3>
              <p className="text-xs text-slate-500">Tipo de instructor, credenciales y captura de firma digital</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Selección de Instructor
              </label>
              <div className="flex gap-4">
                {(['Interno', 'Externo'] as TipoInstructor[]).map((tipo) => (
                  <label
                    key={tipo}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold cursor-pointer transition-all ${
                      tipoInstructor === tipo
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipoInstructor"
                      checked={tipoInstructor === tipo}
                      onChange={() => setTipoInstructor(tipo)}
                      className="sr-only"
                    />
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Instructor {tipo}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              {/* Nombre del Instructor */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Nombre del Instructor <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nombreInstructor}
                  onChange={(e) => setNombreInstructor(e.target.value)}
                  placeholder="Ej: Lic. Carlos Fuentes Mercado"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* RFC */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  RFC del Instructor
                </label>
                <input
                  type="text"
                  value={rfcInstructor}
                  onChange={(e) => setRfcInstructor(e.target.value.toUpperCase())}
                  placeholder="Ej: FUMC820415HV3"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all uppercase"
                />
              </div>

              {/* Puesto (Interno) or Empresa (Externo) */}
              {tipoInstructor === 'Interno' ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Puesto del Instructor (Interno)
                  </label>
                  <input
                    type="text"
                    value={puestoInstructor}
                    onChange={(e) => setPuestoInstructor(e.target.value)}
                    placeholder="Ej: Jefe de Seguridad e Higiene"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Empresa / Proveedor (Externo)
                  </label>
                  <input
                    type="text"
                    value={empresaInstructor}
                    onChange={(e) => setEmpresaInstructor(e.target.value)}
                    placeholder="Ej: Consultoría en Capacitación S.A. de C.V."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              )}

              {/* Firma Digital del Instructor */}
              <div className="md:col-span-2 pt-2">
                <SignatureCanvas
                  label="Firma Digital / Captura de Firma del Instructor"
                  initialSignature={firmaInstructor}
                  onSave={(dataUrl) => setFirmaInstructor(dataUrl)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: ADMINISTRACIÓN DE RECURSOS Y COSTOS */}
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">3. Administración de Recursos y Costos</h3>
              <p className="text-xs text-slate-500">Contenido temático, archivos adjuntos, desglose financiero con formato numérico y aprobación RH</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Contenido Temático */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" /> Contenido Temático (Texto / Resumen)
              </label>
              <textarea
                rows={2}
                value={contenidoTematico}
                onChange={(e) => setContenidoTematico(e.target.value)}
                placeholder="Indique los temas principales del curso o reunión..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
              />
            </div>

            {/* Anexo de Contenido Temático & Real File Attachment */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={anexoCheckboxId}
                    checked={anexoContenido}
                    onChange={(e) => setAnexoContenido(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor={anexoCheckboxId} className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                    Se Anexa Contenido Temático / Documento Oficial
                  </label>
                </div>

                {/* Clip Action Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  title="Haga clic en el clip para seleccionar y cargar cualquier archivo de su computadora"
                >
                  <Paperclip className="w-4 h-4" />
                  <span>{nombreAdjunto ? 'Cambiar Archivo' : 'Cargar Archivo (Clip)'}</span>
                </button>
              </div>

              {/* Display Attached File Info Card */}
              {nombreAdjunto ? (
                <div className="mt-2 p-3 bg-white rounded-xl border border-blue-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                      <File className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-slate-900 truncate max-w-xs">{nombreAdjunto}</p>
                      <p className="text-[10px] text-slate-500">
                        {archivoAdjuntoTamano || 'Documento adjunto'} • Listo para anexar al reporte
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {archivoAdjuntoData && (
                      <button
                        type="button"
                        onClick={() => setViewingAttachment(true)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Ver
                      </button>
                    )}

                    {archivoAdjuntoData && (
                      <button
                        type="button"
                        onClick={handleDownloadAttachedFile}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Descargar
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar archivo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-blue-400 hover:bg-blue-50/20 transition-all cursor-pointer"
                >
                  <Paperclip className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                  <p className="text-xs font-semibold text-slate-700">
                    Haga clic en el clip o aquí para cargar el archivo del temario
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Formatos soportados: PDF, Word (.docx), Excel (.xlsx), Imágenes (.png, .jpg)
                  </p>
                </div>
              )}
            </div>

            {/* Desglose de Costos con CurrencyInput Formateado */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" /> Desglose de Costos ($ MXN)
                </h4>
                <span className="text-[10px] text-slate-500">
                  Valores con formato numérico sin ceros iniciales molestos
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <CurrencyInput
                  id="costoInstructor"
                  label="Costo Instructor ($)"
                  value={costoInstructor}
                  onChange={setCostoInstructor}
                  placeholder="0.00"
                />

                <CurrencyInput
                  id="costoMateriales"
                  label="Costo Materiales ($)"
                  value={costoMateriales}
                  onChange={setCostoMateriales}
                  placeholder="0.00"
                />

                <CurrencyInput
                  id="costoCafeteria"
                  label="Costo Cafetería ($)"
                  value={costoCafeteria}
                  onChange={setCostoCafeteria}
                  placeholder="0.00"
                />

                <CurrencyInput
                  id="otrosCostos"
                  label="Otros Costos ($)"
                  value={otrosCostos}
                  onChange={setOtrosCostos}
                  placeholder="0.00"
                />
              </div>

              {/* Total Costos Display */}
              <div className="p-4 rounded-xl bg-emerald-950 text-emerald-100 flex items-center justify-between border border-emerald-800 shadow-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  Total de Costos (Suma Automática)
                </span>
                <span className="text-2xl font-black text-emerald-400">
                  ${totalCostos.toLocaleString('es-MX', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-emerald-300">MXN</span>
                </span>
              </div>
            </div>

            {/* Aprobación de Recursos RH */}
            <div className="pt-2 border-t border-slate-200">
              <SignatureCanvas
                label="Aprobación de Recursos (Firma de Recursos Humanos RH)"
                initialSignature={firmaRH || 'firma_rh_alejandra'}
                onSave={(dataUrl) => {
                  setFirmaRH(dataUrl);
                  setAprobadoRH(true);
                }}
              />
            </div>
          </div>
        </section>

        {/* SECTION 4: LISTA DE ASISTENCIA / COLEGAS PARTICIPANTES */}
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                4
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  4. Lista de Asistencia / Colegas Participantes
                </h3>
                <p className="text-xs text-slate-500">
                  Tabla dinámica de asistencia (Soporta desde 1 hasta 57+ registros)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={addParticipantRow}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar 1
              </button>
              <button
                type="button"
                onClick={() => addMultipleRows(5)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1 border border-slate-300 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> +5 Filas
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Attendance Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                    <th className="py-3 px-3 w-12 text-center">Pos</th>
                    <th className="py-3 px-3 min-w-[110px]">No. EMP</th>
                    <th className="py-3 px-3 min-w-[180px]">Nombre del Participante</th>
                    <th className="py-3 px-3 w-20 text-center">Género</th>
                    <th className="py-3 px-3 min-w-[140px]">Puesto</th>
                    <th className="py-3 px-3 min-w-[130px]">Departamento</th>
                    <th className="py-3 px-3 min-w-[110px] text-center">Firma</th>
                    <th className="py-3 px-3 w-10 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {participantes.map((p, index) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Pos consecutive */}
                      <td className="py-2.5 px-3 text-center font-bold text-slate-500 bg-slate-50/50">
                        {index + 1}
                      </td>

                      {/* No EMP */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={p.noEmp}
                          onChange={(e) => updateParticipant(p.id, 'noEmp', e.target.value)}
                          placeholder="EMP-1000"
                          className="w-full px-2 py-1 rounded border border-slate-200 font-mono font-medium text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </td>

                      {/* Nombre */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          required
                          value={p.nombre}
                          onChange={(e) => updateParticipant(p.id, 'nombre', e.target.value)}
                          placeholder="Nombre completo"
                          className="w-full px-2 py-1 rounded border border-slate-200 font-medium text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </td>

                      {/* Género */}
                      <td className="py-2.5 px-3 text-center">
                        <select
                          value={p.genero}
                          onChange={(e) => updateParticipant(p.id, 'genero', e.target.value as Genero)}
                          className="px-1.5 py-1 rounded border border-slate-200 font-bold text-xs bg-slate-50"
                        >
                          <option value="H">H</option>
                          <option value="M">M</option>
                        </select>
                      </td>

                      {/* Puesto */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={p.puesto}
                          onChange={(e) => updateParticipant(p.id, 'puesto', e.target.value)}
                          placeholder="Ej. Operador"
                          className="w-full px-2 py-1 rounded border border-slate-200 text-xs"
                        />
                      </td>

                      {/* Depto */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={p.depto}
                          onChange={(e) => updateParticipant(p.id, 'depto', e.target.value)}
                          placeholder="Ej. Producción"
                          className="w-full px-2 py-1 rounded border border-slate-200 text-xs"
                        />
                      </td>

                      {/* Firma Digital de Participante */}
                      <td className="py-2.5 px-3 text-center">
                        {p.firma && (p.firma.startsWith('data:image') || p.firma.startsWith('http')) ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSigningParticipant(p);
                                setTempSignature(p.firma);
                              }}
                              className="group relative flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold transition-all cursor-pointer"
                              title="Ver y editar trazo digital de firma"
                            >
                              <img
                                src={p.firma}
                                alt="Firma"
                                className="h-4 max-w-[45px] object-contain inline-block bg-white rounded px-0.5 border border-emerald-200"
                              />
                              <span>✓ Trazo</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => updateParticipant(p.id, 'firma', '')}
                              className="text-slate-400 hover:text-rose-600 p-0.5"
                              title="Quitar firma"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : p.firma === 'firmado' ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSigningParticipant(p);
                                setTempSignature('');
                              }}
                              className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-800 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                              title="Clic para capturar firma digital con trazo"
                            >
                              <PenTool className="w-2.5 h-2.5 text-blue-600" />
                              <span>✓ Electrónica</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => updateParticipant(p.id, 'firma', '')}
                              className="text-slate-400 hover:text-rose-600 p-0.5"
                              title="Marcar como pendiente"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSigningParticipant(p);
                                setTempSignature('');
                              }}
                              className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                              title="Capturar trazo de firma digital"
                            >
                              <PenTool className="w-2.5 h-2.5 text-amber-600" />
                              <span>Firmar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => updateParticipant(p.id, 'firma', 'firmado')}
                              className="px-1.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-bold cursor-pointer"
                              title="Aceptar rápidamente firma electrónica"
                            >
                              ✓
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Remove Row */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeParticipant(p.id)}
                          disabled={participantes.length <= 1}
                          title="Eliminar fila"
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer Actions & Counter */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-xs font-semibold text-slate-600">
                Total registrado en la lista: <span className="text-blue-600 font-bold">{participantes.length} participantes</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={addParticipantRow}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600" /> +1 Fila
                </button>
                <button
                  type="button"
                  onClick={() => addMultipleRows(10)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600" /> +10 Filas
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Form Submit Bar */}
        <div className="pt-4 flex items-center justify-end gap-4">
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-5 h-5" /> Guardar y Registrar Evento
          </button>
        </div>
      </form>

      {/* MODAL DE FIRMA DIGITAL PARA PARTICIPANTE INDIVIDUAL */}
      {signingParticipant && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 animate-fade-in">
            <div className="bg-slate-900 text-white p-4 px-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400">
                  <PenTool className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Captura de Firma Digital del Participante</h3>
                  <p className="text-[11px] text-slate-300">
                    Pos #{signingParticipant.pos} • {signingParticipant.nombre || 'Participante'} ({signingParticipant.noEmp})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSigningParticipant(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-900 text-xs">
                <p className="font-semibold">
                  {signingParticipant.nombre ? signingParticipant.nombre : 'Participante sin nombre registrado'}
                </p>
                <p className="text-[11px] text-blue-700">
                  Puesto: {signingParticipant.puesto || 'General'} • Área: {signingParticipant.depto || 'General'}
                </p>
              </div>

              {/* Signature Canvas */}
              <SignatureCanvas
                label="Trazo de Firma Digital"
                initialSignature={tempSignature || signingParticipant.firma}
                onSave={(sig) => setTempSignature(sig)}
              />

              <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    updateParticipant(signingParticipant.id, 'firma', 'firmado');
                    setSigningParticipant(null);
                  }}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Usar Firma Electrónica Rápida
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSigningParticipant(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateParticipant(signingParticipant.id, 'firma', tempSignature || 'firmado');
                      setSigningParticipant(null);
                    }}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar Firma</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VISTA PREVIA DE ARCHIVO ADJUNTO */}
      {viewingAttachment && archivoAdjuntoData && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4">
            <div className="bg-slate-900 text-white p-4 px-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <File className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm text-white truncate">{nombreAdjunto}</h3>
              </div>
              <button
                onClick={() => setViewingAttachment(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto flex flex-col items-center justify-center">
              {archivoAdjuntoData.startsWith('data:image') ? (
                <img src={archivoAdjuntoData} alt={nombreAdjunto} className="max-h-96 max-w-full rounded-xl object-contain shadow-md" />
              ) : (
                <div className="p-8 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-200 w-full">
                  <File className="w-16 h-16 text-blue-600 mx-auto" />
                  <p className="font-bold text-slate-800 text-sm">{nombreAdjunto}</p>
                  <p className="text-xs text-slate-500">{archivoAdjuntoTamano} • Archivo cargado correctamente</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleDownloadAttachedFile}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Descargar Archivo
              </button>
              <button
                type="button"
                onClick={() => setViewingAttachment(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold cursor-pointer"
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
