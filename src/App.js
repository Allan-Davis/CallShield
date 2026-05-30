import React, {useEffect, useRef, useState} from 'react';
import {
  NativeModules,
  NativeEventEmitter,
  StatusBar,
  AppState,
  PermissionsAndroid,
  Platform,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import HomeScreen from './screens/HomeScreen';
import WhitelistScreen from './screens/WhitelistScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import LogsScreen from './screens/LogsScreen';
import SettingsScreen from './screens/SettingsScreen';
import useStore from './store/useStore';
import {shouldBlock, startScheduleWatcher, isScheduleActive} from './services/ShieldEngine';

const Tab = createBottomTabNavigator();
const {CallShieldModule} = NativeModules;

// ── Permission Screen ────────────────────────────────────────────────────────
function PermissionScreen({onDone}) {
  const [requesting, setRequesting] = useState(false);
  const request = async () => {
    setRequesting(true);
    try {
      const perms = [
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
      ];
      if (Platform.Version >= 26) {perms.push(PermissionsAndroid.PERMISSIONS.ANSWER_PHONE_CALLS);}
      if (Platform.Version >= 33) {perms.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);}
      await PermissionsAndroid.requestMultiple(perms);
    } catch (e) {}
    setRequesting(false);
    onDone();
  };
  return (
    <View style={ps.wrap}>
      <Text style={ps.icon}>🛡️</Text>
      <Text style={ps.title}>Welcome to CallShield</Text>
      <Text style={ps.body}>
        CallShield needs permissions to block unwanted calls and SMS.{'\n\n'}
        Your data never leaves your device.
      </Text>
      {[
        ['📞', 'Phone', 'Detect and manage incoming calls'],
        ['👤', 'Contacts', 'Pick contacts to whitelist'],
        ['💬', 'SMS', 'Block unwanted text messages'],
        ['🔔', 'Notifications', 'Alert you when something is blocked'],
      ].map(([icon, title, desc]) => (
        <View key={title} style={ps.row}>
          <Text style={ps.rowIcon}>{icon}</Text>
          <View style={ps.rowText}>
            <Text style={ps.rowTitle}>{title}</Text>
            <Text style={ps.rowDesc}>{desc}</Text>
          </View>
        </View>
      ))}
      <TouchableOpacity style={ps.btn} onPress={request} disabled={requesting}>
        <Text style={ps.btnTxt}>{requesting ? 'Requesting...' : 'Grant Permissions & Continue'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={ps.skip} onPress={onDone}>
        <Text style={ps.skipTxt}>Skip (limited functionality)</Text>
      </TouchableOpacity>
    </View>
  );
}

const ps = StyleSheet.create({
  wrap: {flex:1, backgroundColor:'#0a0a12', alignItems:'center', justifyContent:'center', padding:28},
  icon: {fontSize:64, marginBottom:16},
  title: {fontSize:26, fontWeight:'800', color:'#e8f4ff', textAlign:'center', marginBottom:12},
  body: {fontSize:14, color:'#5a7fa8', textAlign:'center', lineHeight:22, marginBottom:20},
  row: {flexDirection:'row', alignItems:'center', backgroundColor:'#111825', borderRadius:12, padding:14, marginBottom:8, width:'100%'},
  rowIcon: {fontSize:22, marginRight:12},
  rowText: {flex:1},
  rowTitle: {color:'#e0f0ff', fontWeight:'700', fontSize:14},
  rowDesc: {color:'#4a6080', fontSize:12, marginTop:2},
  btn: {backgroundColor:'#1e3a5f', borderRadius:14, paddingVertical:16, paddingHorizontal:32, width:'100%', alignItems:'center', marginTop:20, marginBottom:10},
  btnTxt: {color:'#5db8ff', fontWeight:'800', fontSize:16},
  skip: {paddingVertical:10},
  skipTxt: {color:'#3a5570', fontSize:13},
});

// ── Tab Bar ──────────────────────────────────────────────────────────────────
const TABS = [
  {name:'Home', icon:'🛡️', label:'Shield'},
  {name:'Whitelist', icon:'✅', label:'Allow'},
  {name:'Schedule', icon:'🕐', label:'Schedule'},
  {name:'Logs', icon:'📋', label:'Logs'},
  {name:'Settings', icon:'⚙️', label:'Settings'},
];

function MyTabBar({state, navigation}) {
  const {shieldActive} = useStore();
  return (
    <View style={tb.bar}>
      {TABS.map((tab, i) => {
        const focused = state.index === i;
        return (
          <TouchableOpacity
            key={tab.name}
            style={tb.tab}
            onPress={() => navigation.navigate(tab.name)}
            activeOpacity={0.7}>
            <Text style={[tb.icon, focused && tb.iconOn,
              tab.name === 'Home' && shieldActive && tb.iconActive]}>
              {tab.icon}
            </Text>
            <Text style={[tb.label, focused && tb.labelOn]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tb = StyleSheet.create({
  bar: {flexDirection:'row', backgroundColor:'#0d1421', borderTopWidth:1, borderTopColor:'#1a2a3a', paddingVertical:8, paddingBottom:12},
  tab: {flex:1, alignItems:'center'},
  icon: {fontSize:22, opacity:0.4},
  iconOn: {opacity:1},
  iconActive: {opacity:1},
  label: {fontSize:10, color:'#2a4060', marginTop:3, fontWeight:'600'},
  labelOn: {color:'#5db8ff'},
});

// ── Sync to native ────────────────────────────────────────────────────────────
function syncToNative(store) {
  if (!CallShieldModule) {return;}
  try {
    const {shieldActive, shieldMode, schedules = [], whitelist = [], settings = {}} = store;
    const active = shieldMode === 'manual'
      ? shieldActive
      : (schedules || []).some(s => s.active && isScheduleActive(s));
    CallShieldModule.setShieldState(
      active,
      settings.blockCalls !== false,
      settings.blockSMS !== false,
      whitelist,
    ).catch(() => {});
  } catch (e) {}
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const store = useStore();
  const storeRef = useRef(store);
  storeRef.current = store;
  const [permsDone, setPermsDone] = useState(false);

  // Check if permissions already granted on previous launch
  useEffect(() => {
    PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE)
      .then(granted => setPermsDone(granted))
      .catch(() => setPermsDone(true));
  }, []);

  // Sync state to native whenever it changes
  useEffect(() => {
    if (permsDone) {syncToNative(store);}
  }, [store.shieldActive, store.shieldMode, store.whitelist, store.settings, store.schedules, permsDone]);

  // Bootstrap once permissions are done
  useEffect(() => {
    if (!permsDone) {return;}
    startScheduleWatcher(useStore);
    if (CallShieldModule) {
      CallShieldModule.startForegroundService().catch(() => {});
    }
    let callSub = null;
    let smsSub = null;
    if (CallShieldModule) {
      try {
        const emitter = new NativeEventEmitter(CallShieldModule);
        callSub = emitter.addListener('onIncomingCall', ({phone}) => {
          const s = storeRef.current;
          const {blocked} = shouldBlock(phone, 'call', s);
          if (blocked) {CallShieldModule.endCall().catch(() => {});}
          s.addLog({type:'call', phone, action: blocked ? 'blocked' : 'allowed'});
        });
        smsSub = emitter.addListener('onIncomingSMS', ({phone}) => {
          const s = storeRef.current;
          const {blocked} = shouldBlock(phone, 'sms', s);
          s.addLog({type:'sms', phone, action: blocked ? 'blocked' : 'allowed'});
        });
      } catch (e) {}
    }
    const appSub = AppState.addEventListener('change', st => {
      if (st === 'active') {syncToNative(storeRef.current);}
    });
    return () => {
      callSub && callSub.remove();
      smsSub && smsSub.remove();
      appSub.remove();
    };
  }, [permsDone]);

  if (!permsDone) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a12" />
        <PermissionScreen onDone={() => setPermsDone(true)} />
      </SafeAreaProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{flex:1}}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a12" />
        <NavigationContainer>
          <Tab.Navigator tabBar={props => <MyTabBar {...props} />} screenOptions={{headerShown:false}}>
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Whitelist" component={WhitelistScreen} />
            <Tab.Screen name="Schedule" component={ScheduleScreen} />
            <Tab.Screen name="Logs" component={LogsScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
