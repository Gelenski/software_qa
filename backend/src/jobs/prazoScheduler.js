import cron from 'node-cron';
import { escalationService } from '../services/escalationService.js';

/**
 * Job automatico periodico: roda a mesma varredura de prazos do botao
 * "Verificar prazos" (backend/src/services/escalationService.js), sem
 * exigir clique manual. Intervalo configuravel via CRON_VERIFICAR_PRAZOS
 * (padrao: a cada hora).
 */
export function iniciarVerificacaoPeriodica() {
  const expressao = process.env.CRON_VERIFICAR_PRAZOS || '0 * * * *';
  cron.schedule(expressao, () => {
    escalationService.verificarPrazos().catch((err) =>
      console.error('[cron] falha na verificacao periodica de prazos:', err.message),
    );
  });
  console.log(`[cron] verificacao de prazos agendada: "${expressao}"`);
}
