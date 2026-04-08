import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/users.routes';
import patientRoutes from './routes/patients.routes';
import assessmentRoutes from './routes/assessments.routes';
import foodRoutes from './routes/foods.routes';
import dietPlanRoutes from './routes/diet-plans.routes';

dotenv.config();

const app: Express = express();
export const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'Backend is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/diet-plans', dietPlanRoutes);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const DEFAULT_PORT = Number(process.env.PORT) || 5000;
let activePort = DEFAULT_PORT;
const MAX_PORT_TRIES = 10;

const startServer = (port: number, attempts = 0) => {
  const server = app.listen(port, () => {
    activePort = port;
    console.log(`✅ Backend running on http://localhost:${activePort}`);
    console.log(`📚 API Documentation available at http://localhost:${activePort}/api/docs`);
  });

  server.on('error', (error: any) => {
    if (error?.code === 'EADDRINUSE' && attempts < MAX_PORT_TRIES) {
      const nextPort = port + 1;
      console.warn(`⚠️ Port ${port} is already in use. Trying ${nextPort}...`);
      startServer(nextPort, attempts + 1);
      return;
    }

    console.error('Failed to start backend:', error.message || error);
    process.exit(1);
  });
};

startServer(DEFAULT_PORT);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});
