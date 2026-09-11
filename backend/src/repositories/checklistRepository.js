import { pool } from '../config/db.js';

/** Checklist fixo, armazenado como dados na tabela checklist_itens. */
export const checklistRepository = {
  async listarAtivos() {
    const [rows] = await pool.query(
      `SELECT id, ordem, pergunta
         FROM checklist_itens
        WHERE ativo = 1
        ORDER BY ordem`,
    );
    return rows;
  },
};
