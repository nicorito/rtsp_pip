# Phase 2: RTSP Integration

**Duration**: 1-2 days
**Complexity**: High
**Priority**: Critical
**Dependencies**: Phase 1 (Development Build Setup)

## Overview

This phase implements RTSP (Real-Time Streaming Protocol) support to connect to IP cameras and display live video feeds. RTSP is the standard protocol used by most IP cameras including Tapo, Hikvision, Dahua, and ONVIF-compliant cameras.

## Learning Objectives

- Understand RTSP protocol and stream URLs
- Integrate VLCKit for iOS RTSP playback
- Create reusable RTSP player component
- Implement connection error handling
- Manage video stream lifecycle

## Prerequisites

### Completed Requirements
- ✅ Phase 1 completed
- ✅ Development build installed on iOS device
- ✅ Working development environment

### Required Knowledge
- RTSP URL format
- IP camera configuration
- iOS native module integration
- React Native component lifecycle

### Test Equipment
- IP camera (Tapo or compatible) on local network
- Camera credentials (username/password)
- Camera IP address

## Technical Approach

### Option A: react-native-vlc-media-player (Recommended for Quick Start)

**Pros**:
- Pre-built component
- Easier integration
- Community support

**Cons**:
- Less customization
- May have updates lag

### Option B: Custom Native Module with VLCKit (Recommended for Production)

**Pros**:
- Full control
- Better PiP integration
- Optimized performance

**Cons**:
- More complex
- Requires native iOS development

**This guide covers Option B for production-quality implementation.**

## Step-by-Step Implementation

### Step 1: Create Native Module Structure

```bash
# Create native module directory structure
cd /home/user/rtsp_pip
npx create-expo-module@latest rtsp-player

# When prompted:
# Module name: rtsp-player
# Package name: rtsp-player
# Description: RTSP video player with VLCKit
```

**This creates**:
```
modules/
  rtsp-player/
    ios/
      RtspPlayerModule.swift
      RtspPlayerView.swift
    src/
      index.ts
      RtspPlayerView.tsx
```

### Step 2: Install VLCKit Dependency

Edit `modules/rtsp-player/ios/RtspPlayer.podspec`:

```ruby
Pod::Spec.new do |s|
  s.name           = 'RtspPlayer'
  s.version        = '1.0.0'
  s.summary        = 'RTSP video player with VLCKit'
  s.description    = 'Native iOS RTSP player using VLCKit for React Native'
  s.author         = ''
  s.homepage       = 'https://github.com/yourname/rtsp-player'
  s.platforms      = { :ios => '14.0', :tvos => '14.0' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'MobileVLCKit', '~> 3.6.0'

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
```

### Step 3: Implement Native RTSP Player Module

Create `modules/rtsp-player/ios/RtspPlayerModule.swift`:

```swift
import ExpoModulesCore
import MobileVLCKit

public class RtspPlayerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("RtspPlayer")

    Events("onPlayerStateChange", "onError", "onBuffering")

    View(RtspPlayerView.self) {
      Prop("source") { (view: RtspPlayerView, source: [String: Any]) in
        if let uri = source["uri"] as? String {
          view.setSource(uri: uri)
        }
      }

      Prop("paused") { (view: RtspPlayerView, paused: Bool) in
        view.setPaused(paused)
      }

      Prop("autoplay") { (view: RtspPlayerView, autoplay: Bool) in
        view.setAutoplay(autoplay)
      }

      Prop("hwDecoderEnabled") { (view: RtspPlayerView, enabled: Bool) in
        view.setHwDecoderEnabled(enabled)
      }
    }
  }
}
```

### Step 4: Implement Native Player View

Create `modules/rtsp-player/ios/RtspPlayerView.swift`:

