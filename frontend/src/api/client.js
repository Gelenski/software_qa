const BASE = '/api';

async function request(caminho, opcoes = {}) {
  const ehFormData = opcoes.body instanceof FormData;
  const resp = await fetch(BASE + caminho, {
    ...opcoes,
    headers: ehFormData ? opcoes.headers : { 'Content-Type': 'application/json', ...opcoes.headers },
  });
  const texto = await resp.text();
  const dados = texto ? JSON.parse(texto) : null;
  if (!resp.ok) {
    throw new Error(dados?.erro || `Erro ${resp.status}`);
  }
  return dados;
}

export const api = {
  // Casos de teste
  listarCasos: () => request('/casos-teste'),
  criarCaso: (body) => request('/casos-teste', { method: 'POST', body: JSON.stringify(body) }),
  importarCasos: (arquivo) => {
    const dados = new FormData();
    dados.append('arquivo', arquivo);
    return request('/casos-teste/importar', { method: 'POST', body: dados });
  },

  // Checklist templates
  listarChecklistTemplates: () => request('/checklist-templates'),
  obterChecklistTemplate: (id) => request(`/checklist-templates/${id}`),
  criarChecklistTemplate: (body) =>
    request('/checklist-templates', { method: 'POST', body: JSON.stringify(body) }),
  copiarChecklistTemplate: (id, body) =>
    request(`/checklist-templates/${id}/copiar`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // Auditorias
  listarAuditorias: () => request('/auditorias'),
  iniciarAuditoria: (body) =>
    request('/auditorias', { method: 'POST', body: JSON.stringify(body) }),
  obterAuditoria: (id) => request(`/auditorias/${id}`),
  responderItem: (id, itemId, body) =>
    request(`/auditorias/${id}/itens/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  finalizarAuditoria: (id) =>
    request(`/auditorias/${id}/finalizar`, { method: 'POST' }),

  // Nao conformidades
  listarNc: ({ status, responsavel } = {}) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (responsavel) params.set('responsavel', responsavel);
    const qs = params.toString();
    return request('/nao-conformidades' + (qs ? `?${qs}` : ''));
  },
  obterNc: (id) => request(`/nao-conformidades/${id}`),
  criarNc: (body) =>
    request('/nao-conformidades', { method: 'POST', body: JSON.stringify(body) }),
  alterarStatusNc: (id, status) =>
    request(`/nao-conformidades/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  verificarPrazos: () =>
    request('/nao-conformidades/verificar-prazos', { method: 'POST' }),
  escalarNc: (id) =>
    request(`/nao-conformidades/${id}/escalonar`, { method: 'POST' }),

  // Responsaveis
  listarResponsaveis: () => request('/responsaveis'),
  criarResponsavel: (body) =>
    request('/responsaveis', { method: 'POST', body: JSON.stringify(body) }),
  atualizarResponsavel: (id, body) =>
    request(`/responsaveis/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  // Dashboard
  dashboard: () => request('/dashboard'),
};
