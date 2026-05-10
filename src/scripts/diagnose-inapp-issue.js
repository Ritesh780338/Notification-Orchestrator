/**
 * Diagnostic script for in-app notification issues
 * Run with: node src/scripts/diagnose-inapp-issue.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const InAppNotification = require('../models/InAppNotification');
const User = require('../models/User');

async function diagnose() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get user
    const user = await User.findOne({ username: 'rsharma' });
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    const userId = user._id.toString();
    console.log('👤 User Info:');
    console.log('   Username:', user.username);
    console.log('   User ID:', userId);
    console.log('   Email:', user.email);
    console.log();

    // Check notifications with exact user_id
    console.log('🔍 Checking notifications with user_id:', userId);
    const notifications = await InAppNotification.find({ user_id: userId });
    console.log(`   Found: ${notifications.length} notifications\n`);

    if (notifications.length > 0) {
      console.log('📋 Notifications:');
      notifications.forEach((n, i) => {
        console.log(`   ${i + 1}. ${n.read ? '✓' : '○'} ${n.title}`);
        console.log(`      user_id: ${n.user_id}`);
        console.log(`      _id: ${n._id}`);
        console.log(`      created: ${new Date(n.created_at).toLocaleString()}`);
      });
      console.log();
    }

    // Check with different user_id formats
    console.log('🔍 Checking with username:', user.username);
    const byUsername = await InAppNotification.find({ user_id: user.username });
    console.log(`   Found: ${byUsername.length} notifications\n`);

    // API Test
    console.log('🌐 API Test URLs:');
    console.log(`   GET /api/inapp/notifications?user_id=${userId}`);
    console.log(`   GET /api/inapp/unread-count?user_id=${userId}`);
    console.log();

    // Summary
    console.log('📊 Summary:');
    console.log(`   Total notifications for user_id="${userId}": ${notifications.length}`);
    console.log(`   Unread: ${notifications.filter(n => !n.read).length}`);
    console.log(`   Read: ${notifications.filter(n => n.read).length}`);
    console.log();

    if (notifications.length > 0) {
      console.log('✅ Notifications exist in database!');
      console.log('   If frontend shows "No notifications yet", the issue is:');
      console.log('   1. Frontend is using wrong user_id');
      console.log('   2. Check browser console for API errors');
      console.log('   3. Verify auth.user.id matches:', userId);
    } else {
      console.log('⚠️  No notifications found for this user');
      console.log('   Send a test notification first');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

diagnose();
