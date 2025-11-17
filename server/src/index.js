import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import { testConnection } from './db/connection.js';
import authRoutes from './routes/authRoutes.js';
import visitRoutes from './routes/visitRoutes.js';

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/visits', visitRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Server is running' });
});

// Iniciar servidor
const PORT = config.PORT;

async function startServer() {
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.warn('⚠️  Advertencia: No se pudo conectar a la base de datos. Asegúrate de que MySQL esté corriendo.');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  });
}

startServer();

