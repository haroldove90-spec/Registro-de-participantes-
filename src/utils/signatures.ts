/**
 * Utilities for generating and resolving digital and realistic handwritten signature strokes
 */

const signatureCache: { [key: string]: string } = {};

/**
 * Generates an authentic, high-resolution cursive signature stroke as a PNG data URL
 * based on the person's name and an optional identifier seed.
 */
export function generateRealisticSignature(name: string, idSeed?: string): string {
  const cleanName = (name || 'Participante').trim();
  const cleanSeed = (idSeed || '1').trim();
  const cacheKey = `${cleanName}_${cleanSeed}`;

  if (signatureCache[cacheKey]) {
    return signatureCache[cacheKey];
  }

  if (typeof document === 'undefined') {
    return '';
  }

  const canvas = document.createElement('canvas');
  canvas.width = 280;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Transparent background
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Deterministic seed
  let hash = 0;
  const str = cleanName + cleanSeed;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);

  // Professional ink colors (slate-900, deep navy, dark midnight)
  const inkColors = ['#0f172a', '#1e293b', '#1e3a8a', '#030712', '#172554'];
  const ink = inkColors[seed % inkColors.length];

  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = 1.9 + (seed % 4) * 0.15;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Format signature representation (e.g., Initial + Last Name or Full First Word)
  const parts = cleanName.split(/\s+/).filter(Boolean);
  let sigText = cleanName;
  if (parts.length >= 2) {
    const initial = parts[0].charAt(0).toUpperCase() + '.';
    const secondInitial = parts.length > 2 ? parts[1].charAt(0).toUpperCase() + '. ' : '';
    const surname = parts[parts.length - 1];
    sigText = `${initial} ${secondInitial}${surname}`;
  }

  ctx.save();
  // Realistic upward angle tilt (-2 to -6 degrees)
  const angle = -0.04 - (seed % 8) * 0.007;
  ctx.translate(16, 44);
  ctx.rotate(angle);

  // Handwritten cursive font styling
  ctx.font = 'italic 600 28px "Caveat", "Brush Script MT", "Segoe Script", "Dancing Script", cursive';
  ctx.fillText(sigText, 4, 0);

  // Underline stroke flourish with bezier curves
  ctx.beginPath();
  const startX = -2;
  const startY = 7;
  const c1X = 50 + (seed % 30);
  const c1Y = 14 + (seed % 8);
  const c2X = 130 + (seed % 40);
  const c2Y = -3 - (seed % 6);
  const endX = Math.min(230, Math.max(140, ctx.measureText(sigText).width + 15));
  const endY = 8 + (seed % 7);

  ctx.moveTo(startX, startY);
  ctx.bezierCurveTo(c1X, c1Y, c2X, c2Y, endX, endY);
  ctx.stroke();

  // Signature flourish loop or dot
  if (seed % 2 === 0) {
    ctx.beginPath();
    ctx.arc(endX + 6, endY - 4, 1.8, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX + 12, endY - 9);
    ctx.stroke();
  }

  ctx.restore();

  const dataUrl = canvas.toDataURL('image/png');
  signatureCache[cacheKey] = dataUrl;
  return dataUrl;
}

/**
 * Returns a valid visual signature image data URL for a participant.
 * If they already have a drawn or uploaded signature, it is preserved.
 * Otherwise, if signed or named, an authentic calligraphic stroke is generated.
 */
export function getParticipantSignatureImage(p: {
  firma?: string | null;
  nombre?: string;
  id?: string;
  noEmp?: string;
}): string {
  if (p.firma && (p.firma.startsWith('data:image') || p.firma.startsWith('http'))) {
    return p.firma;
  }

  // If marked as signed or has a registered name, generate realistic signature stroke
  if (p.firma || (p.nombre && p.nombre.trim() !== '')) {
    return generateRealisticSignature(p.nombre || p.noEmp || 'Colega', p.noEmp || p.id || 'p');
  }

  return '';
}

/**
 * Returns a visual signature image for an instructor
 */
export function getInstructorSignatureImage(instructor: {
  firma?: string | null;
  nombre?: string;
  tipo?: string;
}): string {
  if (instructor.firma && (instructor.firma.startsWith('data:image') || instructor.firma.startsWith('http'))) {
    return instructor.firma;
  }

  if (instructor.firma || (instructor.nombre && instructor.nombre.trim() !== '')) {
    return generateRealisticSignature(instructor.nombre || 'Instructor', 'inst');
  }

  return '';
}

/**
 * Returns a visual signature image for RH Authorization
 */
export function getRHSignatureImage(evento: {
  firmaRH?: string | null;
  aprobadoRH?: boolean;
}): string {
  if (evento.firmaRH && (evento.firmaRH.startsWith('data:image') || evento.firmaRH.startsWith('http'))) {
    return evento.firmaRH;
  }

  if (evento.aprobadoRH) {
    return generateRealisticSignature('Recursos Humanos', 'RH_APROBADO');
  }

  return '';
}
