# Phase 7: Deployment

**Duration**: 1 day
**Complexity**: Low-Medium
**Priority**: High
**Dependencies**: Phases 1-6

## Overview

This phase covers building the production app, configuring code signing, submitting to TestFlight, and deploying to the App Store. This transforms your development app into a production-ready application.

## Prerequisites

### Required Accounts
- ✅ Apple Developer Account ($99/year)
- ✅ Expo Account (free tier is sufficient)
- ✅ GitHub Account (for CI/CD)

### Required Tools
- ✅ EAS CLI installed (`npm install -g eas-cli`)
- ✅ Xcode installed (latest version)
- ✅ Valid Apple Developer certificates

## Step-by-Step Deployment

### Step 1: Prepare App for Production

#### Update App Version

Edit `app.json`:

```json
{
  "expo": {
    "name": "RTSP Camera Viewer",
    "slug": "rtsp-camera-viewer",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#000000"
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.rtspcamera",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "UIBackgroundModes": ["audio", "video"],
        "NSCameraUsageDescription": "Optional: Access camera for local preview",
        "NSMicrophoneUsageDescription": "Optional: Access microphone for two-way audio",
        "NSLocalNetworkUsageDescription": "Connect to IP cameras on your local network",
        "NSPhotoLibraryAddUsageDescription": "Save camera snapshots to your photo library"
      }
    }
  }
}
```

#### Create App Icons

Required icon sizes for iOS:

```bash
# Icon sizes needed:
# 1024x1024 (App Store)
# 180x180 (iPhone)
# 167x167 (iPad Pro)
# 152x152 (iPad)
# 120x120 (iPhone smaller)
# 87x87 (iPhone notifications)
# 80x80 (iPad notifications)
# 76x76 (iPad)
# 58x58 (iPhone settings)
# 40x40 (Spotlight)
# 29x29 (Settings)
```

Generate icons automatically:

```bash
# Install icon generator
npm install -g @expo/expo-cli

# Generate all sizes from a single 1024x1024 image
npx expo prebuild --clean
```

#### Create Splash Screen

Create `assets/splash.png` (1242x2688 for iPhone)

### Step 2: Configure EAS Build

Edit `eas.json`:

```json
{
  "cli": {
    "version": ">= 13.2.0",
    "appVersionSource": "remote"
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
        "buildConfiguration": "Release",
        "resourceClass": "m-medium"
      }
    },
    "production": {
      "distribution": "store",
      "ios": {
        "buildConfiguration": "Release",
        "resourceClass": "m-medium",
        "autoIncrement": true
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "YOUR_ASC_APP_ID",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

**Build Profiles Explained**:
- **development**: For testing with development client
- **preview**: For internal testing via TestFlight
- **production**: For App Store submission

### Step 3: Set Up Code Signing

#### Option A: EAS Managed Certificates (Recommended)

```bash
# EAS will generate and manage certificates automatically
eas build --platform ios --profile production

# When prompted:
# "Would you like to generate a new Apple Distribution Certificate?" → Yes
# "Would you like to generate a new Apple Provisioning Profile?" → Yes
```

#### Option B: Manual Certificate Management

1. **Create App ID in Apple Developer Portal**
   - Go to https://developer.apple.com/account
   - Certificates, Identifiers & Profiles
   - Identifiers → + (Add)
   - App IDs → Continue
   - Bundle ID: `com.yourcompany.rtspcamera`
   - Enable capabilities:
     - Background Modes
     - Associated Domains (if using deep links)

2. **Create Distribution Certificate**
   ```bash
   # On Mac
   cd ~/Desktop
   openssl req -new -key -out CertificateSigningRequest.certSigningRequest

   # Upload to Apple Developer Portal
   # Certificates → + (Add) → Apple Distribution
   ```

3. **Create Provisioning Profile**
   - Profiles → + (Add)
   - Distribution → App Store
   - Select App ID
   - Select Distribution Certificate
   - Download profile

4. **Configure EAS to use manual certificates**
   ```bash
   eas credentials
   ```

### Step 4: Build for Production

```bash
# Build for App Store
eas build --platform ios --profile production

# This will:
# 1. Upload your project code
# 2. Install dependencies
# 3. Run native build with VLCKit
# 4. Generate IPA file
# 5. Sign with distribution certificate
```

**Expected Build Time**: 20-30 minutes (due to VLCKit compilation)

**Build Output**:
```
✔ Build finished
📱 Download build:
https://expo.dev/accounts/YOUR_ACCOUNT/projects/rtsp-camera-viewer/builds/BUILD_ID

