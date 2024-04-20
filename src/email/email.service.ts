import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter, SendMailOptions } from 'nodemailer';

@Injectable()
export class EmailService {
  private transport: Transporter;

  constructor(private configService: ConfigService) {
    this.transport = createTransport({
      host: this.configService.get('email_host'),
      secure: true,
      auth: {
        user: this.configService.get('email_user'),
        pass: this.configService.get('email_password'),
      },
    });
  }

  async sendEmail({ to, subject, text, html }: SendMailOptions) {
    await this.transport.sendMail({
      from: {
        name: '灵境畅议会议室管理系统',
        address: this.configService.get('email_user'),
      },
      to,
      subject,
      html,
      text,
    });
  }
}
