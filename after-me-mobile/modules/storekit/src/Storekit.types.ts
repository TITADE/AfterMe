import type { StyleProp, ViewStyle } from 'react-native';

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

export type StorekitViewProps = {
  style?: StyleProp<ViewStyle>;
};
