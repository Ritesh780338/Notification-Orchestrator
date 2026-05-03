/* ============================================================
   NotifyHub Orchestrator — app.js
   Pure vanilla JS, no dependencies.
   Connects to a REST API at /api/*
   ============================================================ */

'use strict';

// ─── Config ──────────────────────────────────────────────────────────────────

const API_BASE = '/api';

const EVENT_TYPES = [
  { value: 'user_signup',         label: 'User Signup',         emoji: '👤' },
  { value: 'order_confirmation',  label: 'Order Confirmation',  emoji: '📦' },
  { value: 'password_reset',      label: 'Password Reset',      emoji: '🔑' },
  { value: 'marketing',           label: 'Marketing',           emoji: '📣' },
  { value: 'security_alert',      label: 'Security Alert',      emoji: '🔒' },
  { value: 'system_notification', label: 'System Notification', emoji: '⚙️' },
];

const CHANNELS = ['email', 'sms', 'push', 'inapp'];

const CHANNEL_ICONS = { email: '✉', sms: '💬', push: '📱', inapp: '🔔' };

const PRIORITIES = [
  { value: 'low',    label: '🟢 Low'    },
  { value: 'normal', label: '🔵 Normal' },
  { value: 'high',   label: '🟠 High'   },
  { value: 'urgent', label: '🔴 Urgent' },
];

const DEMO_SCENARIOS = [
  {
    id: 's1', title: 'New User Welcome', icon: '👤', color: '#6366f1',
    userId: 'user_001', eventType: 'user_signup', channels: ['email', 'push'],
    priority: 'normal', metadata: { first_name: 'Priya', plan: 'Pro' },
  },
  {
    id: 's2', title: 'Order Placed', icon: '📦', color: '#f59e0b',
    userId: 'user_042', eventType: 'order_confirmation', channels: ['email', 'sms'],
    priority: 'high', metadata: { order_id: 'ORD-7821', amount: '₹2,499' },
  },
  {
    id: 's3', title: 'Password Reset', icon: '🔑', color: '#ec4899',
    userId: 'user_077', eventType: 'password_reset', channels: ['email'],
    priority: 'urgent', metadata: { first_name: 'Arjun', reset_link: 'https://example.com/reset/tok123' },
  },
  {
    id: 's4', title: 'Security Alert', icon: '🔒', color: '#ef4444',
    userId: 'user_099', eventType: 'security_alert', channels: ['email', 'sms', 'push'],
    priority: 'urgent', metadata: { location: 'Mumbai, IN', device: 'iPhone 15' },
  },
  {
    id: 's5', title: 'Marketing Blast', icon: '📣', color: '#10b981',
    userId: 'user_200', eventType: 'marketing', channels: ['email', 'inapp'],
    priority: 'low', metadata: { campaign: 'Diwali Sale', discount: '30%' },
  },
];

const QUICK_TESTS = [
  { id: 'qt1', title: 'Email — Welcome',   channel: 'email', event: 'user_signup',         priority: 'normal', icon: '✉',  color: '#6366f1' },
  { id: 'qt2', title: 'SMS — Order',       channel: 'sms',   event: 'order_confirmation',  priority: 'high',   icon: '💬', color: '#f59e0b' },
  { id: 'qt3', title: 'Push — Alert',      channel: 'push',  event: 'security_alert',      priority: 'urgent', icon: '📱', color: '#ef4444' },
  { id: 'qt4', title: 'In-App — System',   channel: 'inapp', event: 'system_notification', priority: 'low',    icon: '🔔', color: '#10b981' },
  { id: 'qt5', title: 'Multi — Marketing', channel: 'all',   event: 'marketing',           priority: 'normal', icon: '📣', color: '#ec4899' },
  { id: 'qt6', title: 'Urgent — Password', channel: 'email', event: 'password_reset',      priority: 'urgent', icon: '🔑', color: '#8b5cf6' },
];

const PREF_EVENTS = [
  'user_signup', 'order_confirmation', 'password_reset',
  'marketing', 'security_alert', 'system_notification',
];

