// PayTech Payment Service
// Documentation: https://docs.intech.sn/doc_paytech.php
// API Base URL: https://paytech.sn/api

import { db } from '@/lib/db';

// PayTech Configuration
const PAYTECH_CONFIG = {
  baseUrl: 'https://paytech.sn/api',
  apiKey: process.env.PAYTECH_API_KEY || '',
  apiSecret: process.env.PAYTECH_API_SECRET || '',
  environment: (process.env.PAYTECH_ENV || 'test') as 'test' | 'prod',
  successUrl: process.env.PAYTECH_SUCCESS_URL || '',
  errorUrl: process.env.PAYTECH_ERROR_URL || '',
  callbackUrl: process.env.PAYTECH_CALLBACK_URL || '',
};

export interface PayTechPaymentRequest {
  item_name: string;       // Nom du produit/service
  item_price: number;      // Prix en FCFA
  ref_command: string;     // Référence unique de commande
  command_name: string;    // Description de la commande
  currency?: string;       // Devise: XOF (défaut), EUR, USD, CAD, GBP, MAD
  env?: 'test' | 'prod';   // Environnement
  success_url?: string;    // URL de redirection après succès
  error_url?: string;      // URL de redirection après erreur
  callback_url?: string;   // URL de notification serveur (IPN)
  customer_email?: string; // Email du client (optionnel)
  customer_phone?: string; // Téléphone du client (optionnel)
  customer_name?: string;  // Nom du client (optionnel)
  customer_address?: string; // Adresse du client (optionnel)
}

export interface PayTechPaymentResponse {
  success: boolean;
  token?: string;          // Token de paiement
  redirect_url?: string;   // URL de redirection vers PayTech
  ref_command?: string;    // Référence de la commande
  message?: string;
  error?: string;
}

export interface PayTechIPNData {
  ref_command: string;     // Référence de la commande
  token: string;           // Token de paiement
  amount: number;          // Montant payé
  currency: string;        // Devise
  status: 'success' | 'failed' | 'cancelled';
  payment_method?: string; // Méthode de paiement utilisée
  payment_date?: string;   // Date du paiement
  client_phone?: string;   // Téléphone du client
}

// Generate unique command reference
export function generateCommandRef(prefix: string = 'CMD'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Create payment request with PayTech
export async function createPayTechPayment(
  request: PayTechPaymentRequest
): Promise<PayTechPaymentResponse> {
  try {
    // Check API credentials
    if (!PAYTECH_CONFIG.apiKey || !PAYTECH_CONFIG.apiSecret) {
      return {
        success: false,
        error: 'Configuration PayTech manquante. Veuillez contacter l\'administrateur.',
      };
    }

    // Prepare request data
    const paymentData: PayTechPaymentRequest & { ipn_url?: string } = {
      item_name: request.item_name,
      item_price: request.item_price,
      ref_command: request.ref_command,
      command_name: request.command_name,
      currency: request.currency || 'XOF',
      env: request.env || PAYTECH_CONFIG.environment,
      success_url: request.success_url || PAYTECH_CONFIG.successUrl,
      error_url: request.error_url || PAYTECH_CONFIG.errorUrl,
      ipn_url: request.callback_url || PAYTECH_CONFIG.callbackUrl,
      customer_email: request.customer_email,
      customer_phone: request.customer_phone,
      customer_name: request.customer_name,
      customer_address: request.customer_address,
    };

    // Make API request to PayTech
    const response = await fetch(`${PAYTECH_CONFIG.baseUrl}/payment/request-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API_KEY': PAYTECH_CONFIG.apiKey,
        'API_SECRET': PAYTECH_CONFIG.apiSecret,
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();

    if (!response.ok || data.status !== 'success') {
      console.error('PayTech API error:', data);
      return {
        success: false,
        error: data.message || data.error || 'Erreur lors de la création du paiement',
      };
    }

    // Return success with redirect URL
    return {
      success: true,
      token: data.token,
      redirect_url: data.redirect_url || data.url,
      ref_command: request.ref_command,
      message: 'Paiement initié avec succès',
    };
  } catch (error) {
    console.error('PayTech payment error:', error);
    return {
      success: false,
      error: 'Erreur de connexion au service de paiement. Veuillez réessayer.',
    };
  }
}

// Check payment status by token
export async function checkPayTechPaymentStatus(
  token: string
): Promise<{ success: boolean; status: string; data?: any }> {
  try {
    if (!PAYTECH_CONFIG.apiKey || !PAYTECH_CONFIG.apiSecret) {
      return { success: false, status: 'error' };
    }

    const response = await fetch(`${PAYTECH_CONFIG.baseUrl}/payment/check-status/${token}`, {
      method: 'GET',
      headers: {
        'API_KEY': PAYTECH_CONFIG.apiKey,
        'API_SECRET': PAYTECH_CONFIG.apiSecret,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, status: 'error' };
    }

    return {
      success: true,
      status: data.status || 'unknown',
      data: data,
    };
  } catch (error) {
    console.error('PayTech status check error:', error);
    return { success: false, status: 'error' };
  }
}

// Process refund via PayTech
export async function processPayTechRefund(
  token: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (!PAYTECH_CONFIG.apiKey || !PAYTECH_CONFIG.apiSecret) {
      return { success: false, message: 'Configuration manquante' };
    }

    const response = await fetch(`${PAYTECH_CONFIG.baseUrl}/payment/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API_KEY': PAYTECH_CONFIG.apiKey,
        'API_SECRET': PAYTECH_CONFIG.apiSecret,
      },
      body: JSON.stringify({
        token,
        amount,
        reason,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.status !== 'success') {
      return {
        success: false,
        message: data.message || 'Erreur lors du remboursement',
      };
    }

    return {
      success: true,
      message: 'Remboursement effectué avec succès',
    };
  } catch (error) {
    console.error('PayTech refund error:', error);
    return { success: false, message: 'Erreur lors du remboursement' };
  }
}

// Validate IPN callback
export function validatePayTechIPN(
  data: PayTechIPNData,
  signature?: string
): boolean {
  // PayTech sends IPN data to your callback URL
  // Validate the data to ensure it's from PayTech
  
  // Check required fields
  if (!data.ref_command || !data.token || !data.status) {
    return false;
  }

  // In production, you should verify the signature if provided
  // For now, we'll trust the data structure
  
  return true;
}

// Get PayTech configuration status
export function getPayTechConfigStatus(): {
  configured: boolean;
  environment: string;
  hasCallback: boolean;
} {
  return {
    configured: !!(PAYTECH_CONFIG.apiKey && PAYTECH_CONFIG.apiSecret),
    environment: PAYTECH_CONFIG.environment,
    hasCallback: !!PAYTECH_CONFIG.callbackUrl,
  };
}

// Export configuration for testing
export { PAYTECH_CONFIG };
