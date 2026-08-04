import React, { useState } from 'react';
import { EventoData } from '../../types';
import {
  Users,
  Clock,
  DollarSign,
  Calendar,
  Award,
  BarChart2,
  PieChart as PieChartIcon,
  TrendingUp,
  Download,
  Filter,
  FileSpreadsheet,
  Building2,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { exportAllEventosToExcel, exportAllEventosToPdf } from '../../utils/exporter';

interface MetricasModuleProps {
  eventos: EventoData[];
}

export const MetricasModule: React.FC<MetricasModuleProps> = ({ eventos }) => {
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterModalidad, setFilterModalidad] = useState<string>('todos');

  // Filtered Events
  const filteredEventos = eventos.filter((evt) => {
    const matchesTipo = filterTipo === 'todos' || evt.tipoEvento === filterTipo;
    const matchesModalidad = filterModalidad === 'todos' || evt.ubicacionModalidad === filterModalidad;
    return matchesTipo && matchesModalidad;
  });

  // Calculate High-level Metrics
  const totalEventosCount = filteredEventos.length;
  const totalParticipantesCount = filteredEventos.reduce((sum, e) => sum + e.totalParticipantes, 0);
  const totalHombresCount = filteredEventos.reduce((sum, e) => sum + e.hombresCount, 0);
  const totalMujeresCount = filteredEventos.reduce((sum, e) => sum + e.mujeresCount, 0);
  const totalHorasHombre = filteredEventos.reduce((sum, e) => sum + e.horasHombreCapacitacion, 0);
  const totalInversion = filteredEventos.reduce((sum, e) => sum + e.costos.totalCostos, 0);
  const promedioParticipantes = totalEventosCount > 0 ? (totalParticipantesCount / totalEventosCount).toFixed(1) : '0';

  // Percentages
  const pctHombres = totalParticipantesCount > 0 ? Math.round((totalHombresCount / totalParticipantesCount) * 100) : 0;
  const pctMujeres = totalParticipantesCount > 0 ? Math.round((totalMujeresCount / totalParticipantesCount) * 100) : 0;

  // Chart 1: Gender Data
  const genderChartData = [
    { name: 'Hombres (H)', value: totalHombresCount, color: '#2563eb' },
    { name: 'Mujeres (M)', value: totalMujeresCount, color: '#ec4899' },
  ];

  // Chart 2: Department Breakdown
  const deptoMap: Record<string, number> = {};
  filteredEventos.forEach((evt) => {
    evt.participantes.forEach((p) => {
      const d = p.depto || 'General';
      deptoMap[d] = (deptoMap[d] || 0) + 1;
    });
  });

  const deptoChartData = Object.keys(deptoMap)
    .map((d) => ({
      departamento: d,
      participantes: deptoMap[d],
    }))
    .sort((a, b) => b.participantes - a.participantes)
    .slice(0, 7);

  // Chart 3: Cost Breakdown
  const costInstructorSum = filteredEventos.reduce((sum, e) => sum + e.costos.costoInstructor, 0);
  const costMaterialesSum = filteredEventos.reduce((sum, e) => sum + e.costos.costoMateriales, 0);
  const costCafeteriaSum = filteredEventos.reduce((sum, e) => sum + e.costos.costoCafeteria, 0);
  const costOtrosSum = filteredEventos.reduce((sum, e) => sum + e.costos.otrosCostos, 0);

  const costBreakdownData = [
    { concepto: 'Instructor', monto: costInstructorSum, fill: '#3b82f6' },
    { concepto: 'Materiales', monto: costMaterialesSum, fill: '#10b981' },
    { concepto: 'Cafetería', monto: costCafeteriaSum, fill: '#f59e0b' },
    { concepto: 'Otros Costos', monto: costOtrosSum, fill: '#8b5cf6' },
  ];

  // Chart 4: Modality Distribution
  const modMap: Record<string, number> = { MM: 0, OP: 0, Campo: 0 };
  filteredEventos.forEach((evt) => {
    if (modMap[evt.ubicacionModalidad] !== undefined) {
      modMap[evt.ubicacionModalidad] += 1;
    } else {
      modMap[evt.ubicacionModalidad] = 1;
    }
  });

  const modalityChartData = [
    { name: 'MM (Macro)', eventos: modMap['MM'] || 0, fill: '#3b82f6' },
    { name: 'OP (Oficina)', eventos: modMap['OP'] || 0, fill: '#6366f1' },
    { name: 'Campo', eventos: modMap['Campo'] || 0, fill: '#10b981' },
  ];

  // Chart 5: Event timeline
  const sortedEventsByDate = [...filteredEventos].sort(
    (a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime()
  );

  const timelineChartData = sortedEventsByDate.map((evt) => ({
    fecha: evt.fechaInicio.substring(5), // MM-DD
    nombre: evt.nombreEvento.length > 20 ? evt.nombreEvento.substring(0, 20) + '...' : evt.nombreEvento,
    horasHombre: evt.horasHombreCapacitacion,
    participantes: evt.totalParticipantes,
    inversion: evt.costos.totalCostos,
  }));

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Banner & Actions Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-200 border border-purple-400/30">
            <Sparkles className="w-3.5 h-3.5 text-purple-300" /> Tablero Ejecutivo de Indicadores
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Módulo de Métricas e Indicadores Clave (KPIs)
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Visualización estadística de participantes, equidad de género, inversión financiera y horas-hombre acumuladas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-stretch md:self-auto">
          <button
            onClick={() => exportAllEventosToExcel(filteredEventos)}
            className="flex-1 md:flex-initial px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <FileSpreadsheet className="w-4 h-4" /> Exportar Métricas (Excel)
          </button>
          <button
            onClick={() => exportAllEventosToPdf(filteredEventos)}
            className="flex-1 md:flex-initial px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <Download className="w-4 h-4" /> Exportar Informe (PDF)
          </button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filtros Dinámicos del Tablero:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <span className="text-slate-500 font-medium">Tipo:</span>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="todos">Todos los Tipos</option>
              <option value="Capacitación">Capacitación</option>
              <option value="Reunión de Trabajo">Reunión de Trabajo</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <span className="text-slate-500 font-medium">Modalidad:</span>
            <select
              value={filterModalidad}
              onChange={(e) => setFilterModalidad(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="todos">Todas las Modalidades</option>
              <option value="MM">MM (Macro)</option>
              <option value="OP">OP (Oficina)</option>
              <option value="Campo">Campo</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Eventos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Eventos</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{totalEventosCount}</p>
          <p className="text-[11px] text-slate-500">
            Promedio: <strong className="text-slate-800">{promedioParticipantes}</strong> part./evento
          </p>
        </div>

        {/* Card 2: Total Participantes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Participantes</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{totalParticipantesCount}</p>
          <p className="text-[11px] text-slate-500">
            Hombres: <strong className="text-blue-600">{totalHombresCount}</strong> ({pctHombres}%) | Mujeres: <strong className="text-pink-600">{totalMujeresCount}</strong> ({pctMujeres}%)
          </p>
        </div>

        {/* Card 3: Horas Hombre */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Horas-Hombre</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{totalHorasHombre} <span className="text-xs font-normal text-slate-500">hrs</span></p>
          <p className="text-[11px] text-emerald-600 font-semibold">
            Impacto acumulado en desarrollo
          </p>
        </div>

        {/* Card 4: Total Inversión */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inversión Total</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">${totalInversion.toLocaleString('es-MX')}</p>
          <p className="text-[11px] text-slate-500">
            Presupuesto ejecutado en capacitación
          </p>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Gender Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-pink-600" />
                Distribución de Participantes por Género
              </h3>
              <p className="text-xs text-slate-500">Proporción equitativa de asistencia (Hombres vs Mujeres)</p>
            </div>
            <span className="text-xs font-bold bg-pink-50 text-pink-700 px-2.5 py-1 rounded-full border border-pink-200">
              Equidad laboral
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {totalParticipantesCount > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {genderChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value} Participantes`, 'Cantidad']} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">Sin datos de participantes</div>
            )}
          </div>
        </div>

        {/* Chart 2: Department Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Participantes por Departamento
              </h3>
              <p className="text-xs text-slate-500">Áreas con mayor volumen de capacitación recibida</p>
            </div>
            <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
              Áreas clave
            </span>
          </div>

          <div className="h-64 w-full">
            {deptoChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptoChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="departamento" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => [`${value} Colegas`, 'Participantes']} />
                  <Bar dataKey="participantes" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Sin datos</div>
            )}
          </div>
        </div>

        {/* Chart 3: Financial Cost Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Desglose Financiero de Recursos ($ MXN)
              </h3>
              <p className="text-xs text-slate-500">Distribución de inversión entre Instructor, Materiales, Cafetería y Otros</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Inversión total
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costBreakdownData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="concepto" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `$${val}`} />
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString('es-MX')} MXN`, 'Monto']} />
                <Bar dataKey="monto" radius={[8, 8, 0, 0]}>
                  {costBreakdownData.map((entry, index) => (
                    <Cell key={`cost-cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Modality Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-purple-600" />
                Eventos por Modalidad de Impartición
              </h3>
              <p className="text-xs text-slate-500">Conteo de sesiones en Macro (MM), Oficina (OP) y Campo</p>
            </div>
            <span className="text-xs font-bold bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full border border-purple-200">
              Sedes
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modalityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => [`${value} Eventos`, 'Cantidad']} />
                <Bar dataKey="eventos" radius={[8, 8, 0, 0]}>
                  {modalityChartData.map((entry, index) => (
                    <Cell key={`mod-cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 5: Timeline Evolution */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Evolución de Horas-Hombre e Impacto Temporal
            </h3>
            <p className="text-xs text-slate-500">Comportamiento secuencial de la capacitación impartida por fecha de inicio</p>
          </div>
        </div>

        <div className="h-64 w-full">
          {timelineChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHoras" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === 'horasHombre' ? `${value} hrs-hombre` : `${value} personas`,
                    name === 'horasHombre' ? 'Horas-Hombre' : 'Participantes',
                  ]}
                />
                <Area type="monotone" dataKey="horasHombre" stroke="#4f46e5" fillOpacity={1} fill="url(#colorHoras)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">Sin datos registrados</div>
          )}
        </div>
      </div>
    </div>
  );
};
