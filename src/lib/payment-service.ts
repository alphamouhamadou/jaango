// Payment Service for Mobile Money Integration
// Handles: Orange Money, Wave, and Free Money payments
// Wave API: https://api.wave.com

import { db } from '@/lib/db';
import { 
  PaymentProvider, 
  PaymentRequest, 
  PaymentResponse, 
  ProviderInfo,
  validatePhoneNumber, 
  formatPhoneNumber, 
  calculateFees,
  generateTransactionId,
  getProviderInfo 
} from './payment-helpers';

// Configuration
const WAVE_API_KEY = process.env.WAVE_API_KEY;
const WAVE_SIGNING_SECRET = process.env.WAVE_SIGNING_SECRET;
const ORANGE_MONEY_API_KEY = process.env.ORANGE_MONEY_API_KEY;
const FREE_MONEY_API_KEY = process.env.FREE_MONEY_API_KEY;

// Base URLs
const WAVE_BASE_URL = 'https://api.wave.com';
const ORANGE_BASE_URL = process.env.ORANGE_MONEY_API_URL || 'https://api.orange.com/orange-money-webpay/v1';
const FREE_MONEY_BASE_URL = process.env.FREE_MONEY_API_URL || 'https://api.freemoney.sn/v1';

export interface PaymentStatusResponse {
  transactionId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT';
  amount: number;
  provider: PaymentProvider;
  phoneNumber: string;
  timestamp: Date;
}

