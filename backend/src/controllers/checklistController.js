import { checklistService } from '../services/checklistService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

export const checklistController = {
  listarTemplates: asyncHandler(async (req, res) => {
    res.json(await checklistService.listarTemplates());
  }),

  obterTemplate: asyncHandler(async (req, res) => {
    res.json(await checklistService.obterTemplate(Number(req.params.id)));
  }),

  criarTemplate: asyncHandler(async (req, res) => {
    res.status(201).json(await checklistService.criarTemplate(req.body));
  }),

  copiarTemplate: asyncHandler(async (req, res) => {
    res
      .status(201)
      .json(await checklistService.copiarTemplate(Number(req.params.id), req.body));
  }),
};
