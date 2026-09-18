import { api } from './api/client.js';

const AUDITOR = { usuario: 'auditor', senha: 'auditor123', papel: 'auditor', nome: 'Auditor' };
// ponytail: sem senha real por responsavel (tabela nao tem coluna de senha) - basta o e-mail
// cadastrado. Ceiling: qualquer um com o e-mail entra como aquele responsavel.
const SENHA_TESTER = 'tester123';

const CHAVE = 'testaudit_sessao';

export async function login(usuario, senha) {
  if (usuario === AUDITOR.usuario && senha === AUDITOR.senha) {
    return salvar({ usuario: AUDITOR.usuario, papel: AUDITOR.papel, nome: AUDITOR.nome });
  }

  if (senha === SENHA_TESTER) {
    const responsaveis = await api.listarResponsaveis();
    const encontrado = responsaveis.find(
      (r) => r.email.toLowerCase() === usuario.trim().toLowerCase(),
    );
    if (encontrado) {
      return salvar({ usuario: encontrado.email, papel: 'tester', nome: encontrado.nome });
    }
  }

  throw new Error('Usuario ou senha invalidos');
}

function salvar(sessao) {
  localStorage.setItem(CHAVE, JSON.stringify(sessao));
  return sessao;
}

export function logout() {
  localStorage.removeItem(CHAVE);
}

export function getSessao() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE));
  } catch {
    return null;
  }
}
