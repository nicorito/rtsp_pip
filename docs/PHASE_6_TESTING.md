# Phase 6: Testing & Optimization

**Duration**: 1-2 days
**Complexity**: Medium
**Priority**: High
**Dependencies**: Phases 1-5

## Overview

This phase focuses on comprehensive testing, performance optimization, and ensuring app stability. Proper testing is crucial for a production-ready application, especially for real-time video streaming.

## Testing Categories

1. Functional Testing
2. Performance Testing
3. Network Testing
4. Edge Case Testing
5. Memory & Resource Testing
6. User Acceptance Testing

## Test Plan

### 1. Functional Testing

#### Camera Management
- [ ] Add new camera with valid credentials
- [ ] Add camera with invalid credentials (should show error)
- [ ] Edit existing camera details
- [ ] Delete camera
- [ ] Mark camera as favorite
- [ ] Camera list persists after app restart

#### RTSP Streaming
- [ ] Connect to Tapo camera
- [ ] Connect to generic RTSP stream
- [ ] Connect to Hikvision camera
- [ ] Connect to Dahua camera
- [ ] Stream displays video correctly
- [ ] Stream displays audio correctly
- [ ] Pause/resume playback
- [ ] Stop stream and disconnect

#### Picture-in-Picture
- [ ] PiP button appears when video is playing
- [ ] Enter PiP mode successfully
- [ ] PiP window shows video
- [ ] Audio continues in PiP
- [ ] Exit PiP mode
- [ ] Return to app from PiP window
- [ ] Switch apps while in PiP
- [ ] PiP persists during app switching

#### Navigation
- [ ] Navigate from Home to Add Camera
- [ ] Navigate from Home to Player
- [ ] Navigate from Home to Settings
- [ ] Navigate from Player to Home
- [ ] Back button works correctly
- [ ] Deep linking (if implemented)

#### Settings
- [ ] Toggle hardware decoding
- [ ] Toggle auto-reconnect
- [ ] Settings persist after restart
- [ ] Changing settings affects playback

### 2. Performance Testing

#### Test Script: Memory Monitoring

Create `scripts/memory-test.sh`:

```bash
#!/bin/bash

# Monitor memory usage during video playback
# Run on Mac with iOS device connected

echo "Starting memory profiling..."

# Start instruments memory profiling
instruments -t "Allocations" \
  -D memory_profile.trace \
  -w "YOUR_DEVICE_UDID" \
  com.yourcompany.rtsppip &

INSTRUMENTS_PID=$!

echo "Recording for 5 minutes..."
sleep 300

kill $INSTRUMENTS_PID

echo "Memory profile saved to memory_profile.trace"
echo "Open with: open memory_profile.trace"
```

#### Performance Benchmarks

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| App Launch Time | < 2 seconds | Time from tap to first screen |
| Stream Connection Time | < 3 seconds | Time from connect to first frame |
| PiP Activation Time | < 1 second | Time from button press to PiP window |
| Memory Usage (Idle) | < 50 MB | Instruments - Allocations |
| Memory Usage (Streaming) | < 150 MB | Instruments - Allocations |
| CPU Usage (Streaming) | < 40% | Instruments - CPU Profiler |
| Battery Drain (1 hour) | < 15% | Settings - Battery |

#### Load Testing

Test with multiple simultaneous streams:

```typescript
// Test Grid View with 4 cameras
// Monitor:
// - Frame rate (should maintain 30fps)
// - Memory usage (should not exceed 300MB)
// - CPU usage (should not exceed 70%)
```

### 3. Network Testing

#### Test Scenarios

1. **WiFi Connection**
   - [ ] Stream on 5GHz WiFi
   - [ ] Stream on 2.4GHz WiFi
   - [ ] Stream with weak WiFi signal
   - [ ] Switch between WiFi networks during playback

