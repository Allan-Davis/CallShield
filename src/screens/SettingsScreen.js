/**
 * SettingsScreen — App configuration
 */

import React from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';

import useStore from '../store/useStore';

const SettingRow = ({ label, desc, value, onChange }) => (
  <View style={styles.row}>
    <View style={styles.rowLeft}>
      <Text style={styles.rowLabel}>{label}</Text>
      {desc && <Text style={styles.rowDesc}>{desc}</Text>}
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ true: '#2d7dd2', false: '#222' }}
      thumbColor="#fff"
    />
  </View>
);

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings } = useStore();

  const requestPermissions = async () => {
    const perms = [
      PERMISSIONS.ANDROID.READ_PHONE_STATE,
      PERMISSIONS.ANDROID.READ_CALL_LOG,
      PERMISSIONS.ANDROID.ANSWER_PHONE_CALLS,
      PERMISSIONS.ANDROID.RECEIVE_SMS,
      PERMISSIONS.ANDROID.READ_SMS,
      PERMISSIONS.ANDROID.READ_CONTACTS,
    ];
    for (const perm of perms) {
      await request(perm);
    }
    Alert.alert('Done', 'Permissions requested. If any were denied, open Settings to grant them.');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Settings</Text>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Blocking */}
        <Text style={styles.section}>Blocking</Text>
        <View style={styles.card}>
          <SettingRow
            label="Block Calls"
            desc="Hang up calls from non-whitelisted numbers"
            value={settings.blockCalls}
            onChange={v => updateSettings({ blockCalls: v })}
          />
          <View style={styles.divider} />
          <SettingRow
            label="Block SMS"
            desc="Suppress SMS from non-whitelisted numbers"
            value={settings.blockSMS}
            onChange={v => updateSettings({ blockSMS: v })}
          />
          <View style={styles.divider} />
          <SettingRow
            label="Silent Block"
            desc="Block silently (no missed call notification)"
            value={settings.silentBlock}
            onChange={v => updateSettings({ silentBlock: v })}
          />
        </View>

        {/* Fintech — always on, just informational */}
        <Text style={styles.section}>Financial Services</Text>
        <View style={styles.card}>
          <View style={styles.fintechRow}>
            <Text style={styles.fintechIcon}>🟢</Text>
            <View style={styles.fintechText}>
              <Text style={styles.rowLabel}>M-Pesa Always Allowed</Text>
              <Text style={styles.rowDesc}>Safaricom: 234, 200, 22214, 20880</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.fintechRow}>
            <Text style={styles.fintechIcon}>🟢</Text>
            <View style={styles.fintechText}>
              <Text style={styles.rowLabel}>Airtel Money Always Allowed</Text>
              <Text style={styles.rowDesc}>Airtel: 100, 135 and related</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <Text style={styles.fintechNote}>
            Financial shortcodes are hardcoded to NEVER be blocked, regardless of shield status. Mobile data remains fully accessible at all times.
          </Text>
        </View>

        {/* Notifications */}
        <Text style={styles.section}>Notifications</Text>
        <View style={styles.card}>
          <SettingRow
            label="Notify When Blocked"
            desc="Show a brief notification when a call/SMS is blocked"
            value={settings.notifyBlocked}
            onChange={v => updateSettings({ notifyBlocked: v })}
          />
        </View>

        {/* Permissions */}
        <Text style={styles.section}>Permissions</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermissions}>
            <Text style={styles.permBtnTxt}>🔑 Grant All Permissions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.permBtn, { marginTop: 8 }]} onPress={openSettings}>
            <Text style={styles.permBtnTxt}>⚙️ Open Android Settings</Text>
          </TouchableOpacity>
          <Text style={styles.permNote}>
            CallShield needs Phone, SMS, and Contacts permissions to function. No data leaves your device.
          </Text>
        </View>

        {/* About */}
        <Text style={styles.section}>About</Text>
        <View style={styles.card}>
          <Text style={styles.about}>CallShield v1.0.0</Text>
          <Text style={styles.aboutDesc}>
            100% offline. All rules run on-device. No account required. No data collected.
            {'\n\n'}Built for Android. Works without internet connection.
            {'\n\n'}M-Pesa and Airtel Money transactions are never blocked.
          </Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://github.com/your-username/CallShield')}>
            <Text style={styles.link}>⭐ View on GitHub</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a12', paddingHorizontal: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#e8f4ff', marginTop: 16, marginBottom: 20 },
  section: { fontSize: 11, fontWeight: '700', color: '#3a5570', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8, marginTop: 20 },
  card: { backgroundColor: '#111825', borderRadius: 16, padding: 16, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  rowLeft: { flex: 1, paddingRight: 16 },
  rowLabel: { color: '#e0f0ff', fontWeight: '600', fontSize: 15 },
  rowDesc: { color: '#3a5570', fontSize: 12, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#1a2a3a', marginVertical: 8 },
  fintechRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  fintechIcon: { fontSize: 20 },
  fintechText: { flex: 1 },
  fintechNote: { color: '#2e5a2e', fontSize: 12, marginTop: 12, lineHeight: 18 },
  permBtn: {
    backgroundColor: '#1e3a5f',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  permBtnTxt: { color: '#5db8ff', fontWeight: '700' },
  permNote: { color: '#3a5570', fontSize: 12, marginTop: 12, lineHeight: 18 },
  about: { color: '#e0f0ff', fontWeight: '800', fontSize: 16 },
  aboutDesc: { color: '#4a6080', fontSize: 13, marginTop: 8, lineHeight: 20 },
  link: { color: '#5db8ff', fontWeight: '600', marginTop: 12 },
});
