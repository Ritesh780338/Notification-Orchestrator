/* ============================================================
   NotifyHub Orchestrator — app.js
   Pure vanilla JS, no dependencies.
   Connects to a REST API at /api/*
   ============================================================ */

'use strict';

// ─── Config ──────────────────────────────────────────────────────────────────
// API_BASE is now defined in config.js and loaded before this file

// Authentication state
const auth = {
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null')
};

// Check authentication on load
function checkAuth() {
  if (!auth.token || !auth.user) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

// Update user info in sidebar
function updateUserInfo() {
  if (auth.user) {
    const initials = auth.user.fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    document.querySelector('.author-avatar').textContent = initials;
    document.querySelector('.author-name').textContent = auth.user.fullName;
    document.querySelector('.author-id').textContent = auth.user.username;
  }
}

const EVENT_TYPES = [
  { value: 'user_signup',         label: 'User Signup',         emoji: '👤' },
  { value: 'order_confirmation',  label: 'Order Confirmation',  emoji: '📦' },
  { value: 'password_reset',      label: 'Password Reset',      emoji: '🔑' },
  { value: 'marketing',           label: 'Marketing',           emoji: '📣' },
  { value: 'security_alert',      label: 'Security Alert',      emoji: '🔒' },
  { value: 'system_notification', label: 'System Notification', emoji: '⚙️' },
];

const CHANNELS = ['email', 'sms', 'inapp'];

const CHANNEL_ICONS = { email: '✉', sms: '💬', inapp: '🔔' };

const PRIORITIES = [
  { value: 'low',    label: '🟢 Low'    },
  { value: 'normal', label: '🔵 Normal' },
  { value: 'high',   label: '🟠 High'   },
  { value: 'urgent', label: '🔴 Urgent' },
];

const PREF_EVENTS = [
  'user_signup', 'order_confirmation', 'password_reset',
  'marketing', 'security_alert', 'system_notification',
];

const PAGE_META = {
  dashboard:   { title: 'Dashboard',        sub: 'Your personal overview & analytics'  },
  users:       { title: 'Users',            sub: 'Manage and view all users'    },
  send:        { title: 'Send Notification', sub: 'Compose & dispatch messages'  },
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
  users: [],
  recentUsers: [],
};

// ─── API Helper ───────────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  console.log(`[API] Request: ${options.method || 'GET'} ${API_BASE}${path}`);
  if (options.body) {
    console.log('[API] Request Body:', options.body);
  }
  
  try {
    // Add authorization header if token exists
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (auth.token) {
      headers['Authorization'] = `Bearer ${auth.token}`;
    }
    
    const res = await fetch(`${API_BASE}${path}`, {
      headers,
      ...options,
    });
    
    console.log(`[API] Response Status: ${res.status} ${res.statusText}`);
    
    // Handle unauthorized
    if (res.status === 401 || res.status === 403) {
      console.error('[API] Unauthorized - redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login.html';
      return { ok: false, error: 'Session expired. Please login again.' };
    }
    
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
  if (tabId === 'users') loadAllUsers();
}

// ─── API Status Check ─────────────────────────────────────────────────────────

async function checkApiStatus() {
  const el = document.getElementById('api-status');
  
  try {
    const res = await apiFetch('/health');
    const ok = res.ok;
    
    el.className = `api-status ${ok ? 'ok' : 'err'}`;
    el.innerHTML = `<span class="status-dot"></span><span>${ok ? 'API Connected' : 'API Offline'}</span>`;
    
    if (ok) {
      console.log('[API Status] ✓ API is online');
    } else {
      console.error('[API Status] ✗ API is offline:', res.error);
    }
  } catch (error) {
    console.error('[API Status] ✗ Failed to check API status:', error);
    el.className = 'api-status err';
    el.innerHTML = '<span class="status-dot"></span><span>API Offline</span>';
  }
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

async function loadDashboardStats() {
  // Get current user's ID for filtering
  const userId = auth.user?.user_id || auth.user?._id;
  
  // Update dashboard header with user's name
  const userNameEl = document.getElementById('dashboard-user-name');
  if (userNameEl && auth.user) {
    userNameEl.textContent = auth.user.fullName || auth.user.username || 'Your';
  }
  
  // Fetch user-specific stats
  const url = userId ? `/notifications/stats?user_id=${userId}` : '/notifications/stats';
  const res = await apiFetch(url);
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
  
  console.log(`[Dashboard] Loaded stats for user: ${userId || 'all users'}`);
}

function renderEventTypeChart(byType) {
  const el  = document.getElementById('event-type-chart');
  const max = Math.max(...Object.values(byType), 1);
  const colors = ['#6366f1','#f59e0b','#ec4899','#10b981','#ef4444','#8b5cf6'];

  if (!Object.keys(byType).length) {
    el.innerHTML = '<p class="empty-chart">No notifications sent to you yet</p>';
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
    el.innerHTML = '<p class="empty-chart">No channel data yet</p>';
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
  const el = document.getElementById('recent-activity');
  
  // Get current user's ID for filtering
  const userId = auth.user?.user_id || auth.user?._id;
  
  // Fetch user-specific recent notifications
  const url = userId ? `/notifications/recent?user_id=${userId}&limit=10` : '/notifications/recent?limit=10';
  const res = await apiFetch(url);
  
  if (!res.ok) { 
    el.innerHTML = `<div class="empty-state"><span>⚠</span><p>${res.error}</p></div>`; 
    return; 
  }

  const items = res.data?.notifications || res.data || [];
  if (!items.length) {
    el.innerHTML = '<div class="empty-state"><span>📭</span><p>No recent activity for your account</p></div>';
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
  
  console.log(`[Dashboard] Loaded ${items.length} recent activities for user: ${userId || 'all users'}`);
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function initUsersTab() {
  document.getElementById('search-users').addEventListener('click', searchUsers);
  document.getElementById('user-search').addEventListener('keydown', e => {
    if (e.key === 'Enter') searchUsers();
  });

  window.loadAllUsers = loadAllUsers;
}

async function loadAllUsers() {
  console.log('[Users] Loading all users');
  const res = await apiFetch('/users?limit=100');
  
  if (!res.ok) {
    showToast(`Error loading users: ${res.error}`, 'error');
    return;
  }

  state.users = res.data?.users || [];
  state.recentUsers = state.users.slice(0, 5);
  renderUsersList(state.users);
  renderRecentUsers();
  showToast(`Loaded ${state.users.length} users`, 'success');
}

async function searchUsers() {
  const query = document.getElementById('user-search').value.trim();
  console.log('[Users] Searching for:', query);
  
  const url = query ? `/users?search=${encodeURIComponent(query)}&limit=100` : '/users?limit=100';
  const res = await apiFetch(url);
  
  if (!res.ok) {
    showToast(`Error searching users: ${res.error}`, 'error');
    return;
  }

  const users = res.data?.users || [];
  renderUsersList(users);
  showToast(`Found ${users.length} user(s)`, 'info');
}

function renderUsersList(users) {
  const grid = document.getElementById('users-grid');
  
  if (!users.length) {
    grid.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>No users found</p></div>';
    return;
  }

  grid.innerHTML = users.map(user => `
    <div class="user-card">
      <div class="user-avatar">${getInitials(user.fullName)}</div>
      <div class="user-info">
        <h4>${escHtml(user.fullName)}</h4>
        <p class="user-username">@${escHtml(user.username)}</p>
        <p class="user-email">${escHtml(user.email)}</p>
        <span class="user-role ${user.role === 'admin' ? 'role-admin' : 'role-user'}">${escHtml(user.role)}</span>
      </div>
      <div class="user-actions">
        <button class="btn btn-sm btn-primary" onclick="sendToUser('${escHtml(user.username)}', '${escHtml(user._id)}')">
          <i class="fas fa-paper-plane"></i> Send Notification
        </button>
        <button class="btn btn-sm btn-outline" onclick="viewUserPreferences('${escHtml(user._id)}')">
          <i class="fas fa-cog"></i> Preferences
        </button>
      </div>
    </div>
  `).join('');
}

function renderRecentUsers() {
  const list = document.getElementById('recent-users-list');
  
  if (!state.recentUsers.length) {
    list.innerHTML = '<div class="empty-state"><i class="fas fa-info-circle"></i><p>Go to Users tab to see all users</p></div>';
    return;
  }

  list.innerHTML = state.recentUsers.map(user => `
    <button class="scenario-card" onclick="sendToUser('${escHtml(user.username)}', '${escHtml(user._id)}')">
      <span class="scenario-icon" style="background:#6366f122;color:#6366f1">${getInitials(user.fullName)}</span>
      <div class="scenario-body">
        <strong>${escHtml(user.fullName)}</strong>
        <span>@${escHtml(user.username)}</span>
      </div>
      <i class="fas fa-arrow-right"></i>
    </button>
  `).join('');
}

function getInitials(name) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

window.sendToUser = function(username, userId) {
  console.log('[SendToUser]', username, userId);
  document.getElementById('user-id').value = username;
  switchTab('send');
  
  // Trigger user lookup to show confirmation
  lookupUser(username);
  
  showToast(`Ready to send to @${username}`, 'info');
};

window.viewUserPreferences = function(userId) {
  console.log('[ViewPreferences]', userId);
  document.getElementById('pref-user-id').value = userId;
  switchTab('preferences');
  document.getElementById('load-preferences').click();
};

// ─── Send Notification Tab ────────────────────────────────────────────────────

function initSendTab() {
  console.log('[InitSendTab] Initializing Send Notification tab');

  // User ID lookup with debounce
  let lookupTimeout;
  const userIdInput = document.getElementById('user-id');
  
  userIdInput.addEventListener('input', () => {
    clearTimeout(lookupTimeout);
    const value = userIdInput.value.trim();
    
    if (!value) {
      hideUserConfirmation();
      return;
    }
    
    // Debounce lookup
    lookupTimeout = setTimeout(() => {
      lookupUser(value);
    }, 500);
  });

  // Channel chip toggle - Simplified and fixed
  document.querySelectorAll('.channel-chip').forEach(chip => {
    const checkbox = chip.querySelector('input[type="checkbox"]');
    
    // Set initial visual state
    chip.classList.toggle('checked', checkbox.checked);
    
    // Update visual state when checkbox changes
    checkbox.addEventListener('change', () => {
      chip.classList.toggle('checked', checkbox.checked);
      console.log(`[Channel] ${checkbox.value}: ${checkbox.checked}`);
    });
  });

  // Format JSON btn
  window.formatJSON = () => {
    const ta = document.getElementById('metadata');
    try {
      ta.value = JSON.stringify(JSON.parse(ta.value), null, 2);
      showToast('JSON formatted', 'success');
    } catch { showToast('Invalid JSON', 'error'); }
  };

  // Select all channels
  window.selectAllChannels = () => {
    document.querySelectorAll('.channel-chip').forEach(chip => {
      const checkbox = chip.querySelector('input[type="checkbox"]');
      checkbox.checked = true;
      chip.classList.add('checked');
    });
    showToast('All channels selected', 'info');
  };

  // Load JSON template
  window.loadJsonTemplate = (template) => {
    const ta = document.getElementById('metadata');
    ta.value = JSON.stringify(template, null, 2);
    
    // Visual feedback
    ta.style.borderColor = 'var(--accent)';
    setTimeout(() => {
      ta.style.borderColor = '';
    }, 1000);
    
    showToast('Template loaded - modify as needed', 'success');
  };

  // Reset
  window.resetForm = () => {
    console.log('[ResetForm] Resetting form');
    document.getElementById('send-notification-form').reset();
    
    // Reset channel chips
    document.querySelectorAll('.channel-chip').forEach(chip => {
      const checkbox = chip.querySelector('input[type="checkbox"]');
      const isEmail = chip.dataset.channel === 'email';
      checkbox.checked = isEmail;
      chip.classList.toggle('checked', isEmail);
    });
    
    document.getElementById('send-result').style.display = 'none';
    hideUserConfirmation();
    showToast('Form reset', 'info');
  };

  // Form submit
  document.getElementById('send-notification-form').addEventListener('submit', handleSendSubmit);
}

async function lookupUser(identifier) {
  console.log('[LookupUser] Looking up:', identifier);
  
  try {
    const res = await apiFetch(`/users/${identifier}`);
    
    if (res.ok && res.data.user) {
      showUserConfirmation(res.data.user);
    } else {
      hideUserConfirmation();
    }
  } catch (error) {
    console.error('[LookupUser] Error:', error);
    hideUserConfirmation();
  }
}

function showUserConfirmation(user) {
  const confirmBox = document.getElementById('user-confirmation');
  document.getElementById('confirm-name').textContent = user.fullName || '—';
  document.getElementById('confirm-username').textContent = user.username || '—';
  document.getElementById('confirm-email').textContent = user.email || '—';
  confirmBox.style.display = 'block';
}

function hideUserConfirmation() {
  const confirmBox = document.getElementById('user-confirmation');
  confirmBox.style.display = 'none';
}

async function handleSendSubmit(e) {
  e.preventDefault();
  console.log('[SendForm] Form submitted');
  
  const userIdOrUsername = document.getElementById('user-id').value.trim();
  const eventType = document.getElementById('event-type').value;
  const priority  = document.getElementById('priority').value;
  const metaRaw   = document.getElementById('metadata').value.trim();
  const schedTime = document.getElementById('schedule-time').value;

  // Get checked channels from checkboxes, not from CSS class
  const channels = [...document.querySelectorAll('.channel-chip input[type="checkbox"]:checked')]
    .map(cb => cb.value);

  console.log('[SendForm] Form values:', { userIdOrUsername, eventType, priority, channels, metaRaw, schedTime });

  if (!userIdOrUsername) return showToast('❌ User ID or Username is required', 'error');
  if (!eventType)        return showToast('❌ Select an event type', 'error');
  if (!channels.length)  return showToast('❌ Select at least one channel', 'error');

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

  // Determine if it's a username or user_id (simple heuristic: if it contains @ or looks like username, treat as username)
  const isUsername = /^[a-zA-Z0-9_-]+$/.test(userIdOrUsername) && !userIdOrUsername.startsWith('user_');
  
  const body = { 
    event_type: eventType, 
    priority, 
    preferred_channels: channels, 
    metadata 
  };
  
  // Add either username or user_id
  if (isUsername) {
    body.username = userIdOrUsername;
  } else {
    body.user_id = userIdOrUsername;
  }
  
  // Convert datetime-local to ISO format if provided
  if (schedTime) {
    try {
      const schedDate = new Date(schedTime);
      if (isNaN(schedDate.getTime())) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Notification';
        return showToast('❌ Invalid schedule date/time format', 'error');
      }
      body.schedule_time = schedDate.toISOString();
      console.log('[SendForm] Schedule time converted:', schedTime, '->', body.schedule_time);
    } catch (err) {
      console.error('[SendForm] Invalid schedule time:', err);
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Notification';
      return showToast('❌ Invalid schedule date/time', 'error');
    }
  }

  console.log('[SendForm] Sending request with body:', body);

  const res = await apiFetch('/notifications/events', { method: 'POST', body: JSON.stringify(body) });

  btn.disabled   = false;
  btn.innerHTML  = '<i class="fas fa-paper-plane"></i> Send Notification';

  const resultEl = document.getElementById('send-result');
  resultEl.style.display = 'block';

  if (res.ok) {
    console.log('[SendForm] Response:', res.data);
    state.lastEventId = res.data?.event_id || null;
    
    // Get user email from confirmation box
    const recipientEmail = document.getElementById('confirm-email').textContent;
    const recipientName = document.getElementById('confirm-name').textContent;
    const selectedChannels = channels.join(', ');
    
    showToast('✅ Notification queued successfully!', 'success');
    resultEl.className = 'result-box result-success';
    resultEl.innerHTML = `
      <div style="margin-bottom: 1rem;">
        <strong style="color: #22c55e; font-size: 1.1rem;">✓ Notification Queued Successfully!</strong>
      </div>
      <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
        <div style="margin-bottom: 0.75rem;">
          <strong style="color: #94a3b8; display: block; margin-bottom: 0.25rem;">📧 Recipient:</strong>
          <div style="color: #e8eaf0; font-size: 1.05rem;">
            <div style="font-weight: 600;">${escHtml(recipientName)}</div>
            <div style="color: #6366f1; font-family: monospace; font-size: 0.95rem; margin-top: 0.25rem;">${escHtml(recipientEmail)}</div>
          </div>
        </div>
        <div style="margin-bottom: 0.75rem;">
          <strong style="color: #94a3b8; display: block; margin-bottom: 0.25rem;">📡 Channels:</strong>
          <div style="color: #e8eaf0;">${escHtml(selectedChannels)}</div>
        </div>
        <div style="margin-bottom: 0.75rem;">
          <strong style="color: #94a3b8; display: block; margin-bottom: 0.25rem;">🎯 Event Type:</strong>
          <div style="color: #e8eaf0;">${escHtml(eventType)}</div>
        </div>
        <div style="margin-bottom: 0.5rem;">
          <strong style="color: #94a3b8;">Event ID:</strong>
          <code style="color: #6366f1; background: rgba(99, 102, 247, 0.1); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.9rem; margin-left: 0.5rem;">${escHtml(res.data.event_id)}</code>
        </div>
        <div>
          <strong style="color: #94a3b8;">Status:</strong>
          <span style="color: #22c55e; font-weight: 600; text-transform: uppercase; margin-left: 0.5rem;">${escHtml(res.data.status)}</span>
        </div>
      </div>
      <div style="background: rgba(34, 197, 94, 0.1); border-left: 3px solid #22c55e; padding: 0.75rem; border-radius: 4px; font-size: 0.9rem; margin-bottom: 1rem;">
        <div style="color: #22c55e; font-weight: 600; margin-bottom: 0.25rem;">✅ What happens next:</div>
        <div style="color: #e8eaf0; line-height: 1.6;">
          • Email will be sent to: <strong>${escHtml(recipientEmail)}</strong><br>
          • Notification is being processed<br>
          • Check "Check Status" tab to track delivery
        </div>
      </div>
      <details style="cursor: pointer;">
        <summary style="color: #94a3b8; font-size: 0.85rem; cursor: pointer;">View technical details</summary>
        <pre style="margin-top: 0.5rem; font-size: 0.8rem; color: #7a8090; background: rgba(0,0,0,0.3); padding: 0.75rem; border-radius: 4px; overflow-x: auto;">${escHtml(JSON.stringify(res.data, null, 2))}</pre>
      </details>
    `;
  } else {
    console.error('[SendForm] Error:', res.error);
    showToast(`❌ ${res.error}`, 'error');
    resultEl.className = 'result-box result-error';
    resultEl.innerHTML = `<strong>✕ Error:</strong> ${escHtml(res.error)}<br><small>Check browser console (F12) for details</small>`;
  }
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
  if (!uid) return showToast('Enter a User ID or Username', 'error');

  console.log('[Preferences] Loading preferences for:', uid);
  const res = await apiFetch(`/users/${uid}/preferences`);
  if (!res.ok) return showToast(res.error, 'error');

  const p = res.data;
  console.log('[Preferences] Loaded:', p);
  
  document.getElementById('pref-email').value         = p.email || '';
  document.getElementById('pref-phone').value         = p.phone || '';
  document.getElementById('quiet-hours-enabled').checked = p.quiet_hours?.enabled ?? false;
  document.getElementById('quiet-start').value        = p.quiet_hours?.start ?? 22;
  document.getElementById('quiet-end').value          = p.quiet_hours?.end ?? 7;
  document.getElementById('global-opt-out').checked   = p.global_opt_out ?? false;

  if (p.channels) state.prefMatrix = p.channels;
  renderPreferencesMatrix();

  document.getElementById('preferences-form-container').style.display = 'block';
  showToast('Preferences loaded successfully', 'success');
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

// ─── Logout ───────────────────────────────────────────────────────────────────

async function handleLogout() {
  console.log('[Logout] User initiated logout');
  
  if (confirm('Are you sure you want to logout?')) {
    console.log('[Logout] Logout confirmed');
    showToast('Logging out...', 'info');
    
    try {
      // Call logout API
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('[Logout] API call failed:', error);
    }
    
    // Clear stored data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    
    // Redirect to login page
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 500);
  } else {
    console.log('[Logout] Logout cancelled');
  }
}

// ─── In-App Notifications ─────────────────────────────────────────────────────

let notificationCenterOpen = false;
let notificationCheckInterval = null;

/**
 * Toggle notification center visibility
 */
window.toggleNotificationCenter = async function() {
  const center = document.getElementById('notification-center');
  notificationCenterOpen = !notificationCenterOpen;
  
  if (notificationCenterOpen) {
    center.style.display = 'flex';
    await loadInAppNotifications();
  } else {
    center.style.display = 'none';
  }
};

/**
 * Load in-app notifications for current user
 */
async function loadInAppNotifications() {
  const body = document.getElementById('notification-center-body');
  body.innerHTML = '<div class="notification-center-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
  
  // Get user ID - try multiple fields
  const userId = auth.user?.user_id || auth.user?._id || auth.user?.username;
  
  console.log('[InApp] Loading notifications for user:', userId);
  console.log('[InApp] Auth user object:', auth.user);
  
  if (!userId) {
    body.innerHTML = '<div class="notification-center-empty"><i class="fas fa-exclamation-circle"></i><p>Please login to view notifications</p></div>';
    return;
  }
  
  const res = await apiFetch(`/inapp/notifications?user_id=${encodeURIComponent(userId)}&limit=50`);
  
  console.log('[InApp] API Response:', res);
  
  if (!res.ok || !res.data.notifications) {
    body.innerHTML = '<div class="notification-center-empty"><i class="fas fa-exclamation-circle"></i><p>Failed to load notifications</p></div>';
    return;
  }
  
  const notifications = res.data.notifications;
  
  console.log('[InApp] Loaded notifications:', notifications.length);
  
  if (notifications.length === 0) {
    body.innerHTML = '<div class="notification-center-empty"><i class="fas fa-bell-slash"></i><p>No notifications yet</p></div>';
    return;
  }
  
  body.innerHTML = notifications.map(notif => `
    <div class="notification-item ${notif.read ? '' : 'unread'}" data-id="${notif._id}">
      <div class="notification-item-header">
        <div class="notification-item-title">${escHtml(notif.title)}</div>
        <div class="notification-item-time">${formatTimeAgo(notif.created_at)}</div>
      </div>
      <div class="notification-item-body">${escHtml(notif.body)}</div>
      <div class="notification-item-meta">
        <span class="notification-item-type">
          <i class="fas fa-tag"></i> ${escHtml(notif.event_type)}
        </span>
        <span class="notification-item-priority ${notif.priority}">${notif.priority}</span>
      </div>
      <div class="notification-item-actions">
        ${!notif.read ? `<button class="btn btn-xs btn-primary" onclick="markNotificationRead('${notif._id}')">
          <i class="fas fa-check"></i> Mark Read
        </button>` : ''}
        <button class="btn btn-xs btn-ghost" onclick="deleteNotification('${notif._id}')">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    </div>
  `).join('');
}

/**
 * Check for unread notifications and update badge
 */
async function checkUnreadNotifications() {
  const userId = auth.user?.user_id || auth.user?._id || auth.user?.username;
  if (!userId) return;
  
  const res = await apiFetch(`/inapp/unread-count?user_id=${encodeURIComponent(userId)}`);
  
  if (res.ok && res.data) {
    const count = res.data.count || 0;
    const badge = document.getElementById('notification-badge');
    
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  }
}

/**
 * Mark notification as read
 */
window.markNotificationRead = async function(notificationId) {
  const userId = auth.user?.user_id || auth.user?._id || auth.user?.username;
  if (!userId) return;
  
  const res = await apiFetch(`/inapp/notifications/${notificationId}/read`, {
    method: 'PUT',
    body: JSON.stringify({ user_id: userId })
  });
  
  if (res.ok) {
    showToast('Notification marked as read', 'success');
    await loadInAppNotifications();
    await checkUnreadNotifications();
  } else {
    showToast('Failed to mark as read', 'error');
  }
};

/**
 * Mark all notifications as read
 */
window.markAllNotificationsRead = async function() {
  const userId = auth.user?.user_id || auth.user?._id || auth.user?.username;
  if (!userId) return;
  
  const res = await apiFetch('/inapp/notifications/read-all', {
    method: 'PUT',
    body: JSON.stringify({ user_id: userId })
  });
  
  if (res.ok) {
    showToast(`${res.data.count} notifications marked as read`, 'success');
    await loadInAppNotifications();
    await checkUnreadNotifications();
  } else {
    showToast('Failed to mark all as read', 'error');
  }
};

/**
 * Delete notification
 */
window.deleteNotification = async function(notificationId) {
  if (!confirm('Delete this notification?')) return;
  
  const userId = auth.user?.user_id || auth.user?._id || auth.user?.username;
  if (!userId) return;
  
  const res = await apiFetch(`/inapp/notifications/${notificationId}?user_id=${encodeURIComponent(userId)}`, {
    method: 'DELETE'
  });
  
  if (res.ok) {
    showToast('Notification deleted', 'success');
    await loadInAppNotifications();
    await checkUnreadNotifications();
  } else {
    showToast('Failed to delete notification', 'error');
  }
};

/**
 * Refresh notifications
 */
window.refreshNotifications = async function() {
  await loadInAppNotifications();
  await checkUnreadNotifications();
  showToast('Notifications refreshed', 'info');
};

/**
 * Format time ago (e.g., "2 minutes ago")
 */
function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init() {
  console.log('=== NotifyHub Orchestrator Initializing ===');
  
  // Don't check auth if we're on the login page
  if (window.location.pathname === '/login.html') {
    console.log('[Init] On login page, skipping auth check');
    return;
  }
  
  // Check authentication first
  if (!checkAuth()) {
    return;
  }
  
  // Update user info in sidebar
  updateUserInfo();
  
  console.log('[Init] API Base:', API_BASE);
  console.log('[Init] Logged in as:', auth.user.username);
  
  // Nav listeners
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  console.log('[Init] Navigation listeners attached');

  // Topbar refresh button
  document.querySelector('.topbar-right .btn-outline')?.addEventListener('click', () => {
    console.log('[Refresh] Refreshing current tab:', state.activeTab);
    showToast('Refreshing...', 'info');
    
    // Refresh API status first
    checkApiStatus();
    
    // Then refresh tab-specific data
    if (state.activeTab === 'dashboard') loadDashboardStats();
    else if (state.activeTab === 'templates') loadTemplates();
    else if (state.activeTab === 'users') loadAllUsers();
    else if (state.activeTab === 'preferences') {
      const uid = document.getElementById('pref-user-id').value.trim();
      if (uid) loadPreferences(uid);
    }
  });

  // Init each tab
  console.log('[Init] Initializing tabs...');
  initUsersTab();
  initSendTab();
  initPreferencesTab();
  initTemplatesTab();
  initStatusTab();
  console.log('[Init] All tabs initialized');

  // Verify functions
  if (typeof window.loadAllUsers === 'function') {
    console.log('[Init] ✓ loadAllUsers function is available');
  } else {
    console.error('[Init] ✗ loadAllUsers function NOT available!');
  }

  // Load initial data
  checkApiStatus();
  loadDashboardStats();

  // Refresh API status every 30s
  setInterval(checkApiStatus, 30_000);
  
  // Check for new in-app notifications every 30s
  checkUnreadNotifications();
  notificationCheckInterval = setInterval(checkUnreadNotifications, 30_000);
  
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