const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    name: 'Cheating Daddy Enhanced',
    icon: 'src/assets/logo',
    executableName: 'cheating-daddy',
    appBundleId: 'com.cheatingdaddy.enhanced',
    appCategoryType: 'public.app-category.productivity',
    extendInfo: 'entitlements.plist',
    osxSign: {
      // Uncomment and configure for macOS signing
      // identity: 'Developer ID Application: Your Name (TEAM_ID)',
      // 'hardened-runtime': true,
      // entitlements: 'entitlements.plist',
      // 'entitlements-inherit': 'entitlements.plist',
      // 'signature-flags': 'library'
    },
    osxNotarize: {
      // Uncomment for notarization
      // tool: 'notarytool',
      // appleId: process.env.APPLE_ID,
      // appleIdPassword: process.env.APPLE_PASSWORD,
      // teamId: process.env.APPLE_TEAM_ID
    }
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'cheating_daddy_enhanced',
        authors: 'Cheating Daddy Team',
        description: 'Real-time AI assistant for interviews and meetings'
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          maintainer: 'Cheating Daddy Team',
          homepage: 'https://github.com/yourusername/cheating-daddy-enhanced'
        }
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};