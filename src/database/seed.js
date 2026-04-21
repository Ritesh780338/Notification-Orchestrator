const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../config/database');
const UserPreference = require('../models/UserPreference');
const Template = require('../models/Template');
const logger = require('../config/logger');

async function seed() {
  try {
    await connectDB();
    
    console.log('🌱 Seeding database...\n');

    // Create sample users with preferences
    const sampleUsers = [
      {
        user_id: 'user_001',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        push_token: 'sample_push_token_001',
        preferences: [
          { channel: 'email', category: 'marketing', enabled: true },
          { channel: 'email', category: 'transactional', enabled: true },
          { channel: 'email', category: 'security', enabled: true },
          { channel: 'email', category: 'system', enabled: true },
          { channel: 'sms', category: 'marketing', enabled: false },
          { channel: 'sms', category: 'transactional', enabled: true },
          { channel: 'sms', category: 'security', enabled: true },
          { channel: 'sms', category: 'system', enabled: false },
          { channel: 'push', category: 'marketing', enabled: true },
          { channel: 'push', category: 'transactional', enabled: true },
          { channel: 'push', category: 'security', enabled: true },
          { channel: 'push', category: 'system', enabled: true },
          { channel: 'inapp', category: 'marketing', enabled: true },
          { channel: 'inapp', category: 'transactional', enabled: true },
          { channel: 'inapp', category: 'security', enabled: true },
          { channel: 'inapp', category: 'system', enabled: true }
        ],
        global_opt_out: false,
        quiet_hours: {
          enabled: true,
          start_hour: 22,
          end_hour: 7,
          timezone: 'UTC'
        }
      },
      {
        user_id: 'user_002',
        email: 'jane.smith@example.com',
        phone: '+1987654321',
        preferences: [
          { channel: 'email', category: 'marketing', enabled: false },
          { channel: 'email', category: 'transactional', enabled: true },
          { channel: 'email', category: 'security', enabled: true },
          { channel: 'email', category: 'system', enabled: true }
        ]
      }
    ];

    for (const userData of sampleUsers) {
      await UserPreference.findOneAndUpdate(
        { user_id: userData.user_id },
        userData,
        { upsert: true, new: true }
      );
      console.log(`✓ Created user: ${userData.user_id}`);
    }

    // Create sample templates
    const sampleTemplates = [
      {
        template_id: 'tpl_user_signup_email',
        name: 'User Signup Email',
        channel: 'email',
        event_type: 'user_signup',
        subject: 'Welcome to Notification Orchestrator, {{first_name}}!',
        body: `Hi {{first_name}},

Welcome to Notification Orchestrator! We're excited to have you on board.

This is a centralized multi-channel notification management service that helps you:
- Send notifications across Email, SMS, Push, and In-App channels
- Manage user preferences and opt-outs
- Track delivery status in real-time
- Schedule notifications for later delivery

Get started by exploring the dashboard!

Best regards,
The Notification Orchestrator Team`,
        variables: ['first_name']
      },
      {
        template_id: 'tpl_user_signup_sms',
        name: 'User Signup SMS',
        channel: 'sms',
        event_type: 'user_signup',
        body: 'Welcome {{first_name}}! Thanks for signing up to Notification Orchestrator.',
        variables: ['first_name']
      },
      {
        template_id: 'tpl_user_signup_push',
        name: 'User Signup Push',
        channel: 'push',
        event_type: 'user_signup',
        subject: 'Welcome!',
        body: 'Hi {{first_name}}, welcome to Notification Orchestrator!',
        variables: ['first_name']
      },
      {
        template_id: 'tpl_order_confirmation_email',
        name: 'Order Confirmation Email',
        channel: 'email',
        event_type: 'order_confirmation',
        subject: 'Order Confirmation #{{order_id}}',
        body: `Hi {{first_name}},

Your order has been confirmed!

Order Details:
- Order ID: {{order_id}}
- Amount: ${{amount}}
- Date: {{order_date}}

Thank you for your purchase!

Best regards,
The Team`,
        variables: ['first_name', 'order_id', 'amount', 'order_date']
      },
      {
        template_id: 'tpl_order_confirmation_sms',
        name: 'Order Confirmation SMS',
        channel: 'sms',
        event_type: 'order_confirmation',
        body: 'Order #{{order_id}} confirmed! Amount: ${{amount}}. Thank you!',
        variables: ['order_id', 'amount']
      },
      {
        template_id: 'tpl_password_reset_email',
        name: 'Password Reset Email',
        channel: 'email',
        event_type: 'password_reset',
        subject: 'Password Reset Request',
        body: `Hi {{first_name}},

We received a request to reset your password.

Your reset code is: {{reset_code}}

This code will expire in 15 minutes.

If you didn't request this, please ignore this email and your password will remain unchanged.

Best regards,
Security Team`,
        variables: ['first_name', 'reset_code']
      },
      {
        template_id: 'tpl_password_reset_sms',
        name: 'Password Reset SMS',
        channel: 'sms',
        event_type: 'password_reset',
        body: 'Your password reset code is: {{reset_code}}. Valid for 15 minutes.',
        variables: ['reset_code']
      },
      {
        template_id: 'tpl_security_alert_email',
        name: 'Security Alert Email',
        channel: 'email',
        event_type: 'security_alert',
        subject: 'Security Alert: {{alert_type}}',
        body: `Hi {{first_name}},

We detected unusual activity on your account.

Alert Type: {{alert_type}}
Time: {{timestamp}}
Location: {{location}}

If this was you, you can safely ignore this message. Otherwise, please secure your account immediately.

Best regards,
Security Team`,
        variables: ['first_name', 'alert_type', 'timestamp', 'location']
      },
      {
        template_id: 'tpl_marketing_email',
        name: 'Marketing Email',
        channel: 'email',
        event_type: 'marketing',
        subject: '{{campaign_title}}',
        body: `Hi {{first_name}},

{{campaign_message}}

{{call_to_action}}

Best regards,
Marketing Team

Unsubscribe: {{unsubscribe_link}}`,
        variables: ['first_name', 'campaign_title', 'campaign_message', 'call_to_action', 'unsubscribe_link']
      },
      {
        template_id: 'tpl_system_notification_inapp',
        name: 'System Notification In-App',
        channel: 'inapp',
        event_type: 'system_notification',
        subject: 'System Update',
        body: '{{notification_message}}',
        variables: ['notification_message']
      }
    ];

    for (const templateData of sampleTemplates) {
      await Template.findOneAndUpdate(
        { template_id: templateData.template_id },
        templateData,
        { upsert: true, new: true }
      );
      console.log(`✓ Created template: ${templateData.template_id}`);
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('\nSample Users:');
    console.log('- user_001 (john.doe@example.com)');
    console.log('- user_002 (jane.smith@example.com)');
    console.log('\nYou can now start the server and test the application!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
