/**
 * Script to add missing in-app template for user_signup event
 * Run with: node src/scripts/add-inapp-template.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const templateService = require('../services/template.service');
const logger = require('../config/logger');

async function addInAppTemplate() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Define the in-app template for user_signup
    const inappTemplate = {
      template_id: 'tpl_user_signup_inapp',
      name: 'User Signup In-App',
      channel: 'inapp',
      event_type: 'user_signup',
      subject: 'Welcome to Notification Orchestrator!',
      body: 'Hi {{first_name}}, welcome to our platform! We\'re excited to have you on board.',
      variables: ['first_name']
    };

    // Save the template
    const template = await templateService.saveTemplate(inappTemplate);
    logger.info('✅ In-app template added successfully:', {
      template_id: template.template_id,
      event_type: template.event_type,
      channel: template.channel
    });

    console.log('\n✅ Success! In-app template for user_signup has been added.');
    console.log('Template ID:', template.template_id);
    console.log('Event Type:', template.event_type);
    console.log('Channel:', template.channel);

  } catch (error) {
    logger.error('❌ Error adding in-app template:', error);
    console.error('\n❌ Failed to add template:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    process.exit(0);
  }
}

// Run the script
addInAppTemplate();
