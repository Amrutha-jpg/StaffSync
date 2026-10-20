/**
 * In-app notification dispatcher utility.
 * Currently logs notifications to console and can be extended to
 * support email, push, or WebSocket-based delivery.
 */

const notificationTypes = {
  LEAVE_APPROVED: 'leave_approved',
  LEAVE_REJECTED: 'leave_rejected',
  LEAVE_SUBMITTED: 'leave_submitted',
  ANNOUNCEMENT_POSTED: 'announcement_posted',
  TRAINING_ENROLLED: 'training_enrolled',
  TRAINING_UPDATED: 'training_updated',
};

/**
 * Dispatch a notification.
 * @param {string} type - Notification type from notificationTypes.
 * @param {string} recipientId - User ID of the recipient.
 * @param {object} payload - Additional metadata (message, referenceId, etc.).
 */
const dispatchNotification = async (type, recipientId, payload = {}) => {
  try {
    const notification = {
      type,
      recipientId: recipientId?.toString(),
      payload,
      timestamp: new Date().toISOString(),
    };

    // Log the notification (in production, save to DB or emit via WebSocket)
    console.log(`[NOTIFICATION] → ${type} | recipient: ${recipientId}`, payload);

    // TODO: Integrate with a real-time layer (e.g., Socket.IO) or
    // notification collection in MongoDB for persistent in-app alerts.
    return notification;
  } catch (err) {
    console.error('[NOTIFICATION ERROR]', err.message);
  }
};

module.exports = { dispatchNotification, notificationTypes };
