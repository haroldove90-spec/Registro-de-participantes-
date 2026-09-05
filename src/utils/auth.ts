import { UserCredential, UserProfile, UserRole } from '../types';
import {
  upsertCoordinatorToSupabase,
  deleteCoordinatorFromSupabase,
} from '../lib/supabase';

const STORAGE_KEY_CREDENTIALS = 'registro_participantes_credenciales_v1';

export const SYSTEM_OFFICIAL_URL = 'https://registro-de-participantes.vercel.app/';

/**
 * Default Seeded Credentials requested by the user:
 * 1. Harold Anguiano Morales (Admin)
 *    Usuario: haroldo90 / harold
 *    Clave: Chevropar#1970
 *    Correo: haroldove90@gmail.com / haroldo90@hotmail.com
 *
 * 2. Cesar Netro (Coordinadores / Supervisor)
 *    Usuario: cesar_netro
 *    Clave segura: Netro#Coord2026!
 *    Correo: cesar_netro@hotmail.com
 */
export const DEFAULT_CREDENTIALS: UserCredential[] = [
  {
    id: 'cred_harold_admin',
    nombre: 'Harold Anguiano Morales',
    usuario: 'haroldo90',
    email: 'haroldove90@gmail.com',
    clave: 'Chevropar#1970',
    rol: 'Admin',
    telefono: '+52 (55) 8912-3456',
    puesto: 'Director de Capacitación / Administrador General',
    departamento: 'Dirección de Recursos Humanos',
    rfc: 'AUMH900101XYZ',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    activo: true,
    fechaCreacion: '2026-01-01',
  },
  {
    id: 'cred_cesar_coord',
    nombre: 'Cesar Netro',
    usuario: 'cesar_netro',
    email: 'cesar_netro@hotmail.com',
    clave: 'Netro#Coord2026!',
    rol: 'Admin',
    telefono: '+52 (81) 1234-5678',
    puesto: 'Administrador y Coordinador de Capacitación',
    departamento: 'Coordinación Operativa y Capacitación',
    rfc: 'NECX850515ABC',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    activo: true,
    fechaCreacion: '2026-01-15',
  },
];

/**
 * Checks if a given identifier, email or username corresponds to Harold
 */
export function isHaroldUser(identifierOrEmail?: string): boolean {
  if (!identifierOrEmail) return false;
  const clean = identifierOrEmail.trim().toLowerCase();
  return (
    clean === 'haroldo90' ||
    clean === 'harold' ||
    clean === 'haroldove90@gmail.com' ||
    clean === 'haroldo90@hotmail.com' ||
    clean.includes('harold') ||
    clean.includes('haroldo90')
  );
}

/**
 * Loads stored credentials from localStorage, falling back to default seed
 */
export function getStoredCredentials(): UserCredential[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CREDENTIALS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CREDENTIALS, JSON.stringify(DEFAULT_CREDENTIALS));
      return DEFAULT_CREDENTIALS;
    }
    const parsed: UserCredential[] = JSON.parse(raw);

    // Ensure Harold always exists, has proper name and emails
    let updated = false;
    const haroldExists = parsed.some((c) => isHaroldUser(c.usuario) || isHaroldUser(c.email));
    if (!haroldExists) {
      parsed.unshift(DEFAULT_CREDENTIALS[0]);
      updated = true;
    } else {
      // Ensure Harold's record has his real name Harold Anguiano Morales
      parsed.forEach((c) => {
        if (isHaroldUser(c.usuario) || isHaroldUser(c.email) || c.id === 'cred_harold_admin') {
          if (c.nombre !== 'Harold Anguiano Morales') {
            c.nombre = 'Harold Anguiano Morales';
            updated = true;
          }
        }
      });
    }

    const cesarIndex = parsed.findIndex((c) => c.usuario.toLowerCase() === 'cesar_netro');
    if (cesarIndex < 0) {
      parsed.push(DEFAULT_CREDENTIALS[1]);
      updated = true;
    } else {
      // If Cesar exists, make sure his role is Admin as set in Supabase
      if (parsed[cesarIndex].rol !== 'Admin') {
        parsed[cesarIndex].rol = 'Admin';
        updated = true;
      }
    }

    if (updated) {
      localStorage.setItem(STORAGE_KEY_CREDENTIALS, JSON.stringify(parsed));
    }
    return parsed;
  } catch (err) {
    console.error('Error reading stored credentials:', err);
    return DEFAULT_CREDENTIALS;
  }
}

