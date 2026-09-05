import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Increase payload limit for signatures and attached document data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const DEFAULT_SUPABASE_URL = process.env.SUPABASE_URL || 'https://acjelqhrflkxnkttlrkr.supabase.co';
const DEFAULT_SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjamVscWhyZmxreG5rdHRscmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5OTg1MDMsImV4cCI6MjEwMjU3NDUwM30.5FCoWmIzNwHtQJ9snnClQLvZLNMGiBjL4XtDAZ_L3Kk';

// API Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Proxy: Upsert Evento and its participants directly to Supabase via server-side fetch
app.post('/api/supabase/upsert-evento', async (req, res) => {
  try {
    const { eventoRow, partRows } = req.body;
    if (!eventoRow || !eventoRow.id) {
      return res.status(400).json({ success: false, error: 'Datos de evento incompletos' });
    }

    const targetUrl = `${DEFAULT_SUPABASE_URL}/rest/v1/eventos`;
    const respEvento = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        apikey: DEFAULT_SUPABASE_KEY,
        Authorization: `Bearer ${DEFAULT_SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(eventoRow),
    });

    if (!respEvento.ok) {
      const errText = await respEvento.text();
      console.warn('Server Supabase upsert evento warning:', respEvento.status, errText);
      return res.status(respEvento.status).json({ success: false, error: errText });
    }

    // Upsert participants if present
    if (Array.isArray(partRows) && partRows.length > 0) {
      // Clear previous participants for this event
      await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/participantes?evento_id=eq.${encodeURIComponent(eventoRow.id)}`, {
        method: 'DELETE',
        headers: {
          apikey: DEFAULT_SUPABASE_KEY,
          Authorization: `Bearer ${DEFAULT_SUPABASE_KEY}`,
        },
      });

      // Insert fresh participants
      const respParts = await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/participantes`, {
        method: 'POST',
        headers: {
          apikey: DEFAULT_SUPABASE_KEY,
          Authorization: `Bearer ${DEFAULT_SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify(partRows),
      });

      if (!respParts.ok) {
        const errParts = await respParts.text();
        console.warn('Server Supabase upsert participantes warning:', errParts);
      }
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.warn('Exception in server /api/supabase/upsert-evento:', error?.message || error);
    return res.status(500).json({ success: false, error: error?.message || 'Error de conexión' });
  }
});

// Proxy: Fetch all Eventos and Participantes
app.get('/api/supabase/fetch-eventos', async (req, res) => {
  try {
    const respEventos = await fetch(
      `${DEFAULT_SUPABASE_URL}/rest/v1/eventos?select=*&order=fecha_inicio.desc`,
      {
        headers: {
          apikey: DEFAULT_SUPABASE_KEY,
          Authorization: `Bearer ${DEFAULT_SUPABASE_KEY}`,
        },
      }
    );

    if (!respEventos.ok) {
      const errText = await respEventos.text();
      return res.status(respEventos.status).json({ error: errText });
    }
    const eventos = await respEventos.json();

    const respParts = await fetch(
      `${DEFAULT_SUPABASE_URL}/rest/v1/participantes?select=*&order=pos.asc`,
      {
        headers: {
          apikey: DEFAULT_SUPABASE_KEY,
          Authorization: `Bearer ${DEFAULT_SUPABASE_KEY}`,
        },
      }
    );
    const participantes = respParts.ok ? await respParts.json() : [];

    return res.json({ success: true, eventos, participantes });
  } catch (error: any) {
    console.warn('Exception in server /api/supabase/fetch-eventos:', error?.message || error);
    return res.status(500).json({ error: error?.message || 'Error de red' });
  }
});

// Proxy: Delete an Evento
app.delete('/api/supabase/delete-evento/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const resp = await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/eventos?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        apikey: DEFAULT_SUPABASE_KEY,
        Authorization: `Bearer ${DEFAULT_SUPABASE_KEY}`,
      },
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ success: false, error: errText });
    }
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Error al eliminar' });
  }
});

