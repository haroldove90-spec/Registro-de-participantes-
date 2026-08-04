import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, PenTool } from 'lucide-react';

interface SignatureCanvasProps {
  onSave: (signatureDataUrl: string) => void;
  initialSignature?: string;
  label?: string;
  readOnly?: boolean;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  onSave,
  initialSignature,
  label = 'Captura de Firma Digital',
  readOnly = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!initialSignature);
  const [signatureData, setSignatureData] = useState<string | undefined>(initialSignature);

  useEffect(() => {
    if (initialSignature) {
      setSignatureData(initialSignature);
      setHasSignature(true);
    }
  }, [initialSignature]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b'; // Slate 800

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      const dataUrl = canvas.toDataURL('image/png');
      setSignatureData(dataUrl);
      onSave(dataUrl);
    }
  };

  const clearCanvas = () => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSignatureData(undefined);
    onSave('');
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-blue-600" />
          {label}
        </label>
        {hasSignature && !readOnly && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <Check className="w-3 h-3" /> Capturada
          </span>
        )}
      </div>

      <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors overflow-hidden">
        {signatureData && !isDrawing && readOnly ? (
          <div className="h-28 flex items-center justify-center p-2 bg-white">
            {signatureData.startsWith('data:image') || signatureData.startsWith('http') ? (
              <img src={signatureData} alt="Firma" className="max-h-24 object-contain" />
            ) : (
              <span className="font-serif italic text-lg text-slate-700 font-semibold px-4 py-2 border-b-2 border-slate-800">
                {signatureData === 'firmado' ? '✓ Firma Electrónica Registrada' : signatureData}
              </span>
            )}
          </div>
        ) : (
          <>
            <canvas
              ref={canvasRef}
              width={400}
              height={110}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-28 touch-none cursor-crosshair bg-white"
            />
            {!hasSignature && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-slate-400 select-none">
                Firme aquí usando mouse o pantalla táctil
              </div>
            )}
          </>
        )}

        {!readOnly && (
          <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1">
            <button
              type="button"
              onClick={clearCanvas}
              title="Borrar firma"
              className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors flex items-center gap-1"
            >
              <Eraser className="w-3 h-3 text-slate-500" /> Limpiar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
