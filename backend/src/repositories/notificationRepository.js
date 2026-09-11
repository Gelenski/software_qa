import { pool } from '../config/db.js';

export const notificationRepository = {
  async criar({ ncId, destinatario, assunto, mensagem, canal = 'simulado' }) {
    const [res] = await pool.query(
      `INSERT INTO notificacoes (nc_id, destinatario, canal, assunto, mensagem)
       VALUES (:ncId, :destinatario, :canal, :assunto, :mensagem)`,
      { ncId, destinatario, canal, assunto, mensagem },
    );
    return res.insertId;
  },

  async listar({ ncId } = {}) {
    const where = ncId ? 'WHERE nc_id = :ncId' : '';
    const [rows] = await pool.query(
      `SELECT id, nc_id, destinatario, canal, assunto, mensagem, lida, criado_em
         FROM notificacoes
         ${where}
        ORDER BY criado_em DESC, id DESC`,
      { ncId },
    );
    return rows;
  },
};
