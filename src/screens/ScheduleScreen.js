/**
 * ScheduleScreen — Create and manage blocking schedules
 * Supports: specific days of week, start/end time, custom labels
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
  Modal,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import useStore, { DAYS } from '../store/useStore';
import { isScheduleActive, formatSchedule } from '../services/ShieldEngine';

const PRESET_SCHEDULES = [
  { label: '😴 Sleep Hours', days: [0,1,2,3,4,5,6], startTime: '22:00', endTime: '07:00' },
  { label: '💼 Work Hours', days: [1,2,3,4,5], startTime: '09:00', endTime: '17:00' },
  { label: '🙏 Weekend Rest', days: [0,6], startTime: '00:00', endTime: '23:59' },
  { label: '🍽️ Lunch Break', days: [1,2,3,4,5], startTime: '12:00', endTime: '13:00' },
];

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const { schedules, addSchedule, removeSchedule, toggleSchedule } = useStore();

  const [showAdd, setShowAdd] = useState(false);
  const [label, setLabel] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [startHour, setStartHour] = useState('22');
  const [startMin, setStartMin] = useState('00');
  const [endHour, setEndHour] = useState('07');
  const [endMin, setEndMin] = useState('00');

  const toggleDay = (idx) => {
    setSelectedDays(d =>
      d.includes(idx) ? d.filter(x => x !== idx) : [...d, idx]
    );
  };

  const handleSave = () => {
    if (selectedDays.length === 0) {
      Alert.alert('Select days', 'Please select at least one day.');
      return;
    }
    const sh = String(startHour).padStart(2,'0');
    const sm = String(startMin).padStart(2,'0');
    const eh = String(endHour).padStart(2,'0');
    const em = String(endMin).padStart(2,'0');
    addSchedule({
      label: label.trim() || 'My Schedule',
      days: selectedDays,
      startTime: `${sh}:${sm}`,
      endTime: `${eh}:${em}`,
    });
    setLabel(''); setSelectedDays([]); setStartHour('22'); setStartMin('00'); setEndHour('07'); setEndMin('00');
    setShowAdd(false);
  };

  const applyPreset = (preset) => {
    addSchedule(preset);
  };

  const renderSchedule = ({ item }) => {
    const active = isScheduleActive(item);
    return (
      <View style={[styles.card, active && styles.cardActive]}>
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.cardLabel}>{item.label}</Text>
            <Text style={styles.cardTime}>{formatSchedule(item)}</Text>
          </View>
          <View style={styles.cardActions}>
            {active && <View style={styles.activeBadge}><Text style={styles.activeBadgeTxt}>NOW</Text></View>}
            <Switch
              value={item.active}
              onValueChange={() => toggleSchedule(item.id)}
              trackColor={{ true: '#2d7dd2', false: '#222' }}
              thumbColor="#fff"
            />
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => Alert.alert('Delete Schedule', `Delete "${item.label}"?`, [
            { text: 'Cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => removeSchedule(item.id) },
          ])}>
          <Text style={styles.deleteTxt}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Schedules</Text>
          <Text style={styles.subtitle}>Auto-activate shield by time</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnTxt}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Presets */}
      <Text style={styles.sectionTitle}>Quick Presets</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetRow}>
        {PRESET_SCHEDULES.map((p, i) => (
          <TouchableOpacity key={i} style={styles.preset} onPress={() => applyPreset(p)}>
            <Text style={styles.presetTxt}>{p.label}</Text>
            <Text style={styles.presetTime}>{p.startTime} – {p.endTime}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>My Schedules</Text>
      {schedules.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🕐</Text>
          <Text style={styles.emptyTitle}>No schedules yet</Text>
          <Text style={styles.emptyBody}>Add a schedule to automatically activate the shield.</Text>
        </View>
      ) : (
        <FlatList
          data={schedules}
          keyExtractor={i => i.id}
          renderItem={renderSchedule}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      )}

      {/* Add Schedule Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modal}>
            <Text style={styles.modalTitle}>New Schedule</Text>

            <Text style={styles.fieldLabel}>Label</Text>
            <TextInput
              style={styles.input}
              value={label}
              onChangeText={setLabel}
              placeholder="e.g. Sleep Hours"
              placeholderTextColor="#444"
            />

            <Text style={styles.fieldLabel}>Days</Text>
            <View style={styles.daysRow}>
              {DAYS.map((d, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.dayBtn, selectedDays.includes(i) && styles.dayBtnOn]}
                  onPress={() => toggleDay(i)}>
                  <Text style={[styles.dayTxt, selectedDays.includes(i) && styles.dayTxtOn]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Block From</Text>
            <View style={styles.timeRow}>
              <TextInput
                style={[styles.input, styles.timeInput]}
                value={startHour}
                onChangeText={t => setStartHour(t.replace(/\D/g, '').slice(0,2))}
                keyboardType="numeric"
                maxLength={2}
                placeholder="HH"
                placeholderTextColor="#444"
              />
              <Text style={styles.timeSep}>:</Text>
              <TextInput
                style={[styles.input, styles.timeInput]}
                value={startMin}
                onChangeText={t => setStartMin(t.replace(/\D/g, '').slice(0,2))}
                keyboardType="numeric"
                maxLength={2}
                placeholder="MM"
                placeholderTextColor="#444"
              />
            </View>

            <Text style={styles.fieldLabel}>Block Until</Text>
            <View style={styles.timeRow}>
              <TextInput
                style={[styles.input, styles.timeInput]}
                value={endHour}
                onChangeText={t => setEndHour(t.replace(/\D/g, '').slice(0,2))}
                keyboardType="numeric"
                maxLength={2}
                placeholder="HH"
                placeholderTextColor="#444"
              />
              <Text style={styles.timeSep}>:</Text>
              <TextInput
                style={[styles.input, styles.timeInput]}
                value={endMin}
                onChangeText={t => setEndMin(t.replace(/\D/g, '').slice(0,2))}
                keyboardType="numeric"
                maxLength={2}
                placeholder="MM"
                placeholderTextColor="#444"
              />
            </View>

            <Text style={styles.hint}>
              💡 Overnight ranges work (e.g. 22:00 → 07:00)
            </Text>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={styles.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveTxt}>Save Schedule</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a12', paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#e8f4ff' },
  subtitle: { fontSize: 12, color: '#4a6080', marginTop: 2 },
  addBtn: { backgroundColor: '#1e3a5f', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10 },
  addBtnTxt: { color: '#5db8ff', fontWeight: '700' },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#3a5570', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  presetRow: { marginBottom: 20 },
  preset: {
    backgroundColor: '#111825',
    borderRadius: 12,
    padding: 14,
    marginRight: 10,
    minWidth: 130,
    borderWidth: 1,
    borderColor: '#1a2a3a',
  },
  presetTxt: { color: '#e0f0ff', fontWeight: '700', fontSize: 13 },
  presetTime: { color: '#4a6080', fontSize: 11, marginTop: 4 },
  card: {
    backgroundColor: '#111825',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1a2a3a',
  },
  cardActive: { borderColor: '#1e4a1e', backgroundColor: '#0d1a10' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { color: '#e0f0ff', fontWeight: '700', fontSize: 15 },
  cardTime: { color: '#4a6080', fontSize: 12, marginTop: 3 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activeBadge: { backgroundColor: '#1a4020', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  activeBadgeTxt: { color: '#4caf50', fontSize: 10, fontWeight: '800' },
  deleteBtn: { marginTop: 10, alignSelf: 'flex-start' },
  deleteTxt: { color: '#c0392b', fontSize: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#e0f0ff' },
  emptyBody: { fontSize: 14, color: '#4a6080', textAlign: 'center', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#111825', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 50 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#e8f4ff', marginBottom: 20 },
  fieldLabel: { color: '#5a7fa8', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#0d1421', borderRadius: 10, color: '#e0f0ff', padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#1a2a3a' },
  daysRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  dayBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#0d1421', borderWidth: 1, borderColor: '#1a2a3a' },
  dayBtnOn: { backgroundColor: '#1e3a5f', borderColor: '#2d7dd2' },
  dayTxt: { color: '#4a6080', fontWeight: '700', fontSize: 13 },
  dayTxtOn: { color: '#5db8ff' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timeInput: { width: 70, textAlign: 'center' },
  timeSep: { color: '#5db8ff', fontSize: 24, fontWeight: '800' },
  hint: { color: '#3a5570', fontSize: 12, marginTop: 12 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, backgroundColor: '#1a1a28', borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelTxt: { color: '#5a7fa8', fontWeight: '700' },
  saveBtn: { flex: 1, backgroundColor: '#1e3a5f', borderRadius: 12, padding: 14, alignItems: 'center' },
  saveTxt: { color: '#5db8ff', fontWeight: '700' },
});
