// API Base URL
const API_BASE = '/api';

// Tab Navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
        
        // Load data for specific tabs
        if (tabName === 'dashboard') {
            loadDashboardStats();
        } else if (tabName === 'templates') {
            loadTemplates();
        }
    });
});

// Initialize Dashboard
loadDashboardStats();

// Dashboard Functions
async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_BASE}/notifications/stats`);
        const data = await response.json();
        
        document.getElementById('total-notifications').textContent = data.total || 0;
        document.getElementById('delivered-count').textContent = data.by_status?.delivered || 0;
        
        const pending = (data.by_status?.received || 0) + 
                       (data.by_status?.queued || 0) + 
                       (data.by_status?.processing || 0) +
                       (data.by_status?.scheduled || 0);
        document.getElementById('pending-count').textContent = pending;
        document.getElementById('failed-count').textContent = data.by_status?.failed || 0;
        
        // Render charts
        renderEventTypeChart(data.by_event_type || {});
        renderChannelChart(data.by_channel || {});
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

function renderEventTypeChart(data) {
    const container = document.getElementById('event-type-chart');
    container.innerHTML = '';
    
    if (Object.keys(data).length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6b7280;">No data available</p>';
        return;
    }
    
    const max = Math.max(...Object.values(data));
    
    Object.entries(data).forEach(([type, count]) => {
        const bar = document.createElement('div');
        bar.style.cssText = `
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        `;
        
        const label = document.createElement('div');
        label.textContent = type;
        label.style.cssText = 'width: 200px; font-weight: 600;';
        
        const barContainer = document.createElement('div');
        barContainer.style.cssText = 'flex: 1; background: #e5e7eb; border-radius: 4px; height: 30px; position: relative;';
        
        const barFill = document.createElement('div');
        const percentage = (count / max) * 100;
        barFill.style.cssText = `
            width: ${percentage}%;
            height: 100%;
            background: linear-gradient(90deg, #4f46e5, #7c3aed);
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 10px;
            color: white;
            font-weight: 600;
        `;
        barFill.textContent = count;
        
        barContainer.appendChild(barFill);
        bar.appendChild(label);
        bar.appendChild(barContainer);
        container.appendChild(bar);
    });
}

function renderChannelChart(data) {
    const container = document.getElementById('channel-chart');
    container.innerHTML = '';
    
    const channels = ['email', 'sms', 'push', 'inapp'];
    const statuses = ['delivered', 'sent', 'failed'];
    
    const channelData = {};
    channels.forEach(channel => {
        channelData[channel] = { delivered: 0, sent: 0, failed: 0 };
        statuses.forEach(status => {
            const key = `${channel}_${status}`;
            if (data[key]) {
                channelData[channel][status] = data[key];
            }
        });
    });
    
    if (Object.values(channelData).every(c => c.delivered === 0 && c.sent === 0 && c.failed === 0)) {
        container.innerHTML = '<p style="text-align: center; color: #6b7280;">No data available</p>';
        return;
    }
    
    Object.entries(channelData).forEach(([channel, stats]) => {
        const total = stats.delivered + stats.sent + stats.failed;
        if (total === 0) return;
        
        const channelDiv = document.createElement('div');
        channelDiv.style.cssText = 'margin-bottom: 20px;';
        
        const header = document.createElement('div');
        header.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 5px; font-weight: 600;';
        header.innerHTML = `<span>${channel.toUpperCase()}</span><span>${total} total</span>`;
        
        const barContainer = document.createElement('div');
        barContainer.style.cssText = 'display: flex; height: 30px; border-radius: 4px; overflow: hidden;';
        
        if (stats.delivered > 0) {
            const deliveredBar = document.createElement('div');
            deliveredBar.style.cssText = `
                width: ${(stats.delivered / total) * 100}%;
                background: #10b981;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 0.85rem;
            `;
            deliveredBar.textContent = stats.delivered;
            barContainer.appendChild(deliveredBar);
        }
        
        if (stats.sent > 0) {
            const sentBar = document.createElement('div');
            sentBar.style.cssText = `
                width: ${(stats.sent / total) * 100}%;
                background: #3b82f6;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 0.85rem;
            `;
            sentBar.textContent = stats.sent;
            barContainer.appendChild(sentBar);
        }
        
        if (stats.failed > 0) {
            const failedBar = document.createElement('div');
            failedBar.style.cssText = `
                width: ${(stats.failed / total) * 100}%;
                background: #ef4444;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 0.85rem;
            `;
            failedBar.textContent = stats.failed;
            barContainer.appendChild(failedBar);
        }
        
        channelDiv.appendChild(header);
        channelDiv.appendChild(barContainer);
        container.appendChild(channelDiv);
    });
}

// Send Notification Form
document.getElementById('send-notification-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userId = document.getElementById('user-id').value;
    const eventType = document.getElementById('event-type').value;
    const priority = document.getElementById('priority').value;
    const metadataText = document.getElementById('metadata').value;
    const scheduleTime = document.getElementById('schedule-time').value;
    
    const channels = Array.from(document.querySelectorAll('input[name="channel"]:checked'))
        .map(cb => cb.value);
    
    let metadata = {};
    if (metadataText.trim()) {
        try {
            metadata = JSON.parse(metadataText);
        } catch (error) {
            showResult('send-result', 'Invalid JSON in metadata field', 'error');
            return;
        }
    }
    
    const payload = {
        user_id: userId,
        event_type: eventType,
        priority: priority,
        metadata: metadata,
        preferred_channels: channels.length > 0 ? channels : undefined,
        schedule_time: scheduleTime || undefined
    };
    
    try {
        const response = await fetch(`${API_BASE}/notifications/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showResult('send-result', 
                `✓ Notification sent successfully!<br>Event ID: <strong>${data.event_id}</strong><br>Status: ${data.status}`, 
                'success'
            );
            e.target.reset();
        } else {
            showResult('send-result', `Error: ${data.error || 'Failed to send notification'}`, 'error');
        }
    } catch (error) {
        showResult('send-result', `Error: ${error.message}`, 'error');
    }
});

