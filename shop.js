/* ============================================================================
   Kaha Shop — checkout + payments
   ----------------------------------------------------------------------------
   CONFIGURE THESE THREE THINGS BEFORE GOING LIVE:

   1. RAZORPAY_KEY_ID  — from Razorpay Dashboard > Settings > API Keys.
                         Use the rzp_test_... key while testing, swap to
                         rzp_live_... once your account is activated.
   2. CREATE_ORDER_URL — path to razorpay-order.php on your server.
   3. VERIFY_URL       — path to razorpay-verify.php on your server.

   The secret key NEVER goes in this file. It lives in razorpay-order.php
   on the server, where visitors cannot read it.
   ========================================================================== */

const SHOP_CONFIG = {
    RAZORPAY_KEY_ID: 'rzp_test_REPLACE_ME',
    CREATE_ORDER_URL: 'razorpay-order.php',
    VERIFY_URL: 'razorpay-verify.php',

    // Product
    PRODUCT_NAME: 'Metal Health Cap',
    UNIT_PRICE: 899,          // rupees
    SHIPPING: 60              // rupees, flat
};

document.addEventListener('DOMContentLoaded', function () {

    /* ---------- element handles ---------- */
    const steps = {
        product:  document.getElementById('stepProduct'),
        delivery: document.getElementById('stepDelivery'),
        payment:  document.getElementById('stepPayment'),
        done:     document.getElementById('stepDone')
    };

    const qtyInput      = document.getElementById('quantity');
    const deliveryForm  = document.getElementById('deliveryForm');
    const deliveryError = document.getElementById('deliveryError');
    const paymentError  = document.getElementById('paymentError');

    /* ---------- order state ---------- */
    const order = {
        quantity: 1,
        subtotal: 0,
        shipping: 0,
        total: 0,
        customer: {}
    };

    /* ---------- helpers ---------- */
    const rupees = n => '\u20B9' + n.toLocaleString('en-IN');

    function showStep(name) {
        Object.keys(steps).forEach(k => { steps[k].hidden = (k !== name); });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function setError(box, message) {
        if (!message) { box.hidden = true; box.textContent = ''; return; }
        box.textContent = message;
        box.hidden = false;
        box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function recalc() {
        order.quantity = parseInt(qtyInput.value, 10) || 1;
        order.subtotal = SHOP_CONFIG.UNIT_PRICE * order.quantity;
        order.shipping = SHOP_CONFIG.SHIPPING;
        order.total    = order.subtotal + order.shipping;

        const itemText = SHOP_CONFIG.PRODUCT_NAME + ' \u00D7 ' + order.quantity;

        ['', '2'].forEach(suffix => {
            const item     = document.getElementById('summaryItem' + suffix);
            const subtotal = document.getElementById('summarySubtotal' + suffix);
            const shipping = document.getElementById('summaryShipping' + suffix);
            const total    = document.getElementById('summaryTotal' + suffix);
            if (item)     item.textContent = itemText;
            if (subtotal) subtotal.textContent = rupees(order.subtotal);
            if (shipping) shipping.textContent = rupees(order.shipping);
            if (total)    total.textContent = rupees(order.total);
        });
    }

    /* ---------- step 1: product ---------- */
    document.getElementById('qtyPlus').addEventListener('click', function () {
        const v = parseInt(qtyInput.value, 10) || 1;
        if (v < 10) { qtyInput.value = v + 1; recalc(); }
    });

    document.getElementById('qtyMinus').addEventListener('click', function () {
        const v = parseInt(qtyInput.value, 10) || 1;
        if (v > 1) { qtyInput.value = v - 1; recalc(); }
    });

    document.getElementById('goToDelivery').addEventListener('click', function () {
        recalc();
        showStep('delivery');
    });

    document.getElementById('backToProduct').addEventListener('click', function () {
        showStep('product');
    });

    /* ---------- step 2: delivery details ---------- */
    deliveryForm.addEventListener('submit', function (e) {
        e.preventDefault();
        setError(deliveryError, '');

        const data = {
            name:     document.getElementById('custName').value.trim(),
            email:    document.getElementById('custEmail').value.trim(),
            phone:    document.getElementById('custPhone').value.trim().replace(/\D/g, ''),
            address1: document.getElementById('addr1').value.trim(),
            address2: document.getElementById('addr2').value.trim(),
            city:     document.getElementById('city').value.trim(),
            state:    document.getElementById('state').value,
            pincode:  document.getElementById('pincode').value.trim(),
            notes:    document.getElementById('deliveryNotes').value.trim()
        };

        if (!data.name)     return setError(deliveryError, 'Add your full name so we know who to address the parcel to.');
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email))
                            return setError(deliveryError, 'That email address doesn\u2019t look right. Check it and try again.');
        if (!/^[6-9]\d{9}$/.test(data.phone))
                            return setError(deliveryError, 'Enter a 10-digit Indian mobile number \u2014 the courier will call it.');
        if (!data.address1) return setError(deliveryError, 'Add the first line of your address.');
        if (!data.city)     return setError(deliveryError, 'Add your city.');
        if (!data.state)    return setError(deliveryError, 'Pick your state.');
        if (!/^\d{6}$/.test(data.pincode))
                            return setError(deliveryError, 'PIN codes are 6 digits. Check yours and try again.');

        order.customer = data;

        document.getElementById('summaryAddress').innerHTML = [
            data.name,
            data.address1,
            data.address2,
            data.city + ', ' + data.state + ' ' + data.pincode,
            data.phone
        ].filter(Boolean).join('<br>');

        recalc();
        showStep('payment');
    });

    document.getElementById('backToDelivery').addEventListener('click', function () {
        showStep('delivery');
    });

    /* ---------- step 3: payment ---------- */

    // Razorpay display config per method. This is what makes the chosen
    // app (GPay / PhonePe / Paytm) open first instead of the generic menu.
    function displayConfigFor(method) {
        const blocks = {
            gpay: {
                name: 'Pay using Google Pay',
                instruments: [{ method: 'upi', apps: ['google_pay'] }]
            },
            phonepe: {
                name: 'Pay using PhonePe',
                instruments: [{ method: 'upi', apps: ['phonepe'] }]
            },
            paytm: {
                name: 'Pay using Paytm',
                instruments: [
                    { method: 'upi', apps: ['paytm'] },
                    { method: 'wallet', wallets: ['paytm'] }
                ]
            },
            upi: {
                name: 'Pay using any UPI app',
                instruments: [{ method: 'upi' }]
            },
            card: {
                name: 'Pay by card',
                instruments: [{ method: 'card' }]
            }
        };

        if (method === 'all' || !blocks[method]) return undefined; // full Razorpay menu

        return {
            display: {
                blocks: { chosen: blocks[method] },
                sequence: ['block.chosen'],
                preferences: { show_default_blocks: true } // keeps a fallback if the app isn't installed
            }
        };
    }

    document.querySelectorAll('.pay-method').forEach(function (btn) {
        btn.addEventListener('click', function () {
            startPayment(btn.dataset.method, btn);
        });
    });

    async function startPayment(method, btn) {
        setError(paymentError, '');

        if (typeof Razorpay === 'undefined') {
            return setError(paymentError,
                'The payment window couldn\u2019t load. Check your connection and reload the page.');
        }

        document.querySelectorAll('.pay-method').forEach(b => b.disabled = true);
        btn.classList.add('is-loading');

        try {
            // 1. Ask our server to create a Razorpay order (amount is fixed server-side)
            const res = await fetch(SHOP_CONFIG.CREATE_ORDER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quantity: order.quantity,
                    customer: order.customer
                })
            });

            const data = await res.json();
            if (!res.ok || !data.order_id) {
                throw new Error(data.error || 'Order could not be created.');
            }

            // 2. Open Razorpay Checkout
            const options = {
                key: SHOP_CONFIG.RAZORPAY_KEY_ID,
                amount: data.amount,            // paise, from the server
                currency: data.currency || 'INR',
                order_id: data.order_id,
                name: 'Kaha Mind',
                description: SHOP_CONFIG.PRODUCT_NAME + ' \u00D7 ' + order.quantity,
                image: 'star.png',
                prefill: {
                    name: order.customer.name,
                    email: order.customer.email,
                    contact: '+91' + order.customer.phone,
                    method: (method === 'card') ? 'card'
                          : (method === 'all')  ? undefined
                          : 'upi'
                },
                notes: {
                    product: SHOP_CONFIG.PRODUCT_NAME,
                    quantity: String(order.quantity),
                    address: [order.customer.address1, order.customer.address2,
                              order.customer.city, order.customer.state,
                              order.customer.pincode].filter(Boolean).join(', '),
                    delivery_notes: order.customer.notes || '-'
                },
                theme: { color: '#1e3a5f' },
                config: displayConfigFor(method),
                modal: {
                    ondismiss: function () {
                        resetPayButtons();
                        setError(paymentError, 'Payment cancelled. Nothing was charged \u2014 pick a method to try again.');
                    }
                },
                handler: function (response) {
                    verifyPayment(response);
                }
            };

            const rzp = new Razorpay(options);

            rzp.on('payment.failed', function (response) {
                resetPayButtons();
                const reason = (response.error && response.error.description)
                    ? response.error.description
                    : 'The bank declined the payment.';
                setError(paymentError, reason + ' Nothing was charged \u2014 try another method.');
            });

            rzp.open();

        } catch (err) {
            resetPayButtons();
            const unreachable = /failed to fetch|networkerror|load failed/i.test(err.message);
            setError(paymentError, unreachable
                ? 'We couldn\u2019t reach the payment server. Try again in a moment, or email hello@kahamind.com and we\u2019ll take the order manually.'
                : 'We couldn\u2019t start the payment: ' + err.message +
                  ' Try again, or email hello@kahamind.com and we\u2019ll take the order manually.');
            if (unreachable) {
                console.error('[Kaha Shop] Could not reach ' + SHOP_CONFIG.CREATE_ORDER_URL +
                    '. This page must be served by a web server running PHP \u2014 opening the ' +
                    'HTML file directly from disk will always fail here.', err);
            }
        }
    }

    function resetPayButtons() {
        document.querySelectorAll('.pay-method').forEach(b => {
            b.disabled = false;
            b.classList.remove('is-loading');
        });
    }

    // 3. Verify the signature server-side, then confirm
    async function verifyPayment(response) {
        try {
            const res = await fetch(SHOP_CONFIG.VERIFY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    customer: order.customer,
                    quantity: order.quantity
                })
            });

            const data = await res.json();
            if (!res.ok || !data.verified) {
                throw new Error(data.error || 'Payment could not be verified.');
            }

            document.getElementById('doneName').textContent      = order.customer.name.split(' ')[0];
            document.getElementById('doneEmail').textContent     = order.customer.email;
            document.getElementById('donePaymentId').textContent = response.razorpay_payment_id;
            showStep('done');

        } catch (err) {
            resetPayButtons();
            setError(paymentError,
                'Your payment went through but we couldn\u2019t confirm it automatically. ' +
                'Email hello@kahamind.com with reference ' + response.razorpay_payment_id +
                ' and we\u2019ll sort it out right away.');
        }
    }

    /* ---------- step 4: done ---------- */
    document.getElementById('shopAgain').addEventListener('click', function () {
        deliveryForm.reset();
        qtyInput.value = 1;
        recalc();
        setError(paymentError, '');
        resetPayButtons();
        showStep('product');
    });

    /* ---------- boot ---------- */
    document.getElementById('unitPriceLabel').textContent =
        SHOP_CONFIG.UNIT_PRICE.toLocaleString('en-IN');
    recalc();
});
