import { Router, Request, Response } from 'express';
import { getSupabaseAdmin } from '../config/supabaseAdmin';

const router = Router();

const DEFAULT_CHAPA_SECRET = '';
const DEFAULT_CHAPA_PUBLIC = '';
const DEFAULT_CHAPA_ENCRYPTION = '';

function getChapaBaseUrl(): string {
  const base = (process.env.CHAPA_BASE_URL || 'https://api.chapa.co').replace(/\/+$/, '');
  return base.endsWith('/v1') ? base : `${base}/v1`;
}

function getChapaSecret(): string {
  return (process.env.CHAPA_SECRET_KEY || process.env.CHAPA_API_KEY || DEFAULT_CHAPA_SECRET).trim();
}

function getChapaPublic(): string {
  return (process.env.CHAPA_PUBLIC_KEY || DEFAULT_CHAPA_PUBLIC).trim();
}

function getChapaEncryptionKey(): string {
  return (process.env.CHAPA_ENCRYPTION_KEY || DEFAULT_CHAPA_ENCRYPTION).trim();
}

// GET /api/chapa/status or /api/payments/chapa/status
router.get('/status', (req: Request, res: Response) => {
  const secretKey = getChapaSecret();
  const publicKey = getChapaPublic();
  const hasSecret = !!secretKey;
  const isTest = secretKey.startsWith('CHASECK_TEST');

  res.json({
    configured: hasSecret,
    hasPublicKey: !!publicKey,
    environment: isTest ? 'test' : 'live',
    publicKey: publicKey ? `${publicKey.slice(0, 14)}...` : null,
  });
});

