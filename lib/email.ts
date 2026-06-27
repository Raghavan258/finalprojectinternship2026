import nodemailer from "nodemailer";

let testAccount: nodemailer.TestAccount | null = null;
let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;

  // Generate a test Ethereal Email account dynamically
  testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const mailer = await getTransporter();
    
    const info = await mailer.sendMail({
      from: '"ConnectMyEvent" <noreply@connectmyevent.test>',
      to,
      subject,
      html,
    });

    console.log(`\n=================================================`);
    console.log(`✉️ Email sent to ${to}: "${subject}"`);
    console.log(`🔗 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    console.log(`=================================================\n`);
    
    return { success: true, previewUrl: nodemailer.getTestMessageUrl(info) };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return { success: false, error };
  }
}
