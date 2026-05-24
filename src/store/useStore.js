/**
 * CallShield Global Store (Zustand)
 * Manages shield state, whitelist, schedules — fully offline via AsyncStorage.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** @typedef {{ id: string, name: string, phone: string, allowCalls: boolean, allowSMS: boolean }} Contact */
/** @typedef {{ id: string, label: string, days: number[], startTime: string, endTime: string, active: boolean }} Schedule */

const useStore = create(
  persist(
    (set, get) => ({
      // ── Shield ──────────────────────────────────────────────────
      shieldActive: false,
      shieldMode: 'manual', // 'manual' | 'scheduled'

      toggleShield: () => set(s => ({ shieldActive: !s.shieldActive })),
      setShieldMode: (mode) => set({ shieldMode: mode }),
      activateShield: () => set({ shieldActive: true }),
      deactivateShield: () => set({ shieldActive: false }),

      // ── Whitelist ───────────────────────────────────────────────
      /** @type {Contact[]} */
      whitelist: [],

      addContact: (contact) =>
        set(s => ({
          whitelist: [
            ...s.whitelist,
            {
              id: Date.now().toString(),
              name: contact.name,
              phone: contact.phone.replace(/\s+/g, ''),
              allowCalls: contact.allowCalls ?? true,
              allowSMS: contact.allowSMS ?? true,
            },
          ],
        })),

      removeContact: (id) =>
        set(s => ({ whitelist: s.whitelist.filter(c => c.id !== id) })),

      updateContact: (id, updates) =>
        set(s => ({
          whitelist: s.whitelist.map(c => (c.id === id ? { ...c, ...updates } : c)),
        })),

      isWhitelisted: (phone) => {
        const clean = phone.replace(/\s+/g, '').replace(/^\+254/, '0');
        return get().whitelist.some(c => {
          const cp = c.phone.replace(/^\+254/, '0');
          return cp === clean || c.phone === phone;
        });
      },

      // ── Schedules ───────────────────────────────────────────────
      /** @type {Schedule[]} */
      schedules: [],

      addSchedule: (schedule) =>
        set(s => ({
          schedules: [
            ...s.schedules,
            {
              id: Date.now().toString(),
              label: schedule.label || 'My Schedule',
              days: schedule.days || [],
              startTime: schedule.startTime || '22:00',
              endTime: schedule.endTime || '07:00',
              active: true,
            },
          ],
        })),

      removeSchedule: (id) =>
        set(s => ({ schedules: s.schedules.filter(sc => sc.id !== id) })),

      toggleSchedule: (id) =>
        set(s => ({
          schedules: s.schedules.map(sc =>
            sc.id === id ? { ...sc, active: !sc.active } : sc
          ),
        })),

      updateSchedule: (id, updates) =>
        set(s => ({
          schedules: s.schedules.map(sc =>
            sc.id === id ? { ...sc, ...updates } : sc
          ),
        })),

      // ── Settings ─────────────────────────────────────────────────
      settings: {
        blockCalls: true,
        blockSMS: true,
        allowMpesa: true,       // Always allow M-Pesa shortcodes
        allowAirtelMoney: true, // Always allow Airtel Money shortcodes
        silentBlock: true,      // Block silently vs send to voicemail
        notifyBlocked: false,   // Show notification when something is blocked
      },

      updateSettings: (updates) =>
        set(s => ({ settings: { ...s.settings, ...updates } })),

      // ── Logs ─────────────────────────────────────────────────────
      /** @type {{ id: string, type: 'call'|'sms', phone: string, name: string|null, timestamp: number, action: 'blocked'|'allowed' }[]} */
      logs: [],

      addLog: (entry) =>
        set(s => ({
          logs: [
            { id: Date.now().toString(), timestamp: Date.now(), ...entry },
            ...s.logs,
          ].slice(0, 200), // keep last 200
        })),

      clearLogs: () => set({ logs: [] }),
    }),
    {
      name: 'callshield-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useStore;
