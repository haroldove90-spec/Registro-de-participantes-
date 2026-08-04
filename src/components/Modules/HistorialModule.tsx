import React, { useState } from 'react';
import { EventoData, Participant } from '../../types';
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
} from 'lucide-react';

interface HistorialModuleProps {
  eventos: EventoData[];
  onDeleteEvento: (id: string) => void;
  onUpdateEvento: (eventoActualizado: EventoData) => void;
}

export const HistorialModule: React.FC<HistorialModuleProps> = ({
  eventos,
  onDeleteEvento,
  onUpdateEvento,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterModalidad, setFilterModalidad] = useState<string>('todos');
  const [selectedEvento, setSelectedEvento] = useState<EventoData | null>(null);

  // New Participant Modal inside Event Detail
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);
  const [newNoEmp, setNewNoEmp] = useState('');
  const [newNombre, setNewNombre] = useState('');
  const [newGenero, setNewGenero] = useState<'H' | 'M'>('H');
  const [newPuesto, setNewPuesto] = useState('');
  const [newDepto, setNewDepto] = useState('');

  // Filtering events
  const filteredEventos = eventos.filter((evt) => {
    const matchesSearch =
      evt.nombreEvento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.instructor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.objetivoEvento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.participantes.some(
        (p) =>
          p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.noEmp.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.depto.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesTipo = filterTipo === 'todos' || evt.tipoEvento === filterTipo;
    const matchesModalidad =
      filterModalidad === 'todos' || evt.ubicacionModalidad === filterModalidad;

    return matchesSearch && matchesTipo && matchesModalidad;
  });

  // Calculate Cumulative Metrics
  const totalEventosCount = eventos.length;
  const totalParticipantesCount = eventos.reduce((sum, e) => sum + e.totalParticipantes, 0);
  const totalHorasHombreCount = eventos.reduce((sum, e) => sum + e.horasHombreCapacitacion, 0);
  const totalInversionCount = eventos.reduce((sum, e) => sum + e.costos.totalCostos, 0);
  const totalHombresCount = eventos.reduce((sum, e) => sum + e.hombresCount, 0);
  const totalMujeresCount = eventos.reduce((sum, e) => sum + e.mujeresCount, 0);

  // Add Participant to current viewing event
  const handleAddParticipantToCurrentEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvento || !newNombre.trim()) return;

    const nextPos = selectedEvento.participantes.length + 1;
    const newParticipant: Participant = {
      id: Date.now().toString(),
      pos: nextPos,
      noEmp: newNoEmp.trim() || `EMP-${1000 + nextPos}`,
      nombre: newNombre.trim(),
      genero: newGenero,
      puesto: newPuesto.trim() || 'Operativo',
      depto: newDepto.trim() || 'General',
      firma: 'firmado',
    };

    const updatedParticipants = [...selectedEvento.participantes, newParticipant];
    const hombresCount = updatedParticipants.filter((p) => p.genero === 'H').length;
    const mujeresCount = updatedParticipants.filter((p) => p.genero === 'M').length;
    const totalParticipantes = updatedParticipants.length;
    const horasHombreCapacitacion = selectedEvento.horasCapacitacion * totalParticipantes;

    const updatedEvento: EventoData = {
      ...selectedEvento,
      participantes: updatedParticipants,
      hombresCount,
      mujeresCount,
      totalParticipantes,
      horasHombreCapacitacion,
    };

    onUpdateEvento(updatedEvento);
    setSelectedEvento(updatedEvento);

    // Reset Form
    setNewNoEmp('');
    setNewNombre('');
    setNewPuesto('');
    setNewDepto('');
    setShowAddParticipantModal(false);
  };

  // Export event participants list to CSV
  const exportEventCSV = (evt: EventoData) => {
    const headers = ['Posicion', 'No_Empleado', 'Nombre_Participante', 'Genero', 'Puesto', 'Departamento', 'Firma'];
    const rows = evt.participantes.map((p) => [
      p.pos,
      `"${p.noEmp}"`,
      `"${p.nombre}"`,
      p.genero,
      `"${p.puesto}"`,
      `"${p.depto}"`,
      p.firma === 'firmado' ? 'Firmado' : 'Pendiente',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Lista_Asistencia_${evt.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Event View
  const handlePrintEvent = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Search & Filter Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por evento, instructor, colega participante, No. Empleado o depto..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters & Batch Export */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>Tipo:</span>
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="todos">Todos</option>
                <option value="Capacitación">Capacitación</option>
                <option value="Reunión de Trabajo">Reunión de Trabajo</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600">
              <span>Modalidad:</span>
              <select
                value={filterModalidad}
                onChange={(e) => setFilterModalidad(e.target.value)}
                className="bg-transparent font-semibold text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="todos">Todas</option>
                <option value="MM">MM (Macro)</option>
                <option value="OP">OP (Oficina)</option>
                <option value="Campo">Campo</option>
              </select>
            </div>

            {/* Global Export Buttons */}
            <button
              onClick={() => exportAllEventosToExcel(filteredEventos)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
              title="Exportar todos los eventos a Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Excel (.xlsx)
            </button>

            <button
              onClick={() => exportAllEventosToPdf(filteredEventos)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
              title="Exportar todos los eventos a PDF (.pdf)"
            >
              <FileText className="w-3.5 h-3.5" /> PDF (.pdf)
            </button>
          </div>
        </div>
      </div>

      {/* Events List / Cards */}
      <div className="space-y-4">
        {filteredEventos.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 space-y-3">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-base">No se encontraron eventos registrados</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Pruebe a cambiar los filtros de búsqueda o registre un nuevo evento en el módulo "Registro de Participantes".
            </p>
          </div>
        ) : (
          filteredEventos.map((evt) => (
            <div
              key={evt.id}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 shadow-2xs hover:shadow-md transition-all p-6 space-y-4"
            >
              {/* Event Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="space-y-1">
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
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {evt.nombreEvento}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
                  <button
                    onClick={() => setSelectedEvento(evt)}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5" /> Ver Detalle
                  </button>
                  <button
                    onClick={() => exportEventoToExcel(evt)}
                    title="Exportar este evento a Excel (.xlsx)"
                    className="px-2.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel
                  </button>
                  <button
                    onClick={() => exportEventoToPdf(evt)}
                    title="Exportar este evento a PDF (.pdf)"
                    className="px-2.5 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold transition-colors flex items-center gap-1"
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
                    className="p-2 rounded-xl border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
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
                      className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0 border border-slate-200/80"
                    >
                      {p.nombre}
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
          ))
        )}
      </div>

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
                </div>
                <h3 className="text-lg font-bold text-white">{selectedEvento.nombreEvento}</h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
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
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Exportar Excel
                </button>
                <button
                  onClick={() => exportEventoToPdf(selectedEvento)}
                  className="px-3 py-1.5 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-200 text-xs font-medium transition-colors flex items-center gap-1.5 border border-blue-700/60"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" /> Exportar PDF
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
                    Control de Instructor
                  </h4>
                  <p className="font-bold text-slate-900 text-sm">{selectedEvento.instructor.nombre}</p>
                  <p className="text-slate-600">
                    Tipo: {selectedEvento.instructor.tipo} | RFC: {selectedEvento.instructor.rfc}
                  </p>
                  {selectedEvento.instructor.puesto && (
                    <p className="text-slate-600">Puesto: {selectedEvento.instructor.puesto}</p>
                  )}
                  {selectedEvento.instructor.empresa && (
                    <p className="text-slate-600">Empresa: {selectedEvento.instructor.empresa}</p>
                  )}
                </div>
              </div>

              {/* Attendance Table Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-base text-slate-900">
                      Lista de Asistencia Registrada ({selectedEvento.participantes.length} Colegas)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Desglose: {selectedEvento.hombresCount} Hombres | {selectedEvento.mujeresCount} Mujeres
                    </p>
                  </div>

                  <button
                    onClick={() => setShowAddParticipantModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Participante
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-3 text-center w-12">Pos</th>
                        <th className="py-2.5 px-3">No. EMP</th>
                        <th className="py-2.5 px-3">Nombre Completo</th>
                        <th className="py-2.5 px-3 text-center">Género</th>
                        <th className="py-2.5 px-3">Puesto</th>
                        <th className="py-2.5 px-3">Departamento</th>
                        <th className="py-2.5 px-3 text-center">Firma Digital</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {selectedEvento.participantes.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-3 text-center font-bold text-slate-500">{p.pos}</td>
                          <td className="py-2 px-3 font-mono font-medium text-slate-700">{p.noEmp}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{p.nombre}</td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.genero === 'H'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-pink-100 text-pink-700'
                              }`}
                            >
                              {p.genero}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600">{p.puesto}</td>
                          <td className="py-2 px-3 text-slate-600">{p.depto}</td>
                          <td className="py-2 px-3 text-center">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ Registrado
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial & Content Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px]">
                    Desglose de Costos del Evento
                  </h4>
                  <ul className="space-y-1 text-slate-600">
                    <li className="flex justify-between">
                      <span>Costo Instructor:</span> <strong>${selectedEvento.costos.costoInstructor.toLocaleString()}</strong>
                    </li>
                    <li className="flex justify-between">
                      <span>Costo Materiales:</span> <strong>${selectedEvento.costos.costoMateriales.toLocaleString()}</strong>
                    </li>
                    <li className="flex justify-between">
                      <span>Costo Cafetería:</span> <strong>${selectedEvento.costos.costoCafeteria.toLocaleString()}</strong>
                    </li>
                    <li className="flex justify-between">
                      <span>Otros Costos:</span> <strong>${selectedEvento.costos.otrosCostos.toLocaleString()}</strong>
                    </li>
                    <li className="flex justify-between border-t pt-1 font-bold text-slate-900 text-sm">
                      <span>Total:</span> <span className="text-emerald-700">${selectedEvento.costos.totalCostos.toLocaleString()} MXN</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px]">
                    Contenido & Aprobación RH
                  </h4>
                  <p className="text-slate-700">{selectedEvento.contenidoTematico || 'Sin resumen temático.'}</p>
                  <p className="text-slate-500 font-medium">
                    Anexo: {selectedEvento.anexoContenido ? '✓ Se adjunta temario' : 'No adjunto'}
                  </p>
                  <div className="pt-2 flex items-center justify-between text-emerald-800 font-semibold bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    <span>Aprobación Recursos Humanos (RH)</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Participant to Current Event */}
      {showAddParticipantModal && selectedEvento && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Agregar Colega Participante</h3>
              <button
                onClick={() => setShowAddParticipantModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddParticipantToCurrentEvent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Número de Empleado (No. EMP)</label>
                <input
                  type="text"
                  value={newNoEmp}
                  onChange={(e) => setNewNoEmp(e.target.value)}
                  placeholder="Ej: EMP-1050"
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nombre del Colega <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  placeholder="Nombre completo"
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Género</label>
                  <select
                    value={newGenero}
                    onChange={(e) => setNewGenero(e.target.value as 'H' | 'M')}
                    className="w-full px-3 py-2 rounded-lg border text-sm bg-white"
                  >
                    <option value="H">Hombre (H)</option>
                    <option value="M">Mujer (M)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Departamento</label>
                  <input
                    type="text"
                    value={newDepto}
                    onChange={(e) => setNewDepto(e.target.value)}
                    placeholder="Ej. Operaciones"
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Puesto</label>
                <input
                  type="text"
                  value={newPuesto}
                  onChange={(e) => setNewPuesto(e.target.value)}
                  placeholder="Ej. Técnico Especialista"
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddParticipantModal(false)}
                  className="px-4 py-2 rounded-lg border text-slate-600 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold"
                >
                  Guardar Participante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
