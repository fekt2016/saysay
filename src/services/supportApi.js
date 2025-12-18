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
   */
  createTicket: async (payload) => {
    try {
      const formData = new FormData();

      // Add text fields
      formData.append('department', payload.department);
      formData.append('title', payload.title);
      formData.append('message', payload.message);
      
      if (payload.priority) {
        formData.append('priority', payload.priority);
      }
      if (payload.issueType) {
        formData.append('issueType', payload.issueType);
      }
      if (payload.relatedOrderId) {
        formData.append('relatedOrderId', payload.relatedOrderId);
      }
      if (payload.relatedProductId) {
        formData.append('relatedProductId', payload.relatedProductId);
      }
      if (payload.relatedPayoutId) {
        formData.append('relatedPayoutId', payload.relatedPayoutId);
      }

      // Add file attachments if provided
      if (payload.attachments && Array.isArray(payload.attachments) && payload.attachments.length > 0) {
        payload.attachments.forEach((file, index) => {
          const fileObject = {
            uri: Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri,
            name: file.name || `attachment-${index}.jpg`,
            type: file.type || 'image/jpeg',
          };
          formData.append('attachments', fileObject);
        });
      }

      const response = await api.post('/support/tickets', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  },

  /**
   * List user's support tickets
   * GET /api/v1/support/tickets/my
   * @param {Object} params - Query parameters
   * @param {string} params.status - Filter by status (open, closed, pending, resolved)
   * @param {string} params.department - Filter by department
   * @param {string} params.priority - Filter by priority
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 20)
   * @returns {Promise} API response
   */
  listTickets: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.status) {
        queryParams.append('status', params.status);
      }
      if (params.department) {
        queryParams.append('department', params.department);
      }
      if (params.priority) {
        queryParams.append('priority', params.priority);
      }
      if (params.page) {
        queryParams.append('page', params.page.toString());
      }
      if (params.limit) {
        queryParams.append('limit', params.limit.toString());
      }

      const queryString = queryParams.toString();
      const url = `/support/tickets/my${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error listing tickets:', error);
      throw error;
    }
  },

  /**
   * Get ticket by ID with messages
   * GET /api/v1/support/tickets/:id
   * @param {string} ticketId - Ticket ID
   * @returns {Promise} API response
   */
  getTicketById: async (ticketId) => {
    try {
      const response = await api.get(`/support/tickets/${ticketId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching ticket:', error);
      throw error;
    }
  },

  /**
   * Reply to a support ticket
   * POST /api/v1/support/tickets/:id/reply
   * @param {string} ticketId - Ticket ID
   * @param {Object} payload - Reply data
   * @param {string} payload.message - Reply message (required)
   * @param {boolean} payload.isInternal - Whether reply is internal (admin only)
   * @param {Array} payload.attachments - Array of file objects (optional)
   * @returns {Promise} API response
   */
  replyToTicket: async (ticketId, payload) => {
    try {
      const formData = new FormData();

      // Add message
      formData.append('message', payload.message);
      
      if (payload.isInternal !== undefined) {
        formData.append('isInternal', payload.isInternal.toString());
      }

      // Add file attachments if provided
      if (payload.attachments && Array.isArray(payload.attachments) && payload.attachments.length > 0) {
        payload.attachments.forEach((file, index) => {
          const fileObject = {
            uri: Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri,
            name: file.name || `attachment-${index}.jpg`,
            type: file.type || 'image/jpeg',
          };
          formData.append('attachments', fileObject);
        });
      }

      const response = await api.post(`/support/tickets/${ticketId}/reply`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error replying to ticket:', error);
      throw error;
    }
  },
};

export default supportApi;