const PAGE_META = {
  dashboard:   { title: 'Dashboard',        sub: 'System overview & analytics'  },
  send:        { title: 'Send Notification', sub: 'Compose & dispatch messages'  },
  quicktest:   { title: 'Quick Test',        sub: 'Fire pre-configured tests'    },
  preferences: { title: 'User Preferences', sub: 'Manage notification settings' },
  templates:   { title: 'Templates',        sub: 'Create & manage templates'    },
  status:      { title: 'Check Status',     sub: 'Track delivery in real-time'  },
};

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  activeTab: 'dashboard',
  lastEventId: null,
  prefMatrix: {},   // { eventType: { channel: bool } }
  templates: [],
  dashStats: null,
  dashActivity: [],
};

// ─── API Helper ───────────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  console.log(`[API] Request: ${options.method || 'GET'} ${API_BASE}${path}`);
  if (options.body) {
    console.log('[API] Request Body:', options.body);
  }
  
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    
    console.log(`[API] Response Status: ${res.status} ${res.statusText}`);
    
    const contentType = res.headers.get('content-type');
    console.log('[API] Response Content-Type:', contentType);
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('[API] Non-JSON Response:', text.substring(0, 200));
      throw new Error(`Server returned HTML instead of JSON. Expected endpoint: ${API_BASE}${path}`);
    }
    
    const json = await res.json();
    console.log('[API] Response Data:', json);
    
    if (!res.ok) {
      const errorMsg = json.message || json.error || res.statusText;
      console.error('[API] Error Response:', errorMsg);
      throw new Error(errorMsg);
    }
    
    return { ok: true, data: json };
  } catch (e) {
    console.error('[API] Request Failed:', e);
    return { ok: false, error: e.message };
  }
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function showToast(msg, type = 'info') {
  console.log(`[Toast] ${type.toUpperCase()}: ${msg}`);
  
  const container = document.getElementById('toast-container');
  if (!container) {
    console.error('[Toast] toast-container not found!');
    return;
  }
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${msg}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-visible'));
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => toast.remove(), 350);
  }, 3200);
}

// ─── Navigation ───────────────────────────────────────────────────────────────

function switchTab(tabId) {
  state.activeTab = tabId;

  // Update nav
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  // Update tab panels
  document.querySelectorAll('.tab-content').forEach(el => {
    el.classList.toggle('active', el.id === tabId);
  });

  // Update topbar
  const meta = PAGE_META[tabId] || {};
  document.getElementById('page-title').textContent    = meta.title || tabId;
  document.getElementById('page-subtitle').textContent = meta.sub || '';

  // Load data when switching to certain tabs
  if (tabId === 'dashboard') loadDashboardStats();
  if (tabId === 'templates') loadTemplates();
}

// ─── API Status Check ─────────────────────────────────────────────────────────

