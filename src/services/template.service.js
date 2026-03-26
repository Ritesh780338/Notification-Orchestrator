const pool = require('../config/database');
const logger = require('../config/logger');

class TemplateService {
  /**
   * Get template by event type and channel
   */
  async getTemplate(eventType, channel) {
    try {
      const result = await pool.query(
        `SELECT * FROM templates 
         WHERE event_type = $1 AND channel = $2 AND active = true 
         ORDER BY version DESC LIMIT 1`,
        [eventType, channel]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error fetching template:', error);
      throw error;
    }
  }

  /**
   * Render template with variables
   */
  renderTemplate(template, variables) {
    if (!template) {
      throw new Error('Template not found');
    }

    let rendered = {
      subject: template.subject,
      body: template.body
    };

    // Replace variables in subject and body
    Object.keys(variables).forEach(key => {
      const placeholder = `{{${key}}}`;
      const value = variables[key] || '';
      
      if (rendered.subject) {
        rendered.subject = rendered.subject.replace(new RegExp(placeholder, 'g'), value);
      }
      rendered.body = rendered.body.replace(new RegExp(placeholder, 'g'), value);
    });

    // Check for unreplaced variables
    const unreplacedPattern = /{{(\w+)}}/g;
    const unreplacedInBody = rendered.body.match(unreplacedPattern);
    const unreplacedInSubject = rendered.subject?.match(unreplacedPattern);
    
    if (unreplacedInBody || unreplacedInSubject) {
      logger.warn('Template has unreplaced variables', {
        template_id: template.template_id,
        unreplaced: [...(unreplacedInBody || []), ...(unreplacedInSubject || [])]
      });
    }

    return rendered;
  }

  /**
   * Create or update template
   */
  async saveTemplate(templateData) {
    try {
      const { template_id, channel, event_type, subject, body } = templateData;
      
      const result = await pool.query(
        `INSERT INTO templates (template_id, channel, event_type, subject, body, version)
         VALUES ($1, $2, $3, $4, $5, 1)
         ON CONFLICT (template_id) 
         DO UPDATE SET 
           subject = EXCLUDED.subject,
           body = EXCLUDED.body,
           version = templates.version + 1,
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [template_id, channel, event_type, subject, body]
      );
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error saving template:', error);
      throw error;
    }
  }
}

module.exports = new TemplateService();