```swift
import ExpoModulesCore
import MobileVLCKit
import UIKit

class RtspPlayerView: ExpoView, VLCMediaPlayerDelegate {
  private var mediaPlayer: VLCMediaPlayer?
  private var videoView: UIView?
  private var autoplay: Bool = true
  private var hwDecoderEnabled: Bool = true

  var onPlayerStateChange: EventDispatcher?
  var onError: EventDispatcher?
  var onBuffering: EventDispatcher?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    setupPlayer()
  }

  private func setupPlayer() {
    // Initialize VLC media player
    mediaPlayer = VLCMediaPlayer()
    mediaPlayer?.delegate = self

    // Create video view
    videoView = UIView(frame: self.bounds)
    videoView?.backgroundColor = .black
    videoView?.autoresizingMask = [.flexibleWidth, .flexibleHeight]

    if let videoView = videoView {
      self.addSubview(videoView)
      mediaPlayer?.drawable = videoView
    }

    // Configure VLC options
    configurePlayerOptions()
  }

  private func configurePlayerOptions() {
    guard let mediaPlayer = mediaPlayer else { return }

    // Enable hardware decoding
    if hwDecoderEnabled {
      // Hardware acceleration options
      mediaPlayer.media?.addOption("--avcodec-hw=videotoolbox")
    }

    // Network caching (in milliseconds)
    mediaPlayer.media?.addOption("--network-caching=1000")

    // RTSP options
    mediaPlayer.media?.addOption("--rtsp-tcp") // Use TCP instead of UDP
    mediaPlayer.media?.addOption("--rtsp-frame-buffer-size=500000")
  }

  func setSource(uri: String) {
    guard let mediaPlayer = mediaPlayer else { return }

    // Stop current playback
    if mediaPlayer.isPlaying {
      mediaPlayer.stop()
    }

    // Set new media
    let media = VLCMedia(url: URL(string: uri)!)

    // Configure media options
    media.addOption("--network-caching=1000")
    media.addOption("--rtsp-tcp")

    mediaPlayer.media = media

    if autoplay {
      mediaPlayer.play()
    }
  }

  func setPaused(_ paused: Bool) {
    guard let mediaPlayer = mediaPlayer else { return }

    if paused {
      mediaPlayer.pause()
    } else {
      mediaPlayer.play()
    }
  }

  func setAutoplay(_ autoplay: Bool) {
    self.autoplay = autoplay
  }

  func setHwDecoderEnabled(_ enabled: Bool) {
    self.hwDecoderEnabled = enabled
    configurePlayerOptions()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    videoView?.frame = self.bounds
  }

  // MARK: - VLCMediaPlayerDelegate

  func mediaPlayerStateChanged(_ aNotification: Notification) {
    guard let mediaPlayer = mediaPlayer else { return }

    let stateString: String
    switch mediaPlayer.state {
    case .opening:
      stateString = "opening"
    case .buffering:
      stateString = "buffering"
      onBuffering?([:])
    case .playing:
      stateString = "playing"
    case .paused:
      stateString = "paused"
    case .stopped:
      stateString = "stopped"
    case .ended:
      stateString = "ended"
    case .error:
      stateString = "error"
      onError?(["error": "Playback error occurred"])
    default:
      stateString = "unknown"
    }

    onPlayerStateChange?(["state": stateString])
  }

  func mediaPlayerTimeChanged(_ aNotification: Notification) {
    // Optional: Send time updates
  }

  deinit {
    mediaPlayer?.stop()
    mediaPlayer = nil
  }
}
```

### Step 5: Create React Native Component

Create `modules/rtsp-player/src/RtspPlayerView.tsx`:

```typescript
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
```

Create `modules/rtsp-player/src/index.ts`:

```typescript
export { default as RtspPlayerView } from './RtspPlayerView';
export type { RtspPlayerViewProps } from './RtspPlayerView';
```

### Step 6: Register Module in App

Edit `modules/rtsp-player/index.ts`:

```typescript
export * from './src';
```

Update `/home/user/rtsp_pip/package.json`:

```json
{
  "dependencies": {
    "rtsp-player": "file:./modules/rtsp-player"
  }
}
```

### Step 7: Run Prebuild

```bash
# Generate native iOS project with the new module
npx expo prebuild --clean

# Install dependencies
npm install
```

### Step 8: Rebuild Development Build

```bash
# Rebuild with VLCKit included
eas build --profile development --platform ios --clear-cache
```

**Note**: This will take 15-25 minutes due to VLCKit compilation.

### Step 9: Create RTSP Helper Utilities

