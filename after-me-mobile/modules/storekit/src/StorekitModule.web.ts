import { registerWebModule, NativeModule } from 'expo';

import { StorekitModuleEvents, Product, PurchaseResult } from './Storekit.types';

class StorekitModule extends NativeModule<StorekitModuleEvents> {
  async getProducts(_productIds: string[]): Promise<Product[]> {
    return [];
  }
  async purchase(_productId: string): Promise<PurchaseResult> {
    return { status: 'unknown' };
  }
  async getPurchasedProducts(): Promise<string[]> {
    return [];
  }
  async restore(): Promise<void> {}
}

export default registerWebModule(StorekitModule, 'StorekitModule');
