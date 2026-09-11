import { pool } from '../config/db.js';

export const auditRepository = {
  async criar({ casoTesteId, estrategia }) {
    const [res] = await pool.query(
      `INSERT INTO auditorias (caso_teste_id, estrategia)
       VALUES (:casoTesteId, :estrategia)`,
      { casoTesteId, estrategia },
    );
    return res.insertId;
  },

  /** Cria uma linha de resposta (vazia) para cada item do checklist. */
  async criarItens(auditoriaId, checklistItemIds) {
    if (checklistItemIds.length === 0) return;
    const values = checklistItemIds.map((cid) => [auditoriaId, cid]);
    await pool.query(
      `INSERT INTO auditoria_itens (auditoria_id, checklist_item_id) VALUES ?`,
      [values],
    );
  },

  async buscarPorId(id) {
    const [rows] = await pool.query(
      `SELECT a.id, a.caso_teste_id, a.estrategia, a.status, a.aderencia,
              a.criado_em, a.finalizado_em,
              c.codigo AS caso_codigo, c.titulo AS caso_titulo
         FROM auditorias a
         JOIN casos_teste c ON c.id = a.caso_teste_id
        WHERE a.id = :id`,
      { id },
    );
    return rows[0] || null;
  },

  async listar() {
    const [rows] = await pool.query(
      `SELECT a.id, a.estrategia, a.status, a.aderencia, a.criado_em, a.finalizado_em,
              c.codigo AS caso_codigo, c.titulo AS caso_titulo,
              (SELECT COUNT(*) FROM nao_conformidades n WHERE n.auditoria_id = a.id) AS qtd_nc
         FROM auditorias a
         JOIN casos_teste c ON c.id = a.caso_teste_id
        ORDER BY a.criado_em DESC, a.id DESC`,
    );
    return rows;
  },

  async listarItens(auditoriaId) {
    const [rows] = await pool.query(
      `SELECT ai.checklist_item_id, ai.resposta, ai.observacao,
              ci.ordem, ci.pergunta
         FROM auditoria_itens ai
         JOIN checklist_itens ci ON ci.id = ai.checklist_item_id
        WHERE ai.auditoria_id = :auditoriaId
        ORDER BY ci.ordem`,
      { auditoriaId },
    );
    return rows;
  },

  async atualizarResposta(auditoriaId, checklistItemId, { resposta, observacao }) {
    const [res] = await pool.query(
      `UPDATE auditoria_itens
          SET resposta = :resposta, observacao = :observacao
        WHERE auditoria_id = :auditoriaId AND checklist_item_id = :checklistItemId`,
      { auditoriaId, checklistItemId, resposta, observacao: observacao ?? null },
    );
    return res.affectedRows > 0;
  },

  async finalizar(auditoriaId, aderencia) {
    await pool.query(
      `UPDATE auditorias
          SET status = 'finalizada', aderencia = :aderencia, finalizado_em = NOW()
        WHERE id = :auditoriaId`,
      { auditoriaId, aderencia },
    );
  },

  async atualizarAderencia(auditoriaId, aderencia) {
    await pool.query(
      `UPDATE auditorias SET aderencia = :aderencia WHERE id = :auditoriaId`,
      { auditoriaId, aderencia },
    );
  },
};
