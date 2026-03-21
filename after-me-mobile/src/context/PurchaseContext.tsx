/**
 * Purchase context — exposes premium status and gating helpers to the entire app.
 * Checks entitlements on mount and after every purchase/restore.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PurchaseService } from '../services/PurchaseService';
import { FREE_TIER_DOCUMENT_LIMIT, PRODUCT_IDS } from '../constants/products';
import { useApp } from './AppContext';

type PurchaseState = {
  isPremium: boolean;
  isLoading: boolean;
  /** Which product granted premium: PREMIUM_LIFETIME, PREMIUM_ANNUAL, or null. */
  activeProductId: string | null;
  isLifetime: boolean;
  isAnnual: boolean;
  canAddDocument: boolean;
  documentsRemaining: number;
  refreshPurchaseStatus: () => Promise<void>;
  purchaseProduct: (productId: string) => Promise<'success' | 'cancelled' | 'pending' | 'error'>;
  restorePurchases: () => Promise<boolean>;
};

const PurchaseContext = createContext<PurchaseState | null>(null);

export function PurchaseProvider({ children }: { children: React.ReactNode }) {
  const { totalDocuments } = useApp();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);

  const refreshPurchaseStatus = useCallback(async () => {
    try {
      const [entitled, productId] = await Promise.all([
        PurchaseService.checkEntitlements(),
        PurchaseService.getActiveProductId(),
      ]);
      setIsPremium(entitled);
      setActiveProductId(productId);
    } catch {
      // keep current state
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPurchaseStatus();
  }, [refreshPurchaseStatus]);

  const purchaseProduct = useCallback(async (productId: string): Promise<'success' | 'cancelled' | 'pending' | 'error'> => {
    try {
      const result = await PurchaseService.purchase(productId);
      if (result.status === 'success') {
        setIsPremium(true);
        setActiveProductId(productId);
      }
      return result.status === 'unknown' ? 'error' : result.status;
    } catch {
      return 'error';
    }
  }, []);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    const restored = await PurchaseService.restorePurchases();
    if (restored) {
      setIsPremium(true);
      const productId = await PurchaseService.getActiveProductId();
      setActiveProductId(productId);
    }
    return restored;
  }, []);

  const documentsRemaining = isPremium
    ? Infinity
    : Math.max(0, FREE_TIER_DOCUMENT_LIMIT - totalDocuments);

  const canAddDocument = isPremium || totalDocuments < FREE_TIER_DOCUMENT_LIMIT;

  const value: PurchaseState = {
    isPremium,
    isLoading,
    activeProductId,
    isLifetime: activeProductId === PRODUCT_IDS.PREMIUM_LIFETIME,
    isAnnual:   activeProductId === PRODUCT_IDS.PREMIUM_ANNUAL,
    canAddDocument,
    documentsRemaining,
    refreshPurchaseStatus,
    purchaseProduct,
    restorePurchases,
  };

  return (
    <PurchaseContext.Provider value={value}>
      {children}
    </PurchaseContext.Provider>
  );
}

export function usePurchase(): PurchaseState {
  const ctx = useContext(PurchaseContext);
  if (!ctx) throw new Error('usePurchase must be used within PurchaseProvider');
  return ctx;
}
