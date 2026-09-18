import { responsavelService } from '../services/responsavelService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

export const responsavelController = {
  listar: asyncHandler(async (req, res) => {
    res.json(await responsavelService.listar());
  }),

  criar: asyncHandler(async (req, res) => {
    res.status(201).json(await responsavelService.criar(req.body));
  }),

  atualizar: asyncHandler(async (req, res) => {
    res.json(await responsavelService.atualizar(Number(req.params.id), req.body));
  }),
};
