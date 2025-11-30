# Testing Workflow with Native Modules

## Critical Information

**You CANNOT test VLCKit native module in Expo Go.** Expo Go is a pre-built app that only includes standard Expo SDK modules. Custom native modules require a development build.

## The Reality Check

```
❌ Expo Go + Custom Native Modules = Won't Work
✅ Development Build + Custom Native Modules = Works
```

## Your Options

### Option 1: Automatic EAS Updates with Development Builds (Best)

**How it works:**
1. Build development app **once** (15-25 min, includes VLCKit)
2. Install on device via EAS or download link
3. Push code → CI auto-publishes updates
4. App automatically downloads JavaScript updates

**Setup:**

I've already configured this for you:
- ✅ `auto-deploy.yml` workflow publishes updates on every push
- ✅ `eas.json` configured with development profile
- ✅ Workflow detects native vs JavaScript changes

**First-time build:**
```bash
# Build once (this takes 15-25 minutes)
eas build --profile development --platform ios

# Or trigger via GitHub Actions > EAS Build workflow
```

**Install on device:**
```bash
# After build completes, you'll get a URL like:
# https://expo.dev/accounts/[account]/projects/rtsp-pip-camera/builds/[build-id]

# Option A: Scan QR code with camera app
# Option B: Download .ipa and install via Xcode

# For automatic installation to registered devices:
eas device:create
eas build --profile development --platform ios
```

**Daily workflow:**
```bash
# Make JavaScript changes
git add .
git commit -m "Update UI"
git push

# GitHub Actions automatically publishes update
# Open app → it downloads update automatically
# No rebuild needed!
```

**When you need to rebuild:**
Only when you change:
- Native Swift/Kotlin code
- Native dependencies (adding new native modules)
- App config (Info.plist, AndroidManifest.xml)
- Expo plugins

### Option 2: Make Native Module Optional (Expo Go Compatible)

Create a hybrid app that works in both Expo Go and development builds:

**Step 1: Create environment detection utility**

Create `src/utils/environment.ts`:
```typescript
import Constants from 'expo-constants';

export function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

export function hasNativeModules(): boolean {
  return !isExpoGo();
}
```

**Step 2: Update App.tsx for conditional loading**

```typescript
import React, { useState } from 'react';
import { StyleSheet, View, Text, Button, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { isExpoGo, hasNativeModules } from './src/utils/environment';

// Conditionally import native module
let RTSPPlayer: any = null;
let buildTapoRTSPUrl: any = null;

if (hasNativeModules()) {
  RTSPPlayer = require('./src/components/RTSPPlayer').default;
  buildTapoRTSPUrl = require('./src/utils/rtspHelper').buildTapoRTSPUrl;
}

export default function App() {
  if (isExpoGo()) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.expoGoWarning}>
          <Text style={styles.warningTitle}>⚠️ Expo Go Limitation</Text>
          <Text style={styles.warningText}>
            This app requires VLCKit for RTSP playback, which is not available in Expo Go.
          </Text>
          <Text style={styles.warningText}>
            To test, build a development version:
          </Text>
          <Text style={styles.codeText}>
            eas build --profile development --platform ios
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Your existing app code with RTSP player
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
          {/* Your existing connection form */}
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
  expoGoWarning: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  warningTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 20,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  codeText: {
    fontSize: 14,
    color: '#4ade80',
    fontFamily: 'monospace',
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  player: {
    flex: 1,
  },
  controls: {
    padding: 20,
  },
});
```

**Step 3: Install expo-constants**
```bash
npx expo install expo-constants
```

**Step 4: Test in Expo Go**
```bash
npm start
# Scan QR code with Expo Go
# You'll see warning message about native modules
```

**Benefits:**
- ✅ Can use Expo Go for UI development
- ✅ Automatic updates work
- ✅ No need for builds during UI iteration

**Drawbacks:**
- ❌ Still can't test RTSP functionality in Expo Go
- ❌ Need development build to test actual video features

### Option 3: Use Simulator Builds (Faster Iteration)

Build for iOS Simulator instead of device:

**Update eas.json:**
```json
{
  "build": {
    "development-simulator": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true,
        "resourceClass": "m-medium"
      }
    }
  }
}
```

**Build:**
```bash
eas build --profile development-simulator --platform ios
```

**Benefits:**
- ✅ Faster builds (~10 min vs 25 min)
- ✅ No device registration needed
- ✅ Can test on Mac directly

**Drawbacks:**
- ❌ Can't test device-specific features
- ❌ VLCKit might behave differently on simulator

## Recommended Workflow for Your Project

**Phase 2-3 (Current - Native Development):**
1. Build development version once: `eas build --profile development --platform ios`
2. Install on your iPhone
3. Make changes → push to GitHub
4. Auto-deploy workflow publishes updates
5. Restart app to receive updates
6. Rebuild only when changing native code

**Phase 4-6 (Feature Development):**
1. Use Option 2 (conditional loading) for UI work in Expo Go
2. Use development build for RTSP/PiP testing
3. Automatic updates for JavaScript changes

**Phase 7 (Production):**
1. Build production version
2. Submit to App Store
3. Use EAS Update for hotfixes

## CI/CD Configuration Summary

I've set up automatic deployment for you:

### Files Created/Updated:
- ✅ `.github/workflows/auto-deploy.yml` - Auto-publishes updates on push
- ✅ `.github/workflows/eas-build.yml` - Manual builds via GitHub Actions
- ✅ `eas.json` - Build profiles configured
- ✅ `.github/workflows/eas-update.yml` - Disabled (old workflow)

### How to Use:

**Automatic Updates (JavaScript changes):**
```bash
git push  # That's it! CI handles the rest
```

**Manual Builds (Native changes):**
```bash
# Option A: Local
eas build --profile development --platform ios

# Option B: GitHub Actions
# Go to Actions > EAS Build > Run workflow
```

## Testing Checklist

After your first build:

- [ ] Install development build on device
- [ ] Push a JavaScript change
- [ ] Check GitHub Actions (should publish update)
- [ ] Restart app (should download update)
- [ ] Verify JavaScript change appears
- [ ] Make native change to `RtspPlayerView.swift`
- [ ] Push code
- [ ] Check GitHub Actions (should warn about native changes)
- [ ] Run `eas build` to rebuild
- [ ] Verify native change works

## Common Questions

**Q: Can I use Expo Go for anything?**
A: Yes, use Option 2 (conditional loading) for UI development, but RTSP won't work.

**Q: How long do builds take?**
A: 15-25 minutes for device builds, ~10 min for simulator builds

**Q: Do I need a Mac?**
A: No! EAS Build runs in the cloud. You only need Mac for local builds with Xcode.

**Q: How do I get the app on my iPhone?**
A: After build completes, EAS provides a download link. Register your device with `eas device:create`.

**Q: How much do builds cost?**
A: Free tier: limited builds/month. Paid: unlimited builds. Check expo.dev/pricing

**Q: What about Android?**
A: Change `--platform ios` to `--platform android`. VLCKit works on both!

## Next Steps

Choose your path:

**Path A: Full Native Testing (Recommended)**
1. Run `eas build --profile development --platform ios`
2. Install on iPhone
3. Start developing with auto-updates

**Path B: Hybrid Development**
1. Implement Option 2 (conditional loading)
2. Use Expo Go for UI work
3. Use development build for RTSP testing

**Path C: Simulator Testing**
1. Update eas.json with simulator profile
2. Build simulator version
3. Test on Mac

I recommend **Path A** for your project since you're focused on RTSP/PiP functionality.

---

**Last Updated**: 2025-11-30 (Phase 2: RTSP Integration)
