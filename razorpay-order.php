<?php
/* ============================================================================
   razorpay-order.php — creates a Razorpay order server-side.

   WHY THIS FILE EXISTS: the price must be decided on the server. If the
   browser sent the amount, anyone could edit it to Rs 1 before paying.

   SET YOUR KEYS BELOW. Get them from:
   Razorpay Dashboard > Account & Settings > API Keys > Generate Key.
   Keep the secret in this file only — never in shop.js.
   ========================================================================== */

// ---------------------------------------------------------------- CONFIG ---
$RAZORPAY_KEY_ID     = 'rzp_test_REPLACE_ME';
$RAZORPAY_KEY_SECRET = 'REPLACE_ME_WITH_YOUR_SECRET';

$UNIT_PRICE   = 899;   // rupees, per cap
$SHIPPING     = 60;    // rupees, flat
$MAX_QUANTITY = 10;
// ---------------------------------------------------------------------------

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'POST only.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['error' => 'Malformed request.']);
    exit;
}

// --- Validate quantity, then price it ourselves ---
$quantity = isset($input['quantity']) ? (int) $input['quantity'] : 1;
if ($quantity < 1 || $quantity > $MAX_QUANTITY) {
    http_response_code(400);
    echo json_encode(['error' => 'Quantity must be between 1 and ' . $MAX_QUANTITY . '.']);
    exit;
}

$subtotal = $UNIT_PRICE * $quantity;
$total    = $subtotal + $SHIPPING;
$amount   = $total * 100;   // Razorpay works in paise

// --- Light sanitising of the customer block for the order notes ---
$customer = isset($input['customer']) && is_array($input['customer']) ? $input['customer'] : [];
function clean_note($value) {
    return substr(preg_replace('/[\r\n]+/', ' ', strip_tags((string) $value)), 0, 250);
}

$notes = [
    'product'   => 'Metal Health Cap',
    'quantity'  => (string) $quantity,
    'name'      => clean_note($customer['name']     ?? ''),
    'email'     => clean_note($customer['email']    ?? ''),
    'phone'     => clean_note($customer['phone']    ?? ''),
    'address'   => clean_note(trim(
                        ($customer['address1'] ?? '') . ' ' .
                        ($customer['address2'] ?? '') . ', ' .
                        ($customer['city']     ?? '') . ', ' .
                        ($customer['state']    ?? '') . ' ' .
                        ($customer['pincode']  ?? '')
                   )),
    'delivery_notes' => clean_note($customer['notes'] ?? '-')
];

// --- Create the order via the Razorpay Orders API ---
$payload = json_encode([
    'amount'          => $amount,
    'currency'        => 'INR',
    'receipt'         => 'kaha_' . time() . '_' . substr(bin2hex(random_bytes(4)), 0, 8),
    'payment_capture' => 1,          // auto-capture on success
    'notes'           => $notes
]);

$ch = curl_init('https://api.razorpay.com/v1/orders');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_USERPWD        => $RAZORPAY_KEY_ID . ':' . $RAZORPAY_KEY_SECRET,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_TIMEOUT        => 20
]);

$response = curl_exec($ch);
$status   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($response === false) {
    http_response_code(502);
    echo json_encode(['error' => 'Could not reach the payment gateway. ' . $curlErr]);
    exit;
}

$data = json_decode($response, true);

if ($status !== 200 || empty($data['id'])) {
    http_response_code(502);
    $message = $data['error']['description'] ?? 'The payment gateway rejected the order.';
    error_log('Razorpay order creation failed: ' . $response);
    echo json_encode(['error' => $message]);
    exit;
}

echo json_encode([
    'order_id' => $data['id'],
    'amount'   => $data['amount'],
    'currency' => $data['currency']
]);
