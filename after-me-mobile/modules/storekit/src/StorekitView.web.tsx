import * as React from 'react';

import { StorekitViewProps } from './Storekit.types';

export default function StorekitView(props: StorekitViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
