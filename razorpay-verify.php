<?php
/* ============================================================================
   razorpay-verify.php — confirms a payment really happened.

   Razorpay signs every successful payment. We recompute that signature with
   our secret key; if it doesn't match, the payment is fake and we reject it.
   Only after it matches do we email the order through to Kaha Mind.

   Use the SAME key id and secret as razorpay-order.php.
   ========================================================================== */

// ---------------------------------------------------------------- CONFIG ---
$RAZORPAY_KEY_SECRET = 'REPLACE_ME_WITH_YOUR_SECRET';

$ORDER_EMAIL_TO   = 'hello@kahamind.com';
$ORDER_EMAIL_FROM = 'hello@kahamind.com';   // must be a real mailbox on your domain
$ORDER_LOG_FILE   = __DIR__ . '/orders.log';
// ---------------------------------------------------------------------------

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'POST only.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$orderId   = $input['razorpay_order_id']   ?? '';
$paymentId = $input['razorpay_payment_id'] ?? '';
$signature = $input['razorpay_signature']  ?? '';

if (!$orderId || !$paymentId || !$signature) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing payment details.']);
    exit;
}

// --- The actual check ---
$expected = hash_hmac('sha256', $orderId . '|' . $paymentId, $RAZORPAY_KEY_SECRET);

if (!hash_equals($expected, $signature)) {
    http_response_code(400);
    error_log("Razorpay signature mismatch for order $orderId / payment $paymentId");
    echo json_encode(['verified' => false, 'error' => 'Payment signature did not match.']);
    exit;
}

// --- Verified. Record and notify. ---
function field($value) {
    return htmlspecialchars(strip_tags((string) $value), ENT_QUOTES, 'UTF-8');
}

$c = is_array($input['customer'] ?? null) ? $input['customer'] : [];

$name     = field($c['name']     ?? '');
$email    = field($c['email']    ?? '');
$phone    = field($c['phone']    ?? '');
$address1 = field($c['address1'] ?? '');
$address2 = field($c['address2'] ?? '');
$city     = field($c['city']     ?? '');
$state    = field($c['state']    ?? '');
$pincode  = field($c['pincode']  ?? '');
$notes    = field($c['notes']    ?? '');
$quantity = (int) ($input['quantity'] ?? 1);

$body  = "New Kaha Shop order — payment confirmed.\n\n";
$body .= "Payment ID: $paymentId\n";
$body .= "Order ID:   $orderId\n";
$body .= "Placed:     " . date('d M Y, H:i') . " IST\n\n";
$body .= "ITEM\n";
$body .= "Metal Health Cap x $quantity\n\n";
$body .= "DELIVER TO\n";
$body .= "$name\n";
$body .= "$address1\n";
if ($address2) { $body .= "$address2\n"; }
$body .= "$city, $state $pincode\n\n";
$body .= "CONTACT\n";
$body .= "Email: $email\n";
$body .= "Phone: $phone\n\n";
$body .= "DELIVERY NOTES\n";
$body .= ($notes !== '' ? $notes : '-') . "\n";

// Local log — your backup if email ever fails
@file_put_contents(
    $ORDER_LOG_FILE,
    date('c') . " | $paymentId | $name | $phone | $city $pincode | Cap x$quantity\n",
    FILE_APPEND | LOCK_EX
);

$headers  = "From: $ORDER_EMAIL_FROM\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

@mail($ORDER_EMAIL_TO, "Kaha Shop order — $name — $paymentId", $body, $headers);

echo json_encode(['verified' => true, 'payment_id' => $paymentId]);
