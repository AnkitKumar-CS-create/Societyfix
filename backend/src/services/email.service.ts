import { Resend } from 'resend';

// Initialize Resend if the API key exists in .env
const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;
const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';

export const sendStatusUpdateEmail = async (toEmail: string, title: string, newStatus: string, note?: string) => {
  const subject = `Update on your complaint: ${title}`;
  const html = `
    <h2>Your complaint status has been updated</h2>
    <p><strong>Complaint:</strong> ${title}</p>
    <p><strong>New Status:</strong> ${newStatus}</p>
    ${note ? `<p><strong>Admin Note:</strong> ${note}</p>` : ''}
    <br/>
    <p>Log in to your SocietyFix dashboard to view the full timeline.</p>
  `;

  if (resend) {
    try {
      await resend.emails.send({ from: fromEmail, to: toEmail, subject, html });
    } catch (error) {
      console.error('Failed to send status email:', error);
    }
  } else {
    // MOCK MODE: If no API key is provided, just log it to the terminal
    console.log(`✉️ [MOCK EMAIL SENT to ${toEmail}] Subject: ${subject}`);
  }
};

export const sendImportantNoticeEmail = async (toEmails: string[], title: string, content: string) => {
  const subject = `📌 IMPORTANT SOCIETY NOTICE: ${title}`;
  const html = `
    <h2>${title}</h2>
    <p>${content}</p>
    <br/>
    <p>Please check the SocietyFix Notice Board for more information.</p>
  `;

  if (resend) {
    try {
      // Send individual emails to avoid exposing everyone's email in CC
      for (const toEmail of toEmails) {
        await resend.emails.send({ from: fromEmail, to: toEmail, subject, html });
      }
    } catch (error) {
      console.error('Failed to send notice emails:', error);
    }
  } else {
    console.log(`✉️ [MOCK BATCH EMAIL SENT to ${toEmails.length} residents] Subject: ${subject}`);
  }
};