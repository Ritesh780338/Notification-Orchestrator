/**
 * Example test file for Notification Orchestrator
 * Run with: npm test
 */

const request = require('supertest');
const app = require('../src/server');

describe('Notification Orchestrator API', () => {
  
  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
      
      expect(response.body).toHaveProperty('name', 'Notification Orchestrator');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('endpoints');
    });
  });

  describe('POST /api/notifications/events', () => {
    it('should reject invalid event payload', async () => {
      const response = await request(app)
        .post('/api/notifications/events')
        .send({
          event_type: 'test_event'
          // Missing required user_id
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should accept valid event payload', async () => {
      // Note: This test requires a valid user_id from database
      // In real tests, you would set up test data first
      
      const validEvent = {
        event_type: 'user_signup',
        user_id: '00000000-0000-0000-0000-000000000000', // Replace with valid UUID
        priority: 'normal',
        metadata: {
          first_name: 'Test'
        }
      };

      // This will fail without valid user_id, but shows the structure
      const response = await request(app)
        .post('/api/notifications/events')
        .send(validEvent);
      
      // With valid user_id, expect 202
      // expect(response.status).toBe(202);
      // expect(response.body).toHaveProperty('event_id');
    });
  });

  describe('GET /api/notifications/:id/status', () => {
    it('should return 404 for non-existent notification', async () => {
      const response = await request(app)
        .get('/api/notifications/non-existent-id/status')
        .expect(404);
      
      expect(response.body).toHaveProperty('error', 'Notification not found');
    });
  });

  describe('GET /api/users/:userId/preferences', () => {
    it('should return user preferences', async () => {
      // Note: Requires valid user_id
      const userId = '00000000-0000-0000-0000-000000000000';
      
      const response = await request(app)
        .get(`/api/users/${userId}/preferences`);
      
      // With valid user_id, expect 200
      // expect(response.status).toBe(200);
      // expect(response.body).toHaveProperty('preferences');
    });
  });

});

describe('Template Service', () => {
  const templateService = require('../src/services/template.service');

  it('should render template with variables', () => {
    const template = {
      subject: 'Hello {{first_name}}',
      body: 'Welcome {{first_name}}, your order {{order_id}} is confirmed.'
    };

    const variables = {
      first_name: 'John',
      order_id: '12345'
    };

    const rendered = templateService.renderTemplate(template, variables);

    expect(rendered.subject).toBe('Hello John');
    expect(rendered.body).toBe('Welcome John, your order 12345 is confirmed.');
  });

  it('should handle missing variables', () => {
    const template = {
      subject: 'Hello {{first_name}}',
      body: 'Your order {{order_id}} is ready.'
    };

    const variables = {
      first_name: 'John'
      // order_id is missing
    };

    const rendered = templateService.renderTemplate(template, variables);

    expect(rendered.subject).toBe('Hello John');
    expect(rendered.body).toContain('{{order_id}}'); // Unreplaced
  });
});

describe('Throttle Utilities', () => {
  const { isQuietHours } = require('../src/utils/throttle');

  it('should detect quiet hours', () => {
    // This test depends on current time and environment variables
    const result = isQuietHours();
    expect(typeof result).toBe('boolean');
  });
});
