import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Health & Status endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'insurance-claims-ai-backend',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/status', (_req: Request, res: Response) => {
  res.status(200).json({
    name: 'AI Insurance Claims Intelligence Backend API',
    version: '0.1.0',
    modules: [
      'claims-assessment',
      'ai-agents',
      'agent-orchestration',
      'rag-engine',
      'document-processing',
    ],
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
