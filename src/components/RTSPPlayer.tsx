import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { RtspPlayerView } from 'rtsp-player';

export interface RTSPPlayerProps {
  rtspUrl: string;
  paused?: boolean;
  autoplay?: boolean;
  onError?: (error: string) => void;
  onStateChange?: (state: string) => void;
  style?: any;
}

export default function RTSPPlayer({
  rtspUrl,
  paused = false,
  autoplay = true,
  onError,
  onStateChange,
  style,
}: RTSPPlayerProps) {
  const [isBuffering, setIsBuffering] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerState, setPlayerState] = useState<string>('loading');

  const handleStateChange = useCallback(
    (event: { nativeEvent: { state: string } }) => {
      const { state } = event.nativeEvent;
      setPlayerState(state);

      if (state === 'playing') {
        setIsBuffering(false);
        setError(null);
      } else if (state === 'buffering' || state === 'opening') {
        setIsBuffering(true);
      } else if (state === 'error') {
        setIsBuffering(false);
      }

      onStateChange?.(state);
    },
    [onStateChange]
  );

  const handleError = useCallback(
    (event: { nativeEvent: { error: string } }) => {
      const errorMessage = event.nativeEvent.error;
      setError(errorMessage);
      setIsBuffering(false);
      onError?.(errorMessage);
    },
    [onError]
  );

  const handleBuffering = useCallback(() => {
    setIsBuffering(true);
  }, []);

  return (
    <View style={[styles.container, style]}>
      <RtspPlayerView
        source={{ uri: rtspUrl }}
        paused={paused}
        autoplay={autoplay}
        hwDecoderEnabled={true}
        onPlayerStateChange={handleStateChange}
        onError={handleError}
        onBuffering={handleBuffering}
        style={styles.player}
      />

      {isBuffering && !error && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.overlayText}>Connecting...</Text>
        </View>
      )}

      {error && (
        <View style={styles.overlay}>
          <Text style={styles.errorText}>Connection Error</Text>
          <Text style={styles.errorDetail}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  player: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorDetail: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
