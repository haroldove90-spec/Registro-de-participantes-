import React, { useRef } from 'react';
import { EventoData } from '../types';
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

  // 16 rows minimum for the official form
  const minRows = 16;
  const participantRows = [...evento.participantes];
  while (participantRows.length < minRows) {
    participantRows.push({
      id: `empty_${participantRows.length + 1}`,
      pos: participantRows.length + 1,
      noEmp: '',
      nombre: '',
      genero: 'H',
      puesto: '',
      depto: '',
      firma: '',
    });
  }

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
              <h3 className="font-bold text-sm text-white">Formato Oficial de Lista de Asistencia (1:1)</h3>
              <p className="text-[11px] text-slate-300">
                {evento.nombreEvento} • ID: {evento.id}
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
          className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white text-black font-sans print:p-4 print:overflow-visible"
          style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
        >
          {/* Document Header */}
          <div className="text-center mb-3">
            <h1 className="text-sm font-black tracking-wide uppercase">LISTA DE PARTICIPANTES</h1>
            <h2 className="text-xs font-bold tracking-wide uppercase">DATOS GENERALES</h2>
          </div>

          {/* SECTION 1: DATOS GENERALES GRID */}
          <div className="border border-black text-[11px] mb-4">
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

              {/* Start Date */}
              <div className="flex border-r border-black">
                <div className="border-r border-black p-1 text-center min-w-[28px]">
                  <span className="block font-bold text-[8px]">DIA</span>
                  <span className="font-semibold">{startParsed.dia}</span>
                </div>
                <div className="border-r border-black p-1 text-center min-w-[32px]">
                  <span className="block font-bold text-[8px]">MES</span>
                  <span className="font-semibold">{startParsed.mes}</span>
                </div>
                <div className="p-1 text-center min-w-[40px]">
                  <span className="block font-bold text-[8px]">AÑO</span>
                  <span className="font-semibold">{startParsed.ano}</span>
                </div>
              </div>

              {/* A separator */}
              <div className="p-1 flex items-center justify-center font-bold px-2 border-r border-black">
                A
              </div>

              {/* End Date */}
              <div className="flex border-r border-black">
                <div className="border-r border-black p-1 text-center min-w-[28px]">
                  <span className="block font-bold text-[8px]">DIA</span>
                  <span className="font-semibold">{endParsed.dia}</span>
                </div>
                <div className="border-r border-black p-1 text-center min-w-[32px]">
                  <span className="block font-bold text-[8px]">MES</span>
                  <span className="font-semibold">{endParsed.mes}</span>
                </div>
                <div className="p-1 text-center min-w-[40px]">
                  <span className="block font-bold text-[8px]">AÑO</span>
                  <span className="font-semibold">{endParsed.ano}</span>
                </div>
              </div>

              {/* No Dias */}
              <div className="border-r border-black p-1 text-center flex-1">
                <span className="block font-bold text-[9px]">No DIAS</span>
                <span className="font-bold text-xs">{evento.noDias}</span>
              </div>

              {/* Total Hrs */}
              <div className="p-1 text-center flex-1">
                <span className="block font-bold text-[9px]">TOTAL HRS DE CAPACITACION</span>
                <span className="font-bold text-xs">{evento.horasCapacitacion}</span>
              </div>
            </div>

            {/* Row 5: Numero de Participantes Matrix (MM, OP, Campo, Total, Horario, Total Horas-Hombre) */}
            <div className="flex text-[10px]">
              <div className="p-1 font-bold border-r border-black flex flex-col justify-center text-center px-2">
                <span>NUMERO DE</span>
                <span>PARTICIPANTES</span>
              </div>

              {/* MM */}
              <div className="border-r border-black text-center">
                <div className="border-b border-black font-bold p-0.5 text-[9px]">MM</div>
                <div className="flex">
                  <div className="p-1 border-r border-black min-w-[24px]">
                    <span className="block text-[8px] font-bold">H</span>
                    <span>{mmH}</span>
                  </div>
                  <div className="p-1 min-w-[24px]">
                    <span className="block text-[8px] font-bold">M</span>
                    <span>{mmM}</span>
                  </div>
                </div>
              </div>

              {/* OP */}
              <div className="border-r border-black text-center">
                <div className="border-b border-black font-bold p-0.5 text-[9px]">OP</div>
                <div className="flex">
                  <div className="p-1 border-r border-black min-w-[24px]">
                    <span className="block text-[8px] font-bold">H</span>
                    <span>{opH}</span>
                  </div>
                  <div className="p-1 min-w-[24px]">
                    <span className="block text-[8px] font-bold">M</span>
                    <span>{opM}</span>
                  </div>
                </div>
              </div>

              {/* CAMPO */}
              <div className="border-r border-black text-center">
                <div className="border-b border-black font-bold p-0.5 text-[9px]">CAMPO</div>
                <div className="flex">
                  <div className="p-1 border-r border-black min-w-[24px]">
                    <span className="block text-[8px] font-bold">H</span>
                    <span>{campoH}</span>
                  </div>
                  <div className="p-1 min-w-[24px]">
                    <span className="block text-[8px] font-bold">M</span>
                    <span>{campoM}</span>
                  </div>
                </div>
              </div>

              {/* TOTAL */}
              <div className="border-r border-black text-center">
                <div className="border-b border-black font-bold p-0.5 text-[9px]">TOTAL</div>
                <div className="flex">
                  <div className="p-1 border-r border-black min-w-[26px]">
                    <span className="block text-[8px] font-bold">H</span>
                    <span className="font-bold">{evento.hombresCount}</span>
                  </div>
                  <div className="p-1 min-w-[26px]">
                    <span className="block text-[8px] font-bold">M</span>
                    <span className="font-bold">{evento.mujeresCount}</span>
                  </div>
                </div>
              </div>

              {/* HORARIO & TOTAL HORAS HOMBRE */}
              <div className="flex-1 flex flex-col">
                <div className="border-b border-black p-1 flex items-center justify-between px-3 text-[9px]">
                  <span className="font-bold">HORARIO</span>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">DE</span>
                    <span className="border-b border-black px-1 font-mono">{evento.horarioDe}</span>
                    <span className="font-semibold">A</span>
                    <span className="border-b border-black px-1 font-mono">{evento.horarioA}</span>
                  </div>
                </div>
                <div className="p-1 flex items-center justify-between px-3 text-[9px] bg-slate-50/50">
                  <span className="font-bold">TOTAL HORAS-HOMBRE DE CAPACITACION:</span>
                  <span className="font-bold text-xs">{evento.horasHombreCapacitacion}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: CONTROL DE INSTRUCTORES */}
          <div className="text-center font-bold text-xs uppercase mb-1">CONTROL DE INSTRUCTORES</div>
          <div className="border border-black text-[10px] mb-4">
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
          <div className="border border-black text-[10px] mb-4">
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

          {/* SECTION 4: PARTICIPANTES TABLE (16 rows) */}
          <div className="text-center font-bold text-xs uppercase mb-1">PARTICIPANTES</div>
          <table className="w-full border-collapse border border-black text-[10px] mb-3">
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
              {participantRows.map((p, index) => (
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
          <div className="bg-slate-400 text-white font-bold text-center text-[10px] py-1 tracking-wider uppercase">
            DE SER NECESARIO, CONTINUAR AL REVERSO POR FAVOR
          </div>
        </div>
      </div>
    </div>
  );
};
