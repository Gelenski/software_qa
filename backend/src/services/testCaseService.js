import { testCaseRepository } from '../repositories/testCaseRepository.js';
import { AppError, NotFoundError } from '../domain/errors.js';

export const testCaseService = {
  listar() {
    return testCaseRepository.listar();
  },

  async buscar(id) {
    const caso = await testCaseRepository.buscarPorId(id);
    if (!caso) throw new NotFoundError('Caso de teste');
    return caso;
  },

  async criar(body) {
    const codigo = (body.codigo || '').trim();
    const titulo = (body.titulo || '').trim();
    if (!codigo) throw new AppError('Informe o codigo do caso de teste.');
    if (!titulo) throw new AppError('Informe o titulo do caso de teste.');

    if (await testCaseRepository.buscarPorCodigo(codigo)) {
      throw new AppError(`Ja existe um caso de teste com o codigo "${codigo}".`, 409);
    }

    return testCaseRepository.criar({
      codigo,
      titulo,
      requisito: body.requisito?.trim() || null,
      pre_condicoes: body.preCondicoes?.trim() || null,
      passos: body.passos?.trim() || null,
      resultado_esperado: body.resultadoEsperado?.trim() || null,
    });
  },
};