Create `src/utils/rtspHelper.ts`:

```typescript
export interface CameraConfig {
  username: string;
  password: string;
  ipAddress: string;
  port?: number;
  streamPath?: string;
  protocol?: 'rtsp' | 'http';
}

export interface RTSPUrlOptions {
  useSubStream?: boolean; // Use lower quality stream
  useTCP?: boolean; // Force TCP transport
}

/**
 * Build RTSP URL for Tapo cameras
 */
export function buildTapoRTSPUrl(
  config: CameraConfig,
  options: RTSPUrlOptions = {}
): string {
  const { username, password, ipAddress, port = 554 } = config;
  const { useSubStream = false } = options;

  const streamPath = useSubStream ? 'stream2' : 'stream1';

  return `rtsp://${username}:${password}@${ipAddress}:${port}/${streamPath}`;
}

/**
 * Build generic RTSP URL
 */
export function buildRTSPUrl(
  config: CameraConfig,
  options: RTSPUrlOptions = {}
): string {
  const {
    username,
    password,
    ipAddress,
    port = 554,
    streamPath = 'stream1'
  } = config;

  return `rtsp://${username}:${password}@${ipAddress}:${port}/${streamPath}`;
}

/**
 * Validate RTSP URL format
 */
export function validateRTSPUrl(url: string): boolean {
  const rtspPattern = /^rtsp:\/\/.+/i;
  return rtspPattern.test(url);
}

/**
 * Parse RTSP URL to extract components
 */
export function parseRTSPUrl(url: string): Partial<CameraConfig> | null {
  try {
    const urlObj = new URL(url);

    if (urlObj.protocol !== 'rtsp:') {
      return null;
    }

    return {
      username: urlObj.username || undefined,
      password: urlObj.password || undefined,
      ipAddress: urlObj.hostname,
      port: urlObj.port ? parseInt(urlObj.port) : 554,
      streamPath: urlObj.pathname.slice(1), // Remove leading /
    };
  } catch (error) {
    return null;
  }
}

/**
 * Common RTSP URL templates for different camera brands
 */
export const CAMERA_TEMPLATES = {
  tapo: {
    main: 'rtsp://{username}:{password}@{ip}:554/stream1',
    sub: 'rtsp://{username}:{password}@{ip}:554/stream2',
  },
  hikvision: {
    main: 'rtsp://{username}:{password}@{ip}:554/Streaming/Channels/101',
    sub: 'rtsp://{username}:{password}@{ip}:554/Streaming/Channels/102',
  },
  dahua: {
    main: 'rtsp://{username}:{password}@{ip}:554/cam/realmonitor?channel=1&subtype=0',
    sub: 'rtsp://{username}:{password}@{ip}:554/cam/realmonitor?channel=1&subtype=1',
  },
  onvif: {
    main: 'rtsp://{username}:{password}@{ip}:554/onvif1',
  },
};
```

### Step 10: Create RTSP Player Component

Create `src/components/RTSPPlayer.tsx`:

```typescript
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
          <Text style={styles.errorText}>⚠️ Connection Error</Text>
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
```

### Step 11: Update Main App for Testing

Edit `/home/user/rtsp_pip/App.js` → `/home/user/rtsp_pip/App.tsx`:

```typescript
import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Button, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import RTSPPlayer from './src/components/RTSPPlayer';
import { buildTapoRTSPUrl } from './src/utils/rtspHelper';

