// React Native 0.88.1 ships NO jest-preset.js (verified: there is no
// jest-preset file and no "jest" field in node_modules/react-native), so
// `preset: 'react-native'` does not resolve. Inline its essentials
// (babel-jest with the project babel config, which handles TS via
// @react-native/babel-preset).
let presetConfig;
try {
  require.resolve('react-native/jest-preset');
  presetConfig = { preset: 'react-native' };
} catch {
  presetConfig = {
    testEnvironment: 'node',
    transform: {
      '^.+\\.(js|ts|tsx)$': [
        'babel-jest',
        { configFile: './babel.config.js' },
      ],
    },
    transformIgnorePatterns: [
      'node_modules/(?!(@react-native|react-native|@react-navigation|@shopify|zustand|react-native-reanimated|react-native-worklets|react-native-gesture-handler|react-native-safe-area-context|react-native-screens|@react-native-community)/)',
    ],
  };
}

module.exports = {
  ...presetConfig,
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
};
