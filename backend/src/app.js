import express from 'express';
import cors from 'cors';
import { router } from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { registrarAssinantesDeEmail } from './services/emailNotificationService.js';

// Observer: registra o assinante de notificacao no barramento de eventos.
registrarAssinantesDeEmail();

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, servico: 'TestAudit API' }));
app.use('/api', router);

app.use((req, res) => res.status(404).json({ erro: 'Rota nao encontrada.' }));
app.use(errorHandler);