export default function App() {
  const [cameraConfig, setCameraConfig] = useState({
    ipAddress: '192.168.1.100',
    username: 'admin',
    password: '',
    port: 554,
  });

  const [rtspUrl, setRtspUrl] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = () => {
    const url = buildTapoRTSPUrl(cameraConfig);
    setRtspUrl(url);
    setIsConnected(true);
  };

  const handleDisconnect = () => {
    setRtspUrl(null);
    setIsConnected(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {!isConnected ? (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Camera IP Address"
            value={cameraConfig.ipAddress}
            onChangeText={(text) =>
              setCameraConfig({ ...cameraConfig, ipAddress: text })
            }
          />

          <TextInput
            style={styles.input}
            placeholder="Username"
            value={cameraConfig.username}
            onChangeText={(text) =>
              setCameraConfig({ ...cameraConfig, username: text })
            }
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={cameraConfig.password}
            onChangeText={(text) =>
              setCameraConfig({ ...cameraConfig, password: text })
            }
          />

          <Button title="Connect to Camera" onPress={handleConnect} />
        </View>
      ) : (
        <>
          <RTSPPlayer
            rtspUrl={rtspUrl!}
            autoplay={true}
            onStateChange={(state) => console.log('Player state:', state)}
            onError={(error) => console.error('Player error:', error)}
            style={styles.player}
          />

          <View style={styles.controls}>
            <Button title="Disconnect" onPress={handleDisconnect} color="#ff6b6b" />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  player: {
    flex: 1,
  },
  controls: {
    padding: 20,
  },
});
```

## Testing & Verification

### Test Plan

1. **Connection Test**
   - Enter valid camera credentials
   - Tap "Connect to Camera"
   - Verify video stream appears

2. **Error Handling Test**
   - Enter invalid credentials
   - Verify error message displays
   - Enter invalid IP address
   - Verify connection timeout

3. **Stream Quality Test**
   - Test main stream (stream1)
   - Test sub stream (stream2)
   - Compare quality and latency

4. **Network Test**
   - Disconnect WiFi during playback
   - Verify error handling
   - Reconnect and verify recovery

### Success Criteria

- [ ] RTSP stream displays video
- [ ] Audio plays (if supported by camera)
- [ ] Buffering indicator shows during connection
- [ ] Error messages display for failed connections
- [ ] Stream remains stable for 5+ minutes
- [ ] No memory leaks during extended playback

## Troubleshooting

### Issue: Black Screen, No Video

**Possible Causes**:
1. Incorrect RTSP URL format
2. Camera not accessible on network
3. Wrong credentials
4. Firewall blocking port 554

**Debug Steps**:
```bash
# Test RTSP URL from Mac
ffplay "rtsp://username:password@192.168.1.100:554/stream1"

# Check if camera is reachable
ping 192.168.1.100

# Check if RTSP port is open
nc -zv 192.168.1.100 554
```

### Issue: VLCKit Build Fails

**Solution**:
```bash
# Clear pod cache
cd ios
pod cache clean --all
pod deintegrate
pod install

# Rebuild
cd ..
eas build --profile development --platform ios --clear-cache
```

### Issue: High Latency (>5 seconds)

**Solution**:
```swift
// In RtspPlayerView.swift, adjust caching
media.addOption("--network-caching=300") // Reduce from 1000ms to 300ms
media.addOption("--live-caching=300")
```

## Performance Optimization

### Reduce Latency
```swift
// Ultra-low latency settings
media.addOption("--network-caching=0")
media.addOption("--clock-jitter=0")
media.addOption("--clock-synchro=0")
```

### Enable Hardware Decoding
```swift
// Already implemented in RtspPlayerView.swift
mediaPlayer.media?.addOption("--avcodec-hw=videotoolbox")
```

### Use Sub-Stream for Mobile
```typescript
// Lower bandwidth, better for mobile
const url = buildTapoRTSPUrl(config, { useSubStream: true });
```

## Next Steps

After completing Phase 2:

1. **Proceed to Phase 3** - Picture-in-Picture Implementation
2. **Test with multiple camera brands** (Tapo, Hikvision, Dahua)
3. **Document working RTSP URLs** for different cameras
4. **Profile memory usage** during long playback sessions

## Resources

- [VLCKit Documentation](https://wiki.videolan.org/VLCKit/)
- [RTSP Protocol Specification](https://tools.ietf.org/html/rfc2326)
- [MobileVLCKit CocoaPod](https://cocoapods.org/pods/MobileVLCKit)
- [Expo Modules API](https://docs.expo.dev/modules/overview/)

---

**Status**: Ready for Implementation
**Next Phase**: [Phase 3 - Picture-in-Picture](./PHASE_3_PIP.md)
**Previous Phase**: [Phase 1 - Development Build Setup](./PHASE_1_DEV_BUILD.md)
**Last Updated**: 2025-11-30
