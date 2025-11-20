import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import envConfig from '../config';
import PlaidVerifyIdentityEmail from 'src/emails/otp';

@Injectable()
export class EmailService {
  private resend: Resend;
  constructor() {
    this.resend = new Resend(envConfig.RESEND_API_KEY);
  }

  async sendOTP(payload: { email: string; code: string }) {
    return this.resend.emails.send({
      from: 'Briswell <onboarding@resend.dev>',
      to: [payload.email],
      subject: 'Code OTP',
      react: <PlaidVerifyIdentityEmail validationCode={payload.code} />,
    });
  }
}
