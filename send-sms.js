#!/usr/bin/env node

/**
 * Simple SMS Sender - Interactive
 */

require('dotenv').config();
const readline = require('readline');
const smsAdapter = require('./src/adapters/sms.adapter');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function sendSMS() {
  console.log('\n📱 SMS Sender\n');

  // Get phone number
  const phoneNumber = await question('Enter phone number (10 digits): ');
  
  if (!phoneNumber || phoneNumber.length !== 10) {
    console.error('❌ Invalid phone number. Must be 10 digits.');
    rl.close();
    return;
  }

  // Get message
  const message = await question('Enter message: ');
  
  if (!message) {
    console.error('❌ Message cannot be empty.');
    rl.close();
    return;
  }

  console.log('\n📤 Sending SMS...');
  console.log(`To: ${phoneNumber}`);
  console.log(`Message: ${message}`);
  console.log(`Provider: ${process.env.SMS_PROVIDER}\n`);

  // Send SMS
  const result = await smsAdapter.send(phoneNumber, message);

  if (result.success) {
    console.log('✅ SMS sent successfully!');
    console.log(`Message ID: ${result.messageId}`);
    console.log(`Provider: ${result.provider}\n`);
  } else {
    console.error('❌ SMS sending failed!');
    console.error(`Error: ${result.error}\n`);
  }

  rl.close();
}

sendSMS().catch(error => {
  console.error('❌ Error:', error.message);
  rl.close();
  process.exit(1);
});
