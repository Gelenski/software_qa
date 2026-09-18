import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const smtpConfigurado = Boolean(process.env.SMTP_HOST);

export const remetente = process.env.SMTP_FROM || 'TestAudit <no-reply@testaudit.local>';

/**
 * null quando SMTP_HOST nao esta configurado - nesse caso o mailService
 * cai no modo de teste (loga o e-mail no console em vez de enviar).
 * Timeouts curtos: um SMTP fora do ar nao pode travar a requisicao HTTP
 * (criacao de NC, escalonamento) nem a varredura de cron.
 */
export const transporter = smtpConfigurado
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
    })
  : null;