2. **Cellular Connection**
   - [ ] Stream on 5G (if available)
   - [ ] Stream on 4G/LTE
   - [ ] Stream on 3G (should show quality warning)
   - [ ] Data usage monitoring

3. **Network Interruptions**
   - [ ] Airplane mode during playback
   - [ ] WiFi disconnect during playback
   - [ ] Router restart during playback
   - [ ] VPN connection/disconnection

4. **Auto-Reconnection**
   - [ ] Camera power cycle
   - [ ] Network reconnection
   - [ ] Max retry attempts honored

#### Network Test Script

Create `src/utils/__tests__/networkTest.ts`:

```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { useAutoReconnect } from '../hooks/useAutoReconnect';

describe('Auto-Reconnect', () => {
  it('should attempt reconnection on failure', async () => {
    const mockReconnect = jest.fn();

    const { result } = renderHook(() =>
      useAutoReconnect({
        onReconnect: mockReconnect,
        enabled: true,
      })
    );

    result.current.attemptReconnect();

    await waitFor(
      () => {
        expect(mockReconnect).toHaveBeenCalled();
      },
      { timeout: 6000 }
    );
  });

  it('should respect max retry attempts', async () => {
    const mockReconnect = jest.fn();

    const { result } = renderHook(() =>
      useAutoReconnect({
        onReconnect: mockReconnect,
        enabled: true,
      })
    );

    // Attempt reconnection 5 times
    for (let i = 0; i < 5; i++) {
      result.current.attemptReconnect();
    }

    // Should stop at max attempts (3 by default)
    expect(result.current.reconnectAttempt).toBeLessThanOrEqual(3);
  });
});
```

### 4. Edge Case Testing

#### Test Cases

1. **Invalid Input**
   - [ ] Empty camera name
   - [ ] Invalid IP address format
   - [ ] Non-numeric port
   - [ ] Special characters in password
   - [ ] Extremely long camera name

2. **Boundary Conditions**
   - [ ] 0 cameras saved
   - [ ] 100+ cameras saved
   - [ ] Very long RTSP URL
   - [ ] Camera with no password

3. **App Lifecycle**
   - [ ] App sent to background during playback
   - [ ] App killed during playback
   - [ ] App restored from background
   - [ ] Device locked during playback
   - [ ] Low battery mode

4. **iOS Specific**
   - [ ] Control Center during playback
   - [ ] Siri interruption
   - [ ] Phone call during playback
   - [ ] Notification during playback
   - [ ] Screenshot during playback

5. **Camera Failures**
   - [ ] Camera offline
   - [ ] Wrong credentials
   - [ ] Camera rebooting
   - [ ] Firmware update in progress
   - [ ] Maximum connections reached

### 5. Memory & Resource Testing

#### Memory Leak Detection

Create `scripts/detect-leaks.js`:

```javascript
/**
 * Run this script to detect memory leaks
 * Usage: node scripts/detect-leaks.js
 */

const { execSync } = require('child_process');

console.log('Starting memory leak detection...');

// Run app with Instruments
const command = `
  instruments -t "Leaks" \
    -D leaks_profile.trace \
    -w YOUR_DEVICE_UDID \
    com.yourcompany.rtsppip
`;

try {
  execSync(command, { stdio: 'inherit' });
  console.log('\\nLeak detection complete!');
  console.log('Open report: open leaks_profile.trace');
} catch (error) {
  console.error('Leak detection failed:', error);
}
```

#### Memory Testing Checklist

- [ ] No memory leaks after 1 hour of streaming
- [ ] Memory released when stopping stream
- [ ] Memory released when closing player
- [ ] No retained cycles in components
- [ ] Proper cleanup in useEffect hooks
- [ ] Native module cleanup in deinit

#### Resource Monitoring

Add development-only monitoring:

