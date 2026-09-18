import { pool } from '../config/db.js';

/**
 * PADRAO DE PROJETO: Repository
 * Checklist templates: modelos reutilizaveis de perguntas para auditorias.
 */
export const checklistRepository = {
  async listarTemplates() {
    const [rows] = await pool.query(
      `SELECT t.id, t.nome, t.criado_em,
              (SELECT COUNT(*) FROM checklist_itens ci
                WHERE ci.template_id = t.id AND ci.ativo = 1) AS qtd_itens
         FROM checklist_templates t
        ORDER BY t.nome`,
    );
    return rows;
  },

  async buscarTemplatePorId(id) {
    const [rows] = await pool.query(
      `SELECT id, nome, criado_em FROM checklist_templates WHERE id = :id`,
      { id },
    );
    return rows[0] || null;
  },

  async criarTemplate({ nome }) {
    const [res] = await pool.query(
      `INSERT INTO checklist_templates (nome) VALUES (:nome)`,
      { nome },
    );
    return this.buscarTemplatePorId(res.insertId);
  },

  /** itens: [{ ordem, pergunta }] - insercao em lote. */
  async criarItens(templateId, itens) {
    if (itens.length === 0) return;
    const values = itens.map((it) => [templateId, it.ordem, it.pergunta]);
    await pool.query(
      `INSERT INTO checklist_itens (template_id, ordem, pergunta) VALUES ?`,
      [values],
    );
  },

  /** Todos os itens (inclui inativos) - usado na tela de detalhe do template. */
  async listarItensPorTemplate(templateId) {
    const [rows] = await pool.query(
      `SELECT id, ordem, pergunta, ativo
         FROM checklist_itens
        WHERE template_id = :templateId
        ORDER BY ordem`,
      { templateId },
    );
    return rows;
  },

  /** Itens ativos - usado ao iniciar auditoria e ao copiar um template. */
  async listarAtivosPorTemplate(templateId) {
    const [rows] = await pool.query(
      `SELECT id, ordem, pergunta
         FROM checklist_itens
        WHERE template_id = :templateId AND ativo = 1
        ORDER BY ordem`,
      { templateId },
    );
    return rows;
  },
};
