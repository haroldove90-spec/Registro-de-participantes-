import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, Check, PenTool, RotateCcw, CheckCircle2, Eye } from 'lucide-react';

interface SignatureCanvasProps {
  onSave: (signatureDataUrl: string) => void;
  initialSignature?: string;
  label?: string;
  readOnly?: boolean;
  height?: number;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  onSave,
  initialSignature,
  label = 'Captura de Firma Digital',
  readOnly = false,
  height = 130,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signatureData, setSignatureData] = useState<string | undefined>(initialSignature);
  const [isSaved, setIsSaved] = useState(!!initialSignature);

  // Load existing signature on canvas or state
  useEffect(() => {
    setSignatureData(initialSignature);
    if (initialSignature) {
      setIsSaved(true);
      setHasDrawn(true);

      if (initialSignature.startsWith('data:image') || initialSignature.startsWith('http')) {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = initialSignature;
          }
        }
      }
    }
  }, [initialSignature]);

  // Coordinate normalizer accounting for responsive CSS stretching
  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | MouseEvent | TouchEvent
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX = 0;
    let clientY = 0;
    
    if ('touches' in e && e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('changedTouches' in e && e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a'; // Deep Slate
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
    setIsSaved(false);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && hasDrawn) {
      const dataUrl = canvas.toDataURL('image/png');
      setSignatureData(dataUrl);
      setIsSaved(true);
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
    setHasDrawn(false);
    setSignatureData('');
    setIsSaved(false);
    onSave('');
  };

  // Prevent default scroll on touch devices when drawing on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventTouch = (e: TouchEvent) => {
      if (e.target === canvas) {
        e.preventDefault();
      }
    };

    canvas.addEventListener('touchstart', preventTouch, { passive: false });
    canvas.addEventListener('touchmove', preventTouch, { passive: false });
    return () => {
      canvas.removeEventListener('touchstart', preventTouch);
      canvas.removeEventListener('touchmove', preventTouch);
    };
  }, []);

  return (
    <div className="w-full space-y-2 select-none">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-blue-600" />
          {label}
        </label>
        
        <div className="flex items-center gap-2">
          {isSaved && hasDrawn && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Firma Registrada
            </span>
          )}
        </div>
      </div>

      <div className="relative border-2 border-dashed border-slate-300 rounded-2xl bg-white hover:border-blue-400 transition-colors overflow-hidden shadow-2xs">
        {/* ReadOnly Display if already has signature */}
        {readOnly && signatureData ? (
          <div className="h-32 flex items-center justify-center p-3 bg-slate-50/50">
            {signatureData.startsWith('data:image') || signatureData.startsWith('http') ? (
              <img src={signatureData} alt="Firma Registrada" className="max-h-24 max-w-full object-contain" />
            ) : (
              <div className="text-center font-serif italic text-base text-slate-800 font-bold px-4 py-2 border-b-2 border-slate-800">
                {signatureData}
              </div>
            )}
          </div>
        ) : (
          <>
            <canvas
              ref={canvasRef}
              width={600}
              height={180}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-32 touch-none cursor-crosshair bg-white"
            />

            {/* Guide text if not drawn */}
            {!hasDrawn && !signatureData && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-xs text-slate-400 select-none space-y-1">
                <PenTool className="w-5 h-5 text-slate-300 animate-bounce" />
                <p className="font-medium">Dibuja tu firma digital aquí con el mouse, lápiz táctil o dedo</p>
                <p className="text-[10px] text-slate-300">Se guarda automáticamente en alta resolución</p>
              </div>
            )}
          </>
        )}

        {/* Action Controls Bar */}
        {!readOnly && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-white/90 backdrop-blur-xs p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={clearCanvas}
              title="Borrar y limpiar trazo de firma"
              className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Eraser className="w-3.5 h-3.5 text-slate-400 hover:text-rose-500" />
              <span>Limpiar</span>
            </button>
          </div>
        )}
      </div>

      <p className="text-[10px] text-slate-400 italic">
        * La firma capturada se almacena en base64 / PNG en Supabase para validez en reportes PDF y listas de asistencia.
      </p>
    </div>
  );
};
