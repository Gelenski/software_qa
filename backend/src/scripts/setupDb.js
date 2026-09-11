/**
 * Cria o schema e carrega os dados iniciais.
 * Uso:  npm run db:setup   (dentro de backend/)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.resolve(__dirname, '../../db');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  for (const arquivo of ['schema.sql', 'seed.sql']) {
    const sql = await fs.readFile(path.join(dbDir, arquivo), 'utf8');
    process.stdout.write(`Executando ${arquivo}... `);
    await conn.query(sql);
    console.log('OK');
  }

  await conn.end();
  console.log('Banco pronto.');
}

run().catch((err) => {
  console.error('Falha no setup do banco:', err.message);
  process.exit(1);
});
