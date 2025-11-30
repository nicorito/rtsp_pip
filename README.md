# Expo Template with Auto-Update

An Expo project template with automatic over-the-air (OTA) updates via EAS Update triggered by GitHub commits.

## Features

- Automatic updates to Expo Go on every push to main/master branch
- Zero-cost setup using free tiers
- GitHub Actions workflow for CI/CD
- EAS Update for instant updates without app store submissions

## Prerequisites

- Node.js 18+ installed
- Expo account (free tier)
- Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- GitHub repository

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Install EAS CLI Globally

```bash
npm install -g eas-cli
```

### 3. Login to Expo

```bash
eas login
```

### 4. Configure Your Project

```bash
eas init
```

This will:
- Create a project on Expo servers
- Update `app.json` with your project ID
- Link the local project to your Expo account

### 5. Create EXPO_TOKEN for GitHub Actions

Generate an access token for GitHub Actions:

```bash
eas whoami
eas build:configure
```

Then create a token:

```bash
# In Expo dashboard or via CLI
expo token create --name github-actions
```

Or visit: https://expo.dev/accounts/[your-account]/settings/access-tokens

### 6. Add Secret to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings → Secrets and variables → Actions**
3. Click **New repository secret**
4. Name: `EXPO_TOKEN`
5. Value: Paste your token from step 5
6. Click **Add secret**

### 7. Update app.json

After running `eas init`, your `app.json` will be updated with your project ID. Make sure the `updates.url` and `extra.eas.projectId` fields are populated correctly.

### 8. Test the Setup Locally

Before pushing, test that updates work:

```bash
eas update --branch development --message "Test update"
```

### 9. Open App in Expo Go

1. Start the development server:
   ```bash
   npx expo start
   ```

2. Scan the QR code with:
   - iOS: Camera app
   - Android: Expo Go app

3. Your app should load in Expo Go

### 10. Test Auto-Updates

1. Make a change to `App.js` (e.g., modify the text)
2. Commit and push to main/master branch:
   ```bash
   git add .
   git commit -m "Test auto-update"
   git push origin main
   ```

3. Check GitHub Actions tab to see the workflow running
4. Once complete, restart your app in Expo Go to receive the update

## How It Works

1. **Push to main** → Triggers GitHub Actions workflow
2. **GitHub Actions** → Runs `eas update --auto`
3. **EAS Update** → Uploads JS bundle to Expo servers
4. **Expo Go** → Checks for updates on app restart/reload
5. **Phone** → Downloads and applies the update automatically

## Project Structure

```
expo-template/
├── .github/
│   └── workflows/
│       └── eas-update.yml    # GitHub Actions workflow
├── App.js                     # Main application component
├── app.json                   # Expo configuration
├── eas.json                   # EAS configuration
├── package.json               # Dependencies
└── README.md                  # This file
```

## Configuration Files

### eas.json

Defines update channels for different environments:
- **development**: For testing
- **preview**: For staging
- **production**: For live app

### .github/workflows/eas-update.yml

GitHub Actions workflow that:
- Triggers on push to main/master
- Sets up Node.js and Expo environment
- Installs dependencies
- Publishes EAS update automatically

## Costs

- **GitHub Actions**: Free (2,000 minutes/month for private repos)
- **EAS Update**: Free tier includes:
  - 1,000 monthly active users (MAU)
  - 100 GiB bandwidth
- **Total**: $0 for personal/testing use

## Common Commands

```bash
# Start development server
npm start

# Test update locally
eas update --branch development --message "Your message"

# View update history
eas update:list

# Check project status
eas whoami
eas project:info
```

## Troubleshooting

### Updates Not Showing

1. Force reload in Expo Go (shake device → Reload)
2. Check GitHub Actions logs for errors
3. Verify EXPO_TOKEN is set correctly in GitHub Secrets
4. Ensure `runtimeVersion` in app.json matches across updates

### GitHub Actions Failing

1. Check that EXPO_TOKEN secret is added
2. Verify token hasn't expired
3. Check workflow logs for specific errors
4. Ensure EAS CLI is up to date in workflow

### Can't Login to EAS

```bash
eas logout
eas login
```

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
- [GitHub Actions for Expo](https://github.com/expo/expo-github-action)
- [Expo Go App](https://expo.dev/client)

## Notes

- Updates only work for JavaScript changes (no native code changes)
- For native code changes, you need to build a new binary with `eas build`
- Expo Go has limitations; for production apps, use development builds
- Updates are instant and don't require app store approval
- Users receive updates on next app launch/reload

## License

MIT