```typescript
// src/utils/performanceMonitor.ts
import { AppState, AppStateStatus } from 'react-native';
import { useEffect, useRef } from 'react';

export function usePerformanceMonitor() {
  const startTime = useRef(Date.now());
  const frameCount = useRef(0);

  useEffect(() => {
    if (__DEV__) {
      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTime.current) / 1000;
        const fps = frameCount.current / elapsed;

        console.log('[Performance]', {
          uptime: elapsed.toFixed(1) + 's',
          fps: fps.toFixed(1),
          memory: (performance as any).memory?.usedJSHeapSize || 'N/A',
        });

        frameCount.current = 0;
        startTime.current = Date.now();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, []);

  // Track frame renders
  useEffect(() => {
    frameCount.current++;
  });
}
```

### 6. User Acceptance Testing

#### UAT Test Plan

**Scenario 1: First-Time User**
1. User opens app for first time
2. Sees empty state with clear instructions
3. Taps "+" to add camera
4. Enters camera details
5. Connects successfully
6. Watches live stream
7. Activates PiP mode
8. Returns to app

**Expected**: Smooth, intuitive experience with no confusion

**Scenario 2: Power User**
1. User has 10+ cameras configured
2. Marks 4 cameras as favorites
3. Opens grid view
4. Watches 4 streams simultaneously
5. Switches to single camera view
6. Edits camera settings
7. Tests different stream qualities

**Expected**: Fast navigation, responsive UI, stable streams

**Scenario 3: Network Issues**
1. User starts watching camera
2. Network disconnects
3. App shows error and retry message
4. Network reconnects
5. Stream resumes automatically

**Expected**: Clear error messages, automatic recovery

#### UAT Feedback Form

Create `docs/UAT_FEEDBACK.md`:

```markdown
# User Acceptance Testing Feedback

**Tester Name**: _______________
**Date**: _______________
**App Version**: _______________

## Overall Experience (1-5)
- Ease of Use: [ ]
- Visual Design: [ ]
- Performance: [ ]
- Stability: [ ]

## Specific Feedback

### What worked well?
-
-

### What didn't work?
-
-

### Suggestions for improvement
-
-

### Bugs found
-
-
```

## Optimization Tasks

### 1. Video Stream Optimization

```swift
// In RtspPlayerView.swift

// Optimize buffering
media.addOption("--network-caching=300")  // Lower latency
media.addOption("--live-caching=100")     // Live stream optimization
media.addOption("--clock-jitter=0")       // Reduce jitter
media.addOption("--clock-synchro=0")      // Disable clock sync for live

// Enable hardware decoding
media.addOption("--avcodec-hw=videotoolbox")
media.addOption("--videotoolbox-temporal-deinterlacing")
```

### 2. React Native Optimization

```typescript
// Optimize component renders
import { memo } from 'react';

export default memo(CameraCard, (prev, next) => {
  return prev.camera.id === next.camera.id &&
         prev.camera.name === next.camera.name &&
         prev.camera.favorite === next.camera.favorite;
});
```

### 3. State Management Optimization

```typescript
// Use selectors to prevent unnecessary re-renders
import { create } from 'zustand';
import { shallow } from 'zustand/shallow';

// In component
const { cameras, activeCamera } = useCameraStore(
  (state) => ({
    cameras: state.cameras,
    activeCamera: state.activeCamera,
  }),
  shallow
);
```

### 4. Image & Asset Optimization

```bash
# Optimize images
npx expo-optimize

# Check bundle size
npx expo export --platform ios --output-dir build
du -sh build
```

### 5. Code Splitting

```typescript
// Lazy load screens
const PlayerScreen = lazy(() => import('./screens/PlayerScreen'));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen'));

// Use Suspense
<Suspense fallback={<LoadingScreen />}>
  <PlayerScreen />
</Suspense>
```

## Automated Testing

### Unit Tests

Create `src/utils/__tests__/rtspHelper.test.ts`:

