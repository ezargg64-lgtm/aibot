import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { startWhatsAppBot, resetWhatsAppBot, requestWhatsAppPairingCode, stopWhatsAppBot } from './src/bot';
import { geminiService } from './src/bot/services/geminiService';

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;
  const httpServer = createServer(app);
  
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  // Start initial WhatsApp Bot with socket access
  startWhatsAppBot('whatsapp-bot-01', io);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/bot/:serverId/create', async (req, res) => {
    try {
      const { serverId } = req.params;
      startWhatsAppBot(serverId, io);
      res.json({ status: 'ok', message: `Server ${serverId} created and bot started.` });
    } catch (error: any) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  app.post('/api/bot/:serverId/pair', async (req, res) => {
    try {
      const { serverId } = req.params;
      const { phoneNumber } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required' });
      }
      
      const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
      const code = await requestWhatsAppPairingCode(serverId, cleanNumber, io);
      res.json({ status: 'ok', code });
    } catch (error: any) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  app.post('/api/bot/:serverId/reset', async (req, res) => {
    try {
      const { serverId } = req.params;
      await resetWhatsAppBot(serverId, io);
      res.json({ status: 'ok', message: 'Bot reset triggered' });
    } catch (error: any) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  app.delete('/api/bot/:serverId', async (req, res) => {
    try {
      const { serverId } = req.params;
      await stopWhatsAppBot(serverId, io);
      res.json({ status: 'ok', message: `Server ${serverId} deleted.` });
    } catch (error: any) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  app.post('/api/config/gemini', (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey) {
        return res.status(400).json({ error: 'API key is required' });
      }
      geminiService.updateApiKey(apiKey);
      res.json({ status: 'ok', message: 'Gemini API key updated successfully' });
    } catch (error: any) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  });

  app.get('/api/config/gemini/models', async (req, res) => {
    try {
      const result = await geminiService.getModels();
      if (result.success) {
        res.json({ status: 'ok', models: result.models });
      } else {
        res.status(500).json({ error: 'Failed to fetch models' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/config/gemini/model', (req, res) => {
    try {
      const { model } = req.body;
      if (!model) {
        return res.status(400).json({ error: 'Model is required' });
      }
      geminiService.updateModel(model);
      res.json({ status: 'ok', message: 'Gemini model updated successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

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

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
