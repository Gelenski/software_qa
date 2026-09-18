import { auditService } from '../services/auditService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

export const auditController = {
  listar: asyncHandler(async (req, res) => {
    res.json(await auditService.listar());
  }),

  iniciar: asyncHandler(async (req, res) => {
    const { casoTesteId, estrategia, checklistTemplateId } = req.body;
    res.status(201).json(
      await auditService.iniciar({
        casoTesteId: Number(casoTesteId),
        estrategia,
        checklistTemplateId: Number(checklistTemplateId),
      }),
    );
  }),

  obter: asyncHandler(async (req, res) => {
    res.json(await auditService.obter(Number(req.params.id)));
  }),

  responderItem: asyncHandler(async (req, res) => {
    const { id, itemId } = req.params;
    const { resposta, observacao } = req.body;
    res.json(
      await auditService.responderItem(Number(id), Number(itemId), {
        resposta,
        observacao,
      }),
    );
  }),

  finalizar: asyncHandler(async (req, res) => {
    res.json(await auditService.finalizar(Number(req.params.id)));
  }),
};
