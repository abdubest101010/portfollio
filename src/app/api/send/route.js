import nodemailer from "nodemailer";

export async function POST(req) {
  const { email, subject, message } = await req.json();

  // Nodemailer configuration for Gmail
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER, // Your Gmail email (authenticated user)
      pass: process.env.GMAIL_PASS, // Your Gmail password or app-specific password
    },
  });

  const mailOptions = {
    from: process.env.GMAIL_USER, // Use your Gmail address as the sender
    to: process.env.GMAIL_USER, // Send the email to your Gmail address
    subject: subject, // Subject of the email
    text: message, // Plain text body
    html: `<p>${message}</p>`, // Optional: HTML body of the email
    replyTo: email, // Set the reply-to address to the user's email
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.response);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Error sending email: ", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
