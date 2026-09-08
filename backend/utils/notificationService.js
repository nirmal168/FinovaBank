const Notification = require('../models/Notification');
const { getIO } = require('./socket');

/**
 * Creates and saves a notification to DB, then pushes real-time event via Socket.IO if connected.
 * @param {Object} options
 * @param {string|mongoose.Types.ObjectId} options.user - Target user ObjectId
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {string} options.type - 'LOGIN'|'DEPOSIT'|'WITHDRAWAL'|'TRANSFER'|'LOAN'|'FRAUD'|'ACCOUNT'
 */
const createNotification = async ({ user, title, message, type }) => {
  try {
    const notification = await Notification.create({
      user,
      title,
      message,
      type,
      isRead: false,
    });

    const io = getIO();
    if (io) {
      const room = `user:${user.toString()}`;
      io.to(room).emit('notification:new', notification);
    }

    return notification;
  } catch (err) {
    console.error(`[NotificationService Error] Could not dispatch notification:`, err.message);
    return null;
  }
};

module.exports = {
  createNotification,
};