// Load Preferences
document.getElementById('load-preferences').addEventListener('click', async () => {
    const userId = document.getElementById('pref-user-id').value.trim();
    
    if (!userId) {
        alert('Please enter a user ID');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/users/${userId}/preferences`);
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('preferences-form-container').style.display = 'block';
            populatePreferencesForm(data);
        } else {
            showResult('preferences-result', `Error: ${data.error || 'User not found'}`, 'error');
        }
    } catch (error) {
        showResult('preferences-result', `Error: ${error.message}`, 'error');
    }
});

function populatePreferencesForm(data) {
    document.getElementById('pref-email').value = data.email || '';
    document.getElementById('pref-phone').value = data.phone || '';
    document.getElementById('global-opt-out').checked = data.global_opt_out || false;
    
    if (data.quiet_hours) {
        document.getElementById('quiet-hours-enabled').checked = data.quiet_hours.enabled || false;
        document.getElementById('quiet-start').value = data.quiet_hours.start_hour || 22;
        document.getElementById('quiet-end').value = data.quiet_hours.end_hour || 7;
    }
    
    // Render preferences grid
    const grid = document.getElementById('preferences-grid');
    grid.innerHTML = '';
    
    const channels = ['email', 'sms', 'push', 'inapp'];
    const categories = ['marketing', 'transactional', 'security', 'system'];
    
    categories.forEach(category => {
        channels.forEach(channel => {
            const pref = data.preferences?.find(p => p.channel === channel && p.category === category);
            const enabled = pref ? pref.enabled : true;
            
            const item = document.createElement('div');
            item.className = 'pref-item';
            item.innerHTML = `
                <div class="pref-header">${channel.toUpperCase()}</div>
                <label>
                    <input type="checkbox" data-channel="${channel}" data-category="${category}" ${enabled ? 'checked' : ''}>
                    ${category}
                </label>
            `;
            grid.appendChild(item);
        });
    });
}

// Save Preferences
document.getElementById('preferences-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userId = document.getElementById('pref-user-id').value.trim();
    const email = document.getElementById('pref-email').value.trim();
    const phone = document.getElementById('pref-phone').value.trim();
    const globalOptOut = document.getElementById('global-opt-out').checked;
    
    const preferences = [];
    document.querySelectorAll('#preferences-grid input[type="checkbox"]').forEach(cb => {
        preferences.push({
            channel: cb.dataset.channel,
            category: cb.dataset.category,
            enabled: cb.checked
        });
    });
    
    const quietHours = {
        enabled: document.getElementById('quiet-hours-enabled').checked,
        start_hour: parseInt(document.getElementById('quiet-start').value),
        end_hour: parseInt(document.getElementById('quiet-end').value),
        timezone: 'UTC'
    };
    
    const payload = {
        email: email || undefined,
        phone: phone || undefined,
        preferences,
        global_opt_out: globalOptOut,
        quiet_hours: quietHours
    };
    
    try {
        const response = await fetch(`${API_BASE}/users/${userId}/preferences`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showResult('preferences-result', '✓ Preferences updated successfully!', 'success');
        } else {
            showResult('preferences-result', `Error: ${data.error || 'Failed to update preferences'}`, 'error');
        }
    } catch (error) {
        showResult('preferences-result', `Error: ${error.message}`, 'error');
    }
});

// Templates
document.getElementById('show-template-form').addEventListener('click', () => {
    const container = document.getElementById('template-form-container');
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('cancel-template').addEventListener('click', () => {
    document.getElementById('template-form-container').style.display = 'none';
    document.getElementById('template-form').reset();
});

document.getElementById('template-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const variables = document.getElementById('template-variables').value
        .split(',')
        .map(v => v.trim())
        .filter(v => v);
    
    const payload = {
        template_id: document.getElementById('template-id').value,
        name: document.getElementById('template-name').value,
        channel: document.getElementById('template-channel').value,
        event_type: document.getElementById('template-event-type').value,
        subject: document.getElementById('template-subject').value || undefined,
        body: document.getElementById('template-body').value,
        variables
    };
    
    try {
        const response = await fetch(`${API_BASE}/templates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('✓ Template saved successfully!');
            document.getElementById('template-form-container').style.display = 'none';
            e.target.reset();
            loadTemplates();
        } else {
            alert(`Error: ${data.error || 'Failed to save template'}`);
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
});

async function loadTemplates() {
    try {
        const response = await fetch(`${API_BASE}/templates`);
        const data = await response.json();
        
        const container = document.getElementById('templates-list');
        container.innerHTML = '';
        
        if (!data.templates || data.templates.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6b7280;">No templates found</p>';
            return;
        }
        
        data.templates.forEach(template => {
            const card = document.createElement('div');
            card.className = 'template-card';
            card.innerHTML = `
                <div class="template-header">
                    <div class="template-title">${template.name}</div>
                    <span class="template-badge ${template.channel}">${template.channel}</span>
                </div>
                <div class="template-meta">
                    <span><strong>ID:</strong> ${template.template_id}</span>
                    <span><strong>Event:</strong> ${template.event_type}</span>
                    <span><strong>Version:</strong> ${template.version}</span>
                </div>
                ${template.subject ? `<div><strong>Subject:</strong> ${template.subject}</div>` : ''}
                <div class="template-body">${template.body}</div>
                ${template.variables && template.variables.length > 0 ? 
                    `<div style="margin-top: 10px;"><strong>Variables:</strong> ${template.variables.join(', ')}</div>` : ''}
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading templates:', error);
    }
}

// Check Status
document.getElementById('check-status').addEventListener('click', async () => {
    const id = document.getElementById('status-id').value.trim();
    
    if (!id) {
        alert('Please enter a notification ID or event ID');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/notifications/${id}/status`);
        const data = await response.json();
        
        const container = document.getElementById('status-result');
        
        if (response.ok) {
            container.style.display = 'block';
            container.innerHTML = `
                <div class="status-card">
                    <div class="status-header">
                        <h3>Notification Status</h3>
                        <span class="status-badge ${data.status}">${data.status.toUpperCase()}</span>
                    </div>
                    <div class="status-details">
                        <div class="status-detail">
                            <div class="status-detail-label">Event ID</div>
                            <div class="status-detail-value">${data.event_id}</div>
                        </div>
                        <div class="status-detail">
                            <div class="status-detail-label">Event Type</div>
                            <div class="status-detail-value">${data.event_type}</div>
                        </div>
                        <div class="status-detail">
                            <div class="status-detail-label">User ID</div>
                            <div class="status-detail-value">${data.user_id}</div>
                        </div>
                        <div class="status-detail">
                            <div class="status-detail-label">Priority</div>
                            <div class="status-detail-value">${data.priority}</div>
                        </div>
                        <div class="status-detail">
                            <div class="status-detail-label">Created</div>
                            <div class="status-detail-value">${new Date(data.created_at).toLocaleString()}</div>
                        </div>
                    </div>
                    ${data.channels && data.channels.length > 0 ? `
                        <h4 style="margin-top: 20px;">Channel Delivery</h4>
                        <div class="channels-list">
                            ${data.channels.map(ch => `
                                <div class="channel-item">
                                    <div>
                                        <strong>${ch.channel_type.toUpperCase()}</strong>
                                        ${ch.sent_at ? `<br><small>Sent: ${new Date(ch.sent_at).toLocaleString()}</small>` : ''}
                                    </div>
                                    <span class="status-badge ${ch.status}">${ch.status}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            container.style.display = 'block';
            container.innerHTML = `<div class="result-box error">Error: ${data.error || 'Notification not found'}</div>`;
        }
    } catch (error) {
        const container = document.getElementById('status-result');
        container.style.display = 'block';
        container.innerHTML = `<div class="result-box error">Error: ${error.message}</div>`;
    }
});

// Helper function to show result messages
function showResult(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.className = `result-box ${type}`;
    element.innerHTML = message;
    element.style.display = 'block';
    
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}