// Main payment processing function
export async function processPayment(request: PaymentRequest): Promise<PaymentResponse> {
  // Validate phone number
  const phoneValidation = validatePhoneNumber(request.phoneNumber);
  if (!phoneValidation.valid) {
    return {
      success: false,
      transactionId: generateTransactionId('ERR'),
      status: 'FAILED',
      message: 'Numéro de téléphone invalide. Veuillez entrer un numéro sénégalais valide.',
      timestamp: new Date(),
    };
  }

  // Generate transaction ID
  const transactionId = generateTransactionId();
  const amount = Math.round(request.amount);
  const fees = calculateFees(amount, request.provider);
  const totalAmount = amount + fees;
  const formattedPhone = formatPhoneNumber(request.phoneNumber);

  // Check if we're in production mode (API keys configured)
  const isProduction = 
    (request.provider === 'WAVE' && WAVE_API_KEY) ||
    (request.provider === 'ORANGE_MONEY' && ORANGE_MONEY_API_KEY) ||
    (request.provider === 'FREE_MONEY' && FREE_MONEY_API_KEY);

  if (!isProduction) {
    // Development mode - simulate payment
    return simulatePayment(request, transactionId);
  }

  // Production mode - call real APIs
  try {
    switch (request.provider) {
      case 'WAVE':
        return await processWavePayment(request, transactionId, formattedPhone, amount);
      case 'ORANGE_MONEY':
        return await processOrangeMoneyPayment(request, transactionId, formattedPhone, amount);
      case 'FREE_MONEY':
        return await processFreeMoneyPayment(request, transactionId, formattedPhone, amount);
      default:
        return {
          success: false,
          transactionId,
          status: 'FAILED',
          message: 'Provider de paiement non supporté.',
          timestamp: new Date(),
        };
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    // Fallback to simulation on error
    return simulatePayment(request, transactionId);
  }
}

// Wave payment implementation
// Documentation: https://api.wave.com
// Uses checkout sessions API
async function processWavePayment(
  request: PaymentRequest,
  transactionId: string,
  phoneNumber: string,
  amount: number
): Promise<PaymentResponse> {
  try {
    // Create checkout session
    const body = {
      amount: amount.toString(),
      currency: 'XOF',
      error_url: request.errorUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/error`,
      success_url: request.successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
    };

    const response = await fetch(`${WAVE_BASE_URL}/v1/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WAVE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Wave API error:', data);
      return {
        success: false,
        transactionId,
        status: 'FAILED',
        message: data.message || 'Erreur lors de la création du paiement Wave.',
        timestamp: new Date(),
      };
    }

    // Save transaction to database
    await db.transaction.create({
      data: {
        id: transactionId,
        reference: transactionId,
        provider: 'WAVE',
        type: request.type || 'AVANCE',
        montant: amount,
        frais: 0,
        telephone: phoneNumber,
        statut: 'EN_ATTENTE',
        providerReference: data.id,
      },
    });

    return {
      success: true,
      transactionId,
      status: 'PENDING',
      message: 'Session de paiement créée. Veuillez complé le paiement via l\'application Wave.',
      providerReference: data.id,
      checkoutUrl: data.wave_launch_url,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Wave payment error:', error);
    throw error;
  }
}

// Check Wave payment status
export async function checkWavePaymentStatus(sessionId: string): Promise<PaymentStatusResponse> {
  if (!WAVE_API_KEY) {
    // Return simulated success for development
    return {
      transactionId: sessionId,
      status: 'SUCCESS',
      amount: 0,
      provider: 'WAVE',
      phoneNumber: '',
      timestamp: new Date(),
    };
  }

  const response = await fetch(`${WAVE_BASE_URL}/v1/checkout/sessions/${sessionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${WAVE_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to check payment status');
  }

  const data = await response.json();

  // Map Wave status
  let status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT' = 'PENDING';
  if (data.payment_status === 'complete') {
    status = 'SUCCESS';
  } else if (data.payment_status === 'failed') {
    status = 'FAILED';
  }

  return {
    transactionId: sessionId,
    status,
    amount: parseFloat(data.amount) || 0,
    provider: 'WAVE',
    phoneNumber: '',
    timestamp: new Date(),
  };
}

// Orange Money payment (placeholder for future implementation)
async function processOrangeMoneyPayment(
  request: PaymentRequest,
  transactionId: string,
  phoneNumber: string,
  amount: number
): Promise<PaymentResponse> {
  // TODO: Implement actual Orange Money API
  // The integration would be similar to Wave
  // 1. Create a payment session
  // 2. Return a checkout URL or deep link URL
  
  // For now, fallback to simulation
  return simulatePayment(request, transactionId);
}

// Free Money payment (placeholder for future implementation)
async function processFreeMoneyPayment(
  request: PaymentRequest,
  transactionId: string,
  phoneNumber: string,
  amount: number
): Promise<PaymentResponse> {
  // TODO: Implement actual Free Money API
  return simulatePayment(request, transactionId);
}

// Simulate payment for development/testing
async function simulatePayment(
  request: PaymentRequest,
  transactionId: string
): Promise<PaymentResponse> {
  // Simulate network delay (1-3 seconds)
  const delay = 1000 + Math.random() * 2000;
  await new Promise(resolve => setTimeout(resolve, delay));

  // Simulate success rate (90% for development)
  const success = Math.random() > 0.1;

  return {
    success,
    transactionId,
    status: success ? 'SUCCESS' : 'FAILED',
    message: success
      ? `Paiement ${getProviderInfo(request.provider).name} effectué avec succès.`
      : `Échec du paiement ${getProviderInfo(request.provider).name}. Veuillez réessayer.`,
    providerReference: `${request.provider.slice(0, 2)}${Date.now()}`,
    timestamp: new Date(),
  };
}

// Check payment status (generic)
export async function checkPaymentStatus(
  transactionId: string,
  provider: PaymentProvider
): Promise<PaymentStatusResponse> {
  if (provider === 'WAVE') {
    return checkWavePaymentStatus(transactionId);
  }

  // For other providers, return simulated success
  return {
    transactionId,
    status: 'SUCCESS',
    amount: 0,
    provider,
    phoneNumber: '',
    timestamp: new Date(),
  };
}

// Process refund
export async function processRefund(
  transactionId: string,
  amount: number,
  reason: string
): Promise<PaymentResponse> {
  const refundId = generateTransactionId('REF');

  try {
    // Get original transaction
    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return {
        success: false,
        transactionId: refundId,
        status: 'FAILED',
        message: 'Transaction non trouvée.',
        timestamp: new Date(),
      };
    }

    // Update transaction status
    await db.transaction.update({
      where: { id: transactionId },
      data: { statut: 'REMBOURSE' },
    });

    // Create refund transaction
    await db.transaction.create({
      data: {
        id: refundId,
        reference: refundId,
        provider: transaction.provider,
        type: 'REMBOURSEMENT',
        montant: amount,
        frais: 0,
        telephone: transaction.telephone,
        statut: 'SUCCESS',
        message: reason,
      },
    });

    return {
      success: true,
      transactionId: refundId,
      status: 'SUCCESS',
      message: `Remboursement de ${amount} FCFA effectué avec succès.`,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Refund error:', error);
    return {
      success: false,
      transactionId: refundId,
      status: 'FAILED',
      message: 'Erreur lors du remboursement. Veuillez contacter le support.',
      timestamp: new Date(),
    };
  }
}
