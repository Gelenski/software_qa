import { ncService } from '../services/ncService.js';
import { escalationService } from '../services/escalationService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

export const ncController = {
  listar: asyncHandler(async (req, res) => {
    res.json(await ncService.listar({ status: req.query.status }));
  }),

  obter: asyncHandler(async (req, res) => {
    res.json(await ncService.obter(Number(req.params.id)));
  }),

  criar: asyncHandler(async (req, res) => {
    res.status(201).json(await ncService.criar(req.body));
  }),

  alterarStatus: asyncHandler(async (req, res) => {
    res.json(await ncService.alterarStatus(Number(req.params.id), req.body.status));
  }),

  // Requisito 5 - varredura de prazos sob demanda
  verificarPrazos: asyncHandler(async (req, res) => {
    res.json(await escalationService.verificarPrazos());
  }),

  escalar: asyncHandler(async (req, res) => {
    res.json(await escalationService.escalarUma(Number(req.params.id)));
  }),
};