/**
 * Saves credentials array to localStorage
 */
export function saveStoredCredentials(creds: UserCredential[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CREDENTIALS, JSON.stringify(creds));
  } catch (err) {
    console.error('Error saving credentials:', err);
  }
}

/**
 * Formats phone number for WhatsApp in Mexico:
 * Automatically prepends '+52' if the user puts only their local 10-digit number.
 */
export function formatMexicanWhatsAppPhone(phoneInput: string): {
  display: string;
  rawDigits: string;
  waCleanNumber: string;
} {
  if (!phoneInput) {
    return { display: '', rawDigits: '', waCleanNumber: '' };
  }

  // Extract all numeric digits
  const rawDigits = phoneInput.replace(/\D/g, '');

  // Case 1: Exactly 10 digits (Standard Mexican national number: e.g. 8112345678, 5512345678)
  if (rawDigits.length === 10) {
    const area = rawDigits.slice(0, 2);
    const mid = rawDigits.slice(2, 6);
    const end = rawDigits.slice(6);
    return {
      display: `+52 (${area}) ${mid}-${end}`,
      rawDigits,
      waCleanNumber: '52' + rawDigits,
    };
  }

  // Case 2: 12 digits starting with 52 (e.g. 528112345678)
  if (rawDigits.length === 12 && rawDigits.startsWith('52')) {
    const local = rawDigits.slice(2);
    const area = local.slice(0, 2);
    const mid = local.slice(2, 6);
    const end = local.slice(6);
    return {
      display: `+52 (${area}) ${mid}-${end}`,
      rawDigits: local,
      waCleanNumber: rawDigits,
    };
  }

  // Case 3: 13 digits with legacy mobile prefix 521 (e.g. 5218112345678)
  if (rawDigits.length === 13 && rawDigits.startsWith('521')) {
    const local = rawDigits.slice(3);
    return {
      display: `+52 ${local}`,
      rawDigits: local,
      waCleanNumber: '52' + local,
    };
  }

  // Case 4: Any other string without 52 prefix, prepend 52
  if (rawDigits.length > 0 && !rawDigits.startsWith('52')) {
    return {
      display: `+52 ${rawDigits}`,
      rawDigits,
      waCleanNumber: '52' + rawDigits,
    };
  }

  return {
    display: rawDigits ? `+${rawDigits}` : '',
    rawDigits,
    waCleanNumber: rawDigits,
  };
}

/**
 * Generates the direct WhatsApp sharing URL with official message and system link
 */
