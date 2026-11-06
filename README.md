# NetScope

Máy quét mạng Wi-Fi / LAN cho Android. React Native (TypeScript) cho giao
diện, Kotlin cho toàn bộ xử lý mạng ở tầng native.

Chỉ dùng cho mạng của chính người dùng hoặc mạng được phép kiểm tra. Lần
chạy đầu tiên và màn hình Cài đặt đều hiển thị cảnh báo này.

## Không làm gì

- Không dữ liệu giả / mock ở bất kỳ đâu. Thông tin nào Android không cho
  đọc thì hiển thị "Không khả dụng" kèm lý do ngắn, không bịa số liệu.
- Không tính năng tấn công: không deauth, không bẻ mật khẩu, không khai
  thác lỗ hổng, không ARP spoofing, không chặn gói của thiết bị khác.

## Stack

- Expo SDK 58, React Native 0.88.1, React 19.3.0, TypeScript strict.
- React Navigation 7 (bottom tabs + native stack), Zustand, FlashList,
  react-native-svg cho biểu đồ, react-native-mmkv cho lưu lịch sử.
- Reanimated 4 + expo-blur cho giao diện Liquid Glass tự viết trong app.
- Kotlin: coroutines + Flow, tách lớp data / domain / bridge.
  minSdk 26. Build qua EAS, profile preview / production đều ra APK.
- Cầu nối: NativeModule + DeviceEventEmitter trước. TurboModule qua
  codegen là bước sau, chưa làm ở phần này, không nhận đã xong.

## Vì sao phải prebuild

Expo Go không chạy được code Kotlin tự viết. Luồng build thật là:

```
npm install
npx expo prebuild --platform android
EAS_SKIP_AUTO_FINGERPRINT=1 eas build -p android --profile preview
```

`expo prebuild` tạo lại thư mục `android/` từ template Expo nên sẽ xóa
code Kotlin tự viết. Bản gốc Kotlin nằm ở
`plugins/netscope-native/android/`, plugin `with-netscope-native` copy
lại vào cây `android/` đã tạo ra ở mỗi lần prebuild, thêm quyền vào
AndroidManifest và chèn `NetScopePackage` vào MainApplication đã tạo ra.
Không ghi đè MainApplication / MainActivity / AndroidManifest.

## Kiến trúc

```
JS / TS                        Kotlin (Dispatchers.IO)
-------------------------      -------------------------
screens (5 tab)                bridge/NetScopeModule
  -> store (Zustand)             -> scanner/LanScanner
  -> services/bridge             -> discovery/MdnsDiscovery,
     NetScopeBridge.ts              SsdpDiscovery, NetBiosResolver
  -> utils/subnet, banner,         ReverseDnsResolver
     diff, export               -> wifi/WifiInfoProvider,
                                    WifiScanner
                               -> portscan/PortScanner
                               -> tools/PingTool, TracerouteTool,
                                    DnsTool, WakeOnLanTool
                               -> storage/ScanStore (MMKV qua Kotlin),
                                    OuiLookup (assets/oui.json)
                               -> worker/StrangerCheckWorker
                                    (WorkManager, tùy chọn bật/tắt)
```

Luồng quét: JS gọi `startLanScan(subnet)` -> Kotlin chạy coroutine,
semaphore 64, timeout cấu hình được, đẩy tiến độ bằng event
`NetScopeScanProgress`, kết quả từng thiết bị bằng event
`NetScopeDeviceFound`, xong bằng `NetScopeScanFinished`. Hủy bằng
`cancelScan()`, hủy Job và đóng socket.

## Giao diện Liquid Glass

Tự viết trong app, không dùng thư viện ReactNative-UI.

- `src/components/GlassView.tsx`: 1 lớp `BlurView` duy nhất của
  expo-blur, tint dark, intensity 55, viền trắng mờ, bo cong, bóng nhẹ.
  Không lồng 2 lớp blur trong nhau.
- `src/components/GlassCard.tsx`: thẻ kính dùng chung, padding 16, bo 20.
- `src/components/GlassView.tsx` có `GlassButton`: bấm co lại kiểu
  spring Reanimated (damping 14, stiffness 400, scale 0.93).
- `src/theme/tokens.ts`: dark mặc định, nền #0B1220, chữ #F2F2F7,
  accent #5B9DFF, bo card 20 / nút 16 / sheet 24. Không dùng gradient.

## Danh sách file

