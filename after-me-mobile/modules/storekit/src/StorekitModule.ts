import { NativeModule, requireNativeModule } from 'expo';

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

export type StorekitModuleEvents = Record<string, never>;

declare class StorekitModule extends NativeModule<StorekitModuleEvents> {
  getProducts(productIds: string[]): Promise<Product[]>;
  purchase(productId: string): Promise<PurchaseResult>;
  getPurchasedProducts(): Promise<string[]>;
  restore(): Promise<void>;
}

export default requireNativeModule<StorekitModule>('Storekit');