```typescript
import {
  buildTapoRTSPUrl,
  validateRTSPUrl,
  parseRTSPUrl,
} from '../rtspHelper';

describe('RTSP Helper', () => {
  describe('buildTapoRTSPUrl', () => {
    it('should build correct RTSP URL for main stream', () => {
      const config = {
        username: 'admin',
        password: 'password123',
        ipAddress: '192.168.1.100',
        port: 554,
      };

      const url = buildTapoRTSPUrl(config);
      expect(url).toBe('rtsp://admin:password123@192.168.1.100:554/stream1');
    });

    it('should build correct RTSP URL for sub stream', () => {
      const config = {
        username: 'admin',
        password: 'password123',
        ipAddress: '192.168.1.100',
        port: 554,
      };

      const url = buildTapoRTSPUrl(config, { useSubStream: true });
      expect(url).toBe('rtsp://admin:password123@192.168.1.100:554/stream2');
    });
  });

  describe('validateRTSPUrl', () => {
    it('should validate correct RTSP URLs', () => {
      expect(validateRTSPUrl('rtsp://192.168.1.1:554/stream1')).toBe(true);
      expect(validateRTSPUrl('rtsp://user:pass@192.168.1.1/stream')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validateRTSPUrl('http://192.168.1.1')).toBe(false);
      expect(validateRTSPUrl('not-a-url')).toBe(false);
    });
  });

  describe('parseRTSPUrl', () => {
    it('should parse RTSP URL correctly', () => {
      const url = 'rtsp://admin:pass@192.168.1.100:554/stream1';
      const parsed = parseRTSPUrl(url);

      expect(parsed).toEqual({
        username: 'admin',
        password: 'pass',
        ipAddress: '192.168.1.100',
        port: 554,
        streamPath: 'stream1',
      });
    });
  });
});
```

Run tests:
```bash
npm test
```

### Integration Tests

Create `e2e/camera.test.ts` (using Detox):

```typescript
describe('Camera Management', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should add a new camera', async () => {
    await element(by.id('add-camera-button')).tap();
    await element(by.id('camera-name-input')).typeText('Test Camera');
    await element(by.id('camera-ip-input')).typeText('192.168.1.100');
    await element(by.id('save-button')).tap();

    await expect(element(by.text('Test Camera'))).toBeVisible();
  });

  it('should connect to camera', async () => {
    await element(by.text('Test Camera')).tap();
    await element(by.text('Connect')).tap();

    await waitFor(element(by.id('video-player')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

## Bug Tracking

### Bug Report Template

Create `.github/ISSUE_TEMPLATE/bug_report.md`:

```markdown
---
name: Bug Report
about: Report a bug in the RTSP PiP app
---

**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Device Information**
- Device: [e.g. iPhone 13 Pro]
- iOS Version: [e.g. 16.0]
- App Version: [e.g. 1.0.0]

**Camera Information**
- Brand: [e.g. Tapo]
- Model: [e.g. C200]
- Firmware: [e.g. 1.2.3]

**Additional context**
Add any other context about the problem.
```

## Performance Checklist

- [ ] App launches in < 2 seconds
- [ ] Stream connects in < 3 seconds
- [ ] No frame drops during playback
- [ ] Smooth PiP transitions
- [ ] No memory leaks
- [ ] CPU usage < 40% during streaming
- [ ] Battery drain acceptable (< 15%/hour)
- [ ] App size < 50 MB

## Next Steps

After completing Phase 6:

1. **Proceed to Phase 7** - Deployment
2. **Document all bugs** found during testing
3. **Create performance baseline** for future comparison
4. **Prepare release notes**

## Resources

- [Xcode Instruments Guide](https://developer.apple.com/library/archive/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Detox End-to-End Testing](https://wix.github.io/Detox/)
- [Jest Testing Framework](https://jestjs.io/)

---

**Status**: Ready for Implementation
**Next Phase**: [Phase 7 - Deployment](./PHASE_7_DEPLOYMENT.md)
**Previous Phase**: [Phase 5 - Advanced Features](./PHASE_5_ADVANCED.md)
**Last Updated**: 2025-11-30
