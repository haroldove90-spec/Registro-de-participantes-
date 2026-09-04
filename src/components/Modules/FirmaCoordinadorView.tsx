import React, { useState } from 'react';
import {
  PenTool,
  CheckCircle2,
  Clock,
  UserCheck,
  Building2,
  Calendar,
  Share2,
  Search,
  ArrowLeft,
  Smartphone,
  Check,
  AlertCircle,
  X,
  FileSignature,
  Sparkles,
  Users,
} from 'lucide-react';
import { EventoData, Participant, UserProfile } from '../../types';
import { SignatureCanvas } from '../SignatureCanvas';
import { upsertEventoToSupabase } from '../../lib/supabase';
import {
  playNotificationSound,
  notifyEventSignaturesCompleted,
} from '../../utils/notifications';

interface FirmaCoordinadorViewProps {
  evento: EventoData;
  userProfile?: UserProfile;
  onUpdateEvento: (eventoActualizado: EventoData) => void;
  onClose?: () => void;
}

export const FirmaCoordinadorView: React.FC<FirmaCoordinadorViewProps> = ({
  evento,
  userProfile,
  onUpdateEvento,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [tempSignature, setTempSignature] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  const total = evento.participantes?.length || 0;
  const firmadosCount = evento.participantes?.filter((p) => !!p.firma).length || 0;
  const porcentaje = total > 0 ? Math.round((firmadosCount / total) * 100) : 0;
  const todoFirmado = total > 0 && firmadosCount === total;

  const filteredParticipants = (evento.participantes || []).filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.noEmp && p.noEmp.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.depto && p.depto.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.puesto && p.puesto.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenFirmaModal = (participant: Participant) => {
    setSelectedParticipant(participant);
    setTempSignature(participant.firma || '');
  };

  const handleCloseFirmaModal = () => {
    setSelectedParticipant(null);
    setTempSignature('');
  };

  const handleSaveFirma = async () => {
    if (!selectedParticipant) return;
    if (!tempSignature || tempSignature.trim().length === 0) {
      alert('Por favor solicita al participante que dibuje su firma en el recuadro antes de guardar.');
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const updatedParticipants = evento.participantes.map((p) => {
        if (p.id === selectedParticipant.id) {
          return {
            ...p,
            firma: tempSignature,
            confirmado: true,
            fechaConfirmacion: now,
          };
        }
        return p;
      });

      const updatedEvento: EventoData = {
        ...evento,
        participantes: updatedParticipants,
        estado: updatedParticipants.every((p) => !!p.firma) ? 'Completado' : evento.estado,
      };

      // 1. Update in memory & parent state
      onUpdateEvento(updatedEvento);

      // 2. Persist to Supabase
      await upsertEventoToSupabase(updatedEvento);

      // 3. Audio confirmation
      playNotificationSound();

      setToastMessage(`¡Firma guardada correctamente para ${selectedParticipant.nombre}!`);
      setTimeout(() => setToastMessage(''), 4000);

      // 4. Check if 100% completed
      const allSignedNow = updatedParticipants.every((p) => !!p.firma);
      if (allSignedNow && !todoFirmado) {
        notifyEventSignaturesCompleted(updatedEvento);
      }

      handleCloseFirmaModal();
    } catch (err: any) {
      console.error('Error saving signature:', err);
      alert('Ocurrió un error al guardar la firma: ' + (err?.message || 'Error desconocido'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-16 animate-fade-in font-sans">
      {/* Top Bar for Tablet / Phone */}
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 sm:px-6 shadow-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="Volver al panel"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-1.5 text-xs text-blue-400 font-bold uppercase tracking-wider">
                <FileSignature className="w-4 h-4" />
                <span>Módulo de Firmas en Campo</span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-white truncate max-w-xs sm:max-w-md">
                {evento.nombreEvento}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                todoFirmado
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              {firmadosCount} / {total} Firmados ({porcentaje}%)
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="p-4 rounded-2xl bg-emerald-600/90 text-white font-bold text-sm shadow-xl flex items-center gap-3 border border-emerald-400 animate-bounce">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Event Card Summary */}
        <section className="bg-slate-800/90 rounded-3xl p-5 sm:p-6 border border-slate-700/80 shadow-xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1 bg-slate-900/60 p-3 rounded-2xl border border-slate-700/50">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" /> Fecha del Evento
              </span>
              <p className="text-white font-bold text-sm">{evento.fechaInicio}</p>
            </div>

            <div className="space-y-1 bg-slate-900/60 p-3 rounded-2xl border border-slate-700/50">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Modalidad / Lugar
              </span>
              <p className="text-white font-bold text-sm">{evento.ubicacionModalidad} ({evento.tipoEvento})</p>
            </div>

            <div className="space-y-1 bg-slate-900/60 p-3 rounded-2xl border border-slate-700/50">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-purple-400" /> Instructor
              </span>
              <p className="text-white font-bold text-sm truncate">{evento.instructor?.nombre || 'Por asignar'}</p>
            </div>

            <div className="space-y-1 bg-slate-900/60 p-3 rounded-2xl border border-slate-700/50">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" /> Coordinador Responsable
              </span>
              <p className="text-white font-bold text-sm truncate">
                {evento.coordinadorNombre || 'Coordinador en Campo'}
              </p>
              {evento.coordinadorWhatsApp && (
                <p className="text-[11px] text-emerald-400 font-mono font-medium">
                  WA: {evento.coordinadorWhatsApp}
                </p>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300">Progreso de Recolección de Firmas</span>
              <span className={todoFirmado ? 'text-emerald-400' : 'text-blue-400'}>
                {firmadosCount} de {total} participantes ({porcentaje}%)
              </span>
            </div>
            <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-slate-700/70 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  todoFirmado
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                }`}
                style={{ width: `${porcentaje}%` }}
              />
            </div>
            {todoFirmado && (
              <p className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-4 h-4" />
                ¡Todas las firmas han sido recabadas! El Administrador y Supervisor pueden ver el evento completo en el sistema.
              </p>
            )}
          </div>
        </section>

        {/* Participants Table / List Section */}
        <section className="bg-slate-800/90 rounded-3xl p-5 sm:p-6 border border-slate-700/80 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span>Lista Oficial de Asistencia ({filteredParticipants.length})</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Selecciona al participante para abrir el lienzo de firma digital en tu dispositivo.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, no. emp o depto..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          {filteredParticipants.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-500" />
              <p className="text-sm">No se encontraron participantes con ese criterio de búsqueda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredParticipants.map((p) => {
                const isSigned = !!p.firma;
                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isSigned
                        ? 'bg-slate-900/80 border-emerald-500/30'
                        : 'bg-slate-900/50 border-slate-700/70 hover:border-blue-500/50'
                    }`}
                  >
                    {/* Participant Details */}
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSigned
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {p.pos || '#'}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-white truncate">{p.nombre}</h3>
                          {p.noEmp && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {p.noEmp}
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              p.genero === 'M'
                                ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            {p.genero === 'M' ? 'Mujer' : 'Hombre'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {p.puesto || 'Puesto no especificado'} • {p.depto || 'General'}
                        </p>
                      </div>
                    </div>

                    {/* Signature Preview & Action Button */}
                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      {isSigned ? (
                        <div className="flex items-center gap-3">
                          {/* Signature Graphic Preview */}
                          <div className="h-11 w-28 bg-white rounded-lg p-1 border border-slate-300 flex items-center justify-center overflow-hidden shadow-inner">
                            <img
                              src={p.firma}
                              alt={`Firma de ${p.nombre}`}
                              className="max-h-full max-w-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/30">
                              <Check className="w-3.5 h-3.5" />
                              <span>Firmado</span>
                            </span>

                            <button
                              type="button"
                              onClick={() => handleOpenFirmaModal(p)}
                              className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                            >
                              Volver a firmar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenFirmaModal(p)}
                          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer active:scale-95"
                        >
                          <PenTool className="w-4 h-4 text-white" />
                          <span>Recabar Firma</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* ================= MODAL FLOTANTE DE CAPTURA DE FIRMA ================= */}
      {selectedParticipant && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-firma-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 text-white animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
                  <PenTool className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="modal-firma-title" className="text-base font-bold text-white">
                    Firma Digital de Asistencia
                  </h3>
                  <p className="text-xs text-slate-400">
                    Evento: <span className="text-slate-200 font-medium">{evento.nombreEvento}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseFirmaModal}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Participant Card */}
            <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 text-[11px]">Participante a firmar:</span>
                <p className="font-bold text-sm text-white">{selectedParticipant.nombre}</p>
                <p className="text-slate-400 text-[11px]">
                  {selectedParticipant.puesto || 'Puesto'} • {selectedParticipant.depto || 'Departamento'}
                </p>
              </div>

              {selectedParticipant.noEmp && (
                <div className="text-right">
                  <span className="text-slate-500 text-[10px]">No. Empleado:</span>
                  <p className="font-mono font-bold text-xs text-blue-400">{selectedParticipant.noEmp}</p>
                </div>
              )}
            </div>

            {/* Canvas Area */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Dibuja tu firma con tu dedo, pluma digital o mouse sobre el lienzo:
              </label>

              <div className="border-2 border-dashed border-slate-600 rounded-2xl overflow-hidden bg-white p-1 shadow-inner">
                <SignatureCanvas
                  initialSignature={tempSignature}
                  height={170}
                  label="Firma de Asistencia"
                  onSave={(signatureDataUrl) => {
                    setTempSignature(signatureDataUrl);
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseFirmaModal}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveFirma}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSaving ? 'Guardando...' : 'Guardar Firma del Participante'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
