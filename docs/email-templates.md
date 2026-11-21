# Expense Tracker – Branded Email Templates (Firebase Authentication)

This guide provides production-ready, responsive HTML and plain text email templates for Firebase Authentication.

To configure these in Firebase Console:
1. Navigate to [Firebase Console](https://console.firebase.google.com/).
2. Select your project: **Expense-Tracker**.
3. Open **Authentication** from the left navigation and switch to the **Templates** tab.
4. Customize the sender name to: `Expense Tracker Security` and reply-to email.
5. Update each template using the designs below.

---

## 1. Email Address Verification Template

### Subject Line:
```
Verify your email for Expense Tracker
```

### HTML Body:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F5FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0F172A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F4F5FA; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #FFFFFF; border-radius: 24px; box-shadow: 0 4px 20px rgba(108, 71, 255, 0.08); overflow: hidden; border: 1px solid #E2E8F0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #371485 0%, #5824DC 50%, #763CF8 100%); padding: 36px 30px; text-align: center;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Expense Tracker</h1>
              <p style="margin: 6px 0 0; color: rgba(255, 255, 255, 0.85); font-size: 13px;">Security & Account Verification</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin: 0 0 14px; font-size: 18px; font-weight: 700; color: #0F172A;">Welcome to Expense Tracker!</h2>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 22px; color: #475569;">
                Thank you for creating an account. To protect your financial records and enable multi-device cloud synchronization, please confirm your email address.
              </p>
              
              <!-- Call to Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="%LINK%" target="_blank" style="display: inline-block; background-color: #6C47FF; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 14px; box-shadow: 0 4px 14px rgba(108, 71, 255, 0.35);">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 10px; font-size: 12px; line-height: 18px; color: #64748B;">
                If the button above does not work, copy and paste this verification URL into your browser:
              </p>
              <p style="margin: 0 0 24px; font-size: 11px; line-height: 16px; color: #6C47FF; word-break: break-all;">
                %LINK%
              </p>

              <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;">

              <p style="margin: 0; font-size: 11px; line-height: 16px; color: #94A3B8;">
                If you did not sign up for Expense Tracker, you can safely ignore this email. No changes will be made to your account.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8F9FD; padding: 20px 30px; text-align: center; border-top: 1px solid #F1F5F9;">
              <p style="margin: 0; font-size: 11px; color: #94A3B8;">
                &copy; 2026 Expense Tracker · Protected by Firebase &amp; Google Cloud Security
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. Password Reset Template

### Subject Line:
```
Reset your Expense Tracker password
```

### HTML Body:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F5FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0F172A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F4F5FA; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #FFFFFF; border-radius: 24px; box-shadow: 0 4px 20px rgba(108, 71, 255, 0.08); overflow: hidden; border: 1px solid #E2E8F0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #371485 0%, #5824DC 50%, #763CF8 100%); padding: 36px 30px; text-align: center;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Expense Tracker</h1>
              <p style="margin: 6px 0 0; color: rgba(255, 255, 255, 0.85); font-size: 13px;">Password Reset Request</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin: 0 0 14px; font-size: 18px; font-weight: 700; color: #0F172A;">Need to reset your password?</h2>
              <p style="margin: 0 0 20px; font-size: 14px; line-height: 22px; color: #475569;">
                We received a request to reset the password for your Expense Tracker account (%EMAIL%). Click the button below to choose a new secure password.
              </p>
              
              <!-- Call to Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="%LINK%" target="_blank" style="display: inline-block; background-color: #6C47FF; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 14px; box-shadow: 0 4px 14px rgba(108, 71, 255, 0.35);">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 10px; font-size: 12px; line-height: 18px; color: #64748B;">
                This link will expire in 1 hour for your security. If you need a new link, you can request one anytime from the login page.
              </p>
              <p style="margin: 0 0 24px; font-size: 11px; line-height: 16px; color: #6C47FF; word-break: break-all;">
                %LINK%
              </p>

              <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;">

              <p style="margin: 0; font-size: 11px; line-height: 16px; color: #94A3B8;">
                <strong>Security Notice:</strong> If you did not request a password reset, please disregard this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8F9FD; padding: 20px 30px; text-align: center; border-top: 1px solid #F1F5F9;">
              <p style="margin: 0; font-size: 11px; color: #94A3B8;">
                &copy; 2026 Expense Tracker · Protected by Firebase &amp; Google Cloud Security
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```
