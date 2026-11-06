/**
 * with-netscope-native
 *
 * Khôi phục code Kotlin của NetScope sau `expo prebuild`.
 * Prebuild tạo lại android/ từ template Expo nên sẽ xóa code Kotlin
 * tự viết. Bản gốc nằm ở plugins/netscope-native/android/ và được
 * copy lại vào cây android/ đã tạo ra ở mỗi lần prebuild.
 *
 * Không ghi đè MainApplication.kt / MainActivity.kt và
 * AndroidManifest.xml. Plugin chỉ thêm quyền và chèn NetScopePackage
 * vào MainApplication đã tạo ra, giữ nguyên wiring Expo / RN 0.88.
 */
const fs = require('fs');
const path = require('path');
const {
  AndroidConfig,
  createRunOncePlugin,
  withAndroidManifest,
  withAppBuildGradle,
  withDangerousMod,
  withMainApplication,
} = require('@expo/config-plugins');

const ASSETS_DIR = path.join(__dirname, 'netscope-native', 'android');
const PACKAGE_DIR = path.join('app', 'src', 'main', 'java', 'com', 'netscope', 'scanner');

const withNativeFiles = (config) =>
  withDangerousMod(config, [
    'android',
    async (config) => {
      const androidRoot = config.modRequest.platformProjectRoot;
      const srcRoot = path.join(ASSETS_DIR, PACKAGE_DIR);
      if (!fs.existsSync(srcRoot)) {
        return config;
      }
      const copyRecursive = (srcDir, destDir) => {
        fs.mkdirSync(destDir, { recursive: true });
        for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
          const src = path.join(srcDir, entry.name);
          const dest = path.join(destDir, entry.name);
          if (entry.isDirectory()) {
            copyRecursive(src, dest);
          } else {
            fs.copyFileSync(src, dest);
          }
        }
      };
      copyRecursive(srcRoot, path.join(androidRoot, PACKAGE_DIR));
      const assetsSrc = path.join(ASSETS_DIR, 'app', 'src', 'main', 'assets');
      if (fs.existsSync(assetsSrc)) {
        copyRecursive(assetsSrc, path.join(androidRoot, 'app', 'src', 'main', 'assets'));
      }
      const testSrc = path.join(ASSETS_DIR, 'app', 'src', 'test', 'java', 'com', 'netscope', 'scanner');
      if (fs.existsSync(testSrc)) {
        copyRecursive(testSrc, path.join(androidRoot, 'app', 'src', 'test', 'java', 'com', 'netscope', 'scanner'));
      }
      return config;
    },
  ]);

const PERMISSIONS = [
  'android.permission.ACCESS_WIFI_STATE',
  'android.permission.CHANGE_WIFI_STATE',
  'android.permission.ACCESS_NETWORK_STATE',
  'android.permission.INTERNET',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.NEARBY_WIFI_DEVICES',
  'android.permission.CHANGE_WIFI_MULTICAST_STATE',
  'android.permission.POST_NOTIFICATIONS',
];

const withNetScopeManifest = (config) =>
  withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;
    const application = manifest.manifest.application[0];
    const usesPermissions = manifest.manifest['uses-permission'] || [];
    for (const permission of PERMISSIONS) {
      const exists = usesPermissions.some(
        (entry) => entry.$['android:name'] === permission,
      );
      if (!exists) {
        usesPermissions.push({ $: { 'android:name': permission } });
      }
    }
    manifest.manifest['uses-permission'] = usesPermissions;
    const receivers = application.receiver || [];
    const hasWorkerReceiver = receivers.some(
      (entry) => entry.$['android:name'] === 'androidx.work.impl.background.systemalarm.RescheduleReceiver',
    );
    if (!hasWorkerReceiver) {
      application.receiver = receivers;
    }
    return config;
  });

const withNetScopeGradle = (config) =>
  withAppBuildGradle(config, async (config) => {
    if (!config.modResults.contents.includes('minSdkVersion 26')) {
      config.modResults.contents = config.modResults.contents.replace(
        'minSdkVersion rootProject.ext.minSdkVersion',
        'minSdkVersion 26',
      );
    }
    return config;
  });

const withNetScopePackage = (config) =>
  withMainApplication(config, async (config) => {
    const src = config.modResults.contents;
    if (!src.includes('NetScopePackage')) {
      let next = src;
      if (next.includes('import com.facebook.react.ReactPackage')) {
        next = next.replace(
          'import com.facebook.react.ReactPackage',
          'import com.facebook.react.ReactPackage\nimport com.netscope.scanner.bridge.NetScopePackage',
        );
      }
      if (next.includes('// Packages that cannot be autolinked yet can be added manually here, for example:')) {
        next = next.replace(
          '          // Packages that cannot be autolinked yet can be added manually here, for example:\n          // add(MyReactNativePackage())',
          '          add(NetScopePackage())',
        );
      } else if (next.includes('packages.add(ReactNativeHostWrapper(this))')) {
        next = next
          .replace(
            'import expo.modules.ReactNativeHostWrapper',
            'import com.netscope.scanner.bridge.NetScopePackage\nimport expo.modules.ReactNativeHostWrapper',
          )
          .replace(
            'packages.add(ReactNativeHostWrapper(this))',
            'packages.add(NetScopePackage())\n        packages.add(ReactNativeHostWrapper(this))',
          );
      }
      config.modResults.contents = next;
    }
    return config;
  });

module.exports = createRunOncePlugin(
  (config) => {
    config = withNativeFiles(config);
    config = withNetScopeManifest(config);
    config = withNetScopeGradle(config);
    config = withNetScopePackage(config);
    return config;
  },
  'with-netscope-native',
  '1.0.0',
);
