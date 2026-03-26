-- Notification Orchestrator Database Schema

-- Users table (simplified for demo)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    push_token VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL, -- email, sms, push, in_app
    category VARCHAR(50) NOT NULL, -- marketing, transactional, security, system_alerts
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, channel, category)
);

-- Suppression list (hard opt-out for compliance)
CREATE TABLE IF NOT EXISTS suppression_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, channel)
);

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id VARCHAR(100) UNIQUE NOT NULL,
    channel VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    subject VARCHAR(500),
    body TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(100) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, critical
    metadata JSONB,
    preferred_channels TEXT[], -- array of channels
    schedule_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'received', -- received, queued, scheduled, sent, delivered, failed, suppressed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Delivery Logs table
CREATE TABLE IF NOT EXISTS delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL, -- queued, sent, delivered, failed, suppressed
    attempt_count INTEGER DEFAULT 0,
    rendered_content TEXT,
    provider_response JSONB,
    error_message TEXT,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_schedule_time ON notifications(schedule_time);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_notification_id ON delivery_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_status ON delivery_logs(status);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Insert sample templates
INSERT INTO templates (template_id, channel, event_type, subject, body, version) VALUES
('welcome_email', 'email', 'user_signup', 'Welcome to Notification Orchestrator!', 
 'Hi {{first_name}},\n\nWelcome to our platform! We''re excited to have you on board.\n\nBest regards,\nThe Team', 1),
('welcome_sms', 'sms', 'user_signup', NULL, 
 'Welcome {{first_name}}! Thanks for signing up.', 1),
('order_confirmation_email', 'email', 'order_placed', 'Order Confirmation #{{order_id}}',
 'Hi {{first_name}},\n\nYour order #{{order_id}} has been confirmed.\n\nTotal: ${{amount}}\n\nThank you!', 1),
('password_reset_email', 'email', 'password_reset', 'Password Reset Request',
 'Hi {{first_name}},\n\nClick here to reset your password: {{reset_link}}\n\nThis link expires in 1 hour.', 1),
('security_alert_push', 'push', 'security_alert', 'Security Alert',
 'New login detected from {{location}}. If this wasn''t you, secure your account immediately.', 1);

-- Insert sample user
INSERT INTO users (email, phone) VALUES 
('test@example.com', '+1234567890');

-- Insert default preferences for sample user
INSERT INTO user_preferences (user_id, channel, category, enabled)
SELECT id, channel, category, true
FROM users, 
     (VALUES ('email'), ('sms'), ('push'), ('in_app')) AS channels(channel),
     (VALUES ('marketing'), ('transactional'), ('security'), ('system_alerts')) AS categories(category)
WHERE email = 'test@example.com';
