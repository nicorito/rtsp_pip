# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Expo template project with automatic over-the-air (OTA) updates via EAS Update. It's designed for rapid mobile development with zero-cost deployment using Expo Go and GitHub Actions for CI/CD.

## Essential Commands

### Development
```bash
npm start                 # Start development server
npm run android          # Start with Android device
npm run ios              # Start with iOS device
npm run web              # Start web version
```

### EAS Update Commands
```bash
eas login                                              # Authenticate with Expo account
eas update --branch development --message "msg"        # Test update locally
eas update --auto --non-interactive                    # Auto-publish (used by CI/CD)
eas update:list                                        # View update history
eas whoami                                             # Check authentication status
eas project:info                                       # View project details
```

### Project Setup (for new deployments)
```bash
npm install -g eas-cli                    # Install EAS CLI globally
eas init                                  # Initialize EAS project (updates app.json)
```

## Architecture

### Update System
- **Runtime Version Policy**: Uses `sdkVersion` policy in app.json, meaning updates are scoped to the Expo SDK version
- **Update Flow**: Push to main/master → GitHub Actions triggers → EAS Update publishes → Expo Go checks for updates on app restart
- **Limitations**: Only JavaScript/asset changes can be updated OTA; native code changes require building new binaries with `eas build`

### Configuration Files
- **app.json**: Expo configuration including:
  - `updates.url`: Points to EAS Update endpoint (set by `eas init`)
  - `extra.eas.projectId`: Project ID linking to Expo account
  - `runtimeVersion.policy`: Controls update compatibility (`sdkVersion`)
  - Bundle identifiers for iOS (`ios.bundleIdentifier`) and Android (`android.package`)

- **babel.config.js**: Uses `babel-preset-expo` with `module-resolver` plugin for path aliasing support

- **.github/workflows/eas-update.yml**: Automated deployment workflow that:
  - Triggers on pushes to main/master branches
  - Uses Node.js 18.x
  - Requires `EXPO_TOKEN` secret in GitHub repository settings
  - Runs `eas update --auto --non-interactive` to publish updates

### Project Structure
```
expo-template/
├── App.js                                    # Main entry point (simple template component)
├── app.json                                  # Expo configuration with EAS project ID
├── package.json                              # Dependencies: Expo 54.x, React 19.1.0, React Native 0.81.5
├── babel.config.js                           # Babel configuration with module-resolver
└── .github/workflows/eas-update.yml         # GitHub Actions CI/CD workflow
```

### Key Dependencies
- **expo**: v54.0.20 - Main framework
- **react**: v19.1.0 - UI library
- **react-native**: v0.81.5 - Native platform bridge
- **expo-status-bar**: Status bar component
- **expo-updates**: OTA update functionality
- **babel-plugin-module-resolver**: Path aliasing support

## Important Notes

### EAS Update Requirements
- Updates only work for JavaScript changes (components, logic, styling)
- Native module changes require full app rebuilds
- `runtimeVersion` must match between app binary and OTA updates
- Users receive updates on next app launch/reload in Expo Go

### GitHub Actions Setup
- Requires `EXPO_TOKEN` secret configured in GitHub repository settings
- Token can be created via: https://expo.dev/accounts/[account]/settings/access-tokens
- Workflow automatically publishes to the branch matching the Git branch name

### Development Workflow
1. Make changes to App.js or other JavaScript files
2. Test locally with `npm start` and Expo Go app
3. Commit and push to main/master branch
4. GitHub Actions automatically publishes EAS update
5. Force reload in Expo Go (shake device → Reload) to receive update

### Expo Go vs Production
- This template uses Expo Go for development (no build required)
- For production apps with custom native code, use development builds with `eas build`
- Expo Go has limitations and includes all Expo SDK modules by default
