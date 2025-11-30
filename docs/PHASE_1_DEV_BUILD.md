# Phase 1: Development Build Setup

**Duration**: 2-3 hours
**Complexity**: Low
**Priority**: Critical
**Dependencies**: None

## Overview

This phase transitions the project from Expo Go compatibility to Expo Development Builds. This is essential because PiP and RTSP functionality require native modules that are not available in Expo Go.

## Learning Objectives

- Understand the difference between Expo Go and Development Builds
- Configure expo-dev-client
- Create and install development builds using EAS
- Set up the development workflow for native module testing

## Prerequisites

### Required Tools
```bash
# Node.js 18+ installed
node --version

# EAS CLI installed globally
npm install -g eas-cli

# Expo account (free tier is sufficient)
# Create at: https://expo.dev/signup
```

### Required Hardware
- Mac computer (for iOS development)
- iOS device (iPhone/iPad running iOS 14.0+)
- USB cable for device connection

### Expo Account Setup
```bash
# Login to your Expo account
eas login

# Verify you're logged in
eas whoami

# Check project info
eas project:info
```

## Step-by-Step Implementation

### Step 1: Install expo-dev-client

```bash
# Install expo-dev-client package
npx expo install expo-dev-client

# Install expo-build-properties for native configuration
npx expo install expo-build-properties
```

**What this does**:
- Adds development client support to your app
- Enables loading development servers on custom native builds
- Allows installing and testing native modules

### Step 2: Update app.json Configuration

Edit `/home/user/rtsp_pip/app.json`:

```json
{
  "expo": {
    "name": "RTSP PiP Camera",
    "slug": "rtsp-pip-camera",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.rtsppip",
      "buildNumber": "1",
      "infoPlist": {
        "UIBackgroundModes": ["audio"],
        "NSCameraUsageDescription": "This app uses the camera for local preview (optional feature)",
        "NSMicrophoneUsageDescription": "This app uses the microphone for two-way audio communication with cameras",
        "NSLocalNetworkUsageDescription": "This app needs to access your local network to connect to IP cameras"
      }
    },
    "plugins": [
      [
        "expo-build-properties",
        {
          "ios": {
            "deploymentTarget": "14.0"
          }
        }
      ]
    ],
    "runtimeVersion": {
      "policy": "sdkVersion"
    },
    "updates": {
      "url": "https://u.expo.dev/dbcd8e54-cbdf-424d-85a5-77223090cf91"
    },
    "extra": {
      "eas": {
        "projectId": "dbcd8e54-cbdf-424d-85a5-77223090cf91"
      }
    },
    "owner": "erykdev"
  }
}
```

**Key Changes Explained**:
- `bundleIdentifier`: Unique identifier for your iOS app
- `deploymentTarget`: iOS 14.0 required for PiP
- `UIBackgroundModes`: Enables audio playback in background (required for PiP)
- `NSLocalNetworkUsageDescription`: Required for connecting to IP cameras on LAN

### Step 3: Create eas.json Configuration

Create `/home/user/rtsp_pip/eas.json`:

```json
{
  "cli": {
    "version": ">= 13.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "buildConfiguration": "Debug",
        "simulator": false
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false,
        "buildConfiguration": "Release"
      }
    },
    "production": {
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  }
}
```

**Build Profiles Explained**:
- **development**: For testing native modules, includes dev tools
- **preview**: For internal testing, optimized build
- **production**: For App Store submission

### Step 4: Build Development Client

```bash
# Build development client for iOS (this will take 10-20 minutes)
eas build --profile development --platform ios

# This will:
# 1. Upload your project to EAS servers
# 2. Compile the native iOS app with expo-dev-client
# 3. Generate an IPA file for installation
```

**What happens during build**:
1. EAS uploads your project code
2. iOS app is compiled with all native dependencies
3. Development client is embedded in the app
4. IPA file is generated and made available for download

**Expected Output**:
```
✔ Build finished
📱 Install the build on your device:
https://expo.dev/accounts/YOUR_ACCOUNT/projects/rtsp-pip-camera/builds/BUILD_ID
```

### Step 5: Install Development Build on Device

**Option A: Direct Installation (Recommended)**
```bash
# Install directly via USB
# Click the link from the build output or:
eas build:list

# Download IPA and install using Apple Configurator 2 or Xcode
```

**Option B: QR Code Installation**
1. Open the build link on your computer
2. Scan QR code with iPhone camera
3. Download and install the profile
4. Install the development build

**Note**: You may need to trust the developer certificate:
- Settings → General → VPN & Device Management → Trust

