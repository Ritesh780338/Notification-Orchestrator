/**
 * Script to check user authentication data
 * Run with: node src/scripts/check-user-auth.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function checkUserAuth() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const user = await User.findOne({ username: 'rsharma' });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('👤 User Authentication Data:');
    console.log('='.repeat(60));
    console.log('Username:', user.username);
    console.log('Full Name:', user.fullName);
    console.log('Email:', user.email);
    console.log('User ID (_id):', user._id.toString());
    console.log('Role:', user.role);
    console.log('='.repeat(60));
    
    console.log('\n📝 What should be stored in localStorage:');
    console.log(JSON.stringify({
      _id: user._id.toString(),
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    }, null, 2));
    
    console.log('\n🔍 Frontend should use one of these for user_id:');
    console.log('   - auth.user._id:', user._id.toString());
    console.log('   - auth.user.user_id:', '(not set - needs to be added)');
    console.log('   - auth.user.username:', user.username);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

checkUserAuth();
