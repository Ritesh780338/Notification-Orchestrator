/**
 * Test script to verify notification flow
 * Run with: node src/scripts/test-notification-flow.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const InAppNotification = require('../models/InAppNotification');
const UserPreference = require('../models/UserPreference');
const User = require('../models/User');
const Template = require('../models/Template');
const orchestrationService = require('../services/orchestration.service');
const logger = require('../config/logger');

async function testNotificationFlow() {
  try {
    console.log('🧪 Testing Notification Flow\n');
    console.log('='.repeat(60));
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Check if user exists
    console.log('1️⃣  Checking User...');
    const user = await User.findOne({ username: 'rsharma' });
    if (!user) {
      console.log('❌ User "rsharma" not found!');
      process.exit(1);
    }
    console.log(`✅ User found: ${user.fullName} (${user.email})`);
    console.log(`   User ID: ${user._id}\n`);

    // 2. Check user preferences
    console.log('2️⃣  Checking User Preferences...');
    const userPref = await UserPreference.findOne({ user_id: user._id.toString() });
    if (!userPref) {
      console.log('❌ User preferences not found!');
      process.exit(1);
    }
    console.log(`✅ User preferences found`);
    console.log(`   Email: ${userPref.email}`);
    console.log(`   Phone: ${userPref.phone || 'Not set'}`);
    console.log(`   Push Token: ${userPref.push_token || 'Not set'}\n`);

    // 3. Check templates
    console.log('3️⃣  Checking Templates...');
    const emailTemplate = await Template.findOne({ 
      event_type: 'order_confirmation', 
      channel: 'email',
      active: true 
    });
    const inappTemplate = await Template.findOne({ 
      event_type: 'order_confirmation', 
      channel: 'inapp',
      active: true 
    });
    
    if (!emailTemplate) {
      console.log('❌ Email template for order_confirmation not found!');
    } else {
      console.log(`✅ Email template found: ${emailTemplate.subject}`);
    }
    
    if (!inappTemplate) {
      console.log('❌ In-app template for order_confirmation not found!');
    } else {
      console.log(`✅ In-app template found: ${inappTemplate.subject}`);
    }
    console.log();

    // 4. Create a test notification
    console.log('4️⃣  Creating Test Notification...');
    const testNotification = await Notification.create({
      event_id: `test_${Date.now()}`,
      event_type: 'order_confirmation',
      user_id: user._id.toString(),
      priority: 'normal',
      preferred_channels: ['email', 'inapp'],
      metadata: {
        order_id: 'TEST-' + Date.now(),
        amount: '$99.99',
        items: 3
      },
      status: 'queued',
      channels: []
    });
    console.log(`✅ Test notification created: ${testNotification._id}\n`);

    // 5. Process the notification
    console.log('5️⃣  Processing Notification...');
    console.log('   This will send email and create in-app notification\n');
    
    await orchestrationService.processNotification(testNotification._id);
    
    // 6. Check results
    console.log('6️⃣  Checking Results...');
    const updatedNotification = await Notification.findById(testNotification._id);
    console.log(`   Notification Status: ${updatedNotification.status}`);
    console.log(`   Channels processed: ${updatedNotification.channels.length}`);
    
    updatedNotification.channels.forEach(ch => {
      const icon = ch.status === 'delivered' ? '✅' : '❌';
      console.log(`   ${icon} ${ch.channel_type}: ${ch.status}`);
      if (ch.error_message) {
        console.log(`      Error: ${ch.error_message}`);
      }
    });
    console.log();

    // 7. Check in-app notifications
    console.log('7️⃣  Checking In-App Notifications...');
    const inappNotifications = await InAppNotification.find({ 
      user_id: user._id.toString() 
    }).sort({ created_at: -1 }).limit(5);
    
    console.log(`   Found ${inappNotifications.length} in-app notifications for user\n`);
    
    if (inappNotifications.length > 0) {
      console.log('   Recent notifications:');
      inappNotifications.forEach((n, i) => {
        const readStatus = n.read ? '✓ read' : '○ unread';
        console.log(`   ${i + 1}. ${readStatus} | ${n.title}`);
        console.log(`      ${n.body.substring(0, 60)}...`);
        console.log(`      Created: ${new Date(n.created_at).toLocaleString()}`);
      });
    }
    console.log();

    // Summary
    console.log('='.repeat(60));
    console.log('📊 Test Summary:');
    console.log(`   User: ${user.fullName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Notification ID: ${testNotification._id}`);
    console.log(`   Status: ${updatedNotification.status}`);
    console.log(`   Channels: ${updatedNotification.channels.map(c => c.channel_type).join(', ')}`);
    console.log('='.repeat(60));
    
    const allSuccess = updatedNotification.channels.every(c => c.status === 'delivered');
    if (allSuccess) {
      console.log('\n✅ All channels delivered successfully!\n');
    } else {
      console.log('\n⚠️  Some channels failed - check logs above\n');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the test
testNotificationFlow();
