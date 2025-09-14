import nodemailer from "nodemailer";

const {
    SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, FROM_EMAIL
} = process.env;

export const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 465),
    secure: String(SMTP_SECURE || "true") === "true", 
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
});

function shell(title, body) {
    return `<!doctype html><html><head><meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
  <style>
    body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#0f172a;margin:0;padding:24px;background:#f8fafc}
    .card{max-width:640px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px}
    h1{font-size:18px;margin:0 0 12px} p{margin:0 0 10px;line-height:1.5}
    .muted{color:#64748b;font-size:12px;margin-top:14px}
  </style></head><body><div class="card">${body}</div></body></html>`;
}

export async function sendApplicantEmail({ to, name }) {
    const subject = "✅ Application received — DevKoder";
    const html = shell("Application received", `
    <h1>Thanks, ${name || "there"}!</h1>
    <p>We’ve received your application. Our team will contact you within 24–48 hours.</p>
    <p class="muted">DevKoder • https://www.devkoder.com</p>
  `);
    const text = `Thanks, ${name || "there"}! We’ve received your application. Our team will contact you within 24–48 hours. - DevKoder`;
    await transporter.sendMail({ from: FROM_EMAIL, to, subject, html, text });
}

export async function sendAdminEmail({ to, doc }) {
    const subject = "📨 New application — DevKoder";
    const html = shell("New application", `
    <h1>New application</h1>
    <p><b>Name:</b> ${doc.name || ""}</p>
    <p><b>Email:</b> ${doc.email || ""}</p>
    <p><b>Phone:</b> ${doc.phone || ""}</p>
    <p><b>Message:</b> ${doc.message ? String(doc.message).replace(/\n/g, "<br/>") : ""}</p>
    <p class="muted">ID: ${doc._id} • ${new Date(doc.createdAt || Date.now()).toLocaleString()}</p>
  `);
    const text = `New application
Name: ${doc.name || ""}
Email: ${doc.email || ""}
Phone: ${doc.phone || ""}
Message: ${doc.message || ""}
ID: ${doc._id}`;
    await transporter.sendMail({ from: FROM_EMAIL, to, subject, html, text });
}
