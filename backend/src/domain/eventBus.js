/**
 * PADRAO DE PROJETO: Observer (Publish/Subscribe)
 * -----------------------------------------------------------------------------
 * Barramento de eventos de dominio. O EscalationService publica o evento
 * "nc.escalada"; assinantes (ex.: NotificationService) reagem sem que o
 * publicador os conheca. Facilita adicionar novos efeitos colaterais
 * (log, e-mail real, webhook) sem tocar na regra de escalonamento.
 */

export const EVENTOS = Object.freeze({
  NC_ESCALADA: 'nc.escalada',
});

class EventBus {
  #assinantes = new Map(); // evento -> Set<handler>

  subscribe(evento, handler) {
    if (!this.#assinantes.has(evento)) this.#assinantes.set(evento, new Set());
    this.#assinantes.get(evento).add(handler);
    return () => this.#assinantes.get(evento)?.delete(handler); // unsubscribe
  }

  async publish(evento, payload) {
    const handlers = this.#assinantes.get(evento);
    if (!handlers || handlers.size === 0) return;
    for (const handler of handlers) {
      try {
        await handler(payload);
      } catch (err) {
        // Um assinante com erro nao pode quebrar os demais nem o publicador.
        console.error(`[eventBus] assinante de "${evento}" falhou:`, err.message);
      }
    }
  }
}

export const eventBus = new EventBus();