### Step 6: Test Development Build

```bash
# Start Expo development server
npx expo start --dev-client

# This will show a QR code
# Open your development build app and scan the QR code
```

**Verification Checklist**:
- [ ] Development build app installed on device
- [ ] App opens without crashing
- [ ] Can connect to development server
- [ ] Hot reload works
- [ ] "Expo Go" branding is NOT present (should show your app name)

### Step 7: Update package.json Scripts

Edit `/home/user/rtsp_pip/package.json`:

```json
{
  "scripts": {
    "start": "expo start --dev-client",
    "android": "expo start --android --dev-client",
    "ios": "expo start --ios --dev-client",
    "web": "expo start --web",
    "build:dev:ios": "eas build --profile development --platform ios",
    "build:preview:ios": "eas build --profile preview --platform ios",
    "build:prod:ios": "eas build --profile production --platform ios"
  }
}
```

## Troubleshooting

### Issue: Build Fails with Certificate Error

**Solution**:
```bash
# Let EAS manage certificates (recommended for first-time)
# When prompted, choose "Yes" to generate new certificates
```

### Issue: App Crashes on Launch

**Possible Causes**:
1. Incorrect bundle identifier
2. Missing permissions in Info.plist
3. Development certificate not trusted

**Solution**:
```bash
# Check build logs
eas build:list
# Click on the build and view logs

# Rebuild with verbose logging
eas build --profile development --platform ios --clear-cache
```

### Issue: Cannot Install on Device

**Solutions**:
1. Check that device is registered in Apple Developer Portal
2. Ensure development certificate includes your device UDID
3. Use ad-hoc provisioning profile for testing

### Issue: Dev Client Won't Connect to Server

**Solution**:
1. Ensure phone and computer are on same WiFi network
2. Check firewall settings
3. Try connecting manually:
   ```
   exp://YOUR_IP:8081
   ```

## Verification & Testing

### Success Criteria

- [ ] Development build installed and running on iOS device
- [ ] Can load app from development server
- [ ] Hot reload working
- [ ] No crashes on app launch
- [ ] Console logs visible in terminal
- [ ] App name appears correctly (not "Expo Go")

### Test Cases

1. **Fresh Install Test**
   ```bash
   # Delete app from device
   # Reinstall from EAS
   # Verify clean installation
   ```

2. **Development Server Connection**
   ```bash
   npx expo start --dev-client
   # Scan QR code
   # Verify app loads
   ```

3. **Hot Reload Test**
   - Edit App.js
   - Save file
   - Verify changes appear immediately on device

4. **Native Module Loading**
   ```javascript
   // Add to App.js temporarily
   import { NativeModules } from 'react-native';
   console.log('Native Modules:', Object.keys(NativeModules));
   ```

## Code Changes Summary

### Files Created
- `/eas.json` - EAS build configuration

### Files Modified
- `/app.json` - Added iOS config, plugins, permissions
- `/package.json` - Added expo-dev-client, build scripts

### Dependencies Added
```json
{
  "expo-dev-client": "~5.0.0",
  "expo-build-properties": "~0.14.0"
}
```

## Next Steps

After completing this phase:

1. **Proceed to Phase 2** - RTSP Integration
   - Install VLCKit
   - Create RTSP player component
   - Test video streaming

2. **Keep Development Build Updated**
   ```bash
   # Rebuild when adding new native dependencies
   eas build --profile development --platform ios
   ```

3. **Document Device Setup**
   - Save device UDID
   - Note installed build version
   - Keep track of certificates

## Important Notes

- Development builds must be **rebuilt** whenever you add new native modules
- JavaScript-only changes can use hot reload
- Keep your development build installed for entire development process
- Each team member needs their own development build installation

## Resources

- [Expo Development Builds Documentation](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [iOS Simulator vs Device Testing](https://docs.expo.dev/workflow/ios-simulator/)
- [Troubleshooting EAS Build](https://docs.expo.dev/build-reference/troubleshooting/)

## Estimated Time Breakdown

| Task | Time |
|------|------|
| Install dependencies | 5 min |
| Configure app.json & eas.json | 15 min |
| First EAS build | 15-20 min |
| Install on device | 10 min |
| Test and verify | 15 min |
| Troubleshooting buffer | 30 min |
| **Total** | **2-3 hours** |

---

**Status**: Ready for Implementation
**Next Phase**: [Phase 2 - RTSP Integration](./PHASE_2_RTSP.md)
**Previous Phase**: None
**Last Updated**: 2025-11-30
