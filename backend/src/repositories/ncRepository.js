import { pool } from '../config/db.js';

export const ncRepository = {
  async criar(dados) {
    const [res] = await pool.query(
      `INSERT INTO nao_conformidades
         (auditoria_id, checklist_item_id, descricao, severidade, responsavel, prazo, status)
       VALUES (:auditoriaId, :checklistItemId, :descricao, :severidade,
               :responsavel, :prazo, 'aberta')`,
      dados,
    );
    return this.buscarPorId(res.insertId);
  },

  async buscarPorId(id) {
    const [rows] = await pool.query(
      `SELECT n.*, ci.pergunta AS checklist_pergunta,
              a.caso_teste_id, c.codigo AS caso_codigo
         FROM nao_conformidades n
         LEFT JOIN checklist_itens ci ON ci.id = n.checklist_item_id
         JOIN auditorias a ON a.id = n.auditoria_id
         JOIN casos_teste c ON c.id = a.caso_teste_id
        WHERE n.id = :id`,
      { id },
    );
    return rows[0] || null;
  },

  async listar({ status, auditoriaId } = {}) {
    const cond = [];
    const params = {};
    if (status) {
      cond.push('n.status = :status');
      params.status = status;
    }
    if (auditoriaId) {
      cond.push('n.auditoria_id = :auditoriaId');
      params.auditoriaId = auditoriaId;
    }
    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';
    const [rows] = await pool.query(
      `SELECT n.*, ci.pergunta AS checklist_pergunta, c.codigo AS caso_codigo
         FROM nao_conformidades n
         LEFT JOIN checklist_itens ci ON ci.id = n.checklist_item_id
         JOIN auditorias a ON a.id = n.auditoria_id
         JOIN casos_teste c ON c.id = a.caso_teste_id
         ${where}
        ORDER BY n.criado_em DESC, n.id DESC`,
      params,
    );
    return rows;
  },

  /** NCs vencidas e ainda passiveis de escalonamento (nao resolvidas/atrasadas). */
  async listarVencidasNaoEscaladas(hoje) {
    const [rows] = await pool.query(
      `SELECT * FROM nao_conformidades
        WHERE prazo < :hoje
          AND status NOT IN ('resolvida', 'atrasada')`,
      { hoje },
    );
    return rows;
  },

  async atualizarStatus(id, { status, statusAnterior, escaladoEm }) {
    await pool.query(
      `UPDATE nao_conformidades
          SET status = :status,
              status_anterior = :statusAnterior,
              escalado_em = COALESCE(:escaladoEm, escalado_em)
        WHERE id = :id`,
      {
        id,
        status,
        statusAnterior: statusAnterior ?? null,
        escaladoEm: escaladoEm ?? null,
      },
    );
    return this.buscarPorId(id);
  },

  async contarPorStatus() {
    const [rows] = await pool.query(
      `SELECT status, COUNT(*) AS total
         FROM nao_conformidades
        GROUP BY status`,
    );
    return rows;
  },
};
