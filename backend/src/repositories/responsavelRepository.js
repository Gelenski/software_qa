/**
 * PADRAO DE PROJETO: Repository
 * Isola o acesso a dados (SQL/MySQL) das regras de negocio.
 * Somente esta camada conhece tabelas e colunas.
 */
import { pool } from '../config/db.js';

export const responsavelRepository = {
  async listar() {
    const [rows] = await pool.query(
      `SELECT id, nome, email, criado_em FROM responsaveis ORDER BY nome`,
    );
    return rows;
  },

  async buscarPorId(id) {
    const [rows] = await pool.query(
      `SELECT id, nome, email, criado_em FROM responsaveis WHERE id = :id`,
      { id },
    );
    return rows[0] || null;
  },

  async buscarPorNome(nome) {
    const [rows] = await pool.query(
      `SELECT id, nome, email FROM responsaveis WHERE nome = :nome`,
      { nome },
    );
    return rows[0] || null;
  },

  async criar({ nome, email }) {
    const [res] = await pool.query(
      `INSERT INTO responsaveis (nome, email) VALUES (:nome, :email)`,
      { nome, email },
    );
    return this.buscarPorId(res.insertId);
  },

  async atualizarEmail(id, { email }) {
    await pool.query(`UPDATE responsaveis SET email = :email WHERE id = :id`, { id, email });
    return this.buscarPorId(id);
  },
};
