const nodemailer = require("nodemailer");

/**
 * Email Utility for Track2Give
 * Handles all email notifications and communications
 */

/**
 * Create email transporter
 * Configure with your email service provider
 */
function createTransporter() {
  // TODO: Configure with actual email service (SendGrid, Gmail, etc.)
  // For development, you can use Ethereal (fake SMTP service)

  /* Production example with SendGrid:
  return nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY
    }
  });
  */

  /* Production example with Gmail:
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  */

  // Development: Log to console instead of sending
  return {
    sendMail: async (mailOptions) => {
      console.log("📧 Email would be sent:");
      console.log("To:", mailOptions.to);
      console.log("Subject:", mailOptions.subject);
      console.log("Content:", mailOptions.text);
      return { messageId: "dev-" + Date.now() };
    },
  };
}

/**
 * Send welcome email to new user
 * @param {String} email - User's email address
 * @param {String} username - User's username
 * @returns {Promise<Object>} Email send result
 */
async function sendWelcomeEmail(email, username) {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: '"Track2Give" <noreply@track2give.com>',
      to: email,
      subject: "Welcome to Track2Give! 🌱",
      text: `Hi ${username}!\n\nWelcome to Track2Give - your partner in reducing food waste and making a positive environmental impact.\n\nWith Track2Give, you can:\n✅ Track your food items and expiry dates\n✅ Get notified before food expires\n✅ Share excess food with your community\n✅ See your environmental impact\n\nGet started by uploading your first receipt or adding food items manually!\n\nTogether, we can make a difference.\n\nThe Track2Give Team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #f59e0b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .feature { padding: 10px 0; }
            .feature::before { content: "✅ "; color: #10b981; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .btn { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Track2Give! 🌱</h1>
            </div>
            <div class="content">
              <p>Hi ${username}!</p>
              <p>Welcome to Track2Give - your partner in reducing food waste and making a positive environmental impact.</p>

              <h3>What you can do with Track2Give:</h3>
              <div class="feature">Track your food items and expiry dates</div>
              <div class="feature">Get notified before food expires</div>
              <div class="feature">Share excess food with your community</div>
              <div class="feature">See your environmental impact</div>

              <p>Get started by uploading your first receipt or adding food items manually!</p>

              <a href="${
                process.env.APP_URL || "http://localhost:3000"
              }/dashboard" class="btn">Go to Dashboard</a>

              <p style="margin-top: 30px;">Together, we can make a difference.</p>
              <p><strong>The Track2Give Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 Track2Give. All rights reserved.</p>
              <p>UN SDG Goals: #2 Zero Hunger | #12 Responsible Consumption | #13 Climate Action</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent:", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw error;
  }
}

/**
 * Send password reset email
 * @param {String} email - User's email address
 * @param {String} resetToken - Password reset token
 * @returns {Promise<Object>} Email send result
 */
async function sendPasswordResetEmail(email, resetToken) {
  try {
    const transporter = createTransporter();
    const resetUrl = `${
      process.env.APP_URL || "http://localhost:3000"
    }/reset-password/${resetToken}`;

    const mailOptions = {
      from: '"Track2Give" <noreply@track2give.com>',
      to: email,
      subject: "Reset Your Password - Track2Give",
      text: `You requested a password reset.\n\nClick this link to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nTrack2Give Team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #f59e0b 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .btn { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .warning { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>You requested a password reset for your Track2Give account.</p>

              <p>Click the button below to reset your password:</p>

              <a href="${resetUrl}" class="btn">Reset Password</a>

              <div class="warning">
                <strong>⚠️ Security Notice:</strong><br>
                This link will expire in 1 hour for your security.
              </div>

              <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>

              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="color: #667eea; word-break: break-all;">${resetUrl}</p>
            </div>
            <div class="footer">
              <p>© 2025 Track2Give. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent:", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
}

