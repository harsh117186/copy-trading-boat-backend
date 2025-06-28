# Gmail Configuration Guide

## Setting up Gmail for Forgot Password OTP

### Prerequisites:
- A Gmail account
- 2-Factor Authentication enabled on your Gmail account

### Step-by-Step Setup:

1. **Enable 2-Factor Authentication**
   - Go to your [Google Account settings](https://myaccount.google.com/)
   - Navigate to **Security**
   - Click on **2-Step Verification**
   - Follow the steps to enable it

2. **Generate App Password**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Find **App passwords** under 2-Step Verification
   - Click on **App passwords**
   - Select **Mail** as the app and **Other** as the device
   - Click **Generate**
   - Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

3. **Environment Variables**
   Add these to your `.env` file:
   ```env
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-character-app-password
   ```

   **Important:** 
   - Use your full Gmail address
   - Use the App Password, NOT your regular Gmail password
   - Remove spaces from the App Password if any

### Example Configuration:
```env
GMAIL_USER=myapp@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
```

### Testing Gmail Configuration:

You can test if your Gmail configuration is working by calling the forgot password endpoint:

```bash
curl -X POST http://localhost:3000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@gmail.com"}'
```

### Troubleshooting:

**Common Issues:**

1. **"Invalid login" error**
   - Make sure you're using an App Password, not your regular password
   - Ensure 2-Factor Authentication is enabled

2. **"Less secure app access" error**
   - This is expected - you must use App Passwords with 2FA enabled

3. **"Username and Password not accepted"**
   - Double-check your Gmail address spelling
   - Ensure the App Password is copied correctly (no extra spaces)

### Security Best Practices:

- ✅ Use App Passwords instead of your main Gmail password
- ✅ Never commit your App Password to version control
- ✅ Use a dedicated Gmail account for your application
- ✅ Regularly rotate your App Passwords
- ✅ The OTP expires after 10 minutes for security

### Gmail-Specific Features:

- ✅ Reliable delivery to Gmail inboxes
- ✅ Professional email template
- ✅ Automatic spam filtering bypass
- ✅ High deliverability rates 