# Kaha Shop — setup

## Files

Upload all five to the same folder as your other pages (`public_html`):

| File | What it does |
|---|---|
| `shop.html` | The page — product, delivery form, payment, confirmation |
| `shop.css` | Replaces your existing `shop.css` (header/nav/footer styles unchanged) |
| `shop.js` | Checkout logic + opens the payment window |
| `razorpay-order.php` | Creates the order and decides the price **on the server** |
| `razorpay-verify.php` | Confirms the payment is real, then emails you the order |

Also drop in a product photo named **`cap.png`** (square works best). Without it the page shows a text placeholder — it won't break.

## Getting payments working

Everything routes through **Razorpay**, which is the one integration that covers Google Pay, PhonePe, Paytm, any other UPI app, debit and credit cards, net banking and wallets. You don't need separate accounts with each.

1. Create a Razorpay account at razorpay.com and complete KYC (PAN, bank account, business proof). Activation usually takes 2–4 working days — until it's done you can only take test payments.
2. In the dashboard go to **Account & Settings → API Keys → Generate Key**. You get a **Key ID** (`rzp_test_...`) and a **Key Secret**. The secret is shown once — save it.
3. Paste them in:
   - `shop.js` → `RAZORPAY_KEY_ID`
   - `razorpay-order.php` → `$RAZORPAY_KEY_ID` and `$RAZORPAY_KEY_SECRET`
   - `razorpay-verify.php` → `$RAZORPAY_KEY_SECRET`

   The secret goes in the PHP files only. Never in `shop.js` — anyone can read that file.
4. Test with Razorpay's test card `4111 1111 1111 1111`, any future expiry, any CVV. Test UPI ID: `success@razorpay`.
5. When you're happy, regenerate live keys (`rzp_live_...`) and swap all three places.

## Changing the price or shipping

Change it in **both** files or the amounts will disagree:

- `shop.js` → `UNIT_PRICE`, `SHIPPING`, `FREE_SHIPPING_ABOVE`
- `razorpay-order.php` → `$UNIT_PRICE`, `$SHIPPING`, `$FREE_SHIPPING_ABOVE`

The server's number is the one that gets charged. That's deliberate — it means nobody can edit the price in their browser and pay ₹1.

## Where orders arrive

On every confirmed payment `razorpay-verify.php` emails the full order to `hello@kahamind.com` and appends a line to `orders.log` in the same folder. The log is your backup if an email ever gets lost. Every payment also shows in the Razorpay dashboard with the delivery address attached in the notes field.

## Two honest caveats

- **App-specific UPI buttons behave differently on desktop.** On a phone, tapping "Google Pay" opens the Google Pay app directly. On a laptop there's no app to open, so Razorpay shows a QR code and a "enter your UPI ID" box instead. That's a UPI limitation, not a bug — the buttons still work, they just land somewhere sensible.
- **HTTPS is required.** Razorpay won't process live payments on `http://`. Bluehost gives you a free Let's Encrypt certificate under **Security → SSL/TLS** in cPanel if it isn't already on.

## Legal pages you'll want before going live

Razorpay checks for these during activation, and they're required for selling in India: Terms of Service, Privacy Policy, Refund/Cancellation Policy, and Shipping Policy. Simple pages are fine — I can draft them in the site's style if useful.
