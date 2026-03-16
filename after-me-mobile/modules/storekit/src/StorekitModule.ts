import { NativeModule, requireNativeModule } from 'expo';

import { StorekitModuleEvents } from './Storekit.types';

declare class StorekitModule extends NativeModule<StorekitModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<StorekitModule>('Storekit');
