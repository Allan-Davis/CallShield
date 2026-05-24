/**
 * TabBar — Custom bottom navigation bar
 */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useStore from '../store/useStore';

const TABS = [
  { name: 'Home',      icon: '🛡️', label: 'Shield' },
  { name: 'Whitelist', icon: '✅', label: 'Whitelist' },
  { name: 'Schedule',  icon: '🕐', label: 'Schedule' },
  { name: 'Logs',      icon: '📋', label: 'Logs' },
  { name: 'Settings',  icon: '⚙️', label: 'Settings' },
];

export default function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const { shieldActive } = useStore();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || 8 }]}>
      {TABS.map((tab, index) => {
        const focused = state.index === index;
        const isHome = tab.name === 'Home';
        return (
          <TouchableOpacity
            key={tab.name}
            style={[styles.tab, isHome && styles.homeTab]}
            onPress={() => navigation.navigate(tab.name)}
            activeOpacity={0.7}>
            {isHome ? (
              <View style={[styles.homeBtn, shieldActive && styles.homeBtnActive]}>
                <Text style={styles.homeIcon}>{tab.icon}</Text>
              </View>
            ) : (
              <>
                <Text style={[styles.icon, focused && styles.iconFocused]}>{tab.icon}</Text>
                <Text style={[styles.label, focused && styles.labelFocused]}>{tab.label}</Text>
              </>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#0d1421',
    borderTopWidth: 1,
    borderTopColor: '#1a2a3a',
    paddingTop: 10,
  },
  tab: { flex: 1, alignItems: 'center', paddingBottom: 4 },
  homeTab: { flex: 1.2 },
  homeBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1a2a3a',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
    borderWidth: 2,
    borderColor: '#1e3a5f',
  },
  homeBtnActive: {
    backgroundColor: '#1e3a5f',
    borderColor: '#2d7dd2',
  },
  homeIcon: { fontSize: 22 },
  icon: { fontSize: 20, opacity: 0.4 },
  iconFocused: { opacity: 1 },
  label: { fontSize: 10, color: '#2a4060', marginTop: 3, fontWeight: '600' },
  labelFocused: { color: '#5db8ff' },
});
