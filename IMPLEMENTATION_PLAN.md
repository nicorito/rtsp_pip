# iOS RTSP Picture-in-Picture App - Implementation Plan

## Project Overview

Building an iOS application using Expo that supports:
- Picture-in-Picture (PiP) mode
- RTSP protocol for IP camera streaming (Tapo cameras and others)
- Live audio and video feed
- Background video playback

## Quick Reference

| Phase | Focus Area | Duration | Priority |
|-------|-----------|----------|----------|
| [Phase 1](./docs/PHASE_1_DEV_BUILD.md) | Development Build Setup | 3 hours | Critical |
| [Phase 2](./docs/PHASE_2_RTSP.md) | RTSP Integration | 1-2 days | Critical |
| [Phase 3](./docs/PHASE_3_PIP.md) | Picture-in-Picture | 1-2 days | Critical |
| [Phase 4](./docs/PHASE_4_UI.md) | User Interface | 2-3 days | High |
| [Phase 5](./docs/PHASE_5_ADVANCED.md) | Advanced Features | 2-3 days | Medium |
| [Phase 6](./docs/PHASE_6_TESTING.md) | Testing & Optimization | 1-2 days | High |
| [Phase 7](./docs/PHASE_7_DEPLOYMENT.md) | Deployment Setup | 1 day | High |

**Total Estimated Time**: 8-14 days

## Implementation Approach

### Recommended Stack
- **Framework**: Expo with Development Builds (expo-dev-client)
- **RTSP Playback**: VLCKit (MobileVLCKit for iOS)
- **PiP Support**: AVKit (AVPictureInPictureController)
- **State Management**: Zustand or React Context
- **Storage**: AsyncStorage for camera configurations

### Critical Requirements
- iOS 14.0+ (for PiP support)
- Cannot use Expo Go (native modules required)
- Must use EAS Build for development and production builds
- Requires iOS device for testing (PiP not available in simulator)

## Getting Started

### Prerequisites
```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo account
eas login

# Verify authentication
eas whoami
```

### Implementation Order
1. Start with **Phase 1** to set up development builds
2. Proceed to **Phase 2** for RTSP streaming
3. Add **Phase 3** for PiP functionality
4. Complete **Phase 4** for user interface
5. Enhance with **Phase 5** features as needed
6. Execute **Phase 6** for testing
7. Finalize with **Phase 7** for deployment

## Quick Start (Minimum Viable Product)

To get a working prototype quickly, focus on:
- Phase 1 (Dev Build Setup) - Required
- Phase 2 (RTSP Integration) - Core feature
- Phase 3 (PiP Implementation) - Core feature
- Basic UI from Phase 4 - Minimal interface

