import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { OverviewScreen } from '../screens/OverviewScreen';
import { DevicesScreen } from '../screens/DevicesScreen';
import { WifiScreen } from '../screens/WifiScreen';
import { ToolsScreen } from '../screens/ToolsScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { colors } from '../theme/tokens';
import { getStrings } from '../i18n';
import { useSettingsStore } from '../store/useSettingsStore';

export type TabParamList = {
  Overview: undefined;
  Devices: undefined;
  Wifi: undefined;
  Tools: undefined;
  History: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  const language = useSettingsStore((s) => s.language);
  const t = getStrings(language);
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#111A2E', borderTopColor: colors.divider },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}>
      <Tab.Screen name="Overview" component={OverviewScreen} options={{ tabBarLabel: t.tabs.overview, tabBarIcon: () => <Text>◉</Text> }} />
      <Tab.Screen name="Devices" component={DevicesScreen} options={{ tabBarLabel: t.tabs.devices, tabBarIcon: () => <Text>▦</Text> }} />
      <Tab.Screen name="Wifi" component={WifiScreen} options={{ tabBarLabel: t.tabs.wifi, tabBarIcon: () => <Text>⌁</Text> }} />
      <Tab.Screen name="Tools" component={ToolsScreen} options={{ tabBarLabel: t.tabs.tools, tabBarIcon: () => <Text>⚙</Text> }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: t.tabs.history, tabBarIcon: () => <Text>◷</Text> }} />
    </Tab.Navigator>
  );
}
