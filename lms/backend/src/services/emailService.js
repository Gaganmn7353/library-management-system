/**
 * Email Notification Service
 * 
 * This service handles sending email notifications for:
 * - Book due date reminders
 * - Overdue book notifications
 * - Transaction confirmations
 * 
 * Note: This is a template structure. In production, integrate with:
 * - Nodemailer (Gmail, SMTP)
 * - SendGrid
 * - AWS SES
 * - Mailgun
 * - etc.
 */

import logger from '../utils/logger.js';
import config from '../config/env.js';

class EmailService {
  /**
   * Send email notification
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.html - HTML email body
   * @param {string} options.text - Plain text email body (optional)
   */
  async sendEmail({ to, subject, html, text }) {
    // In production, implement actual email sending logic here
    // For now, we'll just log the email
    
    logger.info('📧 Email would be sent:', {
      to,
      subject,
      html: html.substring(0, 100) + '...',
    });

    // TODO: Implement actual email sending
    // Example with Nodemailer:
    /*
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to,
      subject,
      html,
      text,
    });
    */

    return { success: true, message: 'Email sent successfully' };
  }

  /**
   * Send book due date reminder
   * @param {Object} transaction - Transaction object with member and book details
   */
  async sendDueDateReminder(transaction) {
    const { member_email, member_name, book_title, due_date } = transaction;
    
    const subject = `Book Due Date Reminder: ${book_title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Book Due Date Reminder</h2>
        <p>Dear ${member_name || 'Member'},</p>
        <p>This is a reminder that the following book is due soon:</p>
        <div style="background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Book:</strong> ${book_title}</p>
          <p><strong>Due Date:</strong> ${new Date(due_date).toLocaleDateString()}</p>
        </div>
        <p>Please return the book by the due date to avoid late fees.</p>
        <p>Thank you for using our library!</p>
        <hr>
        <p style="color: #666; font-size: 12px;">This is an automated message from the Library Management System.</p>
      </div>
    `;
    const text = `Book Due Date Reminder\n\nDear ${member_name || 'Member'},\n\nThis is a reminder that "${book_title}" is due on ${new Date(due_date).toLocaleDateString()}. Please return the book by the due date to avoid late fees.\n\nThank you!`;

    return await this.sendEmail({ to: member_email, subject, html, text });
  }

  /**
   * Send overdue book notification
   * @param {Object} transaction - Transaction object with member and book details
   */
  async sendOverdueNotification(transaction) {
    const { member_email, member_name, book_title, due_date, fine_amount, days_overdue } = transaction;
    
    const subject = `⚠️ Overdue Book: ${book_title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">Book Overdue Notice</h2>
        <p>Dear ${member_name || 'Member'},</p>
        <p>The following book is overdue:</p>
        <div style="background: #ffebee; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #d32f2f;">
          <p><strong>Book:</strong> ${book_title}</p>
          <p><strong>Due Date:</strong> ${new Date(due_date).toLocaleDateString()}</p>
          <p><strong>Days Overdue:</strong> ${days_overdue || 'N/A'}</p>
          <p><strong>Current Fine:</strong> ₹${parseFloat(fine_amount || 0).toFixed(2)}</p>
        </div>
        <p>Please return the book immediately to prevent further fines.</p>
        <p>The fine rate is ₹5 per day after the due date.</p>
        <p>Thank you for your prompt attention.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">This is an automated message from the Library Management System.</p>
      </div>
    `;
    const text = `Book Overdue Notice\n\nDear ${member_name || 'Member'},\n\nThe book "${book_title}" was due on ${new Date(due_date).toLocaleDateString()} and is now overdue. Current fine: ₹${parseFloat(fine_amount || 0).toFixed(2)}. Please return the book immediately.\n\nThank you!`;

    return await this.sendEmail({ to: member_email, subject, html, text });
  }

  /**
   * Send book issue confirmation
   * @param {Object} transaction - Transaction object with member and book details
   */
  async sendIssueConfirmation(transaction) {
    const { member_email, member_name, book_title, issue_date, due_date } = transaction;
    
    const subject = `Book Issued: ${book_title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Book Issued Confirmation</h2>
        <p>Dear ${member_name || 'Member'},</p>
        <p>This confirms that the following book has been issued to you:</p>
        <div style="background: #e3f2fd; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Book:</strong> ${book_title}</p>
          <p><strong>Issue Date:</strong> ${new Date(issue_date).toLocaleDateString()}</p>
          <p><strong>Due Date:</strong> ${new Date(due_date).toLocaleDateString()}</p>
        </div>
        <p>Please return the book by the due date to avoid late fees.</p>
        <p>Thank you for using our library!</p>
        <hr>
        <p style="color: #666; font-size: 12px;">This is an automated message from the Library Management System.</p>
      </div>
    `;
    const text = `Book Issued Confirmation\n\nDear ${member_name || 'Member'},\n\nThe book "${book_title}" has been issued to you. Due date: ${new Date(due_date).toLocaleDateString()}. Please return by the due date.\n\nThank you!`;

    return await this.sendEmail({ to: member_email, subject, html, text });
  }