This gives you a functional app in 3-5 days.

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│           React Native Layer                │
│  ┌─────────────┐  ┌─────────────────────┐  │
│  │ UI Components│  │  State Management   │  │
│  └──────┬──────┘  └──────────┬──────────┘  │
│         │                    │              │
│         └────────┬───────────┘              │
│                  │                          │
├──────────────────┼──────────────────────────┤
│          Native Bridge (RCT)                │
├──────────────────┼──────────────────────────┤
│           iOS Native Layer                  │
│  ┌───────────────┴──────────┐               │
│  │  Custom Native Modules   │               │
│  │  ┌──────────┐ ┌────────┐│               │
│  │  │ VLCKit   │ │AVKit   ││               │
│  │  │ (RTSP)   │ │(PiP)   ││               │
│  │  └──────────┘ └────────┘│               │
│  └──────────────────────────┘               │
└─────────────────────────────────────────────┘
```

## Key Technical Decisions

### Decision 1: RTSP Playback Method
**Chosen**: VLCKit with react-native-vlc-media-player
- **Pros**: Direct RTSP support, low latency, offline capability
- **Cons**: Larger app size, native module complexity
- **Alternative**: FFmpeg transcoding to HLS (higher latency, requires server)

### Decision 2: Development Approach
**Chosen**: Expo Development Builds
- **Pros**: Expo ecosystem benefits, OTA updates, EAS integration
- **Cons**: Cannot use Expo Go, requires build process
- **Alternative**: Pure React Native (loses Expo tooling)

### Decision 3: PiP Implementation
**Chosen**: Native module with AVKit
- **Pros**: Official iOS support, reliable, good performance
- **Cons**: iOS only, requires native code
- **Alternative**: Third-party library (limited availability)

## Detailed Phase Documentation

Each phase has its own detailed documentation file:

1. **[Phase 1: Development Build Setup](./docs/PHASE_1_DEV_BUILD.md)**
   - Expo dev client installation
   - EAS configuration
   - iOS build setup
   - Development workflow

2. **[Phase 2: RTSP Integration](./docs/PHASE_2_RTSP.md)**
   - VLCKit installation
   - RTSP player implementation
   - Stream URL management
   - Connection handling

3. **[Phase 3: Picture-in-Picture](./docs/PHASE_3_PIP.md)**
   - iOS PiP configuration
   - Native module creation
   - React Native bridge
   - PiP controls

4. **[Phase 4: User Interface](./docs/PHASE_4_UI.md)**
   - Screen designs
   - Component structure
   - Navigation setup
   - State management

5. **[Phase 5: Advanced Features](./docs/PHASE_5_ADVANCED.md)**
   - Auto-reconnection
   - Multi-camera support
   - Recording functionality
   - Network quality monitoring

6. **[Phase 6: Testing & Optimization](./docs/PHASE_6_TESTING.md)**
   - Test plan
   - Performance optimization
   - Memory management
   - Edge case handling

7. **[Phase 7: Deployment](./docs/PHASE_7_DEPLOYMENT.md)**
   - EAS build configuration
   - Code signing
   - TestFlight setup
   - App Store submission

## Support Documentation

### RTSP URL Formats
```bash
# Tapo Cameras
Main Stream: rtsp://username:password@192.168.1.100:554/stream1
Sub Stream:  rtsp://username:password@192.168.1.100:554/stream2

# Generic ONVIF
rtsp://username:password@ip:554/onvif1

# Hikvision
rtsp://username:password@ip:554/Streaming/Channels/101

# Dahua
rtsp://username:password@ip:554/cam/realmonitor?channel=1&subtype=0
```

### iOS Requirements
- Minimum iOS: 14.0
- Required Capabilities:
  - Background Modes (Audio, Video)
  - Audio & Video entitlements
- Required Permissions:
  - NSCameraUsageDescription (optional, for local preview)
  - NSMicrophoneUsageDescription (optional, for two-way audio)
  - NSLocalNetworkUsageDescription (for IP camera discovery)

## Progress Tracking

- [ ] Phase 1: Development Build Setup
- [ ] Phase 2: RTSP Integration
- [ ] Phase 3: Picture-in-Picture
- [ ] Phase 4: User Interface
- [ ] Phase 5: Advanced Features
- [ ] Phase 6: Testing & Optimization
- [ ] Phase 7: Deployment

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Apple PiP Guidelines](https://developer.apple.com/documentation/avkit/adopting_picture_in_picture_in_a_standard_player)
- [VLCKit Documentation](https://wiki.videolan.org/VLCKit/)
- [RTSP Protocol Specification](https://tools.ietf.org/html/rfc2326)

## Notes

- **Testing**: PiP functionality only works on physical iOS devices, not simulators
- **Network**: Ensure cameras and iOS device are on the same network for local RTSP
- **Performance**: Use sub-stream (stream2) for better performance on mobile
- **Security**: Store credentials securely using react-native-keychain
- **Latency**: Expect 1-3 seconds latency with RTSP, tune buffer settings to optimize

---

**Last Updated**: 2025-11-30
**Version**: 1.0