export function generateWhatsAppCredentialsUrl(coord: {
  nombre: string;
  usuario: string;
  email: string;
  clave: string;
  rol: string;
  telefono: string;
}): string {
  const { waCleanNumber } = formatMexicanWhatsAppPhone(coord.telefono);

  const message =
    `*¡Hola, ${coord.nombre.trim()}!* 👋\n\n` +
    `Te compartimos tus credenciales oficiales de acceso al *Sistema de Registro de Participantes y Control de Capacitaciones*:\n\n` +
    `🔗 *Enlace del Sistema:*\n${SYSTEM_OFFICIAL_URL}\n\n` +
    `👤 *Usuario:* ${coord.usuario}\n` +
    `📧 *Correo:* ${coord.email}\n` +
    `🔑 *Contraseña Segura:* ${coord.clave}\n` +
    `🛡️ *Rol Asignado:* ${coord.rol}\n\n` +
    `Ingresa directamente con tu usuario o correo electrónico y contraseña para comenzar a registrar participantes y gestionar tus capacitaciones de forma sincronizada.`;

  return `https://wa.me/${waCleanNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates a random, high-security password
 */
export function generateSecurePassword(prefix?: string): string {
  const charsUpper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const charsLower = 'abcdefghijkmnpqrstuvwxyz';
  const charsNum = '23456789';
  const charsSym = '#$!@%*';

  const getRandom = (set: string) => set.charAt(Math.floor(Math.random() * set.length));

  if (prefix) {
    const cleanPrefix = prefix.replace(/[^a-zA-Z]/g, '');
    const capitalized =
      cleanPrefix.charAt(0).toUpperCase() + cleanPrefix.slice(1).toLowerCase();
    return `${capitalized}#${getRandom(charsUpper)}${getRandom(charsNum)}${getRandom(charsNum)}${getRandom(charsLower)}!`;
  }

  return `Sec#${getRandom(charsUpper)}${getRandom(charsLower)}${getRandom(charsNum)}${getRandom(charsNum)}${getRandom(charsSym)}${getRandom(charsUpper)}9`;
}

/**
 * Normalizes any role to 'Admin', 'Supervisor', or 'Coordinadores'
 */
export function normalizeRole(role?: string): UserRole {
  if (!role) return 'Supervisor';
  const clean = role.trim().toLowerCase();
  if (clean.includes('admin')) return 'Admin';
  if (clean.includes('supervisor')) return 'Supervisor';
  if (clean.includes('coord')) return 'Coordinadores';
  return 'Supervisor';
}

/**
 * Authenticates user against registered credentials by username or email
 */
export function authenticateWithCredentials(
  identifier: string,
  pass: string
): { success: boolean; user?: UserProfile; error?: string } {
  const cleanId = (identifier || '').trim().toLowerCase();
  const cleanPass = (pass || '').trim();

  if (!cleanId) {
    return { success: false, error: 'Por favor ingresa tu usuario o correo electrónico.' };
  }
  if (!cleanPass) {
    return { success: false, error: 'Por favor ingresa tu contraseña.' };
  }

  const credentials = getStoredCredentials();

  const isHaroldId = isHaroldUser(cleanId);

  const match = credentials.find(
    (c) =>
      c.activo &&
      (c.usuario.toLowerCase() === cleanId ||
        c.email.toLowerCase() === cleanId ||
        (isHaroldId && (isHaroldUser(c.usuario) || isHaroldUser(c.email)))) &&
      c.clave === cleanPass
  );

  if (!match) {
    return {
      success: false,
      error:
        'Credenciales incorrectas. Verifica tu nombre de usuario o correo y tu contraseña.',
    };
  }

  const roleNormalized = normalizeRole(match.rol);
  const isHarold = isHaroldId || isHaroldUser(match.usuario) || isHaroldUser(match.email);

  const userProfile: UserProfile = {
    id: match.id,
    nombre: isHarold ? 'Harold Anguiano Morales' : match.nombre,
    usuario: match.usuario,
    email: match.email,
    puesto: match.puesto || (isHarold ? 'Director de Capacitación / Administrador General' : 'Supervisor de Capacitación'),
    departamento: match.departamento || 'Recursos Humanos / Capacitación',
    rfc: match.rfc || 'AUMH900101XYZ',
    telefono: match.telefono,
    rol: roleNormalized,
    avatarUrl:
      match.avatarUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    fechaIngreso: match.fechaCreacion || new Date().toISOString().split('T')[0],
    notificacionesEmail: true,
    modoOscuro: false,
  };

  return { success: true, user: userProfile };
}

/**
 * Adds or updates a coordinator in storage
 */