  /**
   * Send book return confirmation
   * @param {Object} transaction - Transaction object with member and book details
   */
  async sendReturnConfirmation(transaction) {
    const { member_email, member_name, book_title, return_date, fine_amount } = transaction;
    
    const subject = `Book Returned: ${book_title}`;
    const fineInfo = fine_amount > 0 
      ? `<p><strong>Fine Amount:</strong> ₹${parseFloat(fine_amount).toFixed(2)}</p>`
      : '<p>No fine was charged.</p>';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Book Return Confirmation</h2>
        <p>Dear ${member_name || 'Member'},</p>
        <p>The following book has been returned:</p>
        <div style="background: #e8f5e9; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Book:</strong> ${book_title}</p>
          <p><strong>Return Date:</strong> ${new Date(return_date).toLocaleDateString()}</p>
          ${fineInfo}
        </div>
        <p>Thank you for using our library!</p>
        <hr>
        <p style="color: #666; font-size: 12px;">This is an automated message from the Library Management System.</p>
      </div>
    `;
    const text = `Book Return Confirmation\n\nDear ${member_name || 'Member'},\n\nThe book "${book_title}" has been returned on ${new Date(return_date).toLocaleDateString()}. ${fine_amount > 0 ? `Fine: ₹${parseFloat(fine_amount).toFixed(2)}` : 'No fine charged.'}\n\nThank you!`;

    return await this.sendEmail({ to: member_email, subject, html, text });
  },

  /**
   * Send reservation fulfillment notification
   * @param {Object} reservation - Reservation object with member and book details
   */
  async sendReservationFulfillmentNotification(reservation) {
    const { member_email, member_name, book_title, expiry_date } = reservation;
    
    const subject = `✅ Reserved Book Available: ${book_title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4caf50;">Your Reserved Book is Available!</h2>
        <p>Dear ${member_name || 'Member'},</p>
        <p>Great news! The book you reserved is now available for collection:</p>
        <div style="background: #e8f5e9; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #4caf50;">
          <p><strong>Book:</strong> ${book_title}</p>
          <p><strong>Collection Deadline:</strong> ${new Date(expiry_date).toLocaleString()}</p>
          <p><strong>Time Remaining:</strong> 48 hours</p>
        </div>
        <p>⚠️ <strong>Important:</strong> Please collect the book within 48 hours. If you don't collect it by the deadline, your reservation will be cancelled and the book will go to the next person in the queue.</p>
        <p>Thank you for using our library!</p>
        <hr>
        <p style="color: #666; font-size: 12px;">This is an automated message from the Library Management System.</p>
      </div>
    `;
    const text = `Your Reserved Book is Available!\n\nDear ${member_name || 'Member'},\n\nThe book "${book_title}" is now available for collection. Please collect it within 48 hours (by ${new Date(expiry_date).toLocaleString()}) or your reservation will be cancelled.\n\nThank you!`;

    return await this.sendEmail({ to: member_email, subject, html, text });
  },

  /**
   * Send reservation expiry reminder (24 hours before expiry)
   * @param {Object} reservation - Reservation object with member and book details
   */
  async sendReservationExpiryReminder(reservation) {
    const { member_email, member_name, book_title, expiry_date } = reservation;
    
    const subject = `⏰ Reservation Expiring Soon: ${book_title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff9800;">Reservation Expiring Soon</h2>
        <p>Dear ${member_name || 'Member'},</p>
        <p>This is a reminder that your reserved book will expire soon:</p>
        <div style="background: #fff3e0; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ff9800;">
          <p><strong>Book:</strong> ${book_title}</p>
          <p><strong>Expires:</strong> ${new Date(expiry_date).toLocaleString()}</p>
        </div>
        <p>Please collect the book soon to avoid cancellation.</p>
        <p>Thank you!</p>
        <hr>
        <p style="color: #666; font-size: 12px;">This is an automated message from the Library Management System.</p>
      </div>
    `;
    const text = `Reservation Expiring Soon\n\nDear ${member_name || 'Member'},\n\nYour reservation for "${book_title}" will expire on ${new Date(expiry_date).toLocaleString()}. Please collect the book soon.\n\nThank you!`;

    return await this.sendEmail({ to: member_email, subject, html, text });
  },
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;

