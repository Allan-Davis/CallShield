import React, {useState, useEffect} from 'react';
import {View,Text,Switch,StyleSheet,ScrollView,TouchableOpacity,Alert,NativeModules,Linking,PermissionsAndroid,Platform} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import useStore from '../store/useStore';
const {CallShieldModule} = NativeModules;

export default function SettingsScreen() {
  const {settings,updateSettings} = useStore();
  const [perms, setPerms] = useState({});

  const checkPerms = async () => {
    if (CallShieldModule) {
      try {const r = await CallShieldModule.checkPermissions(); setPerms(r||{}); return;} catch(e){}
    }
    try {
      const keys = {
        READ_PHONE_STATE: PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        READ_CONTACTS: PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        RECEIVE_SMS: PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        READ_SMS: PermissionsAndroid.PERMISSIONS.READ_SMS,
        READ_CALL_LOG: PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
      };
      const r = {};
      for (const [k,v] of Object.entries(keys)) {r[k] = await PermissionsAndroid.check(v);}
      setPerms(r);
    } catch(e){}
  };

  useEffect(()=>{checkPerms();},[]);

  const requestAll = async () => {
    try {
      const permsArr = [
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
      ];
      if (Platform.Version >= 26) {permsArr.push(PermissionsAndroid.PERMISSIONS.ANSWER_PHONE_CALLS);}
      if (Platform.Version >= 33) {permsArr.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);}
      const results = await PermissionsAndroid.requestMultiple(permsArr);
      await checkPerms();
      const allOk = Object.values(results).every(v => v === PermissionsAndroid.RESULTS.GRANTED);
      Alert.alert(allOk?'✅ All Granted':'Some Denied', allOk?'CallShield is fully set up!':'Some permissions were denied. Tap "Open Settings" to grant them manually.');
    } catch(e) {Alert.alert('Error','Could not request permissions.');}
  };

  const startService = async () => {
    if (!CallShieldModule) {Alert.alert('Not Available','Native module not loaded.'); return;}
    try {await CallShieldModule.startForegroundService(); Alert.alert('✅ Running','Background service started.');}
    catch(e) {Alert.alert('Error', String(e.message));}
  };

  const setCallScreening = async () => {
    if (!CallShieldModule) {return;}
    try {await CallShieldModule.requestCallScreeningRole();}
    catch(e){}
    Alert.alert('Call Screening','Select CallShield as the call screening app for best call blocking.');
  };

  const allOk = perms.READ_PHONE_STATE && perms.RECEIVE_SMS && perms.READ_CONTACTS;

  const SR = ({label,desc,value,onChange}) => (
    <View style={s.row}>
      <View style={s.rowL}><Text style={s.rowLabel}>{label}</Text>{desc?<Text style={s.rowDesc}>{desc}</Text>:null}</View>
      <Switch value={!!value} onValueChange={onChange} trackColor={{true:'#2d7dd2',false:'#222'}} thumbColor="#fff" />
    </View>
  );

  const PR = ({label,granted}) => (
    <View style={s.permRow}>
      <Text style={s.rowLabel}>{label}</Text>
      <View style={[s.permBadge, granted?s.pgOn:s.pgOff]}><Text style={[s.permTxt, granted?s.ptOn:s.ptOff]}>{granted?'✓ Granted':'✗ Denied'}</Text></View>
    </View>
  );

  return (
    <SafeAreaView style={s.wrap}>
      <Text style={s.title}>Settings</Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:16,paddingBottom:40}}>
        <View style={[s.banner, allOk?s.bannerOk:s.bannerWarn]}>
          <Text style={[s.bannerTxt, allOk?s.bannerTxtOk:s.bannerTxtWarn]}>
            {allOk?'✅ CallShield fully configured':'⚠️ Missing permissions — tap Grant below'}
          </Text>
        </View>

        <Text style={s.section}>BLOCKING</Text>
        <View style={s.card}>
          <SR label="Block Calls" desc="Reject calls from non-whitelisted numbers" value={settings.blockCalls} onChange={v=>updateSettings({blockCalls:v})} />
          <View style={s.div} />
          <SR label="Block SMS" desc="Drop SMS from non-whitelisted numbers" value={settings.blockSMS} onChange={v=>updateSettings({blockSMS:v})} />
          <View style={s.div} />
          <SR label="Notify When Blocked" desc="Show notification when call/SMS blocked" value={settings.notifyBlocked} onChange={v=>updateSettings({notifyBlocked:v})} />
        </View>

        <Text style={s.section}>FINANCIAL SERVICES</Text>
        <View style={s.card}>
          <Text style={s.fintechNote}>
            🟢 M-Pesa (234, 200, 22214, 20880) — Always Allowed{'\n'}
            🟢 Airtel Money (100, 135) — Always Allowed{'\n\n'}
            These shortcodes are hardcoded and can NEVER be blocked.
          </Text>
        </View>

        <Text style={s.section}>PERMISSIONS</Text>
        <View style={s.card}>
          <PR label="Read Phone State" granted={!!perms.READ_PHONE_STATE} />
          <View style={s.div} />
          <PR label="Answer Calls" granted={!!perms.ANSWER_PHONE_CALLS} />
          <View style={s.div} />
          <PR label="Read Call Log" granted={!!perms.READ_CALL_LOG} />
          <View style={s.div} />
          <PR label="Receive SMS" granted={!!perms.RECEIVE_SMS} />
          <View style={s.div} />
          <PR label="Read SMS" granted={!!perms.READ_SMS} />
          <View style={s.div} />
          <PR label="Read Contacts" granted={!!perms.READ_CONTACTS} />
        </View>

        <Text style={s.section}>SETUP</Text>
        <View style={s.card}>
          {[
            ['🔑  Grant All Permissions', requestAll],
            ['🔄  Refresh Permission Status', checkPerms],
            ['📞  Set as Call Screening App', setCallScreening],
            ['🛡️  Start Background Service', startService],
            ['⚙️  Open Android Settings', ()=>Linking.openSettings()],
          ].map(([label, fn], i) => (
            <React.Fragment key={label}>
              {i>0&&<View style={s.div} />}
              <TouchableOpacity style={s.actionBtn} onPress={fn}>
                <Text style={s.actionTxt}>{label}</Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
          <Text style={s.note}>For full protection: grant all permissions, set CallShield as Call Screening App, and start the background service.</Text>
        </View>

        <Text style={s.section}>ABOUT</Text>
        <View style={s.card}>
          <Text style={s.about}>CallShield v1.0.0</Text>
          <Text style={s.aboutDesc}>100% offline. All rules run on-device. No internet required. No data collected. M-Pesa and Airtel Money are never blocked.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap:{flex:1,backgroundColor:'#0a0a12'},
  title:{fontSize:26,fontWeight:'800',color:'#e8f4ff',marginTop:16,marginHorizontal:16,marginBottom:12},
  banner:{borderRadius:12,padding:12,marginBottom:4,marginHorizontal:0},
  bannerOk:{backgroundColor:'#0d2a12',borderWidth:1,borderColor:'#1a4020'},
  bannerWarn:{backgroundColor:'#2a1a00',borderWidth:1,borderColor:'#4a3000'},
  bannerTxt:{fontWeight:'600',fontSize:13,textAlign:'center'},
  bannerTxtOk:{color:'#4caf50'},
  bannerTxtWarn:{color:'#f39c12'},
  section:{fontSize:11,fontWeight:'700',color:'#3a5570',letterSpacing:1.2,marginBottom:8,marginTop:20},
  card:{backgroundColor:'#111825',borderRadius:16,padding:16,marginBottom:4},
  row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:6},
  permRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:8},
  rowL:{flex:1,paddingRight:16},
  rowLabel:{color:'#e0f0ff',fontWeight:'600',fontSize:15},
  rowDesc:{color:'#3a5570',fontSize:12,marginTop:2},
  div:{height:1,backgroundColor:'#1a2a3a',marginVertical:4},
  permBadge:{paddingHorizontal:8,paddingVertical:3,borderRadius:6},
  pgOn:{backgroundColor:'#0d2a12'},
  pgOff:{backgroundColor:'#2a0d0d'},
  permTxt:{fontSize:11,fontWeight:'700'},
  ptOn:{color:'#2ecc71'},
  ptOff:{color:'#e74c3c'},
  fintechNote:{color:'#4a8a4a',fontSize:13,lineHeight:22},
  actionBtn:{paddingVertical:13},
  actionTxt:{color:'#5db8ff',fontWeight:'700',fontSize:15},
  note:{color:'#3a5570',fontSize:12,marginTop:14,lineHeight:18},
  about:{color:'#e0f0ff',fontWeight:'800',fontSize:16},
  aboutDesc:{color:'#4a6080',fontSize:13,marginTop:8,lineHeight:20},
});
