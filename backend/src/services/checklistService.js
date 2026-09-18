import { checklistRepository } from '../repositories/checklistRepository.js';
import { AppError, NotFoundError } from '../domain/errors.js';

export const checklistService = {
  listarTemplates() {
    return checklistRepository.listarTemplates();
  },

  async obterTemplate(id) {
    const template = await checklistRepository.buscarTemplatePorId(id);
    if (!template) throw new NotFoundError('Checklist template');
    const itens = await checklistRepository.listarItensPorTemplate(id);
    return { template, itens };
  },

  async criarTemplate(body) {
    const nome = (body.nome || '').trim();
    if (!nome) throw new AppError('Informe o nome do checklist.');

    const perguntas = (Array.isArray(body.perguntas) ? body.perguntas : [])
      .map((p) => (typeof p === 'string' ? p.trim() : ''))
      .filter(Boolean);
    if (perguntas.length === 0) {
      throw new AppError('Informe ao menos uma pergunta para o checklist.');
    }

    const template = await checklistRepository.criarTemplate({ nome });
    const itens = perguntas.map((pergunta, i) => ({ ordem: i + 1, pergunta }));
    await checklistRepository.criarItens(template.id, itens);
    return this.obterTemplate(template.id);
  },

  /** Copia os itens ATIVOS de um template existente para um novo template nomeado. */
  async copiarTemplate(id, body) {
    const origem = await checklistRepository.buscarTemplatePorId(id);
    if (!origem) throw new NotFoundError('Checklist template');

    const nome = (body.nome || '').trim();
    if (!nome) throw new AppError('Informe o nome do novo checklist.');

    const itensOrigem = await checklistRepository.listarAtivosPorTemplate(id);
    if (itensOrigem.length === 0) {
      throw new AppError('O checklist de origem nao possui itens ativos para copiar.');
    }

    const novoTemplate = await checklistRepository.criarTemplate({ nome });
    const itens = itensOrigem.map((item, i) => ({ ordem: i + 1, pergunta: item.pergunta }));
    await checklistRepository.criarItens(novoTemplate.id, itens);
    return this.obterTemplate(novoTemplate.id);
  },
};
