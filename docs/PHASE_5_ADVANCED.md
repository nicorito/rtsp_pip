# Phase 5: Advanced Features

**Duration**: 2-3 days
**Complexity**: Medium
**Priority**: Medium
**Dependencies**: Phases 1-4

## Overview

This phase adds production-grade features that enhance user experience and app reliability. These features are optional but highly recommended for a polished, professional application.

## Features to Implement

1. Auto-Reconnection Logic
2. Network Quality Monitoring
3. Multi-Camera Grid View
4. Stream Recording
5. Motion Detection Alerts (future enhancement)
6. Two-Way Audio Support
7. Camera Discovery (mDNS/ONVIF)

## Feature 1: Auto-Reconnection Logic

### Implementation

Update `src/hooks/useAutoReconnect.ts`:

```typescript
import { useEffect, useRef, useState } from 'react';
import { useCameraStore } from '../store/cameraStore';

interface UseAutoReconnectOptions {
  onReconnect: () => void;
  enabled: boolean;
}

export function useAutoReconnect({ onReconnect, enabled }: UseAutoReconnectOptions) {
  const { settings } = useCameraStore();
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  const attemptReconnect = () => {
    if (!enabled || !settings.autoReconnect) return;

    if (reconnectAttempt >= settings.reconnectAttempts) {
      console.log('Max reconnection attempts reached');
      setIsReconnecting(false);
      return;
    }

    setIsReconnecting(true);
    setReconnectAttempt((prev) => prev + 1);

    const delay = settings.reconnectDelay * reconnectAttempt; // Exponential backoff

    console.log(
      `Reconnecting in ${delay}ms (attempt ${reconnectAttempt + 1}/${
        settings.reconnectAttempts
      })`
    );

    reconnectTimerRef.current = setTimeout(() => {
      onReconnect();
      setIsReconnecting(false);
    }, delay);
  };

  const resetReconnect = () => {
    setReconnectAttempt(0);
    setIsReconnecting(false);
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, []);

  return {
    attemptReconnect,
    resetReconnect,
    isReconnecting,
    reconnectAttempt,
  };
}
```

Update `src/components/RTSPPlayer.tsx` to use auto-reconnect:

```typescript
// Add to RTSPPlayer component
const { attemptReconnect, resetReconnect, isReconnecting, reconnectAttempt } =
  useAutoReconnect({
    onReconnect: () => {
      // Trigger reconnection by changing source
      console.log('Attempting to reconnect...');
    },
    enabled: true,
  });

const handleError = useCallback(
  (event: { nativeEvent: { error: string } }) => {
    const errorMessage = event.nativeEvent.error;
    setError(errorMessage);
    setIsBuffering(false);
    onError?.(errorMessage);

    // Attempt auto-reconnection
    attemptReconnect();
  },
  [onError, attemptReconnect]
);

// Reset on successful connection
const handleStateChange = useCallback(
  (event: { nativeEvent: { state: string } }) => {
    const { state } = event.nativeEvent;
    setPlayerState(state);

    if (state === 'playing') {
      setIsBuffering(false);
      setError(null);
      resetReconnect(); // Reset reconnection counter
    }
    // ... rest of code
  },
  [onStateChange, resetReconnect]
);
```

## Feature 2: Network Quality Monitoring

### Implementation

Create `src/hooks/useNetworkQuality.ts`:

```typescript
import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'offline';

export interface NetworkStatus {
  quality: NetworkQuality;
  type: string | null;
  isConnected: boolean;
  isInternetReachable: boolean | null;
}

export function useNetworkQuality() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    quality: 'excellent',
    type: null,
    isConnected: false,
    isInternetReachable: null,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const quality = determineQuality(state);

      setNetworkStatus({
        quality,
        type: state.type,
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
      });
    });

    return () => unsubscribe();
  }, []);

  return networkStatus;
}

function determineQuality(state: NetInfoState): NetworkQuality {
  if (!state.isConnected) return 'offline';

  // WiFi is generally good for RTSP
  if (state.type === 'wifi') {
    return 'excellent';
  }

  // Cellular quality depends on details
  if (state.type === 'cellular' && state.details) {
    const cellularGeneration = state.details.cellularGeneration;

    if (cellularGeneration === '5g') return 'excellent';
    if (cellularGeneration === '4g') return 'good';
    if (cellularGeneration === '3g') return 'fair';
    return 'poor';
  }

  return 'good';
}
```

Install dependency:
```bash
npx expo install @react-native-community/netinfo
```

Add network indicator to `src/components/NetworkIndicator.tsx`:

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react';
import { useNetworkQuality, NetworkQuality } from '../hooks/useNetworkQuality';

const QUALITY_COLORS: Record<NetworkQuality, string> = {
  excellent: '#34C759',
  good: '#30D158',
  fair: '#FFD60A',
  poor: '#FF9F0A',
  offline: '#FF3B30',
};