async function checkApiStatus() {
  const el = document.getElementById('api-status');
  const res = await apiFetch('/health');
  const ok  = res.ok;
  el.className = `api-status ${ok ? 'ok' : 'err'}`;
  el.innerHTML = `<span class="status-dot"></span><span>${ok ? 'API Connected' : 'API Offline'}</span>`;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

async function loadDashboardStats() {
  const res = await apiFetch('/notifications/stats');
  if (!res.ok) return;

  const s = res.data;
  state.dashStats = s;

  const byStatus = s.by_status || {};
  setText('total-notifications', s.total ?? '—');
  setText('delivered-count',     byStatus.delivered ?? '—');
  setText('pending-count',       byStatus.pending ?? '—');
  setText('failed-count',        byStatus.failed ?? '—');

  renderEventTypeChart(s.by_event_type || {});
  renderChannelChart(s.by_channel || {});
  await loadRecentActivity();
}

function renderEventTypeChart(byType) {
  const el  = document.getElementById('event-type-chart');
  const max = Math.max(...Object.values(byType), 1);
  const colors = ['#6366f1','#f59e0b','#ec4899','#10b981','#ef4444','#8b5cf6'];

  if (!Object.keys(byType).length) {
    el.innerHTML = '<p class="empty-chart">No data yet</p>';
    return;
  }

  el.innerHTML = Object.entries(byType).map(([k, v], i) => `
    <div class="mini-bar-row">
      <span class="mini-bar-label">${k.replace(/_/g, ' ')}</span>
      <div class="mini-bar-track">
        <div class="mini-bar-fill" style="width:${Math.round(v/max*100)}%;background:${colors[i % colors.length]}"></div>
      </div>
      <span class="mini-bar-val">${v}</span>
    </div>
  `).join('');
}

function renderChannelChart(byCh) {
  const el  = document.getElementById('channel-chart');
  const max = Math.max(...Object.values(byCh), 1);
  const colors = { email:'#6366f1', sms:'#f59e0b', push:'#ec4899', inapp:'#10b981' };

  if (!Object.keys(byCh).length) {
    el.innerHTML = '<p class="empty-chart">No data yet</p>';
    return;
  }

  el.innerHTML = Object.entries(byCh).map(([k, v]) => `
    <div class="mini-bar-row">
      <span class="mini-bar-label">${CHANNEL_ICONS[k] || ''} ${k}</span>
      <div class="mini-bar-track">
        <div class="mini-bar-fill" style="width:${Math.round(v/max*100)}%;background:${colors[k]||'#6366f1'}"></div>
      </div>
      <span class="mini-bar-val">${v}</span>
    </div>
  `).join('');
}

async function loadRecentActivity() {
  const el  = document.getElementById('recent-activity');
  const res = await apiFetch('/notifications/recent');
  if (!res.ok) { el.innerHTML = `<div class="empty-state"><span>⚠</span><p>${res.error}</p></div>`; return; }

  const items = res.data?.notifications || res.data || [];
  if (!items.length) {
    el.innerHTML = '<div class="empty-state"><span>📭</span><p>No recent activity</p></div>';
    return;
  }

  el.innerHTML = items.map(item => `
    <div class="activity-item">
      <span class="activity-icon">${CHANNEL_ICONS[item.channel] || '🔔'}</span>
      <div class="activity-body">
        <span class="activity-user">${escHtml(item.user_id)}</span>
        <span class="activity-type">${escHtml(item.event_type)}</span>
      </div>
      <span class="activity-status status-${escHtml(item.status)}">${escHtml(item.status)}</span>
      <span class="activity-time">${item.created_at ? new Date(item.created_at).toLocaleTimeString() : ''}</span>
    </div>
  `).join('');
}

// ─── Send Notification Tab ────────────────────────────────────────────────────

function initSendTab() {
  console.log('[InitSendTab] Initializing Send Notification tab');
  
  // Render scenario cards
  const list = document.getElementById('scenario-list');
  if (!list) {
    console.error('[InitSendTab] scenario-list element not found!');
    return;
  }
  
  list.innerHTML = DEMO_SCENARIOS.map(s => `
    <button class="scenario-card" data-id="${s.id}">
      <span class="scenario-icon" style="background:${s.color}22;color:${s.color}">${s.icon}</span>
      <div class="scenario-body">
        <strong>${escHtml(s.title)}</strong>
        <span>${escHtml(s.eventType)}</span>
      </div>
      <span class="scenario-channels">${s.channels.map(c => CHANNEL_ICONS[c]).join(' ')}</span>
    </button>
  `).join('');
  
  console.log('[InitSendTab] Rendered', DEMO_SCENARIOS.length, 'scenario cards');

  list.addEventListener('click', e => {
    const btn = e.target.closest('[data-id]');
    if (!btn) return;
    const s = DEMO_SCENARIOS.find(x => x.id === btn.dataset.id);
    if (s) fillSendForm(s);
  });

  // Channel chip toggle
  document.querySelectorAll('.channel-chip').forEach(chip => {
    chip.addEventListener('click', () => chip.classList.toggle('checked'));
  });

  // Format JSON btn
  window.formatJSON = () => {
    const ta = document.getElementById('metadata');
    try {
      ta.value = JSON.stringify(JSON.parse(ta.value), null, 2);
    } catch { showToast('Invalid JSON', 'error'); }
  };

  // Select all channels
  window.selectAllChannels = () => {
    document.querySelectorAll('.channel-chip').forEach(chip => chip.classList.add('checked'));
    document.querySelectorAll('.channel-chip input').forEach(cb => cb.checked = true);
  };

  // Auto-fill demo
  window.autoFillForm = () => {
    console.log('[AutoFill] Button clicked');
    console.log('[AutoFill] Using scenario:', DEMO_SCENARIOS[0]);
    try {
      fillSendForm(DEMO_SCENARIOS[0]);
      showToast('Form auto-filled successfully!', 'success');
    } catch (error) {
      console.error('[AutoFill] Error:', error);
      showToast(`Auto-fill failed: ${error.message}`, 'error');
    }
  };

  // Reset
  window.resetForm = () => {
    document.getElementById('send-notification-form').reset();
    document.querySelectorAll('.channel-chip').forEach(chip => {
      chip.classList.toggle('checked', chip.dataset.channel === 'email');
    });
    document.getElementById('send-result').style.display = 'none';
  };

  // Form submit
  document.getElementById('send-notification-form').addEventListener('submit', handleSendSubmit);
}

function fillSendForm(s) {
  console.log('[FillForm] Starting to fill form with:', s);
  
  try {
    const userIdEl = document.getElementById('user-id');
    const eventTypeEl = document.getElementById('event-type');
    const priorityEl = document.getElementById('priority');
    const metadataEl = document.getElementById('metadata');
    
    if (!userIdEl) throw new Error('User ID field not found');
    if (!eventTypeEl) throw new Error('Event Type field not found');
    if (!priorityEl) throw new Error('Priority field not found');
    if (!metadataEl) throw new Error('Metadata field not found');
    
    userIdEl.value = s.userId;
    eventTypeEl.value = s.eventType;
    priorityEl.value = s.priority;
    metadataEl.value = JSON.stringify(s.metadata, null, 2);
    
    console.log('[FillForm] Basic fields filled');

    document.querySelectorAll('.channel-chip').forEach(chip => {
      const ch = chip.dataset.channel;
      const on = s.channels.includes(ch);
      chip.classList.toggle('checked', on);
      const input = chip.querySelector('input');
      if (input) input.checked = on;
    });
    
    console.log('[FillForm] Channels configured:', s.channels);

    switchTab('send');
    console.log('[FillForm] Switched to send tab');
  } catch (error) {
    console.error('[FillForm] Error filling form:', error);
    throw error;
  }
}

async function handleSendSubmit(e) {
  e.preventDefault();
  console.log('[SendForm] Form submitted');
  
  const userId    = document.getElementById('user-id').value.trim();
  const eventType = document.getElementById('event-type').value;
  const priority  = document.getElementById('priority').value;
  const metaRaw   = document.getElementById('metadata').value.trim();
  const schedTime = document.getElementById('schedule-time').value;

  const channels = [...document.querySelectorAll('.channel-chip.checked')]
    .map(c => c.dataset.channel);

  console.log('[SendForm] Form values:', { userId, eventType, priority, channels, metaRaw });

  if (!userId)        return showToast('❌ User ID is required', 'error');
  if (!eventType)     return showToast('❌ Select an event type', 'error');
  if (!channels.length) return showToast('❌ Select at least one channel', 'error');

  let metadata = {};
  if (metaRaw) {
    try { 
      metadata = JSON.parse(metaRaw);
      console.log('[SendForm] Parsed metadata:', metadata);
    }
    catch (err) { 
      console.error('[SendForm] Invalid JSON:', err);
      return showToast('❌ Invalid JSON in metadata', 'error'); 
    }
  }

  const btn = document.getElementById('send-btn');
  btn.disabled   = true;
  btn.textContent = 'Sending…';

  const body = { user_id: userId, event_type: eventType, priority, preferred_channels: channels, metadata };
  if (schedTime) body.schedule_time = schedTime;

  console.log('[SendForm] Sending request with body:', body);

  const res = await apiFetch('/notifications/events', { method: 'POST', body: JSON.stringify(body) });

  btn.disabled   = false;
  btn.innerHTML  = '<i class="fas fa-paper-plane"></i> Send Notification';

  const resultEl = document.getElementById('send-result');
  resultEl.style.display = 'block';

  if (res.ok) {
    console.log('[SendForm] Response:', res.data);
    state.lastEventId = res.data?.event_id || null;
    showToast('✅ Notification sent successfully!', 'success');
    resultEl.className = 'result-box result-success';
    resultEl.innerHTML = `<strong>✓ Sent successfully!</strong><pre>${escHtml(JSON.stringify(res.data, null, 2))}</pre>`;
  } else {
    console.error('[SendForm] Error:', res.error);
    showToast(`❌ ${res.error}`, 'error');
    resultEl.className = 'result-box result-error';
    resultEl.innerHTML = `<strong>✕ Error:</strong> ${escHtml(res.error)}<br><small>Check browser console (F12) for details</small>`;
  }
}

// ─── Quick Test Tab ───────────────────────────────────────────────────────────

function initQuickTestTab() {
  const grid = document.getElementById('quicktest-grid');
  grid.innerHTML = QUICK_TESTS.map(qt => `
    <div class="quicktest-card" style="--accent:${qt.color}" data-qt="${qt.id}">
      <span class="qt-icon" style="color:${qt.color}">${qt.icon}</span>
      <div class="qt-body">
        <strong>${escHtml(qt.title)}</strong>
        <span>${qt.priority} · ${qt.channel}</span>
      </div>
      <button class="btn btn-sm btn-primary qt-run-btn" data-qt="${qt.id}">Run</button>
    </div>
  `).join('');

  grid.addEventListener('click', e => {
    const btn = e.target.closest('.qt-run-btn');
    if (!btn) return;
    const qt = QUICK_TESTS.find(x => x.id === btn.dataset.qt);
    if (qt) runQuickTest(qt, btn);
  });

  window.sendAllNotifications = () => QUICK_TESTS.forEach(qt => {
    const btn = document.querySelector(`.qt-run-btn[data-qt="${qt.id}"]`);
    runQuickTest(qt, btn);
  });

  window.sendAllChannels = () => {
    QUICK_TESTS.filter(q => q.channel !== 'all').forEach(qt => {
      const btn = document.querySelector(`.qt-run-btn[data-qt="${qt.id}"]`);
      runQuickTest(qt, btn);
    });
  };

  window.sendAllPriorities = () => {
    [...QUICK_TESTS].sort((a,b) => a.priority.localeCompare(b.priority)).forEach(qt => {
      const btn = document.querySelector(`.qt-run-btn[data-qt="${qt.id}"]`);
      runQuickTest(qt, btn);
    });
  };

  window.clearLog = () => {
    document.getElementById('log-entries').innerHTML = '';
    document.getElementById('quicktest-log').style.display = 'none';
  };
}

async function runQuickTest(qt, btn) {
  console.log('[QuickTest] Starting test:', qt.title);
  
  if (btn) { btn.disabled = true; btn.textContent = '…'; }

  addLogEntry(`Sending: ${qt.title}…`, 'info');

  const payload = {
    user_id: `test_user_${qt.id}`,
    event_type: qt.event,
    priority: qt.priority,
    preferred_channels: qt.channel === 'all' ? CHANNELS : [qt.channel],
    metadata: { test: true, suite: qt.title },
  };
  
  console.log('[QuickTest] Payload:', payload);

  const res = await apiFetch('/notifications/events', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (btn) { btn.disabled = false; btn.textContent = 'Run'; }

  if (res.ok) {
    console.log('[QuickTest] Success:', res.data);
    addLogEntry(`✓ ${qt.title} — ${res.data?.event_id ?? 'sent'}`, 'success');
    showToast(`${qt.title} sent!`, 'success');
  } else {
    console.error('[QuickTest] Failed:', res.error);
    addLogEntry(`✕ ${qt.title} — ${res.error}`, 'error');
    showToast(`Failed: ${res.error}`, 'error');
  }
}

function addLogEntry(msg, type) {
  const log = document.getElementById('quicktest-log');
  log.style.display = 'block';
  const entries = document.getElementById('log-entries');
  const row = document.createElement('div');
  row.className = `log-entry log-${type}`;
  row.innerHTML = `<span class="log-time">${new Date().toLocaleTimeString()}</span><span>${escHtml(msg)}</span>`;
  entries.appendChild(row);
  entries.scrollTop = entries.scrollHeight;
}

// ─── Preferences Tab ──────────────────────────────────────────────────────────

function initPreferencesTab() {
  // Init matrix state
  PREF_EVENTS.forEach(evt => {
    state.prefMatrix[evt] = {};
    CHANNELS.forEach(ch => state.prefMatrix[evt][ch] = true);
  });

  document.getElementById('load-preferences').addEventListener('click', () => {
    const uid = document.getElementById('pref-user-id').value.trim();
    loadPreferences(uid);
  });

  document.getElementById('pref-user-id').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('load-preferences').click();
  });

  document.getElementById('preferences-form').addEventListener('submit', savePreferences);
}