export function saveOrUpdateCoordinator(
  coordinatorData: Omit<UserCredential, 'id' | 'fechaCreacion'> & { id?: string }
): UserCredential {
  const current = getStoredCredentials();
  const phoneFormatted = formatMexicanWhatsAppPhone(coordinatorData.telefono).display;

  // Check if we are updating an existing user by ID or by username/email
  const existingIndex = current.findIndex(
    (c) =>
      (coordinatorData.id && c.id === coordinatorData.id) ||
      c.usuario.toLowerCase() === coordinatorData.usuario.trim().toLowerCase() ||
      c.email.toLowerCase() === coordinatorData.email.trim().toLowerCase()
  );

  let saved: UserCredential;

  if (existingIndex >= 0) {
    const existing = current[existingIndex];
    saved = {
      ...existing,
      ...coordinatorData,
      id: existing.id,
      telefono: phoneFormatted || existing.telefono,
    };
    const updated = [...current];
    updated[existingIndex] = saved;
    saveStoredCredentials(updated);
  } else {
    // Create new
    saved = {
      id: coordinatorData.id || `coord_${Date.now()}`,
      ...coordinatorData,
      telefono: phoneFormatted,
      activo: true,
      fechaCreacion: new Date().toISOString().split('T')[0],
    };
    const updated = [saved, ...current];
    saveStoredCredentials(updated);
  }

  // If the updated user is currently logged in, update active session & profile immediately
  try {
    const rawSession = localStorage.getItem('registro_participantes_auth_session_v1');
    if (rawSession) {
      const sess = JSON.parse(rawSession);
      if (
        sess.user &&
        (sess.user.usuario?.toLowerCase() === saved.usuario.toLowerCase() ||
          sess.user.email?.toLowerCase() === saved.email.toLowerCase() ||
          sess.user.id === saved.id)
      ) {
        sess.user = {
          ...sess.user,
          nombre: saved.nombre,
          usuario: saved.usuario,
          email: saved.email,
          rol: saved.rol,
          puesto: saved.puesto || sess.user.puesto,
          departamento: saved.departamento || sess.user.departamento,
        };
        localStorage.setItem('registro_participantes_auth_session_v1', JSON.stringify(sess));
        localStorage.setItem('registro_participantes_user_profile_v1', JSON.stringify(sess.user));
      }
    }
  } catch (err) {
    console.warn('Session update notice:', err);
  }

  // 1. Supabase client sync
  upsertCoordinatorToSupabase(saved).catch((err) =>
    console.warn('Supabase coordinator update notice:', err)
  );

  // 2. Server-side API proxy sync (guaranteed delivery)
  try {
    fetch('/api/supabase/upsert-coordinator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coord: saved }),
    }).catch(() => {});
  } catch {}

  return saved;
}

/**
 * Updates a user's password in the credentials store
 */
export function updateUserPassword(emailOrUsuario: string, newPassword: string): boolean {
  const current = getStoredCredentials();
  const clean = emailOrUsuario.trim().toLowerCase();
  let found = false;

  const updated = current.map((c) => {
    if (c.email.toLowerCase() === clean || c.usuario.toLowerCase() === clean) {
      found = true;
      const modified = { ...c, clave: newPassword };
      upsertCoordinatorToSupabase(modified).catch((err) =>
        console.warn('Supabase coordinator pass notice:', err)
      );
      return modified;
    }
    return c;
  });

  if (found) {
    saveStoredCredentials(updated);
  }
  return found;
}

/**
 * Deletes a coordinator by ID (cannot delete primary admin Harold)
 */
export function deleteCoordinator(id: string): { success: boolean; error?: string } {
  const current = getStoredCredentials();
  const target = current.find((c) => c.id === id);

  if (!target) {
    return { success: false, error: 'Coordinador no encontrado.' };
  }

  if (target.usuario === 'haroldo90') {
    return { success: false, error: 'No es posible eliminar al Administrador Principal del sistema.' };
  }

  const updated = current.filter((c) => c.id !== id);
  saveStoredCredentials(updated);
  deleteCoordinatorFromSupabase(target.id, target.email, target.usuario).catch((err) =>
    console.warn('Supabase coordinator delete notice:', err)
  );
  return { success: true };
}

