# GitHub Actions Workflows

## Overview

This project includes two GitHub Actions workflows for different deployment scenarios:

1. **EAS Update** (`eas-update.yml`) - For JavaScript/asset updates only
2. **EAS Build** (`eas-build.yml`) - For native module builds

## Important: Native Module Considerations

Since this project uses **custom native modules** (VLCKit for RTSP playback), the deployment strategy differs from standard Expo projects:

### What Requires Native Builds

Changes to these components require `eas build`:
- ✅ Native module code (Swift/Kotlin files)
- ✅ Native dependencies (VLCKit, CocoaPods)
- ✅ Native configuration (Info.plist, AndroidManifest.xml)
- ✅ Expo config plugins
- ✅ App icons, splash screens

### What Can Use OTA Updates

Changes to these components can use `eas update`:
- ✅ JavaScript/TypeScript code (components, screens, logic)
- ✅ React Native styles
- ✅ Assets (images, fonts loaded via require())
- ✅ App configuration (non-native)

## Workflows

### 1. EAS Update Workflow (Currently Disabled)

**File**: `.github/workflows/eas-update.yml`

**Status**: Disabled by default (triggers on `disabled-until-production` branch)

**Purpose**: Publish over-the-air (OTA) JavaScript updates

**When to enable**:
- After distributing initial native builds to users
- For JavaScript-only bug fixes or features
- When you have a stable native module base

**How to enable**:
1. Edit `eas-update.yml`
2. Change branch trigger from `disabled-until-production` to `main`
3. Ensure users have compatible native builds installed

**Workflow steps**:
```yaml
1. Checkout code
2. Install dependencies (npm ci)
3. Publish update (eas update --auto)
```

**Does NOT require `expo prebuild`** because:
- EAS Update only publishes JavaScript bundles
- Native code is not compiled or deployed
- Prebuild is only for generating native projects locally

### 2. EAS Build Workflow

**File**: `.github/workflows/eas-build.yml`

**Trigger**: Manual workflow dispatch only

**Purpose**: Build native apps with all native modules included

**How to use**:
1. Go to GitHub Actions tab
2. Select "EAS Build" workflow
3. Click "Run workflow"
4. Choose:
   - Platform: ios, android, or all
   - Profile: development, preview, or production

**Workflow steps**:
```yaml
1. Checkout code
2. Install dependencies (npm ci)
3. Build with EAS (includes native compilation)
```

**Does NOT require `expo prebuild`** because:
- EAS Build runs prebuild automatically on their cloud servers
- Native dependencies are installed during cloud build
- VLCKit is compiled as part of the iOS build process

## Development Workflow Recommendations

### Phase 2-3: Active Development (Current)

Use **manual builds only**:

```bash
# Local development
npm install
npx expo prebuild --clean
npx expo run:ios

# Cloud development build
eas build --profile development --platform ios
```

**Do NOT enable EAS Update workflow** - you're making native changes

### Phase 4-6: Feature Development

Continue using **manual builds** for each native change:

```bash
# After native module changes
eas build --profile development --platform ios

# After JavaScript-only changes (with existing build)
eas update --branch development --message "UI improvements"
```

### Phase 7: Production Deployment

Enable **both workflows**:

1. **Initial Release**:
   - Use EAS Build workflow to publish to App Store
   - Distribute to users

2. **Post-Release Updates**:
   - JavaScript fixes → Enable EAS Update workflow
   - Native changes → Use EAS Build workflow + new App Store release

## Why No `expo prebuild` in Workflows?

**Short answer**: EAS handles it automatically

**Detailed explanation**:

### For EAS Update:
- Only publishes JavaScript bundles
- Doesn't touch native code
- No need for native project generation
- Works with existing native builds

### For EAS Build:
- Runs `expo prebuild` automatically in the cloud
- Installs native dependencies (VLCKit via CocoaPods)
- Compiles native code (Swift, Objective-C)
- Generates final binary (.ipa for iOS, .apk/.aab for Android)

### For Local Development:
- You manually run `npx expo prebuild --clean`
- Generates `ios/` and `android/` folders
- Allows local builds with Xcode/Android Studio
- Required for `npx expo run:ios` to work

## Required GitHub Secrets

Both workflows require:

```
EXPO_TOKEN
```

**How to create**:
1. Go to https://expo.dev/accounts/[account]/settings/access-tokens
2. Create new token
3. Add to GitHub repository secrets (Settings → Secrets and variables → Actions)

## Summary

| Workflow | Requires Prebuild? | When to Use | Current Status |
|----------|-------------------|-------------|----------------|
| EAS Update | ❌ No | JavaScript-only changes | Disabled |
| EAS Build | ❌ No (automatic) | Native module changes | Manual trigger |
| Local `expo run:ios` | ✅ Yes (manual) | Local development | Use as needed |

**Key Takeaway**: Neither GitHub Actions workflow needs manual `expo prebuild` because:
- EAS Update doesn't deal with native code
- EAS Build runs prebuild automatically in the cloud
- Only local development requires manual prebuild

## Next Steps

After completing Phase 7 (Deployment):
1. Create production build via EAS Build workflow
2. Submit to App Store
3. Enable EAS Update workflow for post-release JavaScript updates
4. Monitor update adoption via Expo dashboard

---

**Last Updated**: 2025-11-30 (Phase 2: RTSP Integration)
