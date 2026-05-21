# Kaha Mind Website - Email Setup Instructions

## What's Been Fixed:

### 1. Email Links Fixed
All "email protected" links have been replaced with proper mailto links across:
- services.html (organization contact)
- faq.html (2 instances)
- newsletter-issue1.html (feedback email)

All email links now properly point to: hello@kahamind.com

### 2. Contact Form Setup

The contact form now uses a PHP script (send-email.php) to send emails directly to hello@kahamind.com.

## Installation Instructions for Bluehost:

### Step 1: Upload Files
1. Log in to your Bluehost cPanel
2. Open "File Manager"
3. Navigate to your public_html folder (or your domain's root folder)
4. Upload ALL your website files including:
   - All HTML files
   - All CSS files
   - All image files (PNG, JPG)
   - **send-email.php** (IMPORTANT!)
   - script.js

### Step 2: Test the Contact Form
1. Go to your website's contact page
2. Fill out the form with test information
3. Click "Send Message"
4. You should receive an email at hello@kahamind.com
5. The page will show a success message in green

### Step 3: Troubleshooting

**If emails aren't being received:**

1. **Check your spam folder** - sometimes automated emails go to spam
2. **Verify your domain email exists** - Make sure hello@kahamind.com is set up in your Bluehost email accounts
3. **Check PHP mail settings** in cPanel:
   - Go to cPanel → "Email Deliverability"
   - Make sure your domain has valid SPF and DKIM records
4. **Alternative: Use SMTP instead of PHP mail()** - If Bluehost's mail() function isn't working, I can provide an updated version using PHPMailer with SMTP

### Step 4: Email Configuration (Optional but Recommended)

In send-email.php, you may need to update line 8:
```php
$from_email = "noreply@kahamind.com";
```

Make sure this email address exists in your Bluehost email accounts, OR change it to:
```php
$from_email = "hello@kahamind.com";
```

### Step 5: Advanced Setup (If basic PHP mail doesn't work)

If you're having issues with email delivery, Bluehost recommends using SMTP authentication. Let me know if you need me to create an SMTP version using PHPMailer - this is more reliable but requires a few more steps.

## What the Contact Form Does:

1. User fills out the form (Name, Email, Phone, Message)
2. Form submits to send-email.php
3. PHP script validates the data
4. Sends email to hello@kahamind.com with all the details
5. User sees a success message
6. Form is cleared and ready for the next submission

## Security Features:

- Input sanitization (prevents malicious code)
- Email validation
- Required field checking
- Protection against spam bots (can add CAPTCHA if needed)

## Need Help?

If you encounter any issues during setup:
1. Check your Bluehost error logs (cPanel → Errors → Error Log)
2. Make sure PHP is enabled on your account
3. Verify file permissions (send-email.php should be 644 or 755)
4. Contact me for the SMTP version if mail() isn't working

## Testing Checklist:

✅ All email links are clickable and open default email client
✅ Contact form submits successfully
✅ Email arrives at hello@kahamind.com
✅ Success message displays after submission
✅ Form validation works (try submitting empty form)
✅ Error messages display when validation fails
