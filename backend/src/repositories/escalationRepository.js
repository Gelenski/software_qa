import { pool } from '../config/db.js';

export const escalationRepository = {
  async registrar({ ncId, motivo, prazoOriginal, diasAtraso }) {
    const [res] = await pool.query(
      `INSERT INTO escalonamentos (nc_id, motivo, prazo_original, dias_atraso)
       VALUES (:ncId, :motivo, :prazoOriginal, :diasAtraso)`,
      { ncId, motivo, prazoOriginal, diasAtraso },
    );
    return res.insertId;
  },

  async listarPorNc(ncId) {
    const [rows] = await pool.query(
      `SELECT id, nc_id, motivo, prazo_original, dias_atraso, criado_em
         FROM escalonamentos
        WHERE nc_id = :ncId
        ORDER BY criado_em DESC`,
      { ncId },
    );
    return rows;
  },
};
