<?php
// Prevent direct access
if ($_SERVER["REQUEST_METHOD"] != "POST") {
    header("Location: contact.html");
    exit();
}

// Configuration
$to_email = "hello@kahamind.com";
$from_email = "noreply@kahamind.com"; // This should match your domain

// Sanitize and validate input
function sanitize_input($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

// Get form data
$name = sanitize_input($_POST['name']);
$email = sanitize_input($_POST['email']);
$phone = isset($_POST['phone']) ? sanitize_input($_POST['phone']) : 'Not provided';
$message = sanitize_input($_POST['message']);

// Validate required fields
$errors = array();

if (empty($name)) {
    $errors[] = "Name is required";
}

if (empty($email)) {
    $errors[] = "Email is required";
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = "Invalid email format";
}

if (empty($message)) {
    $errors[] = "Message is required";
}

// If there are errors, redirect back
if (!empty($errors)) {
    header("Location: contact.html?error=" . urlencode(implode(", ", $errors)));
    exit();
}

// Prepare email
$subject = "New Contact Form Submission from $name";

$email_body = "You have received a new message from the Kaha Mind contact form.\n\n";
$email_body .= "Name: $name\n";
$email_body .= "Email: $email\n";
$email_body .= "Phone: $phone\n\n";
$email_body .= "Message:\n$message\n";

// Email headers
$headers = "From: $from_email\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

// Send email
if (mail($to_email, $subject, $email_body, $headers)) {
    // Success - redirect to thank you page or contact page with success message
    header("Location: contact.html?success=1");
    exit();
} else {
    // Failed - redirect back with error
    header("Location: contact.html?error=" . urlencode("Sorry, there was an error sending your message. Please try again or email us directly."));
    exit();
}
?>