// POST /api/chapa/initialize or /api/payments/chapa/initialize
router.post('/initialize', async (req: Request, res: Response) => {
  try {
    const {
      amount,
      currency = 'ETB',
      email,
      first_name,
      last_name,
      phone_number,
      tx_ref,
      callback_url,
      return_url,
      customization,
    } = req.body;

    if (!amount || !tx_ref) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: amount and tx_ref are required.',
      });
    }

    const secretKey = getChapaSecret();
    if (!secretKey) {
      return res.status(500).json({
        success: false,
        message: 'Chapa gateway secret key is not configured on the server.',
      });
    }

    // Sanitize email: Ensure valid format for Chapa API validation
    let validEmail = (email || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!validEmail || !emailRegex.test(validEmail)) {
      validEmail = 'customer@almadinamarket.com';
    }

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const origin = `${protocol}://${host}`;

    // Chapa strictly enforces customization.title <= 16 characters!
    const customTitle = (customization?.title || 'Almedina Market').slice(0, 16);
    const customDesc = (customization?.description || `Order ${tx_ref}`).slice(0, 50);

    const payload = {
      amount: String(amount),
      currency: currency || 'ETB',
      email: validEmail,
      first_name: (first_name || 'Customer').trim(),
      last_name: (last_name || 'Almedina').trim(),
      phone_number: (phone_number || '0911223344').trim(),
      tx_ref: String(tx_ref).trim(),
      callback_url: callback_url || `${origin}/api/chapa/webhook`,
      return_url: return_url || `${origin}/?chapa_verify=1&tx_ref=${tx_ref}`,
      customization: {
        title: customTitle,
        description: customDesc,
      },
    };

    const apiUrl = getChapaBaseUrl();
    console.log(`[Chapa Gateway] Initializing transaction ${tx_ref} for ${amount} ETB via ${apiUrl}...`);

    const response = await fetch(`${apiUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as any;

    if (!response.ok || data.status !== 'success') {
      console.error('[Chapa Gateway] Upstream error from Chapa:', data);
      return res.status(response.status >= 400 && response.status < 500 ? response.status : 400).json({
        success: false,
        message: typeof data.message === 'string' ? data.message : 'Chapa payment gateway initialization failed.',
        error: data,
      });
    }

    console.log(`[Chapa Gateway] Success! Checkout URL: ${data.data?.checkout_url}`);
    return res.json({
      success: true,
      checkoutUrl: data.data?.checkout_url,
      txRef: tx_ref,
      data: data.data,
    });
  } catch (error: any) {
    console.error('[Chapa Gateway] Exception during initialization:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Payment initialization failed on server.',
    });
  }
});

// GET /api/chapa/verify/:txRef or /api/payments/chapa/verify/:txRef
router.get('/verify/:txRef', async (req: Request, res: Response) => {
  try {
    const { txRef } = req.params;

    if (!txRef) {
      return res.status(400).json({
        success: false,
        message: 'Transaction reference (txRef) parameter is required.',
      });
    }

    const secretKey = getChapaSecret();
    const apiUrl = getChapaBaseUrl();
    console.log(`[Chapa Gateway] Verifying transaction reference: ${txRef} via ${apiUrl}...`);

    const response = await fetch(`${apiUrl}/transaction/verify/${encodeURIComponent(txRef)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = (await response.json()) as any;

    if (!response.ok || data.status !== 'success') {
      console.warn(`[Chapa Gateway] Verification check for ${txRef} returned:`, data);
      return res.json({
        success: false,
        isPaid: false,
        status: data.data?.status || 'pending',
        message: data.message || 'Payment not verified or not completed yet.',
        data: data.data,
      });
    }

    const isPaid = data.data?.status === 'success';
    console.log(`[Chapa Gateway] Verified status for ${txRef}: ${data.data?.status} (isPaid: ${isPaid})`);

    // Synchronize verified payment to Supabase database orders and payments tables
    if (isPaid) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          const now = new Date().toISOString();
          
          // Verify amount and currency
          const { data: existingOrder } = await supabase
            .from('orders')
            .select('id, total_etb, payment_status')
            .eq('chapa_tx_ref', txRef)
            .single();

          if (existingOrder) {
            // Idempotent: Update order if not already marked paid
            if (existingOrder.payment_status !== 'paid') {
              await supabase
                .from('orders')
                .update({
                  payment_status: 'paid',
                  order_status: 'confirmed',
                  updated_at: now,
                })
                .eq('id', existingOrder.id);
            }

            // Upsert payment record
            await supabase
              .from('payments')
              .upsert({
                order_id: existingOrder.id,
                payment_method: 'chapa',
                payment_status: 'paid',
                amount: Number(data.data?.amount || existingOrder.total_etb),
                currency: 'ETB',
                provider: 'chapa',
                provider_transaction_id: data.data?.reference || null,
                internal_transaction_reference: txRef,
                updated_at: now,
              }, { onConflict: 'order_id' });

            console.log(`[Chapa Gateway] Supabase order and payment updated to PAID for txRef: ${txRef}`);
          }
        } catch (dbErr) {
          console.warn('[Chapa Gateway] Supabase sync notice:', dbErr);
        }
      }
    }

    return res.json({
      success: true,
      isPaid,
      status: data.data?.status,
      amount: data.data?.amount,
      currency: data.data?.currency,
      reference: data.data?.reference,
      paymentMethod: data.data?.method,
      customer: {
        email: data.data?.email,
        firstName: data.data?.first_name,
        lastName: data.data?.last_name,
      },
      data: data.data,
    });
  } catch (error: any) {
    console.error('[Chapa Gateway] Exception during verify:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Payment verification failed on server.',
    });
  }
});

// POST /api/chapa/webhook or /api/payments/chapa/webhook
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-chapa-signature'] || req.headers['chapa-signature'];
    const eventData = req.body || {};
    console.log('[Chapa Webhook] Event received:', { signature, body: eventData });

    const txRef = eventData.tx_ref || eventData.trx_ref;
    const status = eventData.status;

    if (txRef && (status === 'success' || status === 'paid')) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const now = new Date().toISOString();
        const { data: order } = await supabase
          .from('orders')
          .select('id, total_etb')
          .eq('chapa_tx_ref', txRef)
          .single();

        if (order) {
          await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              order_status: 'confirmed',
              updated_at: now,
            })
            .eq('id', order.id);

          await supabase
            .from('payments')
            .upsert({
              order_id: order.id,
              payment_method: 'chapa',
              payment_status: 'paid',
              amount: Number(eventData.amount || order.total_etb),
              currency: 'ETB',
              provider: 'chapa',
              provider_transaction_id: eventData.reference || null,
              internal_transaction_reference: txRef,
              updated_at: now,
            }, { onConflict: 'order_id' });

          console.log(`[Chapa Webhook] Order ${order.id} with tx_ref ${txRef} updated to PAID in Supabase.`);
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('[Chapa Webhook] Webhook processing error:', err.message);
    return res.status(200).json({ received: true, error: err.message });
  }
});

export default router;

