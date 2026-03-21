import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { PurchaseProvider, usePurchase } from '../context/PurchaseContext';
import { PurchaseService } from '../services/PurchaseService';
import { useApp } from '../context/AppContext';
import { PRODUCT_IDS, FREE_TIER_DOCUMENT_LIMIT } from '../constants/products';

jest.mock('../context/AppContext', () => ({
  useApp: jest.fn(() => ({ totalDocuments: 3 })),
}));

jest.mock('../services/PurchaseService', () => ({
  PurchaseService: {
    checkEntitlements: jest.fn(() => Promise.resolve(false)),
    getActiveProductId: jest.fn(() => Promise.resolve(null)),
    purchase: jest.fn(() => Promise.resolve({ status: 'success' })),
    restorePurchases: jest.fn(() => Promise.resolve(false)),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <PurchaseProvider>{children}</PurchaseProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  (useApp as jest.Mock).mockReturnValue({ totalDocuments: 3 });
  (PurchaseService.checkEntitlements as jest.Mock).mockResolvedValue(false);
  (PurchaseService.getActiveProductId as jest.Mock).mockResolvedValue(null);
  (PurchaseService.purchase as jest.Mock).mockResolvedValue({
    status: 'success',
  });
  (PurchaseService.restorePurchases as jest.Mock).mockResolvedValue(false);
});

describe('PurchaseContext', () => {
  it('initializes with isPremium=false and isLoading=true', () => {
    (PurchaseService.checkEntitlements as jest.Mock).mockReturnValue(
      new Promise(() => {}),
    );
    (PurchaseService.getActiveProductId as jest.Mock).mockReturnValue(
      new Promise(() => {}),
    );
    const { result } = renderHook(() => usePurchase(), { wrapper });
    expect(result.current.isPremium).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });

  it('isPremium reflects checkEntitlements result after initialization', async () => {
    (PurchaseService.checkEntitlements as jest.Mock).mockResolvedValue(true);
    (PurchaseService.getActiveProductId as jest.Mock).mockResolvedValue(
      PRODUCT_IDS.PREMIUM_LIFETIME,
    );
    const { result } = renderHook(() => usePurchase(), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.isPremium).toBe(true);
  });

  it('canAddDocument is true when totalDocuments < FREE_TIER_DOCUMENT_LIMIT and not premium', async () => {
    (useApp as jest.Mock).mockReturnValue({ totalDocuments: 3 });
    const { result } = renderHook(() => usePurchase(), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.canAddDocument).toBe(true);
  });

  it('canAddDocument is always true when isPremium', async () => {
    (useApp as jest.Mock).mockReturnValue({ totalDocuments: 10 });
    (PurchaseService.checkEntitlements as jest.Mock).mockResolvedValue(true);
    const { result } = renderHook(() => usePurchase(), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.isPremium).toBe(true);
    expect(result.current.canAddDocument).toBe(true);
  });

  it('documentsRemaining is correct for free tier (5 - totalDocuments)', async () => {
    (useApp as jest.Mock).mockReturnValue({ totalDocuments: 3 });
    const { result } = renderHook(() => usePurchase(), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.documentsRemaining).toBe(
      FREE_TIER_DOCUMENT_LIMIT - 3,
    );
  });

  it('documentsRemaining is Infinity when premium', async () => {
    (PurchaseService.checkEntitlements as jest.Mock).mockResolvedValue(true);
    const { result } = renderHook(() => usePurchase(), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.documentsRemaining).toBe(Infinity);
  });

  it('isLifetime and isAnnual reflect activeProductId correctly', async () => {
    (PurchaseService.checkEntitlements as jest.Mock).mockResolvedValue(true);
    (PurchaseService.getActiveProductId as jest.Mock).mockResolvedValue(
      PRODUCT_IDS.PREMIUM_LIFETIME,
    );
    const { result } = renderHook(() => usePurchase(), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.isLifetime).toBe(true);
    expect(result.current.isAnnual).toBe(false);
  });

  it('purchaseProduct returns success and sets isPremium on success', async () => {
    const { result } = renderHook(() => usePurchase(), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    let status!: string;
    await act(async () => {
      status = await result.current.purchaseProduct(
        PRODUCT_IDS.PREMIUM_LIFETIME,
      );
    });
    expect(status).toBe('success');
    expect(result.current.isPremium).toBe(true);
  });

  it('purchaseProduct returns error on exception', async () => {
    (PurchaseService.purchase as jest.Mock).mockRejectedValue(
      new Error('purchase failed'),
    );
    const { result } = renderHook(() => usePurchase(), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    let status!: string;
    await act(async () => {
      status = await result.current.purchaseProduct(
        PRODUCT_IDS.PREMIUM_LIFETIME,
      );
    });
    expect(status).toBe('error');
  });

  it('restorePurchases returns boolean', async () => {
    (PurchaseService.restorePurchases as jest.Mock).mockResolvedValue(true);
    const { result } = renderHook(() => usePurchase(), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    let restored!: boolean;
    await act(async () => {
      restored = await result.current.restorePurchases();
    });
    expect(restored).toBe(true);
    expect(result.current.isPremium).toBe(true);
  });

  it('usePurchase throws when used outside PurchaseProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => usePurchase())).toThrow(
      'usePurchase must be used within PurchaseProvider',
    );
    spy.mockRestore();
  });
});
