const express = require('express');
const router = express.Router();

// Import adapters directly
const emailAdapter = require('../../adapters/email.adapter');
const smsAdapter = require('../../adapters/sms.adapter');
const pushAdapter = require('../../adapters/push.adapter');
const inappAdapter = require('../../adapters/inapp.adapter');

/**
 * POST /api/test/email
 * Test email sending
 */
router.post('/email', async (req, res, next) => {
  try {
    const { email, subject, body } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await emailAdapter.send(
      email,
      subject || 'Test Email from NotifyHub',
      body || 'This is a test email to verify email functionality is working correctly.'
    );

    res.json({
      success: result.success,
      message: result.success ? 'Email sent successfully' : 'Email sending failed',
      details: result
    });

  } catch (error) {
    console.error('Email test failed:', error);
    next(error);
  }
});

/**
 * POST /api/test/sms
 * Test SMS sending
 */
router.post('/sms', async (req, res, next) => {
  try {
    const { phone, message } = req.body;
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const result = await smsAdapter.send(
      phone,
      message || 'Test SMS from NotifyHub. Your notification system is working!'
    );

    res.json({
      success: result.success,
      message: result.success ? 'SMS sent successfully' : 'SMS sending failed',
      details: result
    });

  } catch (error) {
    console.error('SMS test failed:', error);
    next(error);
  }
});

/**
 * POST /api/test/push
 * Test push notification
 */
router.post('/push', async (req, res, next) => {
  try {
    const { token, title, body } = req.body;
    
    const result = await pushAdapter.send(
      token || 'test_device_token',
      title || 'Test Push Notification',
      body || 'This is a test push notification from NotifyHub'
    );

    res.json({
      success: result.success,
      message: result.success ? 'Push notification sent successfully' : 'Push notification failed',
      details: result
    });

  } catch (error) {
    console.error('Push test failed:', error);
    next(error);
  }
});

/**
 * POST /api/test/inapp
 * Test in-app notification
 */
router.post('/inapp', async (req, res, next) => {
  try {
    const { userId, title, body } = req.body;
    
    const result = await inappAdapter.send(
      userId || 'test_user',
      title || 'Test In-App Notification',
      body || 'This is a test in-app notification from NotifyHub'
    );

    res.json({
      success: result.success,
      message: result.success ? 'In-app notification sent successfully' : 'In-app notification failed',
      details: result
    });

  } catch (error) {
    console.error('In-app test failed:', error);
    next(error);
  }
});

/**
 * GET /api/test/verify
 * Verify all adapters
 */
router.get('/verify', async (req, res, next) => {
  try {
    const results = {
      email: await emailAdapter.verify(),
      sms: await smsAdapter.verify(),
      push: await pushAdapter.verify(),
      inapp: await inappAdapter.verify()
    };

    const allWorking = Object.values(results).every(r => r === true);

    res.json({
      success: allWorking,
      message: allWorking ? 'All adapters verified' : 'Some adapters failed verification',
      adapters: results
    });

  } catch (error) {
    console.error('Adapter verification failed:', error);
    next(error);
  }
});

module.exports = router;
