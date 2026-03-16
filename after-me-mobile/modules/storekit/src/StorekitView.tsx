import { requireNativeView } from 'expo';
import * as React from 'react';

import { StorekitViewProps } from './Storekit.types';

const NativeView: React.ComponentType<StorekitViewProps> =
  requireNativeView('Storekit');

export default function StorekitView(props: StorekitViewProps) {
  return <NativeView {...props} />;
}