async function loadPreferences(uid) {
  if (!uid) return showToast('Enter a User ID', 'error');

  const res = await apiFetch(`/users/${uid}/preferences`);
  if (!res.ok) return showToast(res.error, 'error');

  const p = res.data;
  document.getElementById('pref-email').value         = p.email || '';
  document.getElementById('pref-phone').value         = p.phone || '';
  document.getElementById('quiet-hours-enabled').checked = p.quiet_hours?.enabled ?? false;
  document.getElementById('quiet-start').value        = p.quiet_hours?.start ?? 22;
  document.getElementById('quiet-end').value          = p.quiet_hours?.end ?? 7;
  document.getElementById('global-opt-out').checked   = p.global_opt_out ?? false;

  if (p.channels) state.prefMatrix = p.channels;
  renderPreferencesMatrix();

  document.getElementById('preferences-form-container').style.display = 'block';
  showToast('Preferences loaded', 'success');
}

function renderPreferencesMatrix() {
  const grid = document.getElementById('preferences-grid');

  const header = `
    <div class="matrix-header">
      <span>Event Type</span>
      ${CHANNELS.map(c => `<span>${CHANNEL_ICONS[c]}<br><small>${c}</small></span>`).join('')}
    </div>`;

  const rows = PREF_EVENTS.map(evt => `
    <div class="matrix-row">
      <span class="matrix-event">${evt.replace(/_/g, ' ')}</span>
      ${CHANNELS.map(ch => `
        <button type="button"
          class="matrix-toggle ${state.prefMatrix[evt]?.[ch] ? 'on' : 'off'}"
          data-evt="${evt}" data-ch="${ch}">
          ${state.prefMatrix[evt]?.[ch] ? '●' : '○'}
        </button>
      `).join('')}
    </div>
  `).join('');

  grid.innerHTML = header + rows;

  grid.addEventListener('click', e => {
    const btn = e.target.closest('.matrix-toggle');
    if (!btn) return;
    const { evt, ch } = btn.dataset;
    state.prefMatrix[evt][ch] = !state.prefMatrix[evt][ch];
    btn.className = `matrix-toggle ${state.prefMatrix[evt][ch] ? 'on' : 'off'}`;
    btn.textContent = state.prefMatrix[evt][ch] ? '●' : '○';
  });
}

