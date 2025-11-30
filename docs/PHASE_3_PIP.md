# Phase 3: Picture-in-Picture Implementation

**Duration**: 1-2 days
**Complexity**: High
**Priority**: Critical
**Dependencies**: Phase 1 (Development Build Setup), Phase 2 (RTSP Integration)

## Overview

This phase implements Picture-in-Picture (PiP) mode, allowing users to watch the camera feed in a floating window while using other apps on iOS. PiP is a key feature that differentiates this app from basic camera viewers.

## Learning Objectives

- Understand iOS PiP requirements and limitations
- Integrate AVKit's AVPictureInPictureController
- Bridge native PiP functionality to React Native
- Handle PiP lifecycle events
- Implement background audio/video playback

## Prerequisites

### Completed Requirements
- ✅ Phase 1 and Phase 2 completed
- ✅ RTSP video playback working
- ✅ Development build with native modules

### iOS Requirements
- iOS 14.0+ (PiP minimum requirement)
- Physical iOS device (PiP doesn't work in simulator)
- Background modes enabled
- Proper entitlements configured

### Technical Understanding
- AVKit framework basics
- iOS background modes
- Native module development
- Audio session management

## PiP Architecture

```
┌──────────────────────────────────────┐
│       React Native Layer             │
│  ┌────────────────────────────────┐  │
│  │  usePictureInPicture() Hook    │  │
│  │  - startPiP()                  │  │
│  │  - stopPiP()                   │  │
│  │  - isPiPActive state           │  │
│  └────────────┬───────────────────┘  │
│               │                       │
├───────────────┼───────────────────────┤
│    Native Bridge (PiPBridge)         │
├───────────────┼───────────────────────┤
│        iOS Native Layer               │
│  ┌────────────┴───────────────────┐  │
│  │  PiPManager                    │  │
│  │  - AVPictureInPictureController│  │
│  │  - AVPlayerLayer               │  │
│  │  - Delegate handling           │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

## Step-by-Step Implementation

### Step 1: Update iOS Configuration

Edit `/home/user/rtsp_pip/app.json`:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["audio", "video"],
        "AVInitialRouteSharingPolicy": "LongFormVideo"
      },
      "supportsTablet": true
    }
  }
}
```

**Explanation**:
- `audio`: Required for PiP audio playback in background
- `video`: Required for PiP video continuation
- `AVInitialRouteSharingPolicy`: Controls AirPlay behavior

### Step 2: Create Expo Config Plugin for PiP Entitlements

Create `plugins/withPictureInPicture.js`:

```javascript
const {
  withXcodeProject,
  withEntitlementsPlist,
} = require('@expo/config-plugins');

/**
 * Add Picture in Picture capability to iOS project
 */
function withPictureInPicture(config) {
  // Add entitlements
  config = withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.developer.avfoundation.allow-background-audio'] = true;
    return config;
  });

  return config;
}

module.exports = withPictureInPicture;
```

Update `app.json` to use the plugin:

```json
{
  "expo": {
    "plugins": [
      "./plugins/withPictureInPicture",
      [
        "expo-build-properties",
        {
          "ios": {
            "deploymentTarget": "14.0"
          }
        }
      ]
    ]
  }
}
```

### Step 3: Extend RTSP Player Native Module for PiP

Update `modules/rtsp-player/ios/RtspPlayerView.swift`:

```swift
import ExpoModulesCore
import MobileVLCKit
import AVKit
import UIKit

class RtspPlayerView: ExpoView, VLCMediaPlayerDelegate, AVPictureInPictureControllerDelegate {
  private var mediaPlayer: VLCMediaPlayer?
  private var videoView: UIView?
  private var autoplay: Bool = true
  private var hwDecoderEnabled: Bool = true

  // PiP Support
  private var pipController: AVPictureInPictureController?
  private var playerLayer: AVPlayerLayer?
  private var avPlayer: AVPlayer?
  private var pipPossibleObserver: NSKeyValueObservation?

  var onPlayerStateChange: EventDispatcher?
  var onError: EventDispatcher?
  var onBuffering: EventDispatcher?
  var onPiPStatusChange: EventDispatcher?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    setupPlayer()
    setupPictureInPicture()
  }

  private func setupPictureInPicture() {
    // Check if PiP is supported
    guard AVPictureInPictureController.isPictureInPictureSupported() else {
      print("Picture in Picture is not supported on this device")
      return
    }

    // Configure audio session for PiP
    do {
      let audioSession = AVAudioSession.sharedInstance()
      try audioSession.setCategory(.playback, mode: .moviePlayback)
      try audioSession.setActive(true)
    } catch {
      print("Failed to setup audio session: \\(error)")
    }

    // Create AVPlayerLayer for PiP
    // Note: VLCKit doesn't directly support PiP, so we'll create a bridge
    setupPiPBridge()
  }

  private func setupPiPBridge() {
    // Create a dummy AVPlayer for PiP controller
    // In production, you might need to transcode VLC output to AVPlayer
    // For this implementation, we'll use a proxy approach

    let playerLayer = AVPlayerLayer()
    playerLayer.frame = self.bounds
    playerLayer.videoGravity = .resizeAspect

    self.playerLayer = playerLayer

    // Create PiP controller
    if let playerLayer = self.playerLayer {
      pipController = AVPictureInPictureController(playerLayer: playerLayer)
      pipController?.delegate = self

      // Observe PiP possible changes
      pipPossibleObserver = pipController?.observe(
        \\.isPictureInPicturePossible,
        options: [.initial, .new]
      ) { [weak self] _, change in
        guard let self = self else { return }
        let isPossible = change.newValue ?? false
        self.onPiPStatusChange?(["isPossible": isPossible])
      }
    }
  }

  // MARK: - Public Methods

  func startPictureInPicture() {
    guard let pipController = pipController else {
      onError?(["error": "PiP controller not initialized"])
      return
    }

    guard pipController.isPictureInPicturePossible else {
      onError?(["error": "PiP is not currently possible"])
      return
    }

    pipController.startPictureInPicture()
  }

  func stopPictureInPicture() {
    guard let pipController = pipController else { return }

    if pipController.isPictureInPictureActive {
      pipController.stopPictureInPicture()
    }
  }

  // MARK: - AVPictureInPictureControllerDelegate

  func pictureInPictureControllerWillStartPictureInPicture(
    _ pictureInPictureController: AVPictureInPictureController
  ) {
    onPiPStatusChange?(["status": "willStart"])
  }

  func pictureInPictureControllerDidStartPictureInPicture(
    _ pictureInPictureController: AVPictureInPictureController
  ) {
    onPiPStatusChange?(["status": "didStart", "isActive": true])
  }

  func pictureInPictureControllerWillStopPictureInPicture(
    _ pictureInPictureController: AVPictureInPictureController
  ) {
    onPiPStatusChange?(["status": "willStop"])
  }

  func pictureInPictureControllerDidStopPictureInPicture(
    _ pictureInPictureController: AVPictureInPictureController
  ) {
    onPiPStatusChange?(["status": "didStop", "isActive": false])
  }

  func pictureInPictureController(
    _ pictureInPictureController: AVPictureInPictureController,
    failedToStartPictureInPictureWithError error: Error
  ) {
    onError?(["error": "PiP failed to start: \\(error.localizedDescription)"])
  }

  func pictureInPictureController(
    _ pictureInPictureController: AVPictureInPictureController,
    restoreUserInterfaceForPictureInPictureStopWithCompletionHandler completionHandler: @escaping (Bool) -> Void
  ) {
    // Restore the app UI when user taps the PiP window to return to app
    onPiPStatusChange?(["status": "restoreUI"])
    completionHandler(true)
  }

  deinit {
    pipPossibleObserver?.invalidate()
    pipController?.delegate = nil
    mediaPlayer?.stop()
    mediaPlayer = nil
  }
}
```

### Step 4: Update Native Module Interface

Update `modules/rtsp-player/ios/RtspPlayerModule.swift`:

```swift
import ExpoModulesCore

public class RtspPlayerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("RtspPlayer")

    Events(
      "onPlayerStateChange",
      "onError",
      "onBuffering",
      "onPiPStatusChange"
    )

    // Module-level methods
    Function("isPictureInPictureSupported") { () -> Bool in
      return AVPictureInPictureController.isPictureInPictureSupported()
    }

    View(RtspPlayerView.self) {
      Events(
        "onPlayerStateChange",
        "onError",
        "onBuffering",
        "onPiPStatusChange"
      )

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

      // PiP control methods
      AsyncFunction("startPictureInPicture") { (view: RtspPlayerView) in
        view.startPictureInPicture()
      }

      AsyncFunction("stopPictureInPicture") { (view: RtspPlayerView) in
        view.stopPictureInPicture()
      }
    }
  }
}
```

### Step 5: Create React Native PiP Hook

Create `src/hooks/usePictureInPicture.ts`:

```typescript
import { useRef, useState, useCallback, useEffect } from 'react';
import { Platform, NativeModules } from 'react-native';

const { RtspPlayer } = NativeModules;

export interface PiPStatus {
  isActive: boolean;
  isPossible: boolean;
  isSupported: boolean;
}

export function usePictureInPicture() {
  const viewRef = useRef<any>(null);
  const [pipStatus, setPiPStatus] = useState<PiPStatus>({
    isActive: false,
    isPossible: false,
    isSupported: false,
  });

  useEffect(() => {
    if (Platform.OS === 'ios') {
      const checkSupport = async () => {
        try {
          const supported = await RtspPlayer?.isPictureInPictureSupported();
          setPiPStatus((prev) => ({ ...prev, isSupported: supported }));
        } catch (error) {
          console.error('Failed to check PiP support:', error);
        }
      };

      checkSupport();
    }
  }, []);

  const handlePiPStatusChange = useCallback(
    (event: { nativeEvent: { status?: string; isActive?: boolean; isPossible?: boolean } }) => {
      const { status, isActive, isPossible } = event.nativeEvent;

      if (typeof isActive === 'boolean') {
        setPiPStatus((prev) => ({ ...prev, isActive }));
      }

      if (typeof isPossible === 'boolean') {
        setPiPStatus((prev) => ({ ...prev, isPossible }));
      }

      console.log('PiP Status:', status);
    },
    []
  );

  const startPiP = useCallback(async () => {
    if (!pipStatus.isSupported) {
      console.warn('PiP is not supported on this device');
      return false;
    }

    if (!pipStatus.isPossible) {
      console.warn('PiP is not currently possible');
      return false;
    }

    try {
      await viewRef.current?.startPictureInPicture();
      return true;
    } catch (error) {
      console.error('Failed to start PiP:', error);
      return false;
    }
  }, [pipStatus]);

  const stopPiP = useCallback(async () => {
    if (!pipStatus.isActive) {
      return;
    }

    try {
      await viewRef.current?.stopPictureInPicture();
    } catch (error) {
      console.error('Failed to stop PiP:', error);
    }
  }, [pipStatus.isActive]);

  return {
    viewRef,
    pipStatus,
    startPiP,
    stopPiP,
    handlePiPStatusChange,
  };
}
```

### Step 6: Update RTSPPlayer Component with PiP

Update `src/components/RTSPPlayer.tsx`:

```typescript
import React, { useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { RtspPlayerView } from 'rtsp-player';

export interface RTSPPlayerProps {
  rtspUrl: string;
  paused?: boolean;
  autoplay?: boolean;
  onError?: (error: string) => void;
  onStateChange?: (state: string) => void;
  onPiPStatusChange?: (event: any) => void;
  style?: any;
}

export interface RTSPPlayerRef {
  startPictureInPicture: () => Promise<void>;
  stopPictureInPicture: () => Promise<void>;
}

const RTSPPlayer = forwardRef<RTSPPlayerRef, RTSPPlayerProps>(
  (
    {
      rtspUrl,
      paused = false,
      autoplay = true,
      onError,
      onStateChange,
      onPiPStatusChange,
      style,
    },
    ref
  ) => {
    const playerRef = useRef<any>(null);
    const [isBuffering, setIsBuffering] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [playerState, setPlayerState] = useState<string>('loading');

    useImperativeHandle(ref, () => ({
      startPictureInPicture: async () => {
        await playerRef.current?.startPictureInPicture();
      },
      stopPictureInPicture: async () => {
        await playerRef.current?.stopPictureInPicture();
      },
    }));

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
          ref={playerRef}
          source={{ uri: rtspUrl }}
          paused={paused}
          autoplay={autoplay}
          hwDecoderEnabled={true}
          onPlayerStateChange={handleStateChange}
          onError={handleError}
          onBuffering={handleBuffering}
          onPiPStatusChange={onPiPStatusChange}
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
);

RTSPPlayer.displayName = 'RTSPPlayer';

export default RTSPPlayer;

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

### Step 7: Create PiP Controls Component

Create `src/components/PiPButton.tsx`:

```typescript
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';

export interface PiPButtonProps {
  isActive: boolean;
  isPossible: boolean;
  isSupported: boolean;
  onPress: () => void;
}

export default function PiPButton({
  isActive,
  isPossible,
  isSupported,
  onPress,
}: PiPButtonProps) {
  if (Platform.OS !== 'ios' || !isSupported) {
    return null;
  }

  const buttonText = isActive ? '⬇️ Exit PiP' : '⬆️ Enter PiP';
  const disabled = !isPossible && !isActive;

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.buttonText}>{buttonText}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#666',
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### Step 8: Update App with PiP Controls

Update `/home/user/rtsp_pip/App.tsx`:

```typescript
import React, { useState, useRef } from 'react';
import { StyleSheet, View, TextInput, Button, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import RTSPPlayer, { RTSPPlayerRef } from './src/components/RTSPPlayer';
import PiPButton from './src/components/PiPButton';
import { usePictureInPicture } from './src/hooks/usePictureInPicture';
import { buildTapoRTSPUrl } from './src/utils/rtspHelper';

export default function App() {
  const playerRef = useRef<RTSPPlayerRef>(null);
  const { pipStatus, handlePiPStatusChange } = usePictureInPicture();

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

  const handlePiPToggle = async () => {
    if (pipStatus.isActive) {
      await playerRef.current?.stopPictureInPicture();
    } else {
      await playerRef.current?.startPictureInPicture();
    }
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
            ref={playerRef}
            rtspUrl={rtspUrl!}
            autoplay={true}
            onStateChange={(state) => console.log('Player state:', state)}
            onError={(error) => console.error('Player error:', error)}
            onPiPStatusChange={handlePiPStatusChange}
            style={styles.player}
          />

          <View style={styles.controls}>
            <PiPButton
              isActive={pipStatus.isActive}
              isPossible={pipStatus.isPossible}
              isSupported={pipStatus.isSupported}
              onPress={handlePiPToggle}
            />

            <View style={styles.spacer} />

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
  spacer: {
    height: 10,
  },
});
```

### Step 9: Rebuild and Test

```bash
# Rebuild native modules
npx expo prebuild --clean

# Rebuild development build with PiP
eas build --profile development --platform ios --clear-cache

# Install on device and test
```

## Testing & Verification

### Test Scenarios

1. **PiP Activation**
   - Start video playback
   - Tap "Enter PiP" button
   - Verify floating window appears
   - Verify video continues playing

2. **Background Playback**
   - Activate PiP
   - Press home button
   - Verify PiP window persists
   - Verify audio continues

3. **App Switching**
   - While in PiP, open another app
   - Verify PiP window stays on top
   - Tap PiP window to return to app

4. **PiP Deactivation**
   - While in PiP, tap "Exit PiP"
   - Verify return to full screen
   - Verify video continues without interruption

### Success Criteria

- [ ] PiP button appears when video is playing
- [ ] Tapping button activates PiP mode
- [ ] Floating PiP window appears
- [ ] Video continues in PiP window
- [ ] Audio plays in background
- [ ] Can switch apps while PiP is active
- [ ] Can return to app from PiP
- [ ] PiP can be dismissed

## Troubleshooting

### Issue: PiP Button Disabled

**Causes**:
- Video not yet playing
- Background modes not configured
- Device doesn't support PiP

**Solution**:
```typescript
// Check pipStatus
console.log('PiP Status:', pipStatus);
// Verify isSupported: true, isPossible: true
```

### Issue: PiP Doesn't Start

**Debug**:
```swift
// Add logging in RtspPlayerView.swift
print("PiP Possible: \\(pipController?.isPictureInPicturePossible ?? false)")
print("PiP Active: \\(pipController?.isPictureInPictureActive ?? false)")
```

### Issue: Audio Stops in Background

**Solution**:
```swift
// Verify audio session in setupPictureInPicture()
let audioSession = AVAudioSession.sharedInstance()
try audioSession.setCategory(.playback, mode: .moviePlayback)
try audioSession.setActive(true)
```

## Known Limitations

1. **VLC + PiP Challenge**: VLCKit doesn't natively support AVPictureInPictureController
2. **Workaround**: May need to implement video frame capture from VLC to AVPlayer
3. **Alternative**: Use react-native-video with HLS transcoding for better PiP support

## Alternative Implementation (If VLC PiP Fails)

If direct VLC PiP proves challenging, consider:

1. **RTSP to HLS Transcoding**:
   ```bash
   # FFmpeg server-side
   ffmpeg -i rtsp://camera -c:v copy -c:a aac -f hls output.m3u8
   ```

2. **Use react-native-video**:
   ```typescript
   import Video from 'react-native-video';
   // react-native-video has built-in PiP support
   ```

## Next Steps

After completing Phase 3:

1. **Proceed to Phase 4** - UI Development
2. **Test PiP on multiple iOS versions** (14.0, 15.0, 16.0+)
3. **Document PiP limitations** and workarounds
4. **Consider HLS alternative** if needed

## Resources

- [Apple PiP Documentation](https://developer.apple.com/documentation/avkit/adopting_picture_in_picture_in_a_standard_player)
- [AVPictureInPictureController](https://developer.apple.com/documentation/avkit/avpictureinpicturecontroller)
- [Background Modes](https://developer.apple.com/documentation/avfoundation/media_playback/creating_a_basic_video_player_ios_and_tvos/enabling_background_audio)

---

**Status**: Ready for Implementation
**Next Phase**: [Phase 4 - User Interface](./PHASE_4_UI.md)
**Previous Phase**: [Phase 2 - RTSP Integration](./PHASE_2_RTSP.md)
**Last Updated**: 2025-11-30
