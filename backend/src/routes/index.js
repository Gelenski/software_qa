import { Router } from 'express';
import { testCaseController } from '../controllers/testCaseController.js';
import { auditController } from '../controllers/auditController.js';
import { ncController } from '../controllers/ncController.js';
import { dashboardController } from '../controllers/dashboardController.js';
import { notificationService } from '../services/notificationService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

export const router = Router();

// Casos de teste
router.get('/casos-teste', testCaseController.listar);
router.post('/casos-teste', testCaseController.criar);
router.get('/casos-teste/:id', testCaseController.obter);

// Checklist fixo
router.get('/checklist', auditController.checklist);

// Auditorias
router.get('/auditorias', auditController.listar);
router.post('/auditorias', auditController.iniciar);
router.get('/auditorias/:id', auditController.obter);
router.patch('/auditorias/:id/itens/:itemId', auditController.responderItem);
router.post('/auditorias/:id/finalizar', auditController.finalizar);

// Nao conformidades  (rotas especificas ANTES de :id)
router.post('/nao-conformidades/verificar-prazos', ncController.verificarPrazos);
router.get('/nao-conformidades', ncController.listar);
router.post('/nao-conformidades', ncController.criar);
router.get('/nao-conformidades/:id', ncController.obter);
router.patch('/nao-conformidades/:id/status', ncController.alterarStatus);
router.post('/nao-conformidades/:id/escalonar', ncController.escalar);

// Notificacoes simuladas
router.get(
  '/notificacoes',
  asyncHandler(async (req, res) => {
    const ncId = req.query.ncId ? Number(req.query.ncId) : undefined;
    res.json(await notificationService.listar({ ncId }));
  }),
);

// Dashboard
router.get('/dashboard', dashboardController.resumo);
