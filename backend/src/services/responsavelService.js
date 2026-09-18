import { responsavelRepository } from '../repositories/responsavelRepository.js';
import { AppError, NotFoundError } from '../domain/errors.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const responsavelService = {
  listar() {
    return responsavelRepository.listar();
  },

  async criar(body) {
    const nome = (body.nome || '').trim();
    const email = (body.email || '').trim();
    if (!nome) throw new AppError('Informe o nome do responsavel.');
    if (!EMAIL_RE.test(email)) throw new AppError('Informe um e-mail valido.');

    return responsavelRepository.criar({ nome, email });
  },

  /** So o e-mail e editavel: o nome e a chave usada para resolver a NC -> e-mail. */
  async atualizar(id, body) {
    const responsavel = await responsavelRepository.buscarPorId(id);
    if (!responsavel) throw new NotFoundError('Responsavel');

    const email = (body.email || '').trim();
    if (!EMAIL_RE.test(email)) throw new AppError('Informe um e-mail valido.');

    return responsavelRepository.atualizarEmail(id, { email });
  },
};