Build ready for submission to App Store
```

### Step 5: App Store Connect Setup

#### Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. My Apps → + (Add App)
3. Fill in details:
   - **Platform**: iOS
   - **Name**: RTSP Camera Viewer
   - **Primary Language**: English
   - **Bundle ID**: com.yourcompany.rtspcamera
   - **SKU**: rtspcamera001
   - **User Access**: Full Access

4. App Information:
   - **Category**: Utilities or Productivity
   - **Content Rights**: Check if you own all rights
   - **Age Rating**: Complete questionnaire

5. Pricing and Availability:
   - **Price**: Free or set price
   - **Availability**: All countries or select

#### Prepare App Store Metadata

Create `metadata/` directory:

```
metadata/
├── en-US/
│   ├── name.txt                    # "RTSP Camera Viewer"
│   ├── subtitle.txt                # "View IP Cameras with PiP"
│   ├── description.txt             # Full app description
│   ├── keywords.txt                # "RTSP,IP Camera,Security,PiP"
│   ├── promotional_text.txt        # Optional promo text
│   ├── marketing_url.txt           # Optional marketing site
│   ├── support_url.txt             # Support website
│   └── privacy_policy_url.txt      # Privacy policy URL
└── screenshots/
    ├── iPhone_6.5/                 # 1284x2778 (iPhone 14 Pro Max)
    │   ├── 1.png
    │   ├── 2.png
    │   └── 3.png
    └── iPad_12.9/                  # 2048x2732 (iPad Pro)
        ├── 1.png
        └── 2.png
```

#### App Description Example

`metadata/en-US/description.txt`:

```
RTSP Camera Viewer with Picture-in-Picture

Watch your IP security cameras with advanced Picture-in-Picture support.
Compatible with Tapo, Hikvision, Dahua, and all ONVIF-compliant cameras.

FEATURES:

📹 Live RTSP Streaming
• Real-time video and audio from IP cameras
• Low-latency streaming optimized for mobile
• Hardware-accelerated decoding

⬆️ Picture-in-Picture Mode
• Watch cameras while using other apps
• Floating video window
• Background audio support

📷 Multi-Camera Support
• Manage unlimited cameras
• Grid view for multiple streams
• Quick connect to favorites

🔒 Privacy & Security
• All connections stay on your local network
• Credentials stored securely on device
• No cloud services required

⚙️ Advanced Features
• Auto-reconnection
• Stream quality switching
• Snapshot capture
• Network quality monitoring

SUPPORTED CAMERAS:

• Tapo (C100, C200, C310, etc.)
• Hikvision IP cameras
• Dahua IP cameras
• ONVIF-compliant cameras
• Generic RTSP streams

REQUIREMENTS:

• iOS 14.0 or later
• IP camera supporting RTSP protocol
• Local network access

PERFECT FOR:

• Home security monitoring
• Baby monitors
• Pet cameras
• Business surveillance
• Remote property monitoring

---

No subscription required. One-time purchase.
All processing happens on your device.
```

### Step 6: Submit to TestFlight

```bash
# Submit build to App Store Connect
eas submit --platform ios --profile production

# OR use automatic submission from build
eas build --platform ios --profile production --auto-submit
```

**TestFlight Setup**:

1. App Store Connect → TestFlight
2. Select your build
3. Add "What to Test" notes:
   ```
   Version 1.0.0 - Initial Release

   Please test:
   - Adding and connecting to cameras
   - Picture-in-Picture functionality
   - Stream stability over extended period
   - Auto-reconnection on network interruption

   Known Issues:
   - None
   ```

4. Add Internal Testers:
   - Users & Access → TestFlight → Internal Testing
   - Add testers via email
   - They'll receive TestFlight invite

5. Add External Testers (Optional):
   - Create External Group
   - Add testers
   - Submit for Beta Review (1-2 days)

### Step 7: Submit to App Store

After TestFlight testing is complete:

1. **App Store Connect → App Store**

2. **Prepare for Submission**:
   - Upload screenshots (required sizes)
   - Add app description
   - Set keywords
   - Choose age rating
   - Add privacy policy URL
   - Add support URL

3. **Select Build**:
   - Choose build from TestFlight
   - Answer export compliance questions:
     - Uses encryption: Yes (HTTPS/TLS)
     - Exempt: Yes (standard encryption)

4. **App Review Information**:
   - Contact information
   - Demo account credentials (if needed)
   - Notes for reviewer:
     ```
     This app requires an IP camera supporting RTSP protocol.

     For testing, you can use a public RTSP test stream:
     rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mp4

     Or connect to the demo camera:
     IP: rtsp.example.com
     Username: demo
     Password: demo123
     ```

5. **Submit for Review**:
   - Click "Submit for Review"
   - Typical review time: 1-3 days

### Step 8: CI/CD with GitHub Actions

Create `.github/workflows/eas-build.yml`:

```yaml
name: EAS Build and Submit

