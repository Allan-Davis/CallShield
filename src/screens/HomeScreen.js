import React, {useEffect, useRef} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView, NativeModules} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import useStore from '../store/useStore';
import {isScheduleActive, formatSchedule} from '../services/ShieldEngine';

const {CallShieldModule} = NativeModules;

export default function HomeScreen() {
  const {shieldActive, shieldMode, toggleShield, setShieldMode, schedules, whitelist, logs, settings} = useStore();
  const pulse = useRef(new Animated.Value(1)).current;
  const anim = useRef(null);

  useEffect(() => {
    if (shieldActive) {
      anim.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {toValue:1.08, duration:900, useNativeDriver:true}),
          Animated.timing(pulse, {toValue:1, duration:900, useNativeDriver:true}),
        ])
      );
      anim.current.start();
    } else {
      if (anim.current) {anim.current.stop();}
      pulse.setValue(1);
    }
    return () => {if (anim.current) {anim.current.stop();}};
  }, [shieldActive]);

  const handleToggle = () => {
    if (shieldMode !== 'manual') {return;}
    const next = !shieldActive;
    toggleShield();
    if (CallShieldModule) {
      CallShieldModule.setShieldState(next, settings.blockCalls !== false, settings.blockSMS !== false, whitelist || []).catch(() => {});
      if (next) {CallShieldModule.startForegroundService().catch(() => {});}
    }
  };

  const blocked24h = (logs || []).filter(l => l.action === 'blocked' && Date.now() - l.timestamp < 86400000).length;
  const activeScheds = (schedules || []).filter(isScheduleActive);

  return (
    <LinearGradient colors={shieldActive ? ['#030b18','#0a1f35','#030b18'] : ['#0a0a12','#111825','#0a0a12']} style={s.wrap}>
      <SafeAreaView style={s.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          <Text style={s.title}>CallShield</Text>
          <Text style={s.sub}>Block unwanted calls & SMS</Text>

          <View style={s.modeRow}>
            <TouchableOpacity style={[s.modeBtn, shieldMode==='manual' && s.modeBtnOn]} onPress={() => setShieldMode('manual')}>
              <Text style={[s.modeTxt, shieldMode==='manual' && s.modeTxtOn]}>Manual</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.modeBtn, shieldMode==='scheduled' && s.modeBtnOn]} onPress={() => setShieldMode('scheduled')}>
              <Text style={[s.modeTxt, shieldMode==='scheduled' && s.modeTxtOn]}>Scheduled</Text>
            </TouchableOpacity>
          </View>

          <View style={s.shieldWrap}>
            <Animated.View style={{transform:[{scale:pulse}]}}>
              <TouchableOpacity
                style={[s.shield, shieldActive && s.shieldOn]}
                onPress={handleToggle}
                activeOpacity={shieldMode === 'manual' ? 0.75 : 1}>
                <Text style={s.shieldEmoji}>🛡️</Text>
                <Text style={s.shieldStatus}>{shieldActive ? 'ACTIVE' : 'OFF'}</Text>
                <Text style={s.shieldHint}>
                  {shieldMode === 'manual'
                    ? (shieldActive ? 'Tap to deactivate' : 'Tap to activate')
                    : activeScheds.length > 0 ? `Auto · ${activeScheds.length} running` : 'Auto · no schedule now'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <View style={s.statsRow}>
            <View style={s.stat}><Text style={[s.statN, {color:'#5db8ff'}]}>{(whitelist||[]).length}</Text><Text style={s.statL}>Whitelisted</Text></View>
            <View style={s.stat}><Text style={[s.statN, {color:'#e74c3c'}]}>{blocked24h}</Text><Text style={s.statL}>Blocked Today</Text></View>
            <View style={s.stat}><Text style={[s.statN, {color:'#5db8ff'}]}>{(schedules||[]).filter(x=>x.active).length}</Text><Text style={s.statL}>Schedules</Text></View>
          </View>

          <View style={s.card}>
            <View style={s.cardRow}>
              <Text style={s.cardLabel}>📞 Call Blocking</Text>
              <View style={[s.badge, settings.blockCalls !== false ? s.badgeOn : s.badgeOff]}>
                <Text style={s.badgeTxt}>{settings.blockCalls !== false ? 'ON' : 'OFF'}</Text>
              </View>
            </View>
            <View style={s.divider} />
            <View style={s.cardRow}>
              <Text style={s.cardLabel}>💬 SMS Blocking</Text>
              <View style={[s.badge, settings.blockSMS !== false ? s.badgeOn : s.badgeOff]}>
                <Text style={s.badgeTxt}>{settings.blockSMS !== false ? 'ON' : 'OFF'}</Text>
              </View>
            </View>
          </View>

          {shieldMode === 'scheduled' && activeScheds.length > 0 && (
            <View style={s.schedCard}>
              <Text style={s.schedTitle}>🟢 Running Now</Text>
              {activeScheds.map(sc => <Text key={sc.id} style={s.schedItem}>{sc.label} · {formatSchedule(sc)}</Text>)}
            </View>
          )}

          <View style={s.fintechCard}>
            <Text style={s.fintechTxt}>✅ M-Pesa & Airtel Money are always allowed through</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  wrap:{flex:1}, safe:{flex:1},
  scroll:{paddingHorizontal:20, paddingBottom:24},
  title:{fontSize:28, fontWeight:'800', color:'#e8f4ff', marginTop:16},
  sub:{fontSize:13, color:'#4a6080', marginBottom:16},
  modeRow:{flexDirection:'row', backgroundColor:'#111825', borderRadius:12, padding:4, marginBottom:20},
  modeBtn:{flex:1, paddingVertical:10, borderRadius:9, alignItems:'center'},
  modeBtnOn:{backgroundColor:'#1e3a5f'},
  modeTxt:{color:'#4a6080', fontWeight:'600'},
  modeTxtOn:{color:'#5db8ff'},
  shieldWrap:{alignItems:'center', marginBottom:20},
  shield:{width:172, height:172, borderRadius:86, backgroundColor:'#1a1a24', borderWidth:2, borderColor:'#252535', alignItems:'center', justifyContent:'center'},
  shieldOn:{backgroundColor:'#0c1e38', borderColor:'#2d7dd2', borderWidth:3},
  shieldEmoji:{fontSize:46, marginBottom:4},
  shieldStatus:{fontSize:20, fontWeight:'800', color:'#e0f0ff', letterSpacing:3},
  shieldHint:{fontSize:11, color:'#4a6080', marginTop:4, textAlign:'center', paddingHorizontal:16},
  statsRow:{flexDirection:'row', marginBottom:12},
  stat:{flex:1, backgroundColor:'#111825', borderRadius:14, padding:12, alignItems:'center', marginHorizontal:3},
  statN:{fontSize:24, fontWeight:'800'},
  statL:{fontSize:11, color:'#3a5a78', marginTop:2},
  card:{backgroundColor:'#111825', borderRadius:14, padding:14, marginBottom:10},
  cardRow:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:5},
  cardLabel:{color:'#8ab4cc', fontSize:13},
  divider:{height:1, backgroundColor:'#1a2a3a', marginVertical:4},
  badge:{paddingHorizontal:10, paddingVertical:3, borderRadius:6},
  badgeOn:{backgroundColor:'#0d2a12'},
  badgeOff:{backgroundColor:'#2a1a1a'},
  badgeTxt:{color:'#e0f0ff', fontWeight:'700', fontSize:11},
  schedCard:{backgroundColor:'#0d1f10', borderRadius:12, padding:12, borderWidth:1, borderColor:'#1a4020', marginBottom:10},
  schedTitle:{color:'#4caf50', fontWeight:'700', marginBottom:4},
  schedItem:{color:'#2e7d32', fontSize:12, marginTop:2},
  fintechCard:{backgroundColor:'#0d1a10', borderRadius:10, padding:12, alignItems:'center', borderWidth:1, borderColor:'#1a3520', marginTop:4},
  fintechTxt:{color:'#4caf50', fontSize:12, fontWeight:'600', textAlign:'center'},
});