/**
 * Send expiry notification email
 * @param {String} email - User's email address
 * @param {String} username - User's username
 * @param {Array} expiringItems - Array of expiring food items
 * @returns {Promise<Object>} Email send result
 */
async function sendExpiryNotificationEmail(email, username, expiringItems) {
  try {
    const transporter = createTransporter();

    const itemCount = expiringItems.length;
    const itemsList = expiringItems
      .map(
        (item) =>
          `- ${item.name} (expires on ${new Date(
            item.expiryDate
          ).toLocaleDateString()})`
      )
      .join("\n");

    const itemsHtml = expiringItems
      .map(
        (item) => `
        <div style="padding: 10px; margin: 10px 0; background: white; border-left: 4px solid #f59e0b; border-radius: 4px;">
          <strong>${item.name}</strong><br>
          <span style="color: #f59e0b;">Expires: ${new Date(
            item.expiryDate
          ).toLocaleDateString()}</span>
        </div>
      `
      )
      .join("");

    const mailOptions = {
      from: '"Track2Give" <noreply@track2give.com>',
      to: email,
      subject: `⚠️ ${itemCount} Food Item${
        itemCount > 1 ? "s" : ""
      } Expiring Soon!`,
      text: `Hi ${username}!\n\nYou have ${itemCount} food item${
        itemCount > 1 ? "s" : ""
      } expiring soon:\n\n${itemsList}\n\nConsider using these items today or donating them to your community to reduce waste!\n\nView your dashboard: ${
        process.env.APP_URL || "http://localhost:3000"
      }/dashboard\n\nTrack2Give Team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .btn { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Food Items Expiring Soon!</h1>
            </div>
            <div class="content">
              <p>Hi ${username}!</p>

              <p>You have <strong>${itemCount}</strong> food item${
        itemCount > 1 ? "s" : ""
      } expiring soon:</p>

              ${itemsHtml}

              <p>💡 <strong>What you can do:</strong></p>
              <ul>
                <li>Use these items in your meals today</li>
                <li>Donate them to your community</li>
                <li>Share with neighbors to reduce waste</li>
              </ul>

              <a href="${
                process.env.APP_URL || "http://localhost:3000"
              }/dashboard" class="btn">View Dashboard</a>

              <p>Together, we're making a difference! 🌱</p>
            </div>
            <div class="footer">
              <p>© 2025 Track2Give. All rights reserved.</p>
              <p>You can adjust notification preferences in your settings.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Expiry notification email sent:", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending expiry notification email:", error);
    throw error;
  }
}

/**
 * Send item claimed notification email
 * @param {String} email - Donor's email address
 * @param {String} username - Donor's username
 * @param {String} itemName - Name of claimed item
 * @param {String} claimedBy - Username who claimed
 * @returns {Promise<Object>} Email send result
 */
async function sendItemClaimedEmail(email, username, itemName, claimedBy) {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: '"Track2Give" <noreply@track2give.com>',
      to: email,
      subject: `🎉 Your ${itemName} Was Claimed!`,
      text: `Hi ${username}!\n\nGreat news! ${claimedBy} has claimed your ${itemName}.\n\nThank you for helping reduce food waste and supporting your community!\n\nYour environmental impact:\n- Food waste prevented\n- CO2 emissions saved\n- Water resources conserved\n\nView your impact stats: ${
        process.env.APP_URL || "http://localhost:3000"
      }/dashboard\n\nKeep up the great work!\n\nTrack2Give Team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .impact-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 2px solid #10b981; }
            .btn { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Your Item Was Claimed!</h1>
            </div>
            <div class="content">
              <p>Hi ${username}!</p>

              <p>Great news! <strong>${claimedBy}</strong> has claimed your <strong>${itemName}</strong>.</p>

              <div class="impact-box">
                <h3 style="color: #10b981; margin-top: 0;">🌱 Your Environmental Impact</h3>
                <ul>
                  <li>✅ Food waste prevented</li>
                  <li>✅ CO2 emissions saved</li>
                  <li>✅ Water resources conserved</li>
                  <li>✅ Community supported</li>
                </ul>
              </div>

              <p>Thank you for helping reduce food waste and supporting your community!</p>

              <a href="${
                process.env.APP_URL || "http://localhost:3000"
              }/dashboard" class="btn">View Your Impact Stats</a>

              <p>Keep up the great work! Every donation makes a difference. 🌍</p>
            </div>
            <div class="footer">
              <p>© 2025 Track2Give. All rights reserved.</p>
              <p>Together, we're fighting food waste and climate change.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Item claimed email sent:", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending item claimed email:", error);
    throw error;
  }
}

/**
 * Send donation reminder email
 * @param {String} email - User's email address
 * @param {String} username - User's username
 * @param {Array} items - Items suitable for donation
 * @returns {Promise<Object>} Email send result
 */
async function sendDonationReminderEmail(email, username, items) {
  try {
    const transporter = createTransporter();

    const itemCount = items.length;
    const itemsList = items
      .map(
        (item) =>
          `- ${item.name} (expires ${new Date(
            item.expiryDate
          ).toLocaleDateString()})`
      )
      .join("\n");

    const itemsHtml = items
      .map(
        (item) => `
        <div style="padding: 10px; margin: 10px 0; background: white; border-left: 4px solid #10b981; border-radius: 4px;">
          <strong>${item.name}</strong><br>
          <span style="color: #666;">Expires: ${new Date(
            item.expiryDate
          ).toLocaleDateString()}</span>
        </div>
      `
      )
      .join("");

    const mailOptions = {
      from: '"Track2Give" <noreply@track2give.com>',
      to: email,
      subject: `💚 Consider Donating ${itemCount} Item${
        itemCount > 1 ? "s" : ""
      }`,
      text: `Hi ${username}!\n\nYou have ${itemCount} item${
        itemCount > 1 ? "s" : ""
      } that could help someone in your community:\n\n${itemsList}\n\nDonating these items will:\n✅ Help reduce food waste\n✅ Support your community\n✅ Reduce your environmental impact\n\nShare your items: ${
        process.env.APP_URL || "http://localhost:3000"
      }/donate\n\nTrack2Give Team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .btn { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💚 Consider Donating</h1>
            </div>
            <div class="content">
              <p>Hi ${username}!</p>

              <p>You have <strong>${itemCount}</strong> item${
        itemCount > 1 ? "s" : ""
      } that could help someone in your community:</p>

              ${itemsHtml}

              <p><strong>Why donate?</strong></p>
              <ul>
                <li>✅ Help reduce food waste</li>
                <li>✅ Support your community</li>
                <li>✅ Reduce your environmental impact</li>
                <li>✅ Make a positive difference</li>
              </ul>

              <a href="${
                process.env.APP_URL || "http://localhost:3000"
              }/donate" class="btn">Share Your Items</a>

              <p>Every donation counts! 🌱</p>
            </div>
            <div class="footer">
              <p>© 2025 Track2Give. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Donation reminder email sent:", result.messageId);
    return result;
  } catch (error) {
    console.error("Error sending donation reminder email:", error);
    throw error;
  }
}

/**
 * Test email configuration
 * @param {String} toEmail - Email to send test message
 * @returns {Promise<Object>} Test result
 */
async function testEmailConfig(toEmail) {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: '"Track2Give" <noreply@track2give.com>',
      to: toEmail,
      subject: "Test Email - Track2Give",
      text: "This is a test email from Track2Give. If you received this, your email configuration is working correctly!",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>✅ Email Configuration Test</h2>
          <p>This is a test email from Track2Give.</p>
          <p>If you received this, your email configuration is working correctly!</p>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Test email sent successfully:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Email configuration test failed:", error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendExpiryNotificationEmail,
  sendItemClaimedEmail,
  sendDonationReminderEmail,
  testEmailConfig,
};