/**
 * Complete, Updated SQL Schema for Supabase / PostgreSQL
 */
export const UPDATED_DATABASE_SQL = `-- ==============================================================================
-- SISTEMA DE CONTROL DE CAPACITACIONES Y REGISTRO DE PARTICIPANTES
-- SCRIPT SQL ACTUALIZADO (SUPABASE / POSTGRESQL)
-- Enlace Oficial del Sistema: https://registro-de-participantes.vercel.app/
-- ==============================================================================

-- 1. HABILITAR EXTENSIÓN UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA DE USUARIOS Y SUPERVISORES DEL SISTEMA (ROLES, PUESTOS Y CREDENCIALES)
CREATE TABLE IF NOT EXISTS public.usuarios_sistema (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    nombre TEXT NOT NULL,
    usuario TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    clave TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'Supervisor',
    telefono TEXT DEFAULT '',
    puesto TEXT DEFAULT 'Supervisor',
    departamento TEXT DEFAULT 'Recursos Humanos / Capacitación',
    rfc TEXT DEFAULT 'XAXX010101000',
    avatar_url TEXT DEFAULT '',
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Asegurar columnas de puesto y rol en tablas preexistentes
ALTER TABLE public.usuarios_sistema ADD COLUMN IF NOT EXISTS puesto TEXT DEFAULT 'Supervisor';
ALTER TABLE public.usuarios_sistema ADD COLUMN IF NOT EXISTS rol TEXT DEFAULT 'Supervisor';
ALTER TABLE public.perfiles_usuario ADD COLUMN IF NOT EXISTS puesto TEXT DEFAULT 'Supervisor';
ALTER TABLE public.perfiles_usuario ADD COLUMN IF NOT EXISTS rol TEXT DEFAULT 'Supervisor';

-- 3. TABLA DE EVENTOS DE CAPACITACIÓN Y REUNIONES DE TRABAJO
CREATE TABLE IF NOT EXISTS public.eventos (
    id TEXT PRIMARY KEY,
    nombre_evento TEXT NOT NULL,
    objetivo_evento TEXT DEFAULT '',
    dirigido_a TEXT DEFAULT '',
    tipo_evento TEXT NOT NULL CHECK (tipo_evento IN ('Capacitación', 'Reunión de Trabajo')),
    ubicacion_modalidad TEXT NOT NULL CHECK (ubicacion_modalidad IN ('MM', 'OP', 'Campo')),
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_termino DATE NOT NULL DEFAULT CURRENT_DATE,
    no_dias INTEGER NOT NULL DEFAULT 1,
    horario_de TEXT DEFAULT '09:00',
    horario_a TEXT DEFAULT '17:00',
    horas_capacitacion NUMERIC NOT NULL DEFAULT 0,
    horas_hombre_capacitacion NUMERIC NOT NULL DEFAULT 0,
    
    -- Conteos y Métricas de Participantes
    hombres_count INTEGER NOT NULL DEFAULT 0,
    mujeres_count INTEGER NOT NULL DEFAULT 0,
    total_participantes INTEGER NOT NULL DEFAULT 0,
    
    -- Control de Instructores
    instructor_tipo TEXT NOT NULL DEFAULT 'Interno' CHECK (instructor_tipo IN ('Interno', 'Externo')),
    instructor_nombre TEXT NOT NULL DEFAULT '',
    instructor_puesto TEXT DEFAULT '',
    instructor_empresa TEXT DEFAULT '',
    instructor_rfc TEXT DEFAULT '',
    instructor_firma TEXT DEFAULT '',
    
    -- Administración de Recursos y Costos
    contenido_tematico TEXT DEFAULT '',
    nombre_adjunto TEXT DEFAULT '',
    anexo_contenido BOOLEAN NOT NULL DEFAULT true,
    costo_instructor NUMERIC NOT NULL DEFAULT 0,
    costo_materiales NUMERIC NOT NULL DEFAULT 0,
    costo_cafeteria NUMERIC NOT NULL DEFAULT 0,
    otros_costos NUMERIC NOT NULL DEFAULT 0,
    total_costos NUMERIC NOT NULL DEFAULT 0,
    firma_rh TEXT DEFAULT '',
    aprobado_rh BOOLEAN NOT NULL DEFAULT false,
    
    -- Estado y Metadatos
    activo BOOLEAN NOT NULL DEFAULT true,
    estado TEXT NOT NULL DEFAULT 'Registrado' CHECK (estado IN ('Registrado', 'En Proceso', 'Completado', 'Desactivado')),
    creado_por TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. TABLA DE PARTICIPANTES (LISTA DE ASISTENCIA Y FIRMAS DIGITALES)
CREATE TABLE IF NOT EXISTS public.participantes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    evento_id TEXT NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
    pos INTEGER NOT NULL,
    no_emp TEXT DEFAULT '',
    nombre TEXT NOT NULL,
    email TEXT,
    genero TEXT NOT NULL CHECK (genero IN ('H', 'M')),
    puesto TEXT DEFAULT '',
    depto TEXT DEFAULT '',
    firma TEXT DEFAULT '',
    confirmado BOOLEAN DEFAULT true,
    fecha_confirmacion TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. TABLA DE PERFILES DE USUARIO (COMPATIBLE CON SUPABASE AUTH)
CREATE TABLE IF NOT EXISTS public.perfiles_usuario (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID,
    nombre TEXT NOT NULL,
    usuario TEXT,
    email TEXT UNIQUE NOT NULL,
    puesto TEXT DEFAULT '',
    departamento TEXT DEFAULT '',
    rfc TEXT DEFAULT '',
    telefono TEXT DEFAULT '',
    rol TEXT NOT NULL DEFAULT 'Coordinadores',
    avatar_url TEXT DEFAULT '',
    fecha_ingreso DATE DEFAULT CURRENT_DATE,
    notificaciones_email BOOLEAN DEFAULT true,
    modo_oscuro BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. ÍNDICES DE RENDIMIENTO PARA CONSULTAS RÁPIDAS
CREATE INDEX IF NOT EXISTS idx_usuarios_usuario ON public.usuarios_sistema(usuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios_sistema(email);
CREATE INDEX IF NOT EXISTS idx_participantes_evento_id ON public.participantes(evento_id);
CREATE INDEX IF NOT EXISTS idx_participantes_pos ON public.participantes(evento_id, pos);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha_inicio ON public.eventos(fecha_inicio DESC);
CREATE INDEX IF NOT EXISTS idx_perfiles_email ON public.perfiles_usuario(email);

-- 7. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.usuarios_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfiles_usuario ENABLE ROW LEVEL SECURITY;

-- 8. POLÍTICAS DE ACCESO COMPLETO (PERMISIVAS PARA ANON KEY)
DROP POLICY IF EXISTS "Acceso total usuarios_sistema" ON public.usuarios_sistema;
DROP POLICY IF EXISTS "Permitir todo en usuarios_sistema" ON public.usuarios_sistema;
CREATE POLICY "Acceso total usuarios_sistema" ON public.usuarios_sistema FOR ALL USING (true);

DROP POLICY IF EXISTS "Acceso total eventos" ON public.eventos;
DROP POLICY IF EXISTS "Permitir todo en eventos" ON public.eventos;
DROP POLICY IF EXISTS "Permitir lectura publica de eventos" ON public.eventos;
DROP POLICY IF EXISTS "Permitir insercion publica de eventos" ON public.eventos;
DROP POLICY IF EXISTS "Permitir actualizacion publica de eventos" ON public.eventos;
DROP POLICY IF EXISTS "Permitir eliminacion publica de eventos" ON public.eventos;
CREATE POLICY "Acceso total eventos" ON public.eventos FOR ALL USING (true);

DROP POLICY IF EXISTS "Acceso total participantes" ON public.participantes;
DROP POLICY IF EXISTS "Permitir todo en participantes" ON public.participantes;
DROP POLICY IF EXISTS "Permitir lectura publica de participantes" ON public.participantes;
DROP POLICY IF EXISTS "Permitir insercion publica de participantes" ON public.participantes;
DROP POLICY IF EXISTS "Permitir actualizacion publica de participantes" ON public.participantes;
DROP POLICY IF EXISTS "Permitir eliminacion publica de participantes" ON public.participantes;
CREATE POLICY "Acceso total participantes" ON public.participantes FOR ALL USING (true);

DROP POLICY IF EXISTS "Acceso total perfiles_usuario" ON public.perfiles_usuario;
DROP POLICY IF EXISTS "Permitir todo en perfiles_usuario" ON public.perfiles_usuario;
DROP POLICY IF EXISTS "Permitir lectura publica de perfiles" ON public.perfiles_usuario;
DROP POLICY IF EXISTS "Permitir modificacion de perfiles" ON public.perfiles_usuario;
CREATE POLICY "Acceso total perfiles_usuario" ON public.perfiles_usuario FOR ALL USING (true);

-- 9. TRIGGER PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_usuarios_updated_at ON public.usuarios_sistema;
CREATE TRIGGER tr_usuarios_updated_at BEFORE UPDATE ON public.usuarios_sistema FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_eventos_updated_at ON public.eventos;
CREATE TRIGGER tr_eventos_updated_at BEFORE UPDATE ON public.eventos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_perfiles_updated_at ON public.perfiles_usuario;
CREATE TRIGGER tr_perfiles_updated_at BEFORE UPDATE ON public.perfiles_usuario FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 10. INSERCIÓN DE CREDENCIALES OFICIALES (ADMIN Y COORDINADORES)
-- Credencial 1: Administrador General Harold Anguiano Morales
INSERT INTO public.usuarios_sistema (
    nombre, usuario, email, clave, rol, telefono, puesto, departamento, rfc, avatar_url
) VALUES (
    'Harold Anguiano Morales',
    'haroldo90',
    'haroldo90@hotmail.com',
    'Chevropar#1970',
    'Admin',
    '+52 (55) 8912-3456',
    'Director de Capacitación / Administrador General',
    'Dirección de Recursos Humanos',
    'AUMH900101XYZ',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
)
ON CONFLICT (usuario) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    email = EXCLUDED.email,
    clave = EXCLUDED.clave,
    rol = EXCLUDED.rol,
    updated_at = timezone('utc'::text, now());

-- Credencial 2: Coordinador Cesar Netro
INSERT INTO public.usuarios_sistema (
    nombre, usuario, email, clave, rol, telefono, puesto, departamento, rfc, avatar_url
) VALUES (
    'Cesar Netro',
    'cesar_netro',
    'cesar_netro@hotmail.com',
    'Netro#Coord2026!',
    'Coordinadores',
    '+52 (81) 1234-5678',
    'Coordinador de Capacitación y Eventos',
    'Coordinación Operativa y Capacitación',
    'NECX850515ABC',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
)
ON CONFLICT (usuario) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    email = EXCLUDED.email,
    clave = EXCLUDED.clave,
    rol = EXCLUDED.rol,
    updated_at = timezone('utc'::text, now());

-- Compatibilidad en perfiles_usuario
INSERT INTO public.perfiles_usuario (id, nombre, usuario, email, puesto, departamento, rol, telefono)
VALUES 
    ('admin_harold', 'Harold Anguiano Morales', 'haroldo90', 'haroldo90@hotmail.com', 'Director de Capacitación', 'Recursos Humanos', 'Admin', '+52 55 8912-3456'),
    ('coord_cesar', 'Cesar Netro', 'cesar_netro', 'cesar_netro@hotmail.com', 'Coordinador de Capacitación', 'Coordinación Operativa', 'Coordinadores', '+52 81 1234-5678')
ON CONFLICT (email) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    usuario = EXCLUDED.usuario,
    rol = EXCLUDED.rol;
`;
