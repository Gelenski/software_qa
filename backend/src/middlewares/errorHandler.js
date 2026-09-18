import multer from 'multer';
import { AppError } from '../domain/errors.js';

/** Converte erros em respostas JSON consistentes. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ erro: err.message });
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ erro: `Falha no upload: ${err.message}` });
  }
  if (err?.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ erro: 'Registro duplicado.' });
  }
  console.error('[erro]', err);
  return res.status(500).json({ erro: 'Erro interno do servidor.' });
}

/** Envolve handlers async para propagar rejeicoes ao errorHandler. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
