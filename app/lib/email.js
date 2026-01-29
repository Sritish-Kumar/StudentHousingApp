import nodemailer from "nodemailer";

console.log("SMTP Config:", {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER ? "Set" : "Not Set",
    pass: process.env.SMTP_PASS ? "Set" : "Not Set"
});

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const sendData = async (data, req) => {
    const mailOptions = {
        from: process.env.SMTP_FROM_EMAIL || "no-reply@studenthousing.com",
        to: data.to,
        subject: data.subject,
        html: data.html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Message sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};
