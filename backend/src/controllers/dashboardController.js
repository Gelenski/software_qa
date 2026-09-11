import { dashboardService } from '../services/dashboardService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

export const dashboardController = {
  resumo: asyncHandler(async (req, res) => {
    res.json(await dashboardService.resumo());
  }),
};
