const Template = require('../models/Template');
const logger = require('../config/logger');

class TemplateService {
  async getTemplate(eventType, channel) {
    try {
      const template = await Template.findOne({
        event_type: eventType,
        channel: channel,
        active: true
      }).sort({ version: -1 });
      
      return template;
    } catch (error) {
      logger.error('Error fetching template:', error);
      throw error;
    }
  }

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

  async saveTemplate(templateData) {
    try {
      const { template_id, name, channel, event_type, subject, body, variables } = templateData;
      
      const existing = await Template.findOne({ template_id });
      
      if (existing) {
        existing.name = name || existing.name;
        existing.subject = subject;
        existing.body = body;
        existing.variables = variables || existing.variables;
        existing.version += 1;
        await existing.save();
        return existing;
      } else {
        const template = await Template.create({
          template_id,
          name,
          channel,
          event_type,
          subject,
          body,
          variables: variables || [],
          version: 1
        });
        return template;
      }
    } catch (error) {
      logger.error('Error saving template:', error);
      throw error;
    }
  }

  async getAllTemplates() {
    try {
      return await Template.find({ active: true }).sort({ event_type: 1, channel: 1 });
    } catch (error) {
      logger.error('Error fetching templates:', error);
      throw error;
    }
  }
}

module.exports = new TemplateService();
