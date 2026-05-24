/**
 * HomeScreen — Shield ON/OFF control panel
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import useStore from '../store/useStore';
import { isScheduleActive, formatSchedule } from '../services/ShieldEngine';
import { colors, fonts, radius } from '../utils/theme';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    shieldActive,
    shieldMode,
    toggleShield,
    setShieldMode,
    schedules,
    whitelist,
    logs,
    settings,
  } = useStore();

  const [pulseAnim] = useState(new Animated.Value(1));

  // Pulse animation when shield is active
  useEffect(() => {
    if (shieldActive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.12,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [shieldActive]);

  const activeSchedules = schedules.filter(isScheduleActive);
  const blockedToday = logs.filter(
    l => l.action === 'blocked' && Date.now() - l.timestamp < 86400000
  ).length;

  return (
    <LinearGradient
      colors={shieldActive ? ['#0a0f1a', '#0d1f35', '#0a1428'] : ['#0f0f12', '#1a1a22', '#0f0f12']}
      style={[styles.container, { paddingTop: insets.top }]}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>CallShield</Text>
        <Text style={styles.tagline}>Control who reaches you</Text>
      </View>

      {/* Mode Toggle */}
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, shieldMode === 'manual' && styles.modeBtnActive]}
          onPress={() => setShieldMode('manual')}>
          <Text style={[styles.modeTxt, shieldMode === 'manual' && styles.modeTxtActive]}>
            Manual
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, shieldMode === 'scheduled' && styles.modeBtnActive]}
          onPress={() => setShieldMode('scheduled')}>
          <Text style={[styles.modeTxt, shieldMode === 'scheduled' && styles.modeTxtActive]}>
            Scheduled
          </Text>
        </TouchableOpacity>
      </View>

      {/* Big Shield Button */}
      <View style={styles.shieldContainer}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[styles.shieldBtn, shieldActive ? styles.shieldBtnOn : styles.shieldBtnOff]}
            onPress={shieldMode === 'manual' ? toggleShield : undefined}
            activeOpacity={shieldMode === 'manual' ? 0.7 : 1}>

            {/* Glow ring */}
            {shieldActive && <View style={styles.glowRing} />}

            <Text style={styles.shieldIcon}>🛡️</Text>
            <Text style={styles.shieldStatus}>{shieldActive ? 'ACTIVE' : 'OFF'}</Text>
            {shieldMode === 'manual' && (
              <Text style={styles.shieldHint}>
                {shieldActive ? 'Tap to deactivate' : 'Tap to activate'}
              </Text>
            )}
            {shieldMode === 'scheduled' && (
              <Text style={styles.shieldHint}>
                {activeSchedules.length > 0
                  ? `Auto • ${activeSchedules.length} schedule running`
                  : 'Auto • No schedule active now'}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{whitelist.length}</Text>
          <Text style={styles.statLabel}>Whitelisted</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: colors.danger }]}>{blockedToday}</Text>
          <Text style={styles.statLabel}>Blocked Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{schedules.filter(s => s.active).length}</Text>
          <Text style={styles.statLabel}>Schedules</Text>
        </View>
      </View>

      {/* Active Schedules Preview */}
      {shieldMode === 'scheduled' && activeSchedules.length > 0 && (
        <View style={styles.activeScheds}>
          <Text style={styles.activeSched_title}>🟢 Running Now</Text>
          {activeSchedules.map(s => (
            <Text key={s.id} style={styles.activeSched_row}>
              {s.label} · {formatSchedule(s)}
            </Text>
          ))}
        </View>
      )}

      {/* M-Pesa always-on note */}
      <View style={styles.fintechNote}>
        <Text style={styles.fintechText}>
          ✅ M-Pesa & Airtel Money always allowed
        </Text>
      </View>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { marginTop: 16, marginBottom: 8 },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#e8f4ff',
    letterSpacing: -0.5,
  },
  tagline: { fontSize: 13, color: '#5a7fa8', marginTop: 2 },

  modeRow: {
    flexDirection: 'row',
    backgroundColor: '#111825',
    borderRadius: 12,
    padding: 4,
    marginVertical: 16,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: '#1e3a5f' },
  modeTxt: { color: '#4a6080', fontWeight: '600', fontSize: 14 },
  modeTxtActive: { color: '#5db8ff' },

  shieldContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  shieldBtn: {
    width: 190,
    height: 190,
    borderRadius: 95,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 12,
  },
  shieldBtnOn: {
    backgroundColor: '#0d2444',
    borderWidth: 3,
    borderColor: '#2d7dd2',
  },
  shieldBtnOff: {
    backgroundColor: '#1a1a24',
    borderWidth: 2,
    borderColor: '#2a2a3a',
  },
  glowRing: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 1,
    borderColor: 'rgba(45,125,210,0.3)',
  },
  shieldIcon: { fontSize: 52, marginBottom: 6 },
  shieldStatus: {
    fontSize: 22,
    fontWeight: '800',
    color: '#e0f0ff',
    letterSpacing: 3,
  },
  shieldHint: { fontSize: 11, color: '#4a6f96', marginTop: 4 },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#111825',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  statNum: { fontSize: 26, fontWeight: '800', color: '#5db8ff' },
  statLabel: { fontSize: 11, color: '#3a5a78', marginTop: 2 },

  activeScheds: {
    backgroundColor: '#0d1f10',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#1a4020',
  },
  activeSched_title: { color: '#4caf50', fontWeight: '700', marginBottom: 6 },
  activeSched_row: { color: '#2e7d32', fontSize: 12, marginTop: 2 },

  fintechNote: {
    marginTop: 'auto',
    marginBottom: 16,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#0d1a10',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1a3520',
  },
  fintechText: { color: '#4caf50', fontSize: 12, fontWeight: '600' },
});
