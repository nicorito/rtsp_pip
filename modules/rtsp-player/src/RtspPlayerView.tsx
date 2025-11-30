import { requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';
import { ViewProps } from 'react-native';

export type RtspPlayerViewProps = {
  source: {
    uri: string;
  };
  paused?: boolean;
  autoplay?: boolean;
  hwDecoderEnabled?: boolean;
  onPlayerStateChange?: (event: { nativeEvent: { state: string } }) => void;
  onError?: (event: { nativeEvent: { error: string } }) => void;
  onBuffering?: () => void;
  style?: ViewProps['style'];
};

const NativeView = requireNativeViewManager('RtspPlayer');

export default function RtspPlayerView(props: RtspPlayerViewProps) {
  return <NativeView {...props} />;
}
