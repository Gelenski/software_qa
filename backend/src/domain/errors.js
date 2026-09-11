/** Erro de regra de negocio - vira HTTP 400/409/404 no errorHandler. */
export class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'AppError';
    this.status = status;
  }
}

export class NotFoundError extends AppError {
  constructor(recurso = 'Recurso') {
    super(`${recurso} nao encontrado.`, 404);
    this.name = 'NotFoundError';
  }
}
