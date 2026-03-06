export interface BuiltInTemplate {
  name: string;
  description: string;
  htmlTemplate: string;
}

export const BUILT_IN_TEMPLATES: BuiltInTemplate[] = [
  {
    name: "Newsletter",
    description: "Clean weekly or monthly newsletter layout with sections for updates, articles, and links.",
    htmlTemplate: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
  <tr><td style="background:linear-gradient(135deg,#F6D365,#FDA085);padding:32px 40px;text-align:center;">
    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:bold;">Your Newsletter</h1>
    <p style="margin:8px 0 0;color:#ffffff;font-size:14px;opacity:0.9;">Monthly updates and insights</p>
  </td></tr>
  <tr><td style="padding:32px 40px;">
    <h2 style="margin:0 0 12px;color:#18181b;font-size:20px;">Featured Story</h2>
    <p style="margin:0 0 20px;color:#52525b;font-size:15px;line-height:1.6;">Share your main update or story here. Keep it engaging and concise to capture your reader's attention right away.</p>
    <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:linear-gradient(135deg,#F6D365,#FDA085);border-radius:6px;padding:12px 24px;">
      <a href="#" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;">Read More</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #e4e4e7;margin:0;"></td></tr>
  <tr><td style="padding:24px 40px;">
    <h3 style="margin:0 0 8px;color:#18181b;font-size:16px;">Quick Updates</h3>
    <ul style="margin:0;padding:0 0 0 20px;color:#52525b;font-size:14px;line-height:1.8;">
      <li>Update item one — brief description</li>
      <li>Update item two — brief description</li>
      <li>Update item three — brief description</li>
    </ul>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px 40px;text-align:center;">
    <p style="margin:0;color:#a1a1aa;font-size:12px;">You received this because you subscribed to our newsletter.</p>
  </td></tr>
</table>
</td></tr></table>
</body>
</html>`,
  },
  {
    name: "Announcement",
    description: "Bold announcement layout for product launches, company news, or important updates.",
    htmlTemplate: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
  <tr><td style="background:linear-gradient(135deg,#F6D365,#FDA085);padding:48px 40px;text-align:center;">
    <p style="margin:0 0 8px;color:#ffffff;font-size:14px;text-transform:uppercase;letter-spacing:2px;font-weight:bold;">Announcement</p>
    <h1 style="margin:0;color:#ffffff;font-size:32px;font-weight:bold;line-height:1.2;">Big News Is Here</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="margin:0 0 20px;color:#52525b;font-size:16px;line-height:1.6;">We're excited to share something special with you. This is where you describe the announcement in detail.</p>
    <p style="margin:0 0 28px;color:#52525b;font-size:16px;line-height:1.6;">Add more context, dates, or any details your audience needs to know.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:linear-gradient(135deg,#F6D365,#FDA085);border-radius:6px;padding:14px 32px;">
        <a href="#" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;">Learn More</a>
      </td></tr></table>
    </td></tr></table>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px 40px;text-align:center;">
    <p style="margin:0;color:#a1a1aa;font-size:12px;">Questions? Just reply to this email.</p>
  </td></tr>
</table>
</td></tr></table>
</body>
</html>`,
  },
  {
    name: "Promotion",
    description: "Eye-catching promotional email for sales, discounts, and special offers.",
    htmlTemplate: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
  <tr><td style="background:linear-gradient(135deg,#F6D365,#FDA085);padding:40px;text-align:center;">
    <p style="margin:0 0 4px;color:#ffffff;font-size:14px;text-transform:uppercase;letter-spacing:2px;">Limited Time</p>
    <h1 style="margin:0;color:#ffffff;font-size:48px;font-weight:bold;">20% OFF</h1>
    <p style="margin:8px 0 0;color:#ffffff;font-size:16px;">Use code: <strong>SAVE20</strong></p>
  </td></tr>
  <tr><td style="padding:32px 40px;text-align:center;">
    <h2 style="margin:0 0 12px;color:#18181b;font-size:22px;">Don't Miss Out</h2>
    <p style="margin:0 0 24px;color:#52525b;font-size:15px;line-height:1.6;">This exclusive offer is available for a limited time only. Treat yourself to something special today.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:linear-gradient(135deg,#F6D365,#FDA085);border-radius:6px;padding:14px 32px;">
        <a href="#" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;">Shop Now</a>
      </td></tr></table>
    </td></tr></table>
  </td></tr>
  <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #e4e4e7;margin:0;"></td></tr>
  <tr><td style="padding:24px 40px;text-align:center;">
    <p style="margin:0;color:#71717a;font-size:13px;">Offer expires in 48 hours. Cannot be combined with other promotions.</p>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px 40px;text-align:center;">
    <p style="margin:0;color:#a1a1aa;font-size:12px;">You received this because you opted into promotional emails.</p>
  </td></tr>
</table>
</td></tr></table>
</body>
</html>`,
  },
  {
    name: "Welcome",
    description: "Friendly welcome email for new subscribers or customers with next steps.",
    htmlTemplate: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
  <tr><td style="background:linear-gradient(135deg,#F6D365,#FDA085);padding:40px;text-align:center;">
    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:bold;">Welcome Aboard!</h1>
    <p style="margin:8px 0 0;color:#ffffff;font-size:15px;opacity:0.9;">We're thrilled to have you</p>
  </td></tr>
  <tr><td style="padding:32px 40px;">
    <p style="margin:0 0 20px;color:#52525b;font-size:15px;line-height:1.6;">Thanks for joining us! Here's what you can do to get started:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:12px 0;border-bottom:1px solid #f4f4f5;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="background:linear-gradient(135deg,#F6D365,#FDA085);color:#ffffff;font-weight:bold;width:28px;height:28px;border-radius:50%;text-align:center;line-height:28px;font-size:13px;">1</td>
          <td style="padding-left:12px;color:#52525b;font-size:14px;">Complete your profile</td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:12px 0;border-bottom:1px solid #f4f4f5;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="background:linear-gradient(135deg,#F6D365,#FDA085);color:#ffffff;font-weight:bold;width:28px;height:28px;border-radius:50%;text-align:center;line-height:28px;font-size:13px;">2</td>
          <td style="padding-left:12px;color:#52525b;font-size:14px;">Explore our features</td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:12px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="background:linear-gradient(135deg,#F6D365,#FDA085);color:#ffffff;font-weight:bold;width:28px;height:28px;border-radius:50%;text-align:center;line-height:28px;font-size:13px;">3</td>
          <td style="padding-left:12px;color:#52525b;font-size:14px;">Connect with our community</td>
        </tr></table>
      </td></tr>
    </table>
    <div style="margin-top:28px;text-align:center;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td style="background:linear-gradient(135deg,#F6D365,#FDA085);border-radius:6px;padding:12px 28px;">
        <a href="#" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;">Get Started</a>
      </td></tr></table>
    </div>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px 40px;text-align:center;">
    <p style="margin:0;color:#a1a1aa;font-size:12px;">Need help? Reply to this email anytime.</p>
  </td></tr>
</table>
</td></tr></table>
</body>
</html>`,
  },
  {
    name: "Event Invitation",
    description: "Professional event invitation with date, time, location, and RSVP button.",
    htmlTemplate: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
  <tr><td style="background:linear-gradient(135deg,#F6D365,#FDA085);padding:40px;text-align:center;">
    <p style="margin:0 0 4px;color:#ffffff;font-size:13px;text-transform:uppercase;letter-spacing:2px;">You're Invited</p>
    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:bold;line-height:1.2;">Event Name Here</h1>
  </td></tr>
  <tr><td style="padding:32px 40px;">
    <p style="margin:0 0 24px;color:#52525b;font-size:15px;line-height:1.6;">We'd love for you to join us for this special event. Here are the details:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border-radius:8px;overflow:hidden;">
      <tr><td style="padding:20px 24px;border-bottom:1px solid #e4e4e7;">
        <p style="margin:0;color:#a1a1aa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Date & Time</p>
        <p style="margin:4px 0 0;color:#18181b;font-size:15px;font-weight:bold;">[Event Date & Time]</p>
      </td></tr>
      <tr><td style="padding:20px 24px;border-bottom:1px solid #e4e4e7;">
        <p style="margin:0;color:#a1a1aa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Location</p>
        <p style="margin:4px 0 0;color:#18181b;font-size:15px;font-weight:bold;">123 Main Street, City</p>
      </td></tr>
      <tr><td style="padding:20px 24px;">
        <p style="margin:0;color:#a1a1aa;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Dress Code</p>
        <p style="margin:4px 0 0;color:#18181b;font-size:15px;font-weight:bold;">Business Casual</p>
      </td></tr>
    </table>
    <div style="margin-top:28px;text-align:center;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td style="background:linear-gradient(135deg,#F6D365,#FDA085);border-radius:6px;padding:14px 32px;">
        <a href="#" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;">RSVP Now</a>
      </td></tr></table>
    </div>
  </td></tr>
  <tr><td style="background-color:#f9fafb;padding:24px 40px;text-align:center;">
    <p style="margin:0;color:#a1a1aa;font-size:12px;">Can't make it? Let us know by replying to this email.</p>
  </td></tr>
</table>
</td></tr></table>
</body>
</html>`,
  },
];
