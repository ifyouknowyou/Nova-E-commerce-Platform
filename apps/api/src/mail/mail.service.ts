import { Inject, Injectable, Logger } from '@nestjs/common';
import { CONFIG, type AppConfig } from '../config/configuration';

export interface MailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface MailProvider {
  send(input: MailInput): Promise<void>;
}

/** Development provider — prints to the log instead of sending. */
class ConsoleMailProvider implements MailProvider {
  private readonly logger = new Logger('Mail');
  async send(input: MailInput): Promise<void> {
    this.logger.log(`[dev-mail] To: ${input.to} | Subject: ${input.subject}`);
    const urls = (input.text ?? input.html).match(/https?:\/\/[^\s<"']+/g) ?? [];
    for (const url of urls) this.logger.log(`[dev-mail] LINK: ${url}`);
    this.logger.log(`[dev-mail] ---\n${input.text ?? input.html}\n---`);
  }
}

/** Production provider — Resend HTTP API (no SDK dependency). */
class ResendMailProvider implements MailProvider {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(input: MailInput): Promise<void> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend send failed (${res.status}): ${body.slice(0, 200)}`);
    }
  }
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly provider: MailProvider;
  private readonly linkBase: string;

  constructor(@Inject(CONFIG) config: AppConfig) {
    if (config.mailProvider === 'resend' && config.resendApiKey) {
      this.provider = new ResendMailProvider(config.resendApiKey, config.mailFrom);
    } else {
      if (config.mailProvider === 'resend') {
        this.logger.warn(
          'EMAIL_PROVIDER=resend but RESEND_API_KEY is not set — emails are NOT being sent. ' +
            'Verification/password links are logged to the API console instead. ' +
            'Add a valid RESEND_API_KEY (and a Resend-verified sender in MAIL_FROM) to send real email.',
        );
      }
      this.provider = new ConsoleMailProvider();
    }
    this.linkBase = config.webUrl;
  }

  async sendVerificationEmail(to: string, code: string, name: string): Promise<void> {
    const link = `${this.linkBase}/verify-email`;
    await this.provider.send({
      to,
      subject: 'Your NOVA verification code',
      html: `Hello ${name || 'there'},<br/>Your email verification code is:<br/><br/><strong style="font-size:28px;letter-spacing:6px">${code}</strong><br/><br/>Enter this code on the verification page to confirm your email. It expires in 30 minutes.<br/><a href="${link}">Verify your email</a>`,
      text: `Hello ${name || 'there'}. Your NOVA verification code is: ${code}. It expires in 30 minutes. Open ${link} to enter it.`,
    });
  }

  async sendPasswordResetEmail(to: string, token: string, name: string): Promise<void> {
    const link = `${this.linkBase}/reset-password?token=${token}`;
    await this.provider.send({
      to,
      subject: 'Reset your password',
      html: `Hello ${name || 'there'},<br/>Reset your password here:<br/><a href="${link}">Reset password</a><br/>This link expires in 1 hour.`,
      text: `Hello ${name || 'there'}. Reset your password: ${link}`,
    });
  }

  async sendPasswordChangedEmail(to: string): Promise<void> {
    await this.provider.send({
      to,
      subject: 'Your password was changed',
      html: 'Your password has been successfully changed. If this was not you, contact support immediately.',
    });
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    await this.provider.send({
      to,
      subject: 'Welcome to NOVA Commerce',
      html: `Hello ${name || 'there'},<br/>Welcome to NOVA Commerce. Your account is fully verified.`,
    });
  }

}