on:
  push:
    branches:
      - main
      - release/*
  workflow_dispatch:

jobs:
  build:
    name: Build and Submit
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18.x
          cache: npm

      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: npm ci

      - name: Build iOS app
        run: eas build --platform ios --profile production --non-interactive --no-wait

      - name: Submit to App Store
        if: github.ref == 'refs/heads/main'
        run: eas submit --platform ios --profile production --latest --non-interactive
```

**Setup GitHub Secrets**:
1. Go to Repository Settings → Secrets
2. Add `EXPO_TOKEN`:
   ```bash
   # Generate token
   eas login
   eas whoami
   # Create token at: https://expo.dev/accounts/[account]/settings/access-tokens
   ```

### Step 9: Post-Launch Monitoring

#### Analytics Setup (Optional)

Add Firebase Analytics:

```bash
npx expo install @react-native-firebase/app @react-native-firebase/analytics
```

Configure in `app.json`:

```json
{
  "expo": {
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-firebase/analytics"
    ]
  }
}
```

Track key events:

```typescript
import analytics from '@react-native-firebase/analytics';

// Track camera connection
await analytics().logEvent('camera_connected', {
  brand: camera.brand,
  connection_time: connectionTime,
});

// Track PiP usage
await analytics().logEvent('pip_activated', {
  duration: pipDuration,
});
```

#### Crash Reporting

Add Sentry:

```bash
npx expo install sentry-expo
```

Configure:

```typescript
import * as Sentry from 'sentry-expo';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  enableInExpoDevelopment: false,
  debug: __DEV__,
});
```

### Step 10: Maintenance & Updates

#### OTA Updates (JavaScript-only changes)

```bash
# Publish update to production
eas update --branch production --message "Fix connection timeout issue"

# View update status
eas update:view

# Rollback if needed
eas update:republish --branch production --group-id GROUP_ID
```

**OTA Update Flow**:
1. Make JavaScript/asset changes
2. Run `eas update`
3. Users receive update on next app launch
4. No App Store review needed

#### Binary Updates (Native code changes)

```bash
# Build new version
# Update version in app.json first
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --latest

# Wait for App Store review
```

**Version Numbering**:
- **Patch** (1.0.1): Bug fixes, OTA-compatible
- **Minor** (1.1.0): New features, may need binary update
- **Major** (2.0.0): Breaking changes, requires binary update

## Release Checklist

### Pre-Release
- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] App icons prepared (all sizes)
- [ ] Screenshots captured
- [ ] App description written
- [ ] Privacy policy published
- [ ] Support URL active
- [ ] TestFlight testing completed
- [ ] No critical bugs

### App Store Submission
- [ ] Bundle ID configured
- [ ] Code signing working
- [ ] Build uploaded to TestFlight
- [ ] Screenshots uploaded
- [ ] Description added
- [ ] Keywords set
- [ ] Age rating completed
- [ ] Privacy questions answered
- [ ] Submitted for review

### Post-Launch
- [ ] Monitor crash reports
- [ ] Check user reviews
- [ ] Respond to support emails
- [ ] Track analytics
- [ ] Plan next update

## Troubleshooting

### Issue: Build Fails on EAS

**Check**:
```bash
# View detailed logs
eas build:list
# Click on failed build to see logs
```

**Common Causes**:
- Missing dependencies in package.json
- Native module incompatibility
- Code signing issues
- VLCKit download timeout

### Issue: App Rejected by Apple

**Common Reasons**:
1. Missing privacy descriptions
2. Crashes on launch
3. Incomplete functionality
4. Guideline violations

**Resolution**:
- Address issues in rejection email
- Resubmit with fixes
- Add notes explaining changes

### Issue: OTA Updates Not Applying

**Debug**:
```typescript
import * as Updates from 'expo-updates';

// Check for updates manually
const update = await Updates.checkForUpdateAsync();
if (update.isAvailable) {
  await Updates.fetchUpdateAsync();
  await Updates.reloadAsync();
}
```

## Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [TestFlight Documentation](https://developer.apple.com/testflight/)

## Congratulations!

You've successfully deployed your RTSP Camera Viewer app to the App Store! 🎉

### Next Steps

1. **Monitor user feedback** and ratings
2. **Plan feature updates** based on user requests
3. **Maintain app** with regular updates
4. **Engage with users** through reviews and support

---

**Status**: Deployment Complete
**Previous Phase**: [Phase 6 - Testing & Optimization](./PHASE_6_TESTING.md)
**Last Updated**: 2025-11-30
