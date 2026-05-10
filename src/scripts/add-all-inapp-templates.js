/**
 * Script to add in-app templates for all event types
 * Run with: node src/scripts/add-all-inapp-templates.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const templateService = require('../services/template.service');
const logger = require('../config/logger');

async function addAllInAppTemplates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Define all in-app templates
    const inappTemplates = [
      {
        template_id: 'tpl_user_signup_inapp',
        name: 'User Signup In-App',
        channel: 'inapp',
        event_type: 'user_signup',
        subject: 'Welcome to Notification Orchestrator!',
        body: 'Hi {{first_name}}, welcome to our platform! We\'re excited to have you on board.',
        variables: ['first_name']
      },
      {
        template_id: 'tpl_order_confirmation_inapp',
        name: 'Order Confirmation In-App',
        channel: 'inapp',
        event_type: 'order_confirmation',
        subject: 'Order Confirmed #{{order_id}}',
        body: 'Hi {{first_name}}, your order #{{order_id}} has been confirmed! Total: ${{amount}}. Thank you for your purchase!',
        variables: ['first_name', 'order_id', 'amount']
      },
      {
        template_id: 'tpl_password_reset_inapp',
        name: 'Password Reset In-App',
        channel: 'inapp',
        event_type: 'password_reset',
        subject: 'Password Reset Request',
        body: 'Hi {{first_name}}, we received a request to reset your password. Reset Code: {{reset_code}}. If you didn\'t request this, please ignore this notification.',
        variables: ['first_name', 'reset_code']
      },
      {
        template_id: 'tpl_security_alert_inapp',
        name: 'Security Alert In-App',
        channel: 'inapp',
        event_type: 'security_alert',
        subject: 'Security Alert: {{alert_type}}',
        body: 'Hi {{first_name}}, we detected unusual activity on your account. Alert: {{alert_type}} at {{timestamp}}. If this wasn\'t you, please secure your account immediately.',
        variables: ['first_name', 'alert_type', 'timestamp']
      },
      {
        template_id: 'tpl_marketing_inapp',
        name: 'Marketing In-App',
        channel: 'inapp',
        event_type: 'marketing',
        subject: 'Special Offer Just for You!',
        body: 'Hi {{first_name}}, check out our latest offers and updates!',
        variables: ['first_name']
      },
      {
        template_id: 'tpl_system_notification_inapp',
        name: 'System Notification In-App',
        channel: 'inapp',
        event_type: 'system_notification',
        subject: 'System Update',
        body: 'Hi {{first_name}}, we have an important system update for you.',
        variables: ['first_name']
      }
    ];

    console.log('\n📝 Adding in-app templates for all event types...\n');

    let added = 0;
    let updated = 0;

    for (const template of inappTemplates) {
      try {
        const existing = await templateService.getTemplate(template.event_type, template.channel);
        const result = await templateService.saveTemplate(template);
        
        if (existing) {
          updated++;
          console.log(`✅ Updated: ${template.name} (${template.event_type})`);
        } else {
          added++;
          console.log(`✅ Added: ${template.name} (${template.event_type})`);
        }
      } catch (error) {
        console.error(`❌ Failed: ${template.name} - ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Summary: ${added} added, ${updated} updated`);
    console.log('='.repeat(50) + '\n');

    logger.info('In-app templates initialization complete', { added, updated });

  } catch (error) {
    logger.error('❌ Error adding in-app templates:', error);
    console.error('\n❌ Failed to add templates:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    process.exit(0);
  }
}

// Run the script
addAllInAppTemplates();
