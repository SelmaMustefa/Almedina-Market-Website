import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';

const router = Router();

// POST /api/contact
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, email, and message are required.',
      });
    }

    const adminEmail = process.env.STORE_ADMIN_EMAIL || 'admin@almadinamarket.com';
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const resendApiKey = process.env.RESEND_API_KEY;

    let emailSent = false;
    let transportMethod = 'none';

    // 1. Resend API attempt
    if (resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Almedina Market <onboarding@resend.dev>',
            to: [adminEmail],
            reply_to: email,
            subject: `[Customer Inquiry] ${subject || 'New Contact Form Message'} - From ${name}`,
            html: `
              <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #047857; margin-top: 0;">New Message from Almedina Market Storefront</h2>
                <p><strong>Customer Name:</strong> ${name}</p>
                <p><strong>Customer Email:</strong> <a href="mailto:${email}">${email}</a></p>
                <p><strong>Customer Phone:</strong> ${phone || 'Not provided'}</p>
                <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <h3 style="color: #334155;">Message Content:</h3>
                <p style="white-space: pre-wrap; background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #047857;">${message}</p>
              </div>
            `,
          }),
        });

        if (response.ok) {
          emailSent = true;
          transportMethod = 'resend';
        }
      } catch (resendErr) {
        console.warn('[ContactRoutes] Resend attempt error:', resendErr);
      }
    }

    // 2. Fallback to Nodemailer SMTP
    if (!emailSent && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: `"Almedina Market" <${smtpUser}>`,
          to: adminEmail,
          replyTo: email,
          subject: `[Customer Inquiry] ${subject || 'New Contact Form Message'} - From ${name}`,
          text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nSubject: ${subject}\n\nMessage:\n${message}`,
        });

        emailSent = true;
        transportMethod = 'smtp';
      } catch (smtpErr) {
        console.warn('[ContactRoutes] SMTP attempt error:', smtpErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully.',
      delivered: emailSent,
      transport: transportMethod,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[ContactRoutes] Error processing contact form:', error);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred while processing your message.',
    });
  }
});

export default router;
