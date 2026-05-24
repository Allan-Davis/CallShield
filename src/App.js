/**
 * CallShield — App.js
 * Root component: sets up navigation, native event listeners, and schedule watcher.
 */

import React, { useEffect, useRef } from 'react';
import {
  NativeModules,
  NativeEventEmitter,
  NativeAppEventEmitter,
  Alert,
  Platform,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import HomeScreen from './screens/HomeScreen';
import WhitelistScreen from './screens/WhitelistScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import LogsScreen from './screens/LogsScreen';
import SettingsScreen from './screens/SettingsScreen';
import TabBar from './components/TabBar';

import useStore from './store/useStore';
import { shouldBlock, startScheduleWatcher } from './services/ShieldEngine';

const Tab = createBottomTabNavigator();
const { CallShieldModule } = NativeModules;

export default function App() {
  const store = useStore();
  const storeRef = useRef(store);
  storeRef.current = store;

  useEffect(() => {
    // ── Start schedule background watcher ──────────────────────────
    startScheduleWatcher(useStore);

    // ── Listen for native call events ─────────────────────────────
    let callEmitter = null;
    if (CallShieldModule) {
      callEmitter = new NativeEventEmitter(CallShieldModule);

      callEmitter.addListener('onIncomingCall', async (event) => {
        const { phone } = event;
        const s = storeRef.current;
        const { blocked, reason } = shouldBlock(phone, 'call', s);

        if (blocked) {
          // End the call natively
          try {
            await CallShieldModule.endCall();
          } catch (e) {
            console.warn('Could not end call automatically:', e);
          }

          s.addLog({
            type: 'call',
            phone,
            name: s.whitelist.find(c => c.phone.replace(/\s/g,'') === phone.replace(/\s/g,''))?.name || null,
            action: 'blocked',
          });

          if (s.settings.notifyBlocked) {
            Toast.show({
              type: 'info',
              text1: '🛡️ Call Blocked',
              text2: phone,
              visibilityTime: 3000,
            });
          }
        } else {
          s.addLog({
            type: 'call',
            phone,
            name: s.whitelist.find(c => c.phone.replace(/\s/g,'') === phone.replace(/\s/g,''))?.name || null,
            action: 'allowed',
          });
        }
      });

      callEmitter.addListener('onIncomingSMS', async (event) => {
        const { phone, body } = event;
        const s = storeRef.current;
        const { blocked } = shouldBlock(phone, 'sms', s);

        s.addLog({
          type: 'sms',
          phone,
          name: s.whitelist.find(c => c.phone.replace(/\s/g,'') === phone.replace(/\s/g,''))?.name || null,
          action: blocked ? 'blocked' : 'allowed',
        });

        if (blocked && s.settings.notifyBlocked) {
          Toast.show({
            type: 'info',
            text1: '🛡️ SMS Blocked',
            text2: phone,
            visibilityTime: 2000,
          });
        }
      });
    }

    return () => {
      callEmitter?.removeAllListeners('onIncomingCall');
      callEmitter?.removeAllListeners('onIncomingSMS');
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Tab.Navigator
            tabBar={props => <TabBar {...props} />}
            screenOptions={{ headerShown: false }}>
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Whitelist" component={WhitelistScreen} />
            <Tab.Screen name="Schedule" component={ScheduleScreen} />
            <Tab.Screen name="Logs" component={LogsScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
          </Tab.Navigator>
        </NavigationContainer>
        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
