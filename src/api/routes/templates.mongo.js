const express = require('express');
const Joi = require('joi');
const templateService = require('../../services/template.service.mongo');
const Template = require('../../models/Template');
const logger = require('../../config/logger');

const router = express.Router();

// Validation schema
const templateSchema = Joi.object({
  template_id: Joi.string().required(),
  name: Joi.string().required(),
  channel: Joi.string().valid('email', 'sms', 'push', 'inapp').required(),
  event_type: Joi.string().required(),
  subject: Joi.string().when('channel', { is: 'email', then: Joi.required(), otherwise: Joi.optional() }),
  body: Joi.string().required(),
  variables: Joi.array().items(Joi.string()).optional()
});

/**
 * GET /api/templates
 * Get all templates
 */
router.get('/', async (req, res, next) => {
  try {
    const templates = await templateService.getAllTemplates();
    res.json({ templates });
  } catch (error) {
    logger.error('Error fetching templates:', error);
    next(error);
  }
});

/**
 * GET /api/templates/:templateId
 * Get specific template
 */
router.get('/:templateId', async (req, res, next) => {
  try {
    const template = await Template.findOne({ template_id: req.params.templateId });
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    logger.error('Error fetching template:', error);
    next(error);
  }
});

/**
 * POST /api/templates
 * Create or update template
 */
router.post('/', async (req, res, next) => {
  try {
    const { error, value } = templateSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    const template = await templateService.saveTemplate(value);
    
    logger.info('Template saved', { template_id: template.template_id });
    
    res.status(201).json({
      message: 'Template saved successfully',
      template
    });

  } catch (error) {
    logger.error('Error saving template:', error);
    next(error);
  }
});

/**
 * DELETE /api/templates/:templateId
 * Deactivate template
 */
router.delete('/:templateId', async (req, res, next) => {
  try {
    const template = await Template.findOneAndUpdate(
      { template_id: req.params.templateId },
      { active: false },
      { new: true }
    );
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    logger.info('Template deactivated', { template_id: template.template_id });
    
    res.json({
      message: 'Template deactivated successfully',
      template
    });

  } catch (error) {
    logger.error('Error deactivating template:', error);
    next(error);
  }
});

module.exports = router;
