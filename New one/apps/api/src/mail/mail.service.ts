import { Inject, Injectable, Logger } from '@nestjs/common';
import { appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  /** Structured payload the e2e tests can read (e.g. verification link). */
  meta?: Record<string, unknown>;
}

export const MAIL_TRANSPORT = 'MAIL_TRANSPORT';

export interface MailTransport {
  send(message: MailMessage): Promise<void>;
}

/**
 * Dev transport (Phase 2 default): logs to console AND appends a structured
 * record to <repo>/var/mail/outbox.jsonl so verification/reset/invite flows are
 * real and testable end-to-end without an SMTP server. Swap for an SMTP
 * transport when SMTP_* envs are configured.
 */
@Injectable()
export class DevMailTransport implements MailTransport {
  private readonly logger = new Logger(DevMailTransport.name);
  private readonly outboxPath = resolve(__dirname, '../../../../var/mail/outbox.jsonl');

  async send(message: MailMessage): Promise<void> {
    this.logger.log(`[mail:dev] -> ${message.to} | ${message.subject}`);
    this.logger.log(message.text);

    const dir = dirname(this.outboxPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    appendFileSync(this.outboxPath, `${JSON.stringify({ at: new Date().toISOString(), ...message })}\n`, 'utf8');
  }
}

@Injectable()
export class MailService {
  constructor(@Inject(MAIL_TRANSPORT) private readonly transport: MailTransport) {}

  send(message: MailMessage): Promise<void> {
    return this.transport.send(message);
  }
}
