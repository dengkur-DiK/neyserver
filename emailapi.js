 import nodemailer from 'nodemailer';

// Use environment variables for security.
// DO NOT hardcode your email or password here.
const userEmail = process.env.EMAIL_USER;
const userPassword = process.env.EMAIL_PASS;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Extract the form data from the request body
  const { name, email, subject, message } = req.body;

  // Create a Nodemailer transporter using a secure service like SendGrid or Mailgun.
  // Using a personal Gmail account is not recommended for production.
  const transporter = nodemailer.createTransport({
    // Example using a common SMTP host. Replace with your provider's details.
    host: 'smtp.your-email-provider.com',
    port: 587,
    secure: false, // Use 'true' if your provider requires SSL/TLS
    auth: {
      user: userEmail,
      pass: userPassword, 
    },
  });

  // Define the email content
  const mailOptions = {
    // The 'from' field is set to your verified email from your provider
    from: 'hello@antbrosphotography.com', 
    to: 'antbrosphotography@gmail.com', // The email address you want to receive messages at
    subject: `New Message from Contact Form: ${subject}`,
    html: `
      <h2>New Message from Your Website</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <hr>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `,
  };

  try {
    // Send the email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send email.' });
  }
}
