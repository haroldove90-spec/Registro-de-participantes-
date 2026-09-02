import React, { useRef } from 'react';
import { EventoData, Participant } from '../types';
import { Printer, Download, FileSpreadsheet, X, Check, Award, FileText } from 'lucide-react';
import { exportEventoToPdf, exportEventoToExcel } from '../utils/exporter';

interface HojaAsistenciaOficialModalProps {
  evento: EventoData;
  onClose: () => void;
}

function parseFecha(dateStr: string) {
  if (!dateStr) return { dia: '', mes: '', ano: '' };
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return { dia: parts[2], mes: parts[1], ano: parts[0] };
  }
  return { dia: '', mes: '', ano: '' };
}

export const HojaAsistenciaOficialModal: React.FC<HojaAsistenciaOficialModalProps> = ({
  evento,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement | null>(null);

  const startParsed = parseFecha(evento.fechaInicio);
  const endParsed = parseFecha(evento.fechaTermino);

  // Modality breakdowns
  const mmH = evento.ubicacionModalidad === 'MM' ? evento.hombresCount : 0;
  const mmM = evento.ubicacionModalidad === 'MM' ? evento.mujeresCount : 0;
  const opH = evento.ubicacionModalidad === 'OP' ? evento.hombresCount : 0;
  const opM = evento.ubicacionModalidad === 'OP' ? evento.mujeresCount : 0;
  const campoH = evento.ubicacionModalidad === 'Campo' ? evento.hombresCount : 0;
  const campoM = evento.ubicacionModalidad === 'Campo' ? evento.mujeresCount : 0;

  // Pagination rules:
  // Page 1: Official Header + Datos Generales + Instructores + Recursos + first 15 participant rows
  const PAGE_1_ROWS = 15;
  const CONTINUATION_PAGE_ROWS = 35;

  const allParticipants = evento.participantes || [];
  const page1Participants = allParticipants.slice(0, PAGE_1_ROWS);

  // Pad Page 1 up to 15 rows if needed for exact 1:1 physical layout
  const page1Rows = [...page1Participants];
  while (page1Rows.length < PAGE_1_ROWS) {
    const nextPos = page1Rows.length + 1;
    page1Rows.push({
      id: `empty_${nextPos}`,
      pos: nextPos,
      noEmp: '',
      nombre: '',
      genero: 'H',
      puesto: '',
      depto: '',
      firma: '',
    });
  }

  // Continuation pages for participants beyond 15
  const remainingParticipants = allParticipants.slice(PAGE_1_ROWS);
  const continuationPages: Participant[][] = [];

  if (remainingParticipants.length > 0) {
    for (let i = 0; i < remainingParticipants.length; i += CONTINUATION_PAGE_ROWS) {
      continuationPages.push(remainingParticipants.slice(i, i + CONTINUATION_PAGE_ROWS));
    }
  }

  const totalPages = 1 + continuationPages.length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-auto max-h-[96vh] flex flex-col print:border-none print:shadow-none print:max-h-none print:max-w-none print:rounded-none">
        {/* Top Control Bar (Hidden on print) */}
        <div className="bg-slate-900 text-white p-4 px-6 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Formato Oficial de Lista de Asistencia (1:1)</h3>
                <span className="text-[10px] bg-blue-500/30 text-blue-300 font-semibold px-2 py-0.5 rounded border border-blue-400/30">
                  {totalPages === 1 ? '1 Página' : `${totalPages} Páginas (Con Hoja de Continuación)`}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                {evento.nombreEvento} • Folio: <span className="font-mono font-bold text-white">{evento.id}</span> • {allParticipants.length} Participantes Registrados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Formato (1:1)</span>
            </button>

            <button
              onClick={() => exportEventoToPdf(evento)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Descargar PDF</span>
            </button>

            <button
              onClick={() => exportEventoToExcel(evento)}
              className="px-3.5 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 font-semibold text-xs transition-colors flex items-center gap-1.5 border border-emerald-800 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Excel</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT CANVAS */}
        <div
          ref={printRef}
          className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100 text-black font-sans print:p-0 print:bg-white print:overflow-visible"
          style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
        >
          {/* ======================================================== */}
          {/* PAGE 1: CARÁTULA PRINCIPAL (DATOS GENERALES + 15 PART.) */}
          {/* ======================================================== */}
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md border border-slate-300 mb-8 print:border-none print:shadow-none print:p-4 print:mb-0 print:break-after-page">
            {/* Document Header */}
            <div className="flex items-center justify-between mb-2 border-b border-black pb-2">
              <div>
                <h1 className="text-sm font-black tracking-wide uppercase">LISTA DE PARTICIPANTES</h1>
                <h2 className="text-xs font-bold tracking-wide uppercase text-slate-800">DATOS GENERALES</h2>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-600 block">FOLIO OFICIAL:</span>
                <span className="text-xs font-mono font-black text-black">{evento.id}</span>
              </div>
            </div>

            {/* SECTION 1: DATOS GENERALES GRID */}
            <div className="border border-black text-[11px] mb-3">
              {/* Row 1: Nombre del Evento & Checkboxes */}
              <div className="flex border-b border-black">
                <div className="flex-1 p-1.5 flex items-center gap-2 border-r border-black">
                  <span className="font-bold whitespace-nowrap">NOMBRE DEL EVENTO:</span>
                  <span className="font-semibold text-[11px] uppercase">{evento.nombreEvento}</span>
                </div>
                <div className="w-48 p-1 flex flex-col justify-center gap-1 text-[10px] font-bold bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border border-black flex items-center justify-center font-bold text-[10px]">
                      {evento.tipoEvento === 'Capacitación' ? 'X' : ''}
                    </div>
                    <span>CAPACITACION</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border border-black flex items-center justify-center font-bold text-[10px]">
                      {evento.tipoEvento === 'Reunión de Trabajo' ? 'X' : ''}
                    </div>
                    <span>REUNION DE TRABAJO</span>
                  </div>
                </div>
              </div>

              {/* Row 2: Objetivo del Evento */}
              <div className="border-b border-black p-1.5 flex items-start gap-2">
                <span className="font-bold whitespace-nowrap">OBJETIVO DEL EVENTO:</span>
                <span className="font-normal text-[10.5px] leading-tight">{evento.objetivoEvento}</span>
              </div>

              {/* Row 3: Dirigido a */}
              <div className="border-b border-black p-1.5 flex items-center gap-2">
                <span className="font-bold whitespace-nowrap">DIRIGIDO A:</span>
                <span className="font-normal text-[10.5px]">{evento.dirigidoA}</span>
              </div>

              {/* Row 4: Fechas (Día/Mes/Año a Día/Mes/Año), No Días, Total Hrs Capacitacion */}
              <div className="flex border-b border-black text-[10px]">
                {/* Fecha Header */}
                <div className="p-1 flex items-center font-bold border-r border-black px-2">
                  FECHA
                </div>

                {/* Subcolumns: DE (Dia, Mes, Año) */}
                <div className="flex border-r border-black">
                  <div className="p-1 flex items-center font-bold px-1.5 border-r border-black bg-slate-50">DE</div>
                  <div className="w-9 border-r border-black flex flex-col items-center">
                    <span className="text-[8px] font-bold border-b border-black w-full text-center">DIA</span>
                    <span className="font-bold p-0.5">{startParsed.dia}</span>
                  </div>
                  <div className="w-9 border-r border-black flex flex-col items-center">
                    <span className="text-[8px] font-bold border-b border-black w-full text-center">MES</span>
                    <span className="font-bold p-0.5">{startParsed.mes}</span>
                  </div>
                  <div className="w-12 flex flex-col items-center">
                    <span className="text-[8px] font-bold border-b border-black w-full text-center">AÑO</span>
                    <span className="font-bold p-0.5">{startParsed.ano}</span>
                  </div>
                </div>

                {/* Subcolumns: A (Dia, Mes, Año) */}
                <div className="flex border-r border-black">
                  <div className="p-1 flex items-center font-bold px-1.5 border-r border-black bg-slate-50">A</div>
                  <div className="w-9 border-r border-black flex flex-col items-center">
                    <span className="text-[8px] font-bold border-b border-black w-full text-center">DIA</span>
                    <span className="font-bold p-0.5">{endParsed.dia}</span>
                  </div>
                  <div className="w-9 border-r border-black flex flex-col items-center">
                    <span className="text-[8px] font-bold border-b border-black w-full text-center">MES</span>
                    <span className="font-bold p-0.5">{endParsed.mes}</span>
                  </div>
                  <div className="w-12 flex flex-col items-center">
                    <span className="text-[8px] font-bold border-b border-black w-full text-center">AÑO</span>
                    <span className="font-bold p-0.5">{endParsed.ano}</span>
                  </div>
                </div>

                {/* No. Días */}
                <div className="flex-1 p-1 flex items-center justify-center gap-1.5 border-r border-black">
                  <span className="font-bold text-[9px]">NO. DIAS</span>
                  <span className="font-bold text-xs">{evento.noDias}</span>
                </div>

                {/* Total Horas de Capacitación */}
                <div className="flex-1 p-1 flex items-center justify-center gap-1.5">
                  <span className="font-bold text-[9px] text-center leading-tight">TOTAL HORAS DE CAPACITACION</span>
                  <span className="font-bold text-xs">{evento.horasCapacitacion}</span>
                </div>
              </div>

              {/* Row 5: Participantes H/M, MM/OP/Campo, Horarios, Horas-Hombre */}
              <div className="flex text-[10px]">
                {/* Column: PARTICIPANTES */}
                <div className="w-48 p-1 flex items-center justify-center font-bold border-r border-black">
                  PARTICIPANTES
                </div>

                {/* Sub-column MM */}
                <div className="w-16 border-r border-black flex flex-col">
                  <div className="text-center font-bold text-[9px] border-b border-black bg-slate-50">MM</div>
                  <div className="flex text-center">
                    <div className="w-1/2 border-r border-black font-bold text-[8px]">H</div>
                    <div className="w-1/2 font-bold text-[8px]">M</div>
                  </div>
                  <div className="flex text-center border-t border-black">
                    <div className="w-1/2 border-r border-black font-semibold text-[10px]">{mmH}</div>
                    <div className="w-1/2 font-semibold text-[10px]">{mmM}</div>
                  </div>
                </div>

                {/* Sub-column OP */}
                <div className="w-16 border-r border-black flex flex-col">
                  <div className="text-center font-bold text-[9px] border-b border-black bg-slate-50">OP</div>
                  <div className="flex text-center">
                    <div className="w-1/2 border-r border-black font-bold text-[8px]">H</div>
                    <div className="w-1/2 font-bold text-[8px]">M</div>
                  </div>
                  <div className="flex text-center border-t border-black">
                    <div className="w-1/2 border-r border-black font-semibold text-[10px]">{opH}</div>
                    <div className="w-1/2 font-semibold text-[10px]">{opM}</div>
                  </div>
                </div>

                {/* Sub-column CAMPO */}
                <div className="w-20 border-r border-black flex flex-col">
                  <div className="text-center font-bold text-[9px] border-b border-black bg-slate-50">CAMPO</div>
                  <div className="flex text-center">
                    <div className="w-1/2 border-r border-black font-bold text-[8px]">H</div>
                    <div className="w-1/2 font-bold text-[8px]">M</div>
                  </div>
                  <div className="flex text-center border-t border-black">
                    <div className="w-1/2 border-r border-black font-semibold text-[10px]">{campoH}</div>
                    <div className="w-1/2 font-semibold text-[10px]">{campoM}</div>
                  </div>
                </div>

                {/* Sub-column TOTAL */}
                <div className="w-24 border-r border-black flex flex-col">
                  <div className="text-center font-bold text-[9px] border-b border-black bg-slate-50">TOTAL</div>
                  <div className="flex text-center">
                    <div className="w-1/2 border-r border-black font-bold text-[8px]">H</div>
                    <div className="w-1/2 font-bold text-[8px]">M</div>
                  </div>
                  <div className="flex text-center border-t border-black font-bold">
                    <div className="w-1/2 border-r border-black text-[10px]">{evento.hombresCount}</div>
                    <div className="w-1/2 text-[10px]">{evento.mujeresCount}</div>
                  </div>
                </div>

                {/* Right side: HORARIO & HORAS-HOMBRE */}
                <div className="flex-1 flex flex-col">
                  {/* Horario DE A */}
                  <div className="p-1 flex items-center justify-between px-3 border-b border-black">
                    <span className="font-bold text-[9px]">HORARIO:</span>
                    <span className="font-bold text-[9px]">DE: <span className="font-normal">{evento.horarioDe}</span></span>
                    <span className="font-bold text-[9px]">A: <span className="font-normal">{evento.horarioA}</span></span>
                  </div>
                  {/* Total Horas-Hombre */}
                  <div className="p-1 flex items-center justify-between px-3 bg-slate-50">
                    <span className="font-bold text-[9px]">TOTAL HORAS-HOMBRE DE CAPACITACION:</span>
                    <span className="font-bold text-xs">{evento.horasHombreCapacitacion}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: CONTROL DE INSTRUCTORES */}
            <div className="text-center font-bold text-xs uppercase mb-1">CONTROL DE INSTRUCTORES</div>
            <div className="border border-black text-[10px] mb-3">
              {/* EXTERNO */}
              <div className="border-b border-black bg-slate-100 font-bold p-0.5 text-center text-[9px]">
                EXTERNO
              </div>
              <div className="flex border-b border-black font-bold text-[9px] text-center bg-slate-50">
                <div className="w-[45%] p-1 border-r border-black">NOMBRE DEL INSTRUCTOR</div>
                <div className="w-[25%] p-1 border-r border-black">EMPRESA</div>
                <div className="w-[15%] p-1 border-r border-black">RFC</div>
                <div className="w-[15%] p-1">FIRMA</div>
              </div>
              <div className="flex border-b border-black min-h-[26px] items-center text-[10px]">
                <div className="w-[45%] p-1 border-r border-black font-semibold">
                  {evento.instructor.tipo === 'Externo' ? evento.instructor.nombre : ''}
                </div>
                <div className="w-[25%] p-1 border-r border-black">
                  {evento.instructor.tipo === 'Externo' ? evento.instructor.empresa : ''}
                </div>
                <div className="w-[15%] p-1 border-r border-black font-mono">
                  {evento.instructor.tipo === 'Externo' ? evento.instructor.rfc : ''}
                </div>
                <div className="w-[15%] p-0.5 text-center flex items-center justify-center">
                  {evento.instructor.tipo === 'Externo' && evento.instructor.firma ? (
                    evento.instructor.firma.startsWith('data:image') || evento.instructor.firma.startsWith('http') ? (
                      <img src={evento.instructor.firma} alt="Firma" className="max-h-6 max-w-full object-contain" />
                    ) : (
                      <span className="font-serif italic font-bold">{evento.instructor.firma}</span>
                    )
                  ) : null}
                </div>
              </div>

              {/* INTERNO */}
              <div className="border-b border-black bg-slate-100 font-bold p-0.5 text-center text-[9px]">
                INTERNO
              </div>
              <div className="flex border-b border-black font-bold text-[9px] text-center bg-slate-50">
                <div className="w-[45%] p-1 border-r border-black">NOMBRE DEL INSTRUCTOR</div>
                <div className="w-[25%] p-1 border-r border-black">PUESTO</div>
                <div className="w-[15%] p-1 border-r border-black">RFC</div>
                <div className="w-[15%] p-1">FIRMA</div>
              </div>
              <div className="flex min-h-[26px] items-center text-[10px]">
                <div className="w-[45%] p-1 border-r border-black font-semibold">
                  {evento.instructor.tipo === 'Interno' ? evento.instructor.nombre : ''}
                </div>
                <div className="w-[25%] p-1 border-r border-black">
                  {evento.instructor.tipo === 'Interno' ? evento.instructor.puesto : ''}
                </div>
                <div className="w-[15%] p-1 border-r border-black font-mono">
                  {evento.instructor.tipo === 'Interno' ? evento.instructor.rfc : ''}
                </div>
                <div className="w-[15%] p-0.5 text-center flex items-center justify-center">
                  {evento.instructor.tipo === 'Interno' && evento.instructor.firma ? (
                    evento.instructor.firma.startsWith('data:image') || evento.instructor.firma.startsWith('http') ? (
                      <img src={evento.instructor.firma} alt="Firma" className="max-h-6 max-w-full object-contain" />
                    ) : (
                      <span className="font-serif italic font-bold">{evento.instructor.firma}</span>
                    )
                  ) : null}
                </div>
              </div>
            </div>

            {/* SECTION 3: ADMINISTRACION DE RECURSOS */}
            <div className="text-center font-bold text-xs uppercase mb-1">ADMINISTRACION DE RECURSOS</div>
            <div className="border border-black text-[10px] mb-3">
              <div className="flex border-b border-black font-bold text-[9px] text-center bg-slate-50">
                <div className="w-[35%] p-1 border-r border-black">CONTENIDO TEMATICO</div>
                <div className="w-[45%] p-1 border-r border-black">COSTOS</div>
                <div className="w-[20%] p-1">FIRMA DE RH</div>
              </div>

              <div className="flex">
                {/* Contenido Temático Box */}
                <div className="w-[35%] p-3 border-r border-black flex flex-col justify-center items-center text-center">
                  <span className="font-bold text-sm">Se Anexa</span>
                  {evento.nombreAdjunto && (
                    <span className="text-[9px] text-slate-700 mt-1 font-mono">
                      [{evento.nombreAdjunto}]
                    </span>
                  )}
                </div>

                {/* Costos Box */}
                <div className="w-[45%] border-r border-black">
                  <div className="flex border-b border-black p-1 justify-between px-3 text-[9px]">
                    <span className="font-semibold">INSTRUCTOR</span>
                    <span className="font-bold">${evento.costos.costoInstructor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex border-b border-black p-1 justify-between px-3 text-[9px]">
                    <span className="font-semibold">MATERIALES</span>
                    <span className="font-bold">${evento.costos.costoMateriales.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex border-b border-black p-1 justify-between px-3 text-[9px]">
                    <span className="font-semibold">CAFETERIA</span>
                    <span className="font-bold">${evento.costos.costoCafeteria.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex border-b border-black p-1 justify-between px-3 text-[9px]">
                    <span className="font-semibold">OTROS</span>
                    <span className="font-bold">${evento.costos.otrosCostos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex p-1 justify-between px-3 text-[9px] bg-slate-100 font-bold">
                    <span>TOTAL</span>
                    <span>${evento.costos.totalCostos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Firma de RH Box */}
                <div className="w-[20%] p-2 flex flex-col items-center justify-center text-center">
                  {evento.firmaRH && (evento.firmaRH.startsWith('data:image') || evento.firmaRH.startsWith('http')) ? (
                    <img src={evento.firmaRH} alt="Firma RH" className="max-h-12 max-w-full object-contain mb-1" />
                  ) : (
                    <div className="font-bold text-xs text-slate-800 uppercase mb-1">
                      {evento.aprobadoRH ? 'APROBADO RH' : 'PENDIENTE'}
                    </div>
                  )}
                  <span className="text-[8px] text-slate-600 border-t border-black pt-0.5 w-full block">
                    Firma de Recursos Humanos
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 4: PARTICIPANTES TABLE (PAGE 1: Rows 1 to 15) */}
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs uppercase">PARTICIPANTES (1 - 15)</span>
              <span className="text-[9px] font-semibold text-slate-500">Página 1 de {totalPages}</span>
            </div>
            <table className="w-full border-collapse border border-black text-[10px] mb-2">
              <thead>
                <tr className="bg-slate-100 font-bold text-[9px] text-center">
                  <th className="border border-black p-1 w-10">Pos</th>
                  <th className="border border-black p-1 w-24">No. EMP</th>
                  <th className="border border-black p-1 text-left px-2">NOMBRE DEL COLEGA PARTICIPANTE</th>
                  <th className="border border-black p-1 w-36">PUESTO</th>
                  <th className="border border-black p-1 w-32">DEPTO</th>
                  <th className="border border-black p-1 w-24">FIRMA</th>
                </tr>
              </thead>
              <tbody>
                {page1Rows.map((p, index) => (
                  <tr key={p.id} className="h-6">
                    <td className="border border-black p-0.5 text-center font-bold">{index + 1}</td>
                    <td className="border border-black p-0.5 text-center font-mono">{p.noEmp}</td>
                    <td className="border border-black p-0.5 px-2 font-medium">{p.nombre}</td>
                    <td className="border border-black p-0.5 px-1">{p.puesto}</td>
                    <td className="border border-black p-0.5 px-1">{p.depto}</td>
                    <td className="border border-black p-0.5 text-center">
                      {p.firma && (p.firma.startsWith('data:image') || p.firma.startsWith('http')) ? (
                        <img src={p.firma} alt="Firma" className="max-h-5 max-w-[80px] mx-auto object-contain" />
                      ) : p.firma ? (
                        <span className="font-serif italic text-[9px]">Firmado</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Form Footer Banner */}
            <div className="flex items-center justify-between bg-slate-400 text-white font-bold px-3 py-1 text-[9px] tracking-wider uppercase">
              <span>DE SER NECESARIO, CONTINUAR AL REVERSO POR FAVOR</span>
              <span>Página 1 de {totalPages}</span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* CONTINUATION PAGES: (HOJAS DE CONTINUACIÓN / REVERSO)     */}
          {/* ======================================================== */}
          {continuationPages.map((pageChunk, pageIndex) => {
            const pageNum = pageIndex + 2;
            const startRange = PAGE_1_ROWS + pageIndex * CONTINUATION_PAGE_ROWS + 1;
            const endRange = PAGE_1_ROWS + pageIndex * CONTINUATION_PAGE_ROWS + pageChunk.length;

            return (
              <div
                key={`cont_page_${pageNum}`}
                className="bg-white p-6 sm:p-8 rounded-xl shadow-md border border-slate-300 mb-8 print:border-none print:shadow-none print:p-4 print:mb-0 print:break-before-page print:break-after-page"
              >
                {/* Continuation Sheet Header */}
                <div className="border border-black mb-3">
                  <div className="bg-slate-900 text-white p-2 text-center">
                    <h2 className="text-xs font-black tracking-wider uppercase">
                      LISTA DE PARTICIPANTES - HOJA DE CONTINUACIÓN DE ASISTENCIA
                    </h2>
                  </div>
                  <div className="p-2 text-[10px] grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 border-t border-black">
                    <div>
                      <span className="font-bold block text-[9px] text-slate-500">EVENTO:</span>
                      <span className="font-semibold">{evento.nombreEvento}</span>
                    </div>
                    <div>
                      <span className="font-bold block text-[9px] text-slate-500">FOLIO ID:</span>
                      <span className="font-mono font-bold">{evento.id}</span>
                    </div>
                    <div>
                      <span className="font-bold block text-[9px] text-slate-500">FECHAS:</span>
                      <span>{evento.fechaInicio} al {evento.fechaTermino}</span>
                    </div>
                    <div>
                      <span className="font-bold block text-[9px] text-slate-500">INSTRUCTOR:</span>
                      <span className="font-semibold">{evento.instructor.nombre}</span>
                    </div>
                  </div>
                </div>

                {/* Subtitle with participant range */}
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs uppercase">
                    REGISTRO DE PARTICIPANTES (Posiciones {startRange} a {endRange})
                  </span>
                  <span className="text-[9px] font-semibold text-slate-500">
                    Página {pageNum} de {totalPages}
                  </span>
                </div>

                {/* Continuation Participants Table */}
                <table className="w-full border-collapse border border-black text-[10px] mb-3">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-[9px] text-center">
                      <th className="border border-black p-1 w-10">Pos</th>
                      <th className="border border-black p-1 w-24">No. EMP</th>
                      <th className="border border-black p-1 text-left px-2">NOMBRE DEL COLEGA PARTICIPANTE</th>
                      <th className="border border-black p-1 w-14">GÉN.</th>
                      <th className="border border-black p-1 w-36">PUESTO</th>
                      <th className="border border-black p-1 w-32">DEPTO</th>
                      <th className="border border-black p-1 w-28">FIRMA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageChunk.map((p) => (
                      <tr key={p.id} className="h-6">
                        <td className="border border-black p-0.5 text-center font-bold">{p.pos}</td>
                        <td className="border border-black p-0.5 text-center font-mono">{p.noEmp}</td>
                        <td className="border border-black p-0.5 px-2 font-medium">{p.nombre}</td>
                        <td className="border border-black p-0.5 text-center font-bold text-[9px]">{p.genero}</td>
                        <td className="border border-black p-0.5 px-1">{p.puesto}</td>
                        <td className="border border-black p-0.5 px-1">{p.depto}</td>
                        <td className="border border-black p-0.5 text-center">
                          {p.firma && (p.firma.startsWith('data:image') || p.firma.startsWith('http')) ? (
                            <img src={p.firma} alt="Firma" className="max-h-5 max-w-[90px] mx-auto object-contain" />
                          ) : p.firma ? (
                            <span className="font-serif italic text-[9px]">Firmado</span>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Footer Bar */}
                <div className="flex items-center justify-between bg-slate-800 text-white font-bold px-3 py-1 text-[9px] tracking-wider uppercase">
                  <span>SISTEMA DE CONTROL DE CAPACITACIÓN • REGISTRO OFICIAL DE ASISTENCIA</span>
                  <span>Página {pageNum} de {totalPages}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
