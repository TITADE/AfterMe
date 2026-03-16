import { registerWebModule, NativeModule } from 'expo';

import { StorekitModuleEvents } from './Storekit.types';

class StorekitModule extends NativeModule<StorekitModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(StorekitModule, 'StorekitModule');