async function savePreferences(e) {
  e.preventDefault();
  const uid = document.getElementById('pref-user-id').value.trim();
  if (!uid) return showToast('User ID missing', 'error');

  const payload = {
    email:      document.getElementById('pref-email').value,
    phone:      document.getElementById('pref-phone').value,
    quiet_hours: {
      enabled: document.getElementById('quiet-hours-enabled').checked,
      start:   +document.getElementById('quiet-start').value,
      end:     +document.getElementById('quiet-end').value,
    },
    global_opt_out: document.getElementById('global-opt-out').checked,
    channels:     state.prefMatrix,
  };

  const res = await apiFetch(`/users/${uid}/preferences`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  const resultEl = document.getElementById('preferences-result');
  resultEl.style.display = 'block';

  if (res.ok) {
    showToast('Preferences saved ✓', 'success');
    resultEl.className = 'result-box result-success';
    resultEl.innerHTML = `<strong>✓ Saved!</strong><pre>${escHtml(JSON.stringify(res.data, null, 2))}</pre>`;
  } else {
    showToast(res.error, 'error');
    resultEl.className = 'result-box result-error';
    resultEl.innerHTML = `<strong>✕ Error:</strong> ${escHtml(res.error)}`;
  }
}

// ─── Templates Tab ────────────────────────────────────────────────────────────

function initTemplatesTab() {
  document.getElementById('show-template-form').addEventListener('click', () => {
    const container = document.getElementById('template-form-container');
    const visible   = container.style.display !== 'none';
    container.style.display = visible ? 'none' : 'block';
    document.getElementById('show-template-form').innerHTML = visible
      ? '<i class="fas fa-plus"></i> New Template'
      : '✕ Cancel';
  });

  document.getElementById('cancel-template').addEventListener('click', () => {
    document.getElementById('template-form-container').style.display = 'none';
    document.getElementById('show-template-form').innerHTML = '<i class="fas fa-plus"></i> New Template';
  });

  document.getElementById('template-form').addEventListener('submit', handleTemplateSave);
}

async function loadTemplates() {
  const res = await apiFetch('/templates');
  if (!res.ok) return;

  state.templates = res.data?.templates || res.data || [];
  document.getElementById('template-count').textContent =
    `${state.templates.length} template${state.templates.length !== 1 ? 's' : ''}`;
  renderTemplatesList();
}

function renderTemplatesList() {
  const list = document.getElementById('templates-list');
  if (!state.templates.length) {
    list.innerHTML = '<div class="empty-state"><span>⊞</span><p>No templates yet. Create one above.</p></div>';
    return;
  }

  list.innerHTML = state.templates.map(tpl => `
    <div class="template-card">
      <div class="tpl-header">
        <span class="tpl-channel">${CHANNEL_ICONS[tpl.channel] || '◈'} ${escHtml(tpl.channel)}</span>
        <span class="tpl-event">${escHtml(tpl.event_type)}</span>
      </div>
      <h4>${escHtml(tpl.name)}</h4>
      <p class="tpl-id">${escHtml(tpl.template_id)}</p>
      ${tpl.subject ? `<p class="tpl-subject">"${escHtml(tpl.subject)}"</p>` : ''}
      <p class="tpl-preview">${escHtml((tpl.body || '').slice(0, 80))}${tpl.body?.length > 80 ? '…' : ''}</p>
      ${tpl.variables?.length ? `<div class="tpl-vars">${tpl.variables.map(v => `<span class="var-chip">{{${escHtml(v)}}}</span>`).join('')}</div>` : ''}
      <div class="tpl-actions">
        <button class="btn btn-xs btn-danger tpl-delete-btn" data-id="${escHtml(tpl.template_id)}">Delete</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.tpl-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this template?')) return;
      const res = await apiFetch(`/templates/${btn.dataset.id}`, { method: 'DELETE' });
      if (res.ok) { showToast('Template deleted', 'success'); loadTemplates(); }
      else showToast(res.error, 'error');
    });
  });
}

async function handleTemplateSave(e) {
  e.preventDefault();
  const varRaw = document.getElementById('template-variables').value;
  const payload = {
    template_id: document.getElementById('template-id').value.trim(),
    name:       document.getElementById('template-name').value.trim(),
    channel:    document.getElementById('template-channel').value,
    event_type:  document.getElementById('template-event-type').value.trim(),
    subject:    document.getElementById('template-subject').value.trim(),
    body:       document.getElementById('template-body').value.trim(),
    variables:  varRaw.split(',').map(v => v.trim()).filter(Boolean),
  };

  const res = await apiFetch('/templates', { method: 'POST', body: JSON.stringify(payload) });
  if (res.ok) {
    showToast('Template saved ✓', 'success');
    document.getElementById('template-form').reset();
    document.getElementById('template-form-container').style.display = 'none';
    document.getElementById('show-template-form').innerHTML = '<i class="fas fa-plus"></i> New Template';
    loadTemplates();
  } else {
    showToast(res.error, 'error');
  }
}

// ─── Status Tab ───────────────────────────────────────────────────────────────

function initStatusTab() {
  document.getElementById('check-status').addEventListener('click', checkNotificationStatus);
  document.getElementById('status-id').addEventListener('keydown', e => {
    if (e.key === 'Enter') checkNotificationStatus();
  });

  window.pasteLastEventId = () => {
    if (state.lastEventId) {
      document.getElementById('status-id').value = state.lastEventId;
    } else {
      showToast('No recent event ID available', 'info');
    }
  };
}

async function checkNotificationStatus() {
  const id = document.getElementById('status-id').value.trim();
  if (!id) return showToast('Enter an Event or Notification ID', 'error');

  const btn = document.getElementById('check-status');
  btn.disabled = true;
  btn.textContent = 'Tracking…';

  const res = await apiFetch(`/notifications/${id}/status`);

  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-search"></i> Track';

  const resultEl = document.getElementById('status-result');
  resultEl.style.display = 'block';

  if (!res.ok) {
    resultEl.innerHTML = `<div class="result-box result-error"><strong>✕ Not found:</strong> ${escHtml(res.error)}</div>`;
    return;
  }

  const d = res.data;
  const notifications = d.notifications || [];

  resultEl.innerHTML = `
    <div class="status-overview">
      <div class="status-meta">
        <span class="status-badge status-${escHtml(d.status)}">${escHtml(d.status || 'unknown')}</span>
        <span class="status-event-id">${escHtml(d.event_id || id)}</span>
        <span class="status-ts">${d.created_at ? new Date(d.created_at).toLocaleString() : ''}</span>
      </div>
      <div class="status-info-grid">
        <div><label>User</label><span>${escHtml(d.user_id || '—')}</span></div>
        <div><label>Event Type</label><span>${escHtml(d.event_type || '—')}</span></div>
        <div><label>Priority</label><span>${escHtml(d.priority || '—')}</span></div>
        <div><label>Channels</label><span>${(d.channels || []).join(', ') || '—'}</span></div>
      </div>
    </div>
    ${notifications.length ? `
      <h4 class="status-delivery-title">Delivery Status per Channel</h4>
      <div class="delivery-list">
        ${notifications.map(n => `
          <div class="delivery-item">
            <span class="delivery-ch">${CHANNEL_ICONS[n.channel] || '◈'} ${escHtml(n.channel)}</span>
            <span class="activity-status status-${escHtml(n.status)}">${escHtml(n.status)}</span>
            <span class="delivery-ts">${n.sent_at ? new Date(n.sent_at).toLocaleTimeString() : ''}</span>
            ${n.error_message ? `<span class="delivery-err">${escHtml(n.error_message)}</span>` : ''}
          </div>
        `).join('')}
      </div>
    ` : ''}
    ${d.metadata ? `<details class="status-meta-details"><summary>Metadata</summary><pre>${escHtml(JSON.stringify(d.metadata, null, 2))}</pre></details>` : ''}
  `;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init() {
  console.log('=== NotifyHub Orchestrator Initializing ===');
  console.log('[Init] API Base:', API_BASE);
  console.log('[Init] Demo Scenarios:', DEMO_SCENARIOS.length);
  
  // Nav listeners
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  console.log('[Init] Navigation listeners attached');

  // Topbar refresh button
  document.querySelector('.topbar-right .btn-outline')?.addEventListener('click', () => {
    if (state.activeTab === 'dashboard') loadDashboardStats();
    else if (state.activeTab === 'templates') loadTemplates();
  });

  // Init each tab
  console.log('[Init] Initializing tabs...');
  initSendTab();
  initQuickTestTab();
  initPreferencesTab();
  initTemplatesTab();
  initStatusTab();
  console.log('[Init] All tabs initialized');

  // Verify autoFillForm is available
  if (typeof window.autoFillForm === 'function') {
    console.log('[Init] ✓ autoFillForm function is available');
  } else {
    console.error('[Init] ✗ autoFillForm function NOT available!');
  }

  // Load initial data
  checkApiStatus();
  loadDashboardStats();

  // Refresh API status every 30s
  setInterval(checkApiStatus, 30_000);
  
  console.log('=== NotifyHub Orchestrator Ready ===');
}

document.addEventListener('DOMContentLoaded', init);

// Global error handler
window.addEventListener('error', (event) => {
  console.error('[Global Error]', event.error);
  showToast(`❌ JavaScript Error: ${event.error?.message || 'Unknown error'}`, 'error');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise Rejection]', event.reason);
  showToast(`❌ Promise Error: ${event.reason?.message || event.reason}`, 'error');
});