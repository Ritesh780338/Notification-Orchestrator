/* ============================================================
   NotifyHub Orchestrator — config.js
   Environment-aware API configuration
   ============================================================ */

'use strict';

// Auto-detect environment and set API base URL
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname === '';

// IMPORTANT: Replace this URL with your actual Render backend URL
// Example: 'https://notification-orchestrator.onrender.com/api'
const PRODUCTION_API_URL = 'https://notification-orchestrator.onrender.com/api';

// Set API_BASE based on environment
const API_BASE = isLocalhost ? '/api' : PRODUCTION_API_URL;

// Log configuration for debugging
console.log('=== API Configuration ===');
console.log('[Config] Environment:', isLocalhost ? 'Development (Local)' : 'Production');
console.log('[Config] Current hostname:', window.location.hostname);
console.log('[Config] API Base URL:', API_BASE);
console.log('[Config] Full API URL example:', API_BASE + '/health');
console.log('========================');
