import { auditRepository } from '../repositories/auditRepository.js';
import { ncRepository } from '../repositories/ncRepository.js';

/** Agrega os numeros das telas de dashboard (requisito 6). */
export const dashboardService = {
  async resumo() {
    const [auditorias, contagem] = await Promise.all([
      auditRepository.listar(),
      ncRepository.contarPorStatus(),
    ]);

    const porStatus = Object.fromEntries(contagem.map((r) => [r.status, r.total]));
    const abertas =
      (porStatus.aberta || 0) +
      (porStatus.em_correcao || 0) +
      (porStatus.aguardando_validacao || 0);

    const finalizadas = auditorias.filter((a) => a.status === 'finalizada');
    const comAderencia = finalizadas.filter((a) => a.aderencia != null);
    const aderenciaMedia = comAderencia.length
      ? Math.round(
          (comAderencia.reduce((s, a) => s + Number(a.aderencia), 0) /
            comAderencia.length) *
            100,
        ) / 100
      : null;

    return {
      auditorias: {
        total: auditorias.length,
        finalizadas: finalizadas.length,
        emAndamento: auditorias.length - finalizadas.length,
        aderenciaMedia,
        lista: auditorias.map((a) => ({
          id: a.id,
          caso: `${a.caso_codigo} - ${a.caso_titulo}`,
          status: a.status,
          estrategia: a.estrategia,
          aderencia: a.aderencia == null ? null : Number(a.aderencia),
          qtdNc: a.qtd_nc,
          criadoEm: a.criado_em,
        })),
      },
      naoConformidades: {
        abertas,
        atrasadas: porStatus.atrasada || 0,
        resolvidas: porStatus.resolvida || 0,
        aguardandoValidacao: porStatus.aguardando_validacao || 0,
        emCorrecao: porStatus.em_correcao || 0,
        porStatus,
      },
    };
  },
};
