/**
 * LogsScreen — View history of blocked/allowed calls and SMS
 */

import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';

import useStore from '../store/useStore';

export default function LogsScreen() {
  const insets = useSafeAreaInsets();
  const { logs, clearLogs } = useStore();

  const renderLog = ({ item }) => {
    const isBlocked = item.action === 'blocked';
    const isCall = item.type === 'call';
    const time = format(new Date(item.timestamp), 'dd MMM · HH:mm');

    return (
      <View style={[styles.row, isBlocked ? styles.rowBlocked : styles.rowAllowed]}>
        <Text style={styles.rowIcon}>{isCall ? '📞' : '💬'}</Text>
        <View style={styles.rowMid}>
          <Text style={styles.rowName}>{item.name || item.phone}</Text>
          {item.name && <Text style={styles.rowPhone}>{item.phone}</Text>}
          <Text style={styles.rowTime}>{time}</Text>
        </View>
        <View style={[styles.badge, isBlocked ? styles.badgeBlocked : styles.badgeAllowed]}>
          <Text style={[styles.badgeTxt, isBlocked ? styles.badgeTxtBlocked : styles.badgeTxtAllowed]}>
            {isBlocked ? 'BLOCKED' : 'ALLOWED'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Activity Log</Text>
          <Text style={styles.subtitle}>{logs.length} events recorded</Text>
        </View>
        {logs.length > 0 && (
          <TouchableOpacity
            onPress={() => Alert.alert('Clear Logs', 'Delete all logs?', [
              { text: 'Cancel' },
              { text: 'Clear', style: 'destructive', onPress: clearLogs },
            ])}>
            <Text style={styles.clearBtn}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {logs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No activity yet</Text>
          <Text style={styles.emptyBody}>Blocked and allowed calls/SMS will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={i => i.id}
          renderItem={renderLog}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      )}
    </View>
  );
}

const logStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a12', paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#e8f4ff' },
  subtitle: { fontSize: 12, color: '#4a6080', marginTop: 2 },
  clearBtn: { color: '#c0392b', fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111825',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    gap: 12,
  },
  rowBlocked: { borderLeftColor: '#c0392b' },
  rowAllowed: { borderLeftColor: '#2ecc71' },
  rowIcon: { fontSize: 20 },
  rowMid: { flex: 1 },
  rowName: { color: '#e0f0ff', fontWeight: '600', fontSize: 14 },
  rowPhone: { color: '#4a6080', fontSize: 11, marginTop: 1 },
  rowTime: { color: '#3a5070', fontSize: 11, marginTop: 3 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeBlocked: { backgroundColor: '#2a0d0d' },
  badgeAllowed: { backgroundColor: '#0d2a12' },
  badgeTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  badgeTxtBlocked: { color: '#e74c3c' },
  badgeTxtAllowed: { color: '#2ecc71' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#e0f0ff' },
  emptyBody: { fontSize: 14, color: '#4a6080', textAlign: 'center', marginTop: 8 },
});

// Re-export with correct styles binding
const styles = logStyles;