```
app.json, eas.json, package.json, tsconfig.json
babel.config.js, metro.config.js, index.js, App.tsx
plugins/with-netscope-native.js
plugins/netscope-native/android/app/src/main/java/com/netscope/scanner/
  bridge/NetScopeModule.kt, NetScopePackage.kt
  scanner/LanScanner.kt, SubnetCalculator.kt
  discovery/MdnsDiscovery.kt, SsdpDiscovery.kt, NetBiosResolver.kt,
    ReverseDnsResolver.kt
  wifi/WifiInfoProvider.kt, WifiScanner.kt
  portscan/PortScanner.kt, BannerGrabber.kt
  tools/PingTool.kt, TracerouteTool.kt, DnsTool.kt, WakeOnLanTool.kt
  storage/ScanStore.kt, OuiLookup.kt
  worker/StrangerCheckWorker.kt
  util/NetworkUtils.kt
  assets/oui.json
src/app/App.tsx
src/navigation/RootNavigator.tsx, TabNavigator.tsx
src/screens/OverviewScreen.tsx, DevicesScreen.tsx, WifiScreen.tsx,
  ToolsScreen.tsx, HistoryScreen.tsx, SettingsScreen.tsx,
  DeviceDetailScreen.tsx, PermissionsScreen.tsx
src/components/GlassView.tsx, GlassCard.tsx, ScanProgressBar.tsx,
  DeviceRow.tsx, ChannelGraph.tsx, Skeleton.tsx, EmptyState.tsx
src/store/useScanStore.ts, useSettingsStore.ts
src/services/bridge/NetScopeBridge.ts
src/hooks/useNetworkInfo.ts, useScan.ts, usePermissions.ts
src/utils/subnet.ts, banner.ts, diff.ts, export.ts, format.ts
src/i18n/vi.ts, en.ts, index.ts
src/theme/tokens.ts
__tests__/subnet.test.ts, banner.test.ts, diff.test.ts, store.test.ts
android/app/src/test/java/com/netscope/scanner/ (unit test Kotlin)
```

## Giới hạn đã biết của Android

- Từ Android 10 trở lên không đọc được MAC qua `/proc/net/arp`.
  Hiển thị "MAC không khả dụng", nhận diện thiết bị bằng mDNS / SSDP
  thay thế, tra hãng bằng bảng OUI offline chỉ khi có MAC.
- Đọc SSID và kết quả scan Wi-Fi cần quyền vị trí và dịch vụ vị trí
  đang bật. Android 13 trở lên dùng `NEARBY_WIFI_DEVICES`.
- `WifiManager.startScan` bị giới hạn: app foreground tối đa 4 lần
  quét trong 2 phút, app background 1 lần trong 30 phút. Khi bị giới
  hạn, app hiển thị thông báo rõ ràng và dùng kết quả scan gần nhất.
- ICMP ping có thể bị chặn tùy thiết bị / mạng. Quét LAN dùng
  `InetAddress.isReachable` rồi fallback TCP 80 / 443 / 135 / 445.
- Traceroute bằng TTL thủ công không phải lúc nào cũng nhận được
  ICMP Time Exceeded, tùy router và nhà mạng.

## Build

```sh
npm install
npm run typecheck
npx expo prebuild --platform android
EAS_SKIP_AUTO_FINGERPRINT=1 eas build -p android --profile preview
eas build:list
```

Build EAS chạy trên cloud, bấm Ctrl+C thoát terminal vẫn chạy tiếp.
Tài khoản EAS dùng `imnotdeveloper0102` (đã đăng nhập ở máy Hoàng Dươngg);
lượt Free của `gnoudisme` đã hết tới 01/12/2026.

## Đã kiểm chứng (2026-11-07, local)

- `npm install`: 854 package, exit 0. `npm ci --include=dev --dry-run`: pass.
  Lock sinh không dùng `--legacy-peer-deps`. `react-native-screens` đã sửa
  từ `5.0.0-beta.1` sang `4.30.1` vì bản beta không thỏa peer `>= 4.0.0`
  của `@react-navigation/bottom-tabs` 7.21.0 (ERESOLVE).
- `npx tsc --noEmit`: pass, exit 0. Sửa trong lúc kiểm chứng: tsconfig
  extends `@react-native/typescript-config` (bản có `/tsconfig.json`
  tsc không tìm thấy), bỏ `backgroundColor` ở StatusBar, bỏ `as const`
  ở i18n vi, bỏ `estimatedItemSize` (FlashList 2.x không còn prop này),
  `expo-file-system` v19 dùng import `expo-file-system/legacy` cho
  `cacheDirectory` / `writeAsStringAsync`.
- `npx jest`: 4 suite / 10 test pass. RN 0.88.1 không còn file
  `jest-preset.js` nên jest.config.js tự inline babel-jest (theo cách
  đã làm ở Network Signal).
- `npx expo config`: pass, SDK 58.0.0, plugin `with-netscope-native` đã load.
- `npx expo prebuild --platform android`: pass. Kiểm chứng trong cây
  `android/` đã tạo ra: đủ 20 file Kotlin, `oui.json` và 3 file test
  được copy; Manifest có đủ 8 quyền NetScope; `MainApplication.kt`
  có `import NetScopePackage` và `add(NetScopePackage())`; `minSdkVersion 26`.
  Lần prebuild đầu lộ ra plugin cũ chèn sai mẫu MainApplication của
  RN 0.88 (mẫu cũ dùng `ReactNativeHostWrapper`), đã sửa plugin sang
  mẫu `PackageList(...).packages.apply { add(...) }` rồi prebuild lại.

## Chưa kiểm chứng

- Chưa build EAS, chưa có APK, chưa chạy máy thật. Kotlin chưa biên
  dịch bằng Gradle ở đây (không có Android SDK), test Kotlin chưa chạy.
- Chưa tạo repo GitHub, chưa push đi đâu.
