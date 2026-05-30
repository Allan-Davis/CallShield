import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useStore = create(
  persist(
    (set, get) => ({
      // Shield
      shieldActive: false,
      shieldMode: 'manual', // 'manual' | 'scheduled'
      toggleShield: () => set(s => ({shieldActive: !s.shieldActive})),
      setShieldMode: m => set({shieldMode: m}),
      activateShield: () => set({shieldActive: true}),
      deactivateShield: () => set({shieldActive: false}),

      // Settings
      settings: {blockCalls: true, blockSMS: true, notifyBlocked: true},
      updateSettings: u => set(s => ({settings: {...s.settings, ...u}})),

      // Whitelist
      whitelist: [],
      addContact: c =>
        set(s => ({
          whitelist: [
            ...s.whitelist,
            {
              id: String(Date.now()),
              allowCalls: true,
              allowSMS: true,
              ...c,
              phone: String(c.phone || '').replace(/\s/g, ''),
            },
          ],
        })),
      removeContact: id =>
        set(s => ({whitelist: s.whitelist.filter(c => c.id !== id)})),
      updateContact: (id, u) =>
        set(s => ({whitelist: s.whitelist.map(c => c.id === id ? {...c, ...u} : c)})),

      // Schedules
      schedules: [],
      addSchedule: sc =>
        set(s => ({
          schedules: [
            ...s.schedules,
            {id: String(Date.now()), label: 'Schedule', days: [1,2,3,4,5], startTime: '22:00', endTime: '07:00', active: true, ...sc},
          ],
        })),
      removeSchedule: id =>
        set(s => ({schedules: s.schedules.filter(sc => sc.id !== id)})),
      toggleSchedule: id =>
        set(s => ({schedules: s.schedules.map(sc => sc.id === id ? {...sc, active: !sc.active} : sc)})),
      updateSchedule: (id, u) =>
        set(s => ({schedules: s.schedules.map(sc => sc.id === id ? {...sc, ...u} : sc)})),

      // Logs
      logs: [],
      addLog: entry =>
        set(s => ({
          logs: [{id: String(Date.now()), timestamp: Date.now(), ...entry}, ...s.logs].slice(0, 300),
        })),
      clearLogs: () => set({logs: []}),
    }),
    {name: 'callshield-store', storage: createJSONStorage(() => AsyncStorage)},
  ),
);

export default useStore;
