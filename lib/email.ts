/**
 * Email helper (Gmail SMTP via nodemailer).
 * Env: GMAIL_USER, GMAIL_APP_PASSWORD (Google App Password, needs 2FA), EMAIL_FROM (optional).
 * Swap the transport here to move to Resend/Brevo without touching callers.
 */
import nodemailer from 'nodemailer';

interface Attachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Attachment[];
}

const globalForMail = globalThis as unknown as { mailer?: nodemailer.Transporter };

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error('GMAIL_USER / GMAIL_APP_PASSWORD is not configured');
  }
  // Reuse the SMTP connection across warm serverless invocations.
  if (!globalForMail.mailer) {
    globalForMail.mailer = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
    });
  }
  return globalForMail.mailer;
}

export async function sendEmail({ to, subject, html, text, attachments }: SendEmailParams) {
  const user = process.env.GMAIL_USER!;
  const info = await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || user,
    to,
    subject,
    html,
    text,
    attachments,
  });
  return { messageId: info.messageId, accepted: info.accepted as string[], rejected: info.rejected as string[] };
}
