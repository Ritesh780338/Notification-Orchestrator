/**
 * Script to verify in-app notification setup
 * Run with: node src/scripts/verify-inapp-setup.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Template = require('../models/Template');
const InAppNotification = require('../models/InAppNotification');
const logger = require('../config/logger');

async function verifySetup() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check in-app templates
    console.log('📋 Checking In-App Templates...');
    console.log('='.repeat(60));
    
    const inappTemplates = await Template.find({ channel: 'inapp', active: true });
    
    if (inappTemplates.length === 0) {
      console.log('❌ No in-app templates found!');
      console.log('   Run: node src/scripts/add-all-inapp-templates.js\n');
    } else {
      console.log(`✅ Found ${inappTemplates.length} in-app templates:\n`);
      inappTemplates.forEach(t => {
        console.log(`   ✓ ${t.event_type.padEnd(25)} | ${t.subject}`);
      });
      console.log();
    }

    // Check recent in-app notifications
    console.log('🔔 Recent In-App Notifications...');
    console.log('='.repeat(60));
    
    const recentNotifications = await InAppNotification
      .find()
      .sort({ created_at: -1 })
      .limit(10);
    
    if (recentNotifications.length === 0) {
      console.log('ℹ️  No in-app notifications in database yet');
      console.log('   Send a test notification with "inapp" channel selected\n');
    } else {
      console.log(`Found ${recentNotifications.length} recent notifications:\n`);
      recentNotifications.forEach(n => {
        const time = new Date(n.created_at).toLocaleString();
        const readStatus = n.read ? '✓ read' : '○ unread';
        console.log(`   ${readStatus} | ${n.user_id.padEnd(15)} | ${n.title.substring(0, 40)}`);
        console.log(`          ${time}`);
      });
      console.log();
    }

    // Check unread counts by user
    console.log('📊 Unread Counts by User...');
    console.log('='.repeat(60));
    
    const unreadByUser = await InAppNotification.aggregate([
      { $match: { read: false } },
      { $group: { _id: '$user_id', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    if (unreadByUser.length === 0) {
      console.log('ℹ️  No unread notifications\n');
    } else {
      unreadByUser.forEach(u => {
        console.log(`   ${u._id.padEnd(20)} : ${u.count} unread`);
      });
      console.log();
    }

    // Summary
    console.log('='.repeat(60));
    console.log('📝 Summary:');
    console.log(`   Templates: ${inappTemplates.length} in-app templates configured`);
    console.log(`   Notifications: ${recentNotifications.length} total in database`);
    console.log(`   Unread: ${unreadByUser.reduce((sum, u) => sum + u.count, 0)} across ${unreadByUser.length} users`);
    console.log('='.repeat(60));

    if (inappTemplates.length > 0) {
      console.log('\n✅ In-app notification system is properly configured!');
      console.log('   You can now send notifications with the "inapp" channel.\n');
    } else {
      console.log('\n⚠️  Setup incomplete - run the template migration script first.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the verification
verifySetup();
