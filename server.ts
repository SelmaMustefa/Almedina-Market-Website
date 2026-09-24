import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import cors from 'cors';
import apiRouter from './server/index';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4173;

app.use(cors());
app.use(express.json());

// Security headers middleware
app.use((_req: Request, res: Response, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Container Health Check Route (for EthioDeploy / Docker / orchestrators)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

// Mount modular REST APIs under /api
app.use('/api', apiRouter);

// ─────────────────────────────────────────────────────────────────────────────
// Email Delivery API Endpoints (Direct Gmail SMTP & Resend)
// ─────────────────────────────────────────────────────────────────────────────

const STORE_OWNER_EMAIL = 'al.medina.market90@gmail.com';
const DEFAULT_RESEND_KEY = '';

function getAdminEmail(): string {
  return process.env.ADMIN_NOTIFICATION_EMAIL?.trim() || STORE_OWNER_EMAIL;
}

function getGmailCredentials(): { user: string; pass: string } | null {
  const user = process.env.GMAIL_USER?.trim() || STORE_OWNER_EMAIL;
  const pass = process.env.GMAIL_APP_PASSWORD?.trim() || process.env.SMTP_PASSWORD?.trim();
  if (user && pass) {
    return { user, pass };
  }
  return null;
}

function getResendKey(): string | null {
  return process.env.RESEND_API_KEY?.trim() || DEFAULT_RESEND_KEY;
}

/**
 * GET /api/email/status
 * Returns status of email delivery integration
 */
app.get('/api/email/status', (_req: Request, res: Response) => {
  const gmail = getGmailCredentials();
  const resend = getResendKey();
  res.json({
    recipientEmail: getAdminEmail(),
    gmailSmtpConfigured: !!gmail,
    resendConfigured: !!resend,
    activeProvider: gmail ? 'gmail_smtp' : resend ? 'resend' : 'mock',
  });
});

/**
 * POST /api/contact/send
 * Sends contact form inquiry directly to store owner inbox (al.medina.market90@gmail.com)
 */
app.post('/api/contact/send', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name and message are required.',
      });
    }

    const recipient = getAdminEmail();
    
    // Clean any legacy [Subject: ...] prefixes from the message body
    const cleanMessage = typeof message === 'string'
      ? message.replace(/^\[Subject:\s*[^\]]+\]\s*/i, '').trim()
      : message;

    const rawSubject = (subject || '').trim();
    const cleanSubject =
      rawSubject && !rawSubject.toLowerCase().includes('inquiry via footer email icon')
        ? rawSubject
        : `Customer Inquiry from ${name}`;

    const senderEmail = email?.trim() || 'no-reply@almedinamarket.et';
    const gmailCreds = getGmailCredentials();

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAF8F0; padding: 24px; border-radius: 16px; border: 1px solid #e5e0d3; color: #1A1A1A;">
        <div style="border-bottom: 2px solid #059669; padding-bottom: 12px; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 20px; color: #065f46; font-weight: 800;">Almedina Market Bethel</h1>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b7280;">New Contact Form Message Received</p>
        </div>

        <div style="background-color: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 130px; font-weight: 600;">Customer Name:</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 700;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Customer Email:</td>
              <td style="padding: 8px 0; color: #111827;"><a href="mailto:${senderEmail}" style="color: #059669; font-weight: 600;">${senderEmail}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Phone Number:</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 600;">${phone || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Subject:</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 600;">${cleanSubject}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Received At:</td>
              <td style="padding: 8px 0; color: #6b7280;">${new Date().toLocaleString('en-US', { timeZone: 'Africa/Addis_Ababa' })} (EAT)</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #ffffff; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb;">
          <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 14px; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Message Content</h3>
          <div style="font-size: 14px; line-height: 1.6; color: #1f2937; white-space: pre-wrap; background-color: #f9fafb; padding: 14px; border-radius: 8px; border-left: 4px solid #059669;">
${cleanMessage}
          </div>
        </div>

        <div style="margin-top: 24px; text-align: center; font-size: 12px; color: #9ca3af;">
          <p style="margin: 0;">Sent automatically from Almedina Market Bethel Storefront</p>
          <p style="margin: 4px 0 0 0;">Click Reply to respond directly to the customer at ${senderEmail}</p>
        </div>
      </div>
    `;

    // Strategy 1: Direct Gmail SMTP via Nodemailer (Directly delivers to al.medina.market90@gmail.com)
    if (gmailCreds) {
      console.log(`[SMTP] Sending message to ${recipient} via Gmail SMTP...`);
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailCreds.user,
          pass: gmailCreds.pass,
        },
      });

      const info = await transporter.sendMail({
        from: `"Almedina Market Contact Form" <${gmailCreds.user}>`,
        to: recipient,
        replyTo: senderEmail.includes('@') ? senderEmail : undefined,
        subject: `[Almedina Inquiry] ${cleanSubject} - from ${name}`,
        html: htmlBody,
      });

      console.log(`[SMTP] Message delivered successfully to ${recipient}! ID: ${info.messageId}`);
      return res.json({
        success: true,
        message: `Message sent directly to ${recipient}`,
        provider: 'gmail_smtp',
        id: info.messageId,
      });
    }

    // Strategy 2: Resend API
    const resendKey = getResendKey();
    if (resendKey) {
      console.log(`[Resend] Dispatching email to ${recipient}...`);
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Almedina Market <onboarding@resend.dev>',
          to: [recipient],
          reply_to: senderEmail.includes('@') ? senderEmail : undefined,
          subject: `[Almedina Inquiry] ${cleanSubject} - from ${name}`,
          html: htmlBody,
        }),
      });

      const resendData = (await resendRes.json()) as any;

      if (resendRes.ok) {
        console.log(`[Resend] Email delivered successfully to ${recipient}! ID: ${resendData.id}`);
        return res.json({
          success: true,
          message: `Message sent directly to ${recipient}`,
          provider: 'resend',
          id: resendData.id,
        });
      } else {
        console.warn('[Resend Warning]:', resendData.message);
        // If Resend restricted testing to account owner email, explain clearly
        return res.status(200).json({
          success: true,
          isSimulation: true,
          recipient,
          note: 'Resend Sandbox mode restricts external delivery. Use Gmail App Password for direct delivery to ' + recipient,
        });
      }
    }

    // Strategy 3: Simulated / local capture
    return res.json({
      success: true,
      isSimulation: true,
      recipient,
      message: `Message recorded for ${recipient}.`,
    });
  } catch (error: any) {
    console.error('[Email Dispatch] Exception:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error processing contact message.',
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Vite Middleware / Static Asset Serving
// ─────────────────────────────────────────────────────────────────────────────


async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  });
}

// Only start the server if not running in a Serverless environment (like Vercel)
if (!process.env.VERCEL) {
  startServer();
}

export default app;