// Proxy: Fetch all system coordinators and users
app.get('/api/supabase/fetch-coordinators', async (req, res) => {
  try {
    const resp = await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/usuarios_sistema?select=*&order=nombre.asc`, {
      headers: {
        apikey: DEFAULT_SUPABASE_KEY,
        Authorization: `Bearer ${DEFAULT_SUPABASE_KEY}`,
      },
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ error: errText });
    }
    const data = await resp.json();
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Error al consultar usuarios' });
  }
});

// Proxy: Upsert coordinator to both usuarios_sistema and perfiles_usuario
app.post('/api/supabase/upsert-coordinator', async (req, res) => {
  try {
    const { coord } = req.body;
    if (!coord || !coord.usuario) {
      return res.status(400).json({ success: false, error: 'Datos de usuario incompletos' });
    }

    const targetRole = coord.rol?.toLowerCase().includes('admin') ? 'Admin' : (coord.rol || 'Supervisor');

    // 1. Upsert into usuarios_sistema
    const usuarioRow = {
      id: coord.id,
      nombre: coord.nombre,
      usuario: coord.usuario,
      email: coord.email,
      clave: coord.clave,
      rol: targetRole,
      telefono: coord.telefono || '',
      puesto: coord.puesto || 'Supervisor',
      departamento: coord.departamento || 'Recursos Humanos / Capacitación',
      rfc: coord.rfc || 'XAXX010101000',
      avatar_url: coord.avatarUrl || '',
      activo: coord.activo ?? true,
      updated_at: new Date().toISOString(),
    };

    const respUsuario = await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/usuarios_sistema`, {
      method: 'POST',
      headers: {
        apikey: DEFAULT_SUPABASE_KEY,
        Authorization: `Bearer ${DEFAULT_SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(usuarioRow),
    });

    // 2. Also keep perfiles_usuario in sync
    const perfilRow = {
      nombre: coord.nombre,
      email: coord.email,
      puesto: coord.puesto || 'Supervisor',
      departamento: coord.departamento || 'Recursos Humanos / Capacitación',
      rfc: coord.rfc || 'XAXX010101000',
      telefono: coord.telefono || '',
      rol: targetRole,
      avatar_url: coord.avatarUrl || '',
      notificaciones_email: true,
      modo_oscuro: false,
      updated_at: new Date().toISOString(),
    };

    await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/perfiles_usuario`, {
      method: 'POST',
      headers: {
        apikey: DEFAULT_SUPABASE_KEY,
        Authorization: `Bearer ${DEFAULT_SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(perfilRow),
    });

    if (!respUsuario.ok) {
      const errText = await respUsuario.text();
      return res.status(respUsuario.status).json({ success: false, error: errText });
    }

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Error al guardar usuario' });
  }
});

// Proxy: Update user role in both usuarios_sistema and perfiles_usuario
app.post('/api/supabase/update-user-role', async (req, res) => {
  try {
    const { identifier, newRole } = req.body;
    if (!identifier || !newRole) {
      return res.status(400).json({ success: false, error: 'Identificador y rol requeridos' });
    }

    const clean = identifier.trim().toLowerCase();
    const targetRole = newRole.toLowerCase().includes('admin') ? 'Admin' : (newRole || 'Supervisor');

    // Update in usuarios_sistema by email or usuario
    const filterField = clean.includes('@') ? 'email' : 'usuario';
    await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/usuarios_sistema?${filterField}=eq.${encodeURIComponent(clean)}`, {
      method: 'PATCH',
      headers: {
        apikey: DEFAULT_SUPABASE_KEY,
        Authorization: `Bearer ${DEFAULT_SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rol: targetRole, updated_at: new Date().toISOString() }),
    });

    // Update in perfiles_usuario
    if (clean.includes('@')) {
      await fetch(`${DEFAULT_SUPABASE_URL}/rest/v1/perfiles_usuario?email=eq.${encodeURIComponent(clean)}`, {
        method: 'PATCH',
        headers: {
          apikey: DEFAULT_SUPABASE_KEY,
          Authorization: `Bearer ${DEFAULT_SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rol: targetRole, updated_at: new Date().toISOString() }),
      });
    }

    return res.json({ success: true, role: targetRole });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Error al actualizar rol' });
  }
});

// Mount Vite middleware or static dist
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
});
