// Payment Helper Functions
// Shared utilities for payment processing via PayTech

export type PaymentProvider = 'PAYTECH' | 'ORANGE_MONEY' | 'WAVE' | 'FREE_MONEY';

export interface ProviderInfo {
  name: string;
  logo: string;
  color: string;
  description: string;
  prefixes: string[];
  fees: number;
}

// PayTech - Aggregateur de paiement (Orange Money, Wave, Free Money, Cartes)
export const PAYTECH_INFO = {
  name: 'PayTech',
  logo: '/images/paytech.png',
  color: '#0066FF',
  description: 'Payez via PayTech (Orange Money, Wave, Free Money, Carte bancaire)',
  supportedMethods: [
    { name: 'Orange Money', color: '#FF6600', icon: 'smartphone' },
    { name: 'Wave', color: '#1DC8F2', icon: 'smartphone' },
    { name: 'Free Money', color: '#CD1E25', icon: 'smartphone' },
    { name: 'Carte bancaire', color: '#6366F1', icon: 'credit-card' },
  ],
};

// Provider configuration and display info
export const PROVIDER_INFO: Record<PaymentProvider, ProviderInfo> = {
  PAYTECH: {
    name: 'PayTech',
    logo: '/images/paytech.png',
    color: '#0066FF',
    description: 'Payez via PayTech (Orange Money, Wave, Free Money)',
    prefixes: ['70', '76', '77', '78'],
    fees: 0,
  },
  ORANGE_MONEY: {
    name: 'Orange Money',
    logo: '/images/orange-money.png',
    color: '#FF6600',
    description: 'Payez avec votre compte Orange Money',
    prefixes: ['77', '78', '70'],
    fees: 0,
  },
  WAVE: {
    name: 'Wave',
    logo: '/images/wave.png',
    color: '#1DC8F2',
    description: 'Payez avec Wave, rapide et sécurise',
    prefixes: ['77', '78', '76', '70'],
    fees: 0,
  },
  FREE_MONEY: {
    name: 'Free Money',
    logo: '/images/free-money.png',
    color: '#CD1E25',
    description: 'Payez avec votre compte Free Money',
    prefixes: ['76'],
    fees: 0,
  },
};

// Get provider display info
export function getProviderInfo(provider: PaymentProvider): ProviderInfo {
  return PROVIDER_INFO[provider];
}

// Validate phone number for Senegal
export function validatePhoneNumber(phone: string): { valid: boolean; provider?: PaymentProvider } {
  // Remove spaces, dashes and plus
  let cleanPhone = phone.replace(/[\s-+]/g, '');
  
  // Remove country code if present
  if (cleanPhone.startsWith('221')) {
    cleanPhone = cleanPhone.slice(3);
  }
  
  // Check if it's a valid Senegal mobile number (9 digits starting with 70, 76, 77, 78)
  if (!/^(70|76|77|78)\d{7}$/.test(cleanPhone)) {
    return { valid: false };
  }
  
  // Detect provider based on prefix
  const prefix = cleanPhone.slice(0, 2);
  
  if (prefix === '76') {
    return { valid: true, provider: 'FREE_MONEY' };
  } else if (prefix === '77' || prefix === '78' || prefix === '70') {
    return { valid: true, provider: 'ORANGE_MONEY' };
  }
  
  return { valid: true, provider: 'WAVE' };
}

// Format phone number for API (with country code)
export function formatPhoneNumber(phone: string): string {
  let cleanPhone = phone.replace(/[\s-+]/g, '');
  
  // Remove duplicate country code
  if (cleanPhone.startsWith('221221')) {
    cleanPhone = cleanPhone.slice(3);
  }
  
  // Add country code if needed
  if (!cleanPhone.startsWith('221')) {
    return `221${cleanPhone}`;
  }
  
  return cleanPhone;
}

// Calculate fees (if applicable)
export function calculateFees(amount: number, provider: PaymentProvider): number {
  const config = PROVIDER_INFO[provider];
  // Currently no fees, but can be adjusted per provider
  return 0;
}

// Generate unique transaction ID
export function generateTransactionId(prefix: string = 'PAY'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Format amount for display
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-SN', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
