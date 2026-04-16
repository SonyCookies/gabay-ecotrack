import nodemailer from "nodemailer";

// ---------------------------------------------------------------------------
// Transporter — created once per Node.js process (warm across requests)
// ---------------------------------------------------------------------------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true", // true for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface PickupCompleteEmailOptions {
  to: string;           // resident email
  residentName: string;
  wasteType: string;
  score: number;        // 1-5 star rating
  criteria: {
    segregated: boolean;
    clean: boolean;
    packaged: boolean;
  };
  completedAt?: string; // ISO date string
}

// ---------------------------------------------------------------------------
// Star helpers
// ---------------------------------------------------------------------------
const starBar = (score: number) =>
  Array.from({ length: 5 }, (_, i) => (i < score ? "★" : "☆")).join("");

// ---------------------------------------------------------------------------
// sendPickupCompleteEmail
// ---------------------------------------------------------------------------
export async function sendPickupCompleteEmail(opts: PickupCompleteEmailOptions) {
  const {
    to,
    residentName,
    wasteType,
    score,
    criteria,
    completedAt,
  } = opts;

  const date = completedAt
    ? new Date(completedAt).toLocaleDateString("en-PH", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-PH", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  const criteriaRows = [
    { label: "Properly Segregated", met: criteria.segregated },
    { label: "Clean & Dry",         met: criteria.clean },
    { label: "Securely Packaged",   met: criteria.packaged },
  ]
    .map(
      (c) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#374151;">${c.label}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:16px;">
            ${c.met ? "✅" : "❌"}
          </td>
        </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#ffffff;padding:48px;text-align:center;border-bottom:1px solid #f0f0f0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}" style="text-decoration:none;">
              <img src="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/logo/gabaylogo.png" 
                   alt="GABAY EcoTrack" 
                   style="width:180px;height:auto;display:block;margin:0 auto;" />
            </a>
            <p style="margin:16px 0 0;color:#166534;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">Community Waste Management</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:48px;">

            <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#14532d;">Pickup Completed! 🎉</h2>
            <p style="margin:0 0 32px;font-size:15px;color:#6b7280;">Hi <strong>${residentName}</strong>, your waste collection has been successfully verified.</p>

            <!-- Summary Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:16px;margin-bottom:32px;">
              <tr>
                <td style="padding:24px 28px;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:1px;">Collection Summary</p>
                  <p style="margin:0 0 16px;font-size:20px;font-weight:800;color:#14532d;">${wasteType} Waste</p>
                  <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Collected on ${date}</p>
                  <p style="margin:12px 0 0;font-size:28px;letter-spacing:2px;color:#f59e0b;">${starBar(score)}</p>
                  <p style="margin:4px 0 0;font-size:13px;color:#6b7280;font-weight:600;">${score} / 5 Eco Points Awarded</p>
                </td>
              </tr>
            </table>

            <!-- Criteria Table -->
            <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Disposal Assessment</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:32px;">
              <thead>
                <tr style="background:#f9fafb;">
                  <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:700;color:#6b7280;border-bottom:1px solid #e5e7eb;">Criteria</th>
                  <th style="padding:10px 12px;text-align:center;font-size:12px;font-weight:700;color:#6b7280;border-bottom:1px solid #e5e7eb;">Result</th>
                </tr>
              </thead>
              <tbody>${criteriaRows}</tbody>
            </table>

            <!-- CTA -->
            <div style="text-align:center;margin-bottom:32px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/resident/eco-points"
                 style="display:inline-block;background:#14532d;color:#ffffff;font-weight:700;font-size:14px;padding:14px 32px;border-radius:50px;text-decoration:none;">
                View My Eco Points →
              </a>
            </div>

            <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
              Thank you for keeping your community clean! Consistent proper disposal earns you more Eco Points redeemable for rewards in the GABAY store.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:24px 48px;text-align:center;border-top:1px solid #f0f0f0;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">This is an automated message from GABAY EcoTrack. Please do not reply.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? `"GABAY EcoTrack" <${process.env.SMTP_USER}>`,
    to,
    subject: `✅ Pickup Complete — ${score} Eco Points Awarded | GABAY`,
    html,
    // Plain-text fallback
    text: `Hi ${residentName},\n\nYour ${wasteType} waste pickup has been verified on ${date}.\nRating: ${starBar(score)} (${score}/5)\nEco Points Awarded: ${score}\n\nThank you for keeping your community clean!\n\n— GABAY EcoTrack`,
  });
}
