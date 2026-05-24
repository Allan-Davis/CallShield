/**
 * WhitelistScreen — Manage contacts allowed through the shield
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Switch,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Contacts from 'react-native-contacts';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

import useStore from '../store/useStore';

export default function WhitelistScreen() {
  const insets = useSafeAreaInsets();
  const { whitelist, addContact, removeContact, updateContact } = useStore();

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [allowCalls, setAllowCalls] = useState(true);
  const [allowSMS, setAllowSMS] = useState(true);

  const handleAdd = () => {
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter a phone number.');
      return;
    }
    addContact({ name: name.trim() || phone.trim(), phone: phone.trim(), allowCalls, allowSMS });
    setName(''); setPhone(''); setAllowCalls(true); setAllowSMS(true);
    setShowAdd(false);
  };

  const importFromContacts = async () => {
    const perm = await request(PERMISSIONS.ANDROID.READ_CONTACTS);
    if (perm !== RESULTS.GRANTED) {
      Alert.alert('Permission needed', 'Grant contacts permission in Settings.');
      return;
    }
    const contacts = await Contacts.getAll();
    // Show a picker — simplified: add first phone of selected contact
    Alert.alert('Import Contacts', `Found ${contacts.length} contacts. Use the manual add form and type their number, or this can be extended with a full contact picker.`);
  };

  const renderContact = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{(item.name || '?')[0].toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactPhone}>{item.phone}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>📞</Text>
          <Switch
            value={item.allowCalls}
            onValueChange={v => updateContact(item.id, { allowCalls: v })}
            trackColor={{ true: '#2d7dd2', false: '#222' }}
            thumbColor="#fff"
          />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>💬</Text>
          <Switch
            value={item.allowSMS}
            onValueChange={v => updateContact(item.id, { allowSMS: v })}
            trackColor={{ true: '#2d7dd2', false: '#222' }}
            thumbColor="#fff"
          />
        </View>
        <TouchableOpacity
          onPress={() => Alert.alert('Remove', `Remove ${item.name}?`, [
            { text: 'Cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => removeContact(item.id) },
          ])}
          style={styles.removeBtn}>
          <Text style={styles.removeTxt}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Whitelist</Text>
          <Text style={styles.subtitle}>{whitelist.length} contacts allowed through</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnTxt}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.importBtn} onPress={importFromContacts}>
        <Text style={styles.importTxt}>📋 Import from Contacts</Text>
      </TouchableOpacity>

      {whitelist.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔒</Text>
          <Text style={styles.emptyTitle}>No whitelisted contacts</Text>
          <Text style={styles.emptyBody}>
            When the shield is active, everyone except whitelisted contacts will be blocked.
          </Text>
        </View>
      ) : (
        <FlatList
          data={whitelist}
          keyExtractor={i => i.id}
          renderItem={renderContact}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Contact Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Contact</Text>

            <Text style={styles.fieldLabel}>Name (optional)</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Mom"
              placeholderTextColor="#444"
            />

            <Text style={styles.fieldLabel}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. 0712345678 or +254712345678"
              placeholderTextColor="#444"
              keyboardType="phone-pad"
            />

            <View style={styles.switchRow}>
              <Text style={styles.fieldLabel}>Allow Calls</Text>
              <Switch
                value={allowCalls}
                onValueChange={setAllowCalls}
                trackColor={{ true: '#2d7dd2', false: '#333' }}
              />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.fieldLabel}>Allow SMS</Text>
              <Switch
                value={allowSMS}
                onValueChange={setAllowSMS}
                trackColor={{ true: '#2d7dd2', false: '#333' }}
              />
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={styles.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                <Text style={styles.saveTxt}>Add Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a12', paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#e8f4ff' },
  subtitle: { fontSize: 12, color: '#4a6080', marginTop: 2 },
  addBtn: { backgroundColor: '#1e3a5f', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10 },
  addBtnTxt: { color: '#5db8ff', fontWeight: '700' },
  importBtn: { backgroundColor: '#111825', borderRadius: 10, padding: 12, marginBottom: 14, alignItems: 'center' },
  importTxt: { color: '#5a7fa8', fontWeight: '600' },
  card: {
    backgroundColor: '#111825',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#1e3a5f',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { color: '#5db8ff', fontWeight: '800', fontSize: 18 },
  contactName: { color: '#e0f0ff', fontWeight: '700', fontSize: 15 },
  contactPhone: { color: '#4a6080', fontSize: 12, marginTop: 2 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleRow: { alignItems: 'center', gap: 2 },
  toggleLabel: { fontSize: 12 },
  removeBtn: { padding: 6, marginLeft: 4 },
  removeTxt: { color: '#c0392b', fontWeight: '700', fontSize: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#e0f0ff', textAlign: 'center' },
  emptyBody: { fontSize: 14, color: '#4a6080', textAlign: 'center', marginTop: 8, lineHeight: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#111825', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#e8f4ff', marginBottom: 20 },
  fieldLabel: { color: '#5a7fa8', fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#0d1421',
    borderRadius: 10,
    color: '#e0f0ff',
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#1a2a3a',
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, backgroundColor: '#1a1a28', borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelTxt: { color: '#5a7fa8', fontWeight: '700' },
  saveBtn: { flex: 1, backgroundColor: '#1e3a5f', borderRadius: 12, padding: 14, alignItems: 'center' },
  saveTxt: { color: '#5db8ff', fontWeight: '700' },
});
