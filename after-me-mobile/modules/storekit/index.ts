import { requireNativeModule } from 'expo-modules-core';

export type Product = {
  id: string;
  displayName: string;
  description: string;
  displayPrice: string;
  price: number;
};

export type PurchaseResult = {
  status: 'success' | 'cancelled' | 'pending' | 'unknown';
  transactionId?: string;
};

// Import the native module
const StorekitModule = requireNativeModule('Storekit');

/**
 * Fetches product details from the App Store.
 */
export async function getProducts(productIds: string[]): Promise<Product[]> {
  return await StorekitModule.getProducts(productIds);
}

/**
 * Initiates a purchase for a specific product.
 */
export async function purchase(productId: string): Promise<PurchaseResult> {
  return await StorekitModule.purchase(productId);
}

/**
 * Returns a list of product IDs that the user currently owns (entitled to).
 */
export async function getPurchasedProducts(): Promise<string[]> {
  return await StorekitModule.getPurchasedProducts();
}

/**
 * Manually syncs the App Store receipt (Restore Purchases).
 */
export async function restore(): Promise<void> {
  return await StorekitModule.restore();
}
