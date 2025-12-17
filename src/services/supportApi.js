import api from './api';
import { Platform } from 'react-native';

const supportApi = {
  /**
   * Create a new support ticket
   * POST /api/v1/support/tickets
   * @param {Object} payload - Ticket data
   * @param {string} payload.department - Department (required)
   * @param {string} payload.title - Ticket title (required)
   * @param {string} payload.message - Ticket message (required)
   * @param {string} payload.priority - Priority (low, medium, high, urgent)
   * @param {string} payload.issueType - Issue type
   * @param {string} payload.relatedOrderId - Related order ID
   * @param {string} payload.relatedProductId - Related product ID
   * @param {string} payload.relatedPayoutId - Related payout ID
   * @param {Array} payload.attachments - Array of file objects (optional)
   * @returns {Promise} API response