const QUALITY_TEXT: Record<NetworkQuality, string> = {
  excellent: '📶 Excellent',
  good: '📶 Good',
  fair: '⚠️ Fair',
  poor: '⚠️ Poor',
  offline: '❌ Offline',
};

export default function NetworkIndicator() {
  const networkStatus = useNetworkQuality();

  if (networkStatus.quality === 'excellent') {
    return null; // Don't show when network is excellent
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: QUALITY_COLORS[networkStatus.quality] },
      ]}
    >
      <Text style={styles.text}>{QUALITY_TEXT[networkStatus.quality]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
```

## Feature 3: Multi-Camera Grid View

### Implementation

Create `src/screens/GridViewScreen.tsx`:

```typescript
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useCameraStore } from '../store/cameraStore';
import RTSPPlayer from '../components/RTSPPlayer';
import { buildRTSPUrl } from '../utils/rtspHelper';

const { width } = Dimensions.get('window');

export default function GridViewScreen() {
  const { cameras } = useCameraStore();
  const [gridSize, setGridSize] = useState<2 | 4>(4); // 2x2 or 4x4

  const cellSize = width / Math.sqrt(gridSize);

  const activeCameras = cameras.filter((c) => c.favorite).slice(0, gridSize);

  return (
    <View style={styles.container}>
      <FlatList
        data={activeCameras}
        numColumns={Math.sqrt(gridSize)}
        key={gridSize} // Force re-render on grid size change
        renderItem={({ item }) => (
          <View style={[styles.cell, { width: cellSize, height: cellSize }]}>
            <RTSPPlayer
              rtspUrl={buildRTSPUrl(item)}
              autoplay={true}
              style={styles.player}
            />
          </View>
        )}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
      />

      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setGridSize(gridSize === 2 ? 4 : 2)}
      >
        <Text style={styles.toggleText}>
          {gridSize === 2 ? '2x2' : '4x4'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cell: {
    borderWidth: 1,
    borderColor: '#333',
  },
  player: {
    flex: 1,
  },
  toggleButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  toggleText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
```

## Feature 4: Stream Recording

### Implementation

Add recording capability to native module.

Update `modules/rtsp-player/ios/RtspPlayerView.swift`:

```swift
import AVFoundation

class RtspPlayerView: ExpoView {
  private var assetWriter: AVAssetWriter?
  private var videoInput: AVAssetWriterInput?
  private var isRecording = false

  func startRecording() {
    guard !isRecording else { return }

    let documentsPath = FileManager.default.urls(
      for: .documentDirectory,
      in: .userDomainMask
    )[0]

    let timestamp = Int(Date().timeIntervalSince1970)
    let outputURL = documentsPath.appendingPathComponent("recording_\\(timestamp).mp4")

    do {
      assetWriter = try AVAssetWriter(outputURL: outputURL, fileType: .mp4)

      let videoSettings: [String: Any] = [
        AVVideoCodecKey: AVVideoCodecType.h264,
        AVVideoWidthKey: 1920,
        AVVideoHeightKey: 1080,
      ]

      videoInput = AVAssetWriterInput(
        mediaType: .video,
        outputSettings: videoSettings
      )

      if let videoInput = videoInput {
        assetWriter?.add(videoInput)
      }

      assetWriter?.startWriting()
      assetWriter?.startSession(atSourceTime: .zero)

      isRecording = true

      onRecordingStatusChange?(["isRecording": true])
    } catch {
      print("Failed to start recording: \\(error)")
      onError?(["error": "Recording failed: \\(error.localizedDescription)"])
    }
  }

  func stopRecording() {
    guard isRecording else { return }

    videoInput?.markAsFinished()

    assetWriter?.finishWriting { [weak self] in
      guard let self = self else { return }

      self.isRecording = false
      self.onRecordingStatusChange?(["isRecording": false])

      if let outputURL = self.assetWriter?.outputURL {
        self.onRecordingComplete?(["path": outputURL.path])
      }

      self.assetWriter = nil
      self.videoInput = nil
    }
  }
}
```

Add recording controls to UI:

```typescript
// In PlayerScreen.tsx
const [isRecording, setIsRecording] = useState(false);

const handleRecordToggle = async () => {
  if (isRecording) {
    await playerRef.current?.stopRecording();
  } else {
    await playerRef.current?.startRecording();
  }
  setIsRecording(!isRecording);
};

// Add button to UI
<TouchableOpacity
  style={[styles.controlButton, isRecording && styles.recordingActive]}
  onPress={handleRecordToggle}
>
  <Text style={styles.buttonText}>{isRecording ? '⏹' : '⏺'}</Text>
</TouchableOpacity>
```

## Feature 5: Camera Discovery (ONVIF/mDNS)

### Implementation

Create `src/utils/cameraDiscovery.ts`:

```typescript
import dgram from 'react-native-udp';

export interface DiscoveredCamera {
  name: string;
  ipAddress: string;
  manufacturer: string;
  model: string;
  rtspPort: number;
}

/**
 * Discover ONVIF cameras on local network
 */
export async function discoverOnvifCameras(): Promise<DiscoveredCamera[]> {
  return new Promise((resolve) => {
    const socket = dgram.createSocket('udp4');
    const discoveredCameras: DiscoveredCamera[] = [];

    const onvifProbe = `<?xml version="1.0" encoding="UTF-8"?>
<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope"
            xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing">
  <s:Header>
    <a:Action s:mustUnderstand="1">http://schemas.xmlsoap.org/ws/2005/04/discovery/Probe</a:Action>
    <a:MessageID>uuid:${generateUUID()}</a:MessageID>
    <a:ReplyTo>
      <a:Address>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</a:Address>
    </a:ReplyTo>
    <a:To s:mustUnderstand="1">urn:schemas-xmlsoap-org:ws:2005:04:discovery</a:To>
  </s:Header>
  <s:Body>
    <Probe xmlns="http://schemas.xmlsoap.org/ws/2005/04/discovery" />
  </s:Body>
</s:Envelope>`;

    socket.bind(3702, () => {
      socket.addMembership('239.255.255.250');

      socket.send(
        onvifProbe,
        0,
        onvifProbe.length,
        3702,
        '239.255.255.250',
        (err) => {
          if (err) console.error('Discovery send error:', err);
        }
      );
    });

    socket.on('message', (msg, rinfo) => {
      // Parse ONVIF response
      const response = msg.toString();

      if (response.includes('ProbeMatches')) {
        const camera: DiscoveredCamera = {
          name: 'ONVIF Camera',
          ipAddress: rinfo.address,
          manufacturer: 'Unknown',
          model: 'Unknown',
          rtspPort: 554,
        };

        discoveredCameras.push(camera);
      }
    });

    // Stop discovery after 5 seconds
    setTimeout(() => {
      socket.close();
      resolve(discoveredCameras);
    }, 5000);
  });
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
```

**Note**: ONVIF discovery requires UDP multicast support, which may have limitations on mobile. Consider as an advanced/optional feature.

## Feature 6: Snapshot Capture

### Implementation

Add to native module:

```swift
// In RtspPlayerView.swift
func captureSnapshot() -> UIImage? {
  guard let videoView = videoView else { return nil }

  UIGraphicsBeginImageContextWithOptions(videoView.bounds.size, false, 0.0)
  defer { UIGraphicsEndImageContext() }

  guard let context = UIGraphicsGetCurrentContext() else { return nil }

  videoView.layer.render(in: context)
  let image = UIGraphicsGetImageFromCurrentImageContext()

  return image
}

func saveSnapshot() {
  guard let image = captureSnapshot() else {
    onError?(["error": "Failed to capture snapshot"])
    return
  }

  UIImageWriteToSavedPhotosAlbum(image, nil, nil, nil)
  onSnapshotSaved?(["success": true])
}
```

Add UI control:

```typescript
const handleSnapshot = async () => {
  await playerRef.current?.saveSnapshot();
  Alert.alert('Snapshot Saved', 'Image saved to Photos');
};

<TouchableOpacity style={styles.controlButton} onPress={handleSnapshot}>
  <Text style={styles.buttonText}>📷</Text>
</TouchableOpacity>
```

## Feature 7: Stream Quality Switching

### Implementation

Update UI to allow stream quality toggle:

```typescript
const [useHighQuality, setUseHighQuality] = useState(true);

const rtspUrl = buildTapoRTSPUrl(camera, {
  useSubStream: !useHighQuality,
});

const toggleQuality = () => {
  setUseHighQuality(!useHighQuality);
};

<TouchableOpacity style={styles.qualityButton} onPress={toggleQuality}>
  <Text style={styles.buttonText}>
    {useHighQuality ? 'HD' : 'SD'}
  </Text>
</TouchableOpacity>
```

## Testing & Verification

### Test Cases

1. **Auto-Reconnection**
   - Disconnect camera power
   - Verify app attempts reconnection
   - Restore power, verify connection resumes

2. **Network Quality**
   - Switch between WiFi and cellular
   - Verify quality indicator updates
   - Test stream performance on different networks

3. **Grid View**
   - Add multiple cameras
   - Mark as favorites
   - Open grid view, verify all streams load

4. **Recording**
   - Start recording
   - Record for 30 seconds
   - Stop recording, verify file saved

5. **Snapshot**
   - Capture snapshot
   - Verify saved to Photos
   - Check image quality

## Next Steps

Proceed to [Phase 6 - Testing & Optimization](./PHASE_6_TESTING.md)

---

**Status**: Ready for Implementation
**Next Phase**: [Phase 6 - Testing](./PHASE_6_TESTING.md)
**Previous Phase**: [Phase 4 - UI Development](./PHASE_4_UI.md)
**Last Updated**: 2025-11-30
