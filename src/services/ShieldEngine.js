/**
 * CallShield Engine
 * Core service that intercepts calls/SMS and applies blocking rules.
 * Runs as a background service — works fully OFFLINE.
 *
 * M-Pesa shortcodes: 234, 200, MPESA, 20880
 * Airtel Money shortcodes: 100, 135, AIRTEL
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import { format, parse, isWithinInterval, addDays } from 'date-fns';

// ── M-Pesa & Airtel Money passthrough numbers ─────────────────────────────────
const FINTECH_WHITELIST = [
  // M-Pesa (Safaricom Kenya)
  '234', '200', '22214', '20880', 'MPESA', 'M-PESA',
  // Airtel Money Kenya
  '100', '135', '0100', 'AIRTEL', 'AIRTELMONEY',
  // Equity Eazzy
  '247', 'EQUITY',
  // Generic USSD/bank shortcodes (3-5 digits)
];

const FINTECH_PATTERNS = [
  /^2\d{2}$/, // 3-digit Safaricom shortcodes
  /^1\d{2}$/, // 3-digit Airtel shortcodes
  /^\*\d{3}/, // USSD codes
  /MPESA/i,
  /AIRTEL/i,
  /EQUITY/i,
  /MSHWARI/i,
  /FULIZA/i,
];

/**
 * Check if a number is a financial service that should NEVER be blocked.
 */
export function isFintechNumber(phone) {
  const cleaned = phone.replace(/\s+/g, '').replace(/[^\d*+A-Za-z]/g, '');
  if (FINTECH_WHITELIST.includes(cleaned)) return true;
  return FINTECH_PATTERNS.some(p => p.test(cleaned));
}

/**
 * Parse "HH:mm" time string into today's Date object.
 */
function parseTime(timeStr, baseDate = new Date()) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/**
 * Check if current time falls within a schedule window.
 * Handles overnight ranges like 22:00 → 07:00.
 */
export function isScheduleActive(schedule) {
  if (!schedule.active) return false;

  const now = new Date();
  const todayIndex = now.getDay(); // 0 = Sun

  if (!schedule.days.includes(todayIndex)) return false;

  const start = parseTime(schedule.startTime);
  const end = parseTime(schedule.endTime);

  // Handle overnight: e.g. 22:00 → 07:00 next day
  if (start > end) {
    // Either after start OR before end
    return now >= start || now <= end;
  }

  return now >= start && now <= end;
}

/**
 * Master decision function.
 * Returns { blocked: boolean, reason: string }
 */
export function shouldBlock(phone, type, store) {
  const { shieldActive, shieldMode, whitelist, schedules, settings } = store;

  // 1. Always allow fintech / M-Pesa / Airtel Money
  if (isFintechNumber(phone)) {
    return { blocked: false, reason: 'fintech_passthrough' };
  }

  // 2. Determine if shield is currently ON
  let shieldOn = false;
  if (shieldMode === 'manual') {
    shieldOn = shieldActive;
  } else {
    // Scheduled mode: shield is on if ANY active schedule matches now
    shieldOn = schedules.some(isScheduleActive);
  }

  if (!shieldOn) {
    return { blocked: false, reason: 'shield_off' };
  }

  // 3. Check whitelist
  const cleanPhone = phone.replace(/\s+/g, '').replace(/^\+254/, '0');
  const whitelisted = whitelist.find(c => {
    const cp = c.phone.replace(/\s+/g, '').replace(/^\+254/, '0');
    return cp === cleanPhone || c.phone === phone;
  });

  if (whitelisted) {
    if (type === 'call' && whitelisted.allowCalls) {
      return { blocked: false, reason: 'whitelisted_calls' };
    }
    if (type === 'sms' && whitelisted.allowSMS) {
      return { blocked: false, reason: 'whitelisted_sms' };
    }
  }

  // 4. Block based on settings
  if (type === 'call' && !settings.blockCalls) {
    return { blocked: false, reason: 'calls_not_blocked' };
  }
  if (type === 'sms' && !settings.blockSMS) {
    return { blocked: false, reason: 'sms_not_blocked' };
  }

  return { blocked: true, reason: 'blocked_by_shield' };
}

/**
 * Format a schedule for display.
 */
export function formatSchedule(schedule) {
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = schedule.days.map(d => DAYS[d]).join(', ');
  return `${days} · ${schedule.startTime} – ${schedule.endTime}`;
}

/**
 * Background tick — checks schedules every minute and updates shield state.
 * Call this once on app start.
 */
let _tickInterval = null;

export function startScheduleWatcher(store) {
  if (_tickInterval) return;

  _tickInterval = BackgroundTimer.setInterval(() => {
    if (store.getState().shieldMode === 'scheduled') {
      const { schedules } = store.getState();
      const anyActive = schedules.some(isScheduleActive);
      store.getState().shieldActive !== anyActive &&
        (anyActive
          ? store.getState().activateShield()
          : store.getState().deactivateShield());
    }
  }, 60_000); // every 60 seconds
}

export function stopScheduleWatcher() {
  if (_tickInterval) {
    BackgroundTimer.clearInterval(_tickInterval);
    _tickInterval = null;
  }
}
