import { test } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { parseImportRows } from './testCaseService.js';

async function bufferComLinhas(linhas) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Casos de Teste');
  linhas.forEach((linha) => ws.addRow(linha));
  return wb.xlsx.writeBuffer();
}

test('ignora rotulos e exemplo, mapeia colunas tecnicas para os campos de criar()', async () => {
  const buffer = await bufferComLinhas([
    ['codigo', 'titulo', 'requisito', 'pre_condicoes', 'passos', 'resultado_esperado'],
    ['Código*', 'Título*', 'Requisito', 'Pré-condições', 'Passos', 'Resultado Esperado'],
    ['CT-001', 'Exemplo', 'RF-001', 'pre', 'passo', 'resultado'],
    ['CT-010', 'Login OK', 'RF-002', 'usuario ativo', '1. abrir\n2. logar', 'entra no sistema'],
  ]);

  const linhas = await parseImportRows(buffer);

  assert.equal(linhas.length, 1); // linha 3 (exemplo do template) e sempre ignorada
  assert.deepEqual(linhas[0].corpo, {
    codigo: 'CT-010',
    titulo: 'Login OK',
    requisito: 'RF-002',
    preCondicoes: 'usuario ativo',
    passos: '1. abrir\n2. logar',
    resultadoEsperado: 'entra no sistema',
  });
  assert.equal(linhas[0].linha, 4);
});

test('pula linhas totalmente em branco dentro da area de dados', async () => {
  const buffer = await bufferComLinhas([
    ['codigo', 'titulo', 'requisito', 'pre_condicoes', 'passos', 'resultado_esperado'],
    ['Código*', 'Título*', 'Requisito', 'Pré-condições', 'Passos', 'Resultado Esperado'],
    ['CT-001', 'Exemplo', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['CT-020', 'Outro caso', '', '', '', ''],
  ]);

  const linhas = await parseImportRows(buffer);

  assert.equal(linhas.length, 1);
  assert.equal(linhas[0].corpo.codigo, 'CT-020');
});

test('rejeita planilha sem cabecalho tecnico reconhecido', async () => {
  const buffer = await bufferComLinhas([['foo', 'bar']]);
  await assert.rejects(() => parseImportRows(buffer), /Cabecalho/);
});
