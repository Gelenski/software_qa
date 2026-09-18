import { testCaseService } from '../services/testCaseService.js';
import { AppError } from '../domain/errors.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

export const testCaseController = {
  listar: asyncHandler(async (req, res) => {
    res.json(await testCaseService.listar());
  }),

  importar: asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError('Envie um arquivo .xlsx para importar.');
    res.json(await testCaseService.importar(req.file.buffer));
  }),

  criar: asyncHandler(async (req, res) => {
    res.status(201).json(await testCaseService.criar(req.body));
  }),
};
