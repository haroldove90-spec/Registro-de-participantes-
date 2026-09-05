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
