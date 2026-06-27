import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;

  if (smtpUser && smtpPass) {
    // Use real SMTP (Gmail)
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  } else {
    // Fallback to fake Ethereal account if no env variables set
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const mailer = await getTransporter();
    const fromAddress = process.env.SMTP_USER || '"ConnectMyEvent" <noreply@connectmyevent.test>';
    
    const info = await mailer.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
    });

    console.log(`\n=================================================`);
    console.log(`✉️ Email sent to ${to}: "${subject}"`);
    
    if (process.env.SMTP_USER) {
      console.log(`✅ Sent successfully via Gmail!`);
    } else {
      console.log(`🔗 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    console.log(`=================================================\n`);
    
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return { success: false, error };
  }
}
