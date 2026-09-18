import ExcelJS from 'exceljs';
import { testCaseRepository } from '../repositories/testCaseRepository.js';
import { AppError } from '../domain/errors.js';

// Mapeia o cabecalho tecnico da planilha (linha 1 do template) para os campos
// aceitos por testCaseService.criar().
const CAMPOS_POR_COLUNA = {
  codigo: 'codigo',
  titulo: 'titulo',
  requisito: 'requisito',
  pre_condicoes: 'preCondicoes',
  passos: 'passos',
  resultado_esperado: 'resultadoEsperado',
};

// No template gerado: linha 1 = cabecalho tecnico, linha 2 = rotulos, linha 3 = exemplo.
const PRIMEIRA_LINHA_DE_DADOS = 4;

function textoCelula(row, col) {
  const v = row.getCell(col).value;
  if (v == null) return '';
  if (typeof v === 'object') return String(v.text ?? v.result ?? '');
  return String(v);
}

/** Le o .xlsx e devolve as linhas de dados ja mapeadas para o formato de testCaseService.criar(). */
export async function parseImportRows(buffer) {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    throw new AppError('Arquivo invalido. Envie um .xlsx no formato do template.');
  }

  const aba = workbook.getWorksheet('Casos de Teste') || workbook.worksheets[0];
  if (!aba) throw new AppError('Planilha vazia ou sem a aba "Casos de Teste".');

  const colunas = {};
  aba.getRow(1).eachCell({ includeEmpty: false }, (cell, col) => {
    const campo = CAMPOS_POR_COLUNA[String(cell.value || '').trim()];
    if (campo) colunas[col] = campo;
  });
  if (Object.keys(colunas).length === 0) {
    throw new AppError('Cabecalho da planilha nao reconhecido. Use o template de importacao.');
  }

  const linhas = [];
  for (let n = PRIMEIRA_LINHA_DE_DADOS; n <= aba.rowCount; n += 1) {
    const row = aba.getRow(n);
    const corpo = {};
    Object.entries(colunas).forEach(([col, campo]) => {
      corpo[campo] = textoCelula(row, Number(col)).trim();
    });
    if (Object.values(corpo).some((v) => v)) linhas.push({ linha: n, corpo });
  }
  return linhas;
}

export const testCaseService = {
  listar() {
    return testCaseRepository.listar();
  },

  async criar(body) {
    const codigo = (body.codigo || '').trim();
    const titulo = (body.titulo || '').trim();
    if (!codigo) throw new AppError('Informe o codigo do caso de teste.');
    if (!titulo) throw new AppError('Informe o titulo do caso de teste.');

    if (await testCaseRepository.buscarPorCodigo(codigo)) {
      throw new AppError(`Ja existe um caso de teste com o codigo "${codigo}".`, 409);
    }

    return testCaseRepository.criar({
      codigo,
      titulo,
      requisito: body.requisito?.trim() || null,
      pre_condicoes: body.preCondicoes?.trim() || null,
      passos: body.passos?.trim() || null,
      resultado_esperado: body.resultadoEsperado?.trim() || null,
    });
  },

  async importar(buffer) {
    const linhas = await parseImportRows(buffer);
    const falhas = [];
    let importados = 0;
    for (const { linha, corpo } of linhas) {
      try {
        await this.criar(corpo);
        importados += 1;
      } catch (err) {
        falhas.push({ linha, codigo: corpo.codigo || null, erro: err.message });
      }
    }
    return { importados, falhas };
  },
};
