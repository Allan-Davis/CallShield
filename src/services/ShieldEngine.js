const FINTECH = ['234','200','22214','20880','100','135','247','MPESA','M-PESA','AIRTEL','AIRTELMONEY','EQUITY'];
const FINTECH_RE = [/^2\d{2}$/,/^1\d{2}$/,/MPESA/i,/AIRTEL/i,/EQUITY/i,/MSHWARI/i,/FULIZA/i];

export function isFintechNumber(phone) {
  if (!phone) {return false;}
  const c = String(phone).replace(/\s+/g, '');
  return FINTECH.includes(c) || FINTECH_RE.some(r => r.test(c));
}

function parseTime(t) {
  const parts = String(t || '00:00').split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

export function isScheduleActive(sc) {
  if (!sc || !sc.active) {return false;}
  const now = new Date();
  if (!Array.isArray(sc.days) || !sc.days.includes(now.getDay())) {return false;}
  const start = parseTime(sc.startTime);
  const end = parseTime(sc.endTime);
  if (start > end) {return now >= start || now <= end;}
  return now >= start && now <= end;
}

export function shouldBlock(phone, type, store) {
  if (!phone) {return {blocked: false};}
  if (isFintechNumber(phone)) {return {blocked: false, reason: 'fintech'};}
  const {shieldActive, shieldMode, whitelist = [], schedules = [], settings = {}} = store;
  const on = shieldMode === 'manual'
    ? shieldActive
    : (schedules || []).some(s => s.active && isScheduleActive(s));
  if (!on) {return {blocked: false, reason: 'shield_off'};}
  const clean = String(phone).replace(/\s+/g, '').replace(/^\+254/, '0');
  const wl = (whitelist || []).find(c => {
    const cp = String(c.phone || '').replace(/\s+/g, '').replace(/^\+254/, '0');
    return cp === clean || c.phone === phone;
  });
  if (wl) {
    if (type === 'call' && wl.allowCalls !== false) {return {blocked: false, reason: 'whitelisted'};}
    if (type === 'sms' && wl.allowSMS !== false) {return {blocked: false, reason: 'whitelisted'};}
    return {blocked: true, reason: 'wl_blocked'};
  }
  if (type === 'call' && !settings.blockCalls) {return {blocked: false};}
  if (type === 'sms' && !settings.blockSMS) {return {blocked: false};}
  return {blocked: true, reason: 'blocked'};
}

export function formatSchedule(sc) {
  const D = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const days = Array.isArray(sc.days) ? sc.days.map(d => D[d] || '').join(', ') : '';
  return days + ' · ' + (sc.startTime || '') + ' – ' + (sc.endTime || '');
}

let _tick = null;
export function startScheduleWatcher(hook) {
  if (_tick) {return;}
  _tick = setInterval(() => {
    try {
      const st = hook.getState();
      if (st.shieldMode !== 'scheduled') {return;}
      const active = (st.schedules || []).some(s => s.active && isScheduleActive(s));
      if (active && !st.shieldActive) {st.activateShield();}
      else if (!active && st.shieldActive) {st.deactivateShield();}
    } catch (e) {}
  }, 30000);
}
