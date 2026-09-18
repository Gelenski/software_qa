import { Router } from 'express';
import multer from 'multer';
import { testCaseController } from '../controllers/testCaseController.js';
import { checklistController } from '../controllers/checklistController.js';
import { auditController } from '../controllers/auditController.js';
import { ncController } from '../controllers/ncController.js';
import { dashboardController } from '../controllers/dashboardController.js';
import { responsavelController } from '../controllers/responsavelController.js';
import { notificationRepository } from '../repositories/notificationRepository.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

export const router = Router();

const uploadPlanilha = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Casos de teste  (rota de importacao ANTES de :id)
router.get('/casos-teste', testCaseController.listar);
router.post('/casos-teste', testCaseController.criar);
router.post('/casos-teste/importar', uploadPlanilha.single('arquivo'), testCaseController.importar);

// Checklist templates (rotas especificas ANTES de :id)
router.get('/checklist-templates', checklistController.listarTemplates);
router.post('/checklist-templates', checklistController.criarTemplate);
router.get('/checklist-templates/:id', checklistController.obterTemplate);
router.post('/checklist-templates/:id/copiar', checklistController.copiarTemplate);

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
    res.json(await notificationRepository.listar({ ncId }));
  }),
);

// Responsaveis (nome + e-mail para notificacoes reais)
router.get('/responsaveis', responsavelController.listar);
router.post('/responsaveis', responsavelController.criar);
router.patch('/responsaveis/:id', responsavelController.atualizar);

// Dashboard
router.get('/dashboard', dashboardController.resumo);
