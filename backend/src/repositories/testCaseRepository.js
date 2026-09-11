/**
 * PADRAO DE PROJETO: Repository
 * Isola o acesso a dados (SQL/MySQL) das regras de negocio.
 * Somente esta camada conhece tabelas e colunas.
 */
import { pool } from '../config/db.js';

export const testCaseRepository = {
  async listar() {
    const [rows] = await pool.query(
      `SELECT id, codigo, titulo, requisito, pre_condicoes, passos,
              resultado_esperado, criado_em
         FROM casos_teste
        ORDER BY codigo`,
    );
    return rows;
  },

  async buscarPorId(id) {
    const [rows] = await pool.query(
      `SELECT id, codigo, titulo, requisito, pre_condicoes, passos,
              resultado_esperado, criado_em
         FROM casos_teste WHERE id = :id`,
      { id },
    );
    return rows[0] || null;
  },

  async buscarPorCodigo(codigo) {
    const [rows] = await pool.query(
      `SELECT id FROM casos_teste WHERE codigo = :codigo`,
      { codigo },
    );
    return rows[0] || null;
  },

  async criar(dados) {
    const [res] = await pool.query(
      `INSERT INTO casos_teste
         (codigo, titulo, requisito, pre_condicoes, passos, resultado_esperado)
       VALUES (:codigo, :titulo, :requisito, :pre_condicoes, :passos, :resultado_esperado)`,
      dados,
    );
    return this.buscarPorId(res.insertId);
  },
};
