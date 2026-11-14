// Midtrans Direct Core API with Automatic Snap Fallback

export interface MidtransChargeParams {
  orderId: string;
  amount: number;
  paymentCode: string;
  paymentType: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface MidtransChargeResult {
  paymentUrl: string | null;
  vaNumber: string | null;
  snapToken: string | null;
  rawResponse: any;
}

function getSnapEnabledPayments(paymentCode: string, paymentType: string): string[] {
  const codeUpper = (paymentCode || '').toUpperCase();
  if (codeUpper.includes('QRIS')) return ['gopay', 'qris'];
  if (codeUpper === 'GOPAY' || codeUpper.includes('GOPAY')) return ['gopay'];
  if (codeUpper.includes('SHOPEEPAY')) return ['shopeepay'];
  if (codeUpper.includes('MANDIRI')) return ['echannel'];
  if (codeUpper.includes('PERMATA')) return ['permata_va'];
  if (codeUpper.includes('BNI')) return ['bni_va'];
  if (codeUpper.includes('BCA')) return ['bca_va'];
  if (codeUpper.includes('BRI')) return ['bri_va'];
  if (codeUpper.includes('CIMB')) return ['cimb_va'];
  if (codeUpper.includes('DANAMON')) return ['danamon_va'];
  if (codeUpper.includes('BSI')) return ['other_va', 'bni_va'];
  if (codeUpper.includes('DANA') || codeUpper.includes('OVO')) return ['gopay', 'shopeepay', 'qris'];
  if (codeUpper.includes('CREDITCARD') || codeUpper.includes('CARD')) return ['credit_card'];
  
  if (paymentType === 'va') return ['bni_va', 'echannel', 'permata_va', 'bca_va', 'bri_va'];
  if (paymentType === 'qr_code') return ['gopay', 'qris'];
  if (paymentType === 'E-Wallet' || paymentType === 'e_wallet') return ['gopay', 'shopeepay'];
  
  return ['gopay', 'bni_va', 'echannel', 'permata_va', 'qris'];
}

export async function createMidtransTransaction(params: MidtransChargeParams): Promise<MidtransChargeResult> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    throw new Error('MIDTRANS_SERVER_KEY is not configured');
  }

  const isProd = process.env.MIDTRANS_IS_PRODUCTION === 'true' || process.env.MIDTRANS_IS_PRODUCTION === '1';
  const baseUrl = isProd ? 'https://api.midtrans.com/v2' : 'https://api.sandbox.midtrans.com/v2';
  const snapUrl = isProd ? 'https://app.midtrans.com/snap/v1/transactions' : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

  const authHeader = `Basic ${Buffer.from(serverKey + ':').toString('base64')}`;

  const { orderId, amount, paymentCode, customerName, customerEmail, customerPhone } = params;
  const roundedAmount = Math.round(amount);

  const customerDetails = {
    first_name: customerName || 'Donatur',
    email: customerEmail || 'donatur@example.com',
    phone: customerPhone || '081234567890',
  };

  const codeUpper = (paymentCode || '').toUpperCase();

  // Step 1: Try Core API Direct Charge First
  let coreBody: any = null;

  if (codeUpper.includes('QRIS') || params.paymentType === 'qr_code') {
    coreBody = {
      payment_type: 'qris',
      transaction_details: { order_id: orderId, gross_amount: roundedAmount },
      qris: { acquire_provider: 'gopay' },
      customer_details: customerDetails,
    };
  } else if (codeUpper === 'GOPAY' || codeUpper.includes('GOPAY')) {
    coreBody = {
      payment_type: 'gopay',
      transaction_details: { order_id: orderId, gross_amount: roundedAmount },
      gopay: { enable_callback: true, callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/status/${orderId}` },
      customer_details: customerDetails,
    };
  } else if (codeUpper.includes('SHOPEEPAY')) {
    coreBody = {
      payment_type: 'shopeepay',
      transaction_details: { order_id: orderId, gross_amount: roundedAmount },
      shopeepay: { callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/status/${orderId}` },
      customer_details: customerDetails,
    };
  } else if (codeUpper.includes('MANDIRI')) {
    coreBody = {
      payment_type: 'echannel',
      transaction_details: { order_id: orderId, gross_amount: roundedAmount },
      echannel: { bill_info1: 'Donasi', bill_info2: 'Donasi Online' },
      customer_details: customerDetails,
    };
  } else if (codeUpper.includes('PERMATA')) {
    coreBody = {
      payment_type: 'permata',
      transaction_details: { order_id: orderId, gross_amount: roundedAmount },
      customer_details: customerDetails,
    };
  } else if (params.paymentType === 'va' || codeUpper.includes('BNI') || codeUpper.includes('BCA') || codeUpper.includes('BRI') || codeUpper.includes('CIMB') || codeUpper.includes('DANAMON') || codeUpper.includes('BSI')) {
    let bankName = 'bni';
    if (codeUpper.includes('BCA')) bankName = 'bca';
    else if (codeUpper.includes('BRI')) bankName = 'bri';
    else if (codeUpper.includes('CIMB')) bankName = 'cimb';
    else if (codeUpper.includes('DANAMON')) bankName = 'danamon';
    else if (codeUpper.includes('BSI')) bankName = 'bsi';
    else if (codeUpper.includes('BNI')) bankName = 'bni';

    coreBody = {
      payment_type: 'bank_transfer',
      transaction_details: { order_id: orderId, gross_amount: roundedAmount },
      bank_transfer: { bank: bankName },
      customer_details: customerDetails,
    };
  }

  if (coreBody) {
    try {
      console.log(`[Midtrans Core API Charge] Request:`, JSON.stringify(coreBody));
      const res = await fetch(`${baseUrl}/charge`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify(coreBody),
      });

      const resData = await res.json();
      console.log(`[Midtrans Core API Charge] Response status: ${res.status}`, JSON.stringify(resData));

      // Check if Core API successfully generated payment details (status_code 200 or 201 and not 402/channel unactivated)
      if (res.ok && (resData.status_code === '200' || resData.status_code === '201') && resData.status_code !== '402') {
        let paymentUrl: string | null = null;
        let vaNumber: string | null = null;

        if (resData.payment_type === 'qris') {
          const qrAction = resData.actions?.find((a: any) => a.name === 'generate-qr-code') || resData.actions?.[0];
          const qrUrl = qrAction?.url || resData.qr_string;
          if (qrUrl) paymentUrl = JSON.stringify({ qr_string: qrUrl, type: 'qr_code' });
        } else if (['gopay', 'shopeepay', 'deeplink'].includes(resData.payment_type)) {
          const deeplinkAction = resData.actions?.find((a: any) => a.name === 'deeplink-redirect' || a.name === 'qr-code') || resData.actions?.[0];
          paymentUrl = deeplinkAction?.url || resData.redirect_url || null;
        } else if (resData.payment_type === 'bank_transfer') {
          if (resData.va_numbers && resData.va_numbers.length > 0) {
            vaNumber = resData.va_numbers[0].va_number;
          }
        } else if (resData.payment_type === 'echannel') {
          if (resData.bill_key && resData.biller_code) {
            vaNumber = `${resData.biller_code} - ${resData.bill_key}`;
          } else {
            vaNumber = resData.bill_key || null;
          }
        } else if (resData.payment_type === 'permata') {
          vaNumber = resData.permata_va_number || null;
        }

        if (vaNumber || paymentUrl) {
          return {
            paymentUrl,
            vaNumber,
            snapToken: null,
            rawResponse: resData,
          };
        }
      } else {
        console.warn(`[Midtrans Core API] Channel not active or returned status ${resData.status_code}. Falling back to Snap API...`);
      }
    } catch (err: any) {
      console.warn(`[Midtrans Core API Error] ${err.message}. Falling back to Snap API...`);
    }
  }

  // Step 2: Fallback to Midtrans Snap API with specific enabled_payments
  const enabledPayments = getSnapEnabledPayments(paymentCode, params.paymentType);
  const snapBody = {
    transaction_details: {
      order_id: orderId,
      gross_amount: roundedAmount,
    },
    enabled_payments: enabledPayments,
    customer_details: customerDetails,
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_BASE_URL}/status/${orderId}`,
    },
  };

  console.log(`[Midtrans Snap API Request]`, JSON.stringify(snapBody));

  const snapRes = await fetch(snapUrl, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': authHeader,
    },
    body: JSON.stringify(snapBody),
  });

  const snapData = await snapRes.json();
  console.log(`[Midtrans Snap API Response] Status: ${snapRes.status}`, JSON.stringify(snapData));

  if (!snapRes.ok || !snapData.token) {
    throw new Error(snapData.error_messages?.join(', ') || snapData.status_message || 'Gagal membuat transaksi Midtrans Snap');
  }

  // Encode redirect_url & snap_token into JSON string or URL
  const paymentUrl = JSON.stringify({
    redirect_url: snapData.redirect_url,
    snap_token: snapData.token,
    provider: 'midtrans',
  });

  return {
    paymentUrl,
    vaNumber: null,
    snapToken: snapData.token,
    rawResponse: snapData,
  };
}
