import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { DeviceDetailScreen } from '../screens/DeviceDetailScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { PermissionsScreen } from '../screens/PermissionsScreen';
import type { DeviceInfo } from '../services/bridge/NetScopeBridge';

export type RootParamList = {
  Tabs: undefined;
  DeviceDetail: { device: DeviceInfo };
  Settings: undefined;
  Permissions: undefined;
};

const Stack = createNativeStackNavigator<RootParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="DeviceDetail" component={DeviceDetailScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Permissions" component={PermissionsScreen} />
    </Stack.Navigator>
  );
}
