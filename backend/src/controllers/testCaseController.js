import { testCaseService } from '../services/testCaseService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

export const testCaseController = {
  listar: asyncHandler(async (req, res) => {
    res.json(await testCaseService.listar());
  }),

  obter: asyncHandler(async (req, res) => {
    res.json(await testCaseService.buscar(Number(req.params.id)));
  }),

  criar: asyncHandler(async (req, res) => {
    res.status(201).json(await testCaseService.criar(req.body));
  }),
};
