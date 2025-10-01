import { useCallback } from "react";

const App = () => {
  const productId = "6831f48039574c9486cfd2d2";
  const planLabel = "1 day";
  const paytmMid = "Referr60778075001428";
  const backendUrl = "https://4a0d-2409-40c1-2a-98b9-ad6b-a05a-6cd5-93c.ngrok-free.app";

  const loadPaytmScript = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.Paytm && window.Paytm.CheckoutJS) {
        console.log("Paytm Checkout JS already loaded");
        return resolve();
      }
      const script = document.createElement("script");
      script.src = `https://securegw.paytm.in/merchantpgpui/checkoutjs/merchants/${paytmMid}.js`;
      script.async = true;
      script.onload = () => {
        console.log("Paytm Checkout JS script loaded");
        resolve();
      };
      script.onerror = () => {
        console.error("Failed to load Paytm Checkout JS");
        reject(new Error("Failed to load Paytm Checkout JS"));
      };
      document.body.appendChild(script);
    });
  }, []);

  const startPayment = useCallback(async () => {
    try {
      console.log("Starting payment process...");

      // 1. Create order from backend
      const orderRes = await fetch(`${backendUrl}/api/v1/order/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          useWallet: false,
          productId,
          planLabel,
        }),
      });

      if (!orderRes.ok) {
        const errorText = await orderRes.text();
        throw new Error(`Failed to create order: ${errorText}`);
      }

      const orderData = await orderRes.json();
      console.log("Order Response:", orderData);

      // Adjust based on your backend response structure
      const { orderId, txnToken, amount } = orderData; // Update if nested, e.g., orderData.data

      // 2. Load Paytm script
      await loadPaytmScript();

      // 3. Invoke Paytm Checkout
      window.Paytm.CheckoutJS.onLoad(() => {
        console.log("Paytm Checkout JS initialized");
        window.Paytm.CheckoutJS.init({
          flow: "DEFAULT",
          merchant: {
            mid: paytmMid,
            redirect: true, // Redirect to Paytm payment page
          },
          data: {
            orderId,
            token: txnToken,
            tokenType: "TXN_TOKEN",
            amount: amount.toString(), // Use amount from createOrder
          },
          handler: {
            notifyMerchant: (eventName, data) => {
              console.log(`Paytm Event: ${eventName}`, data);
              if (eventName === "SUCCESS") {
                verifyPayment(data);
              } else if (eventName === "ERROR") {
                console.error("Payment failed:", data);
                alert(`Payment failed: ${data.status || "Unknown error"}`);
              } else if (eventName === "USER_CANCELLED") {
                console.log("Payment cancelled by user");
                alert("Payment cancelled");
              }
            },
          },
        })
          .then(() => {
            console.log("Invoking Paytm payment...");
            window.Paytm.CheckoutJS.invoke();
          })
          .catch((error) => {
            console.error("CheckoutJS init error:", error);
            alert("Failed to initialize payment: " + error.message);
          });
      });
    } catch (err) {
      console.error("Payment Error:", err);
      alert("Payment error: " + err.message);
    }
  }, [loadPaytmScript]);

  const verifyPayment = async (result) => {
    try {
      console.log("Verifying payment:", result);
      const { ORDERID, TXNID, CHECKSUMHASH, STATUS, TXNAMOUNT, TXNDATE } = result;

      // 4. Verify payment
      const verifyRes = await fetch(`${backendUrl}/api/v1/order/verify-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paytmOrderId: ORDERID,
          txnId: TXNID,
          checksum: CHECKSUMHASH,
          STATUS,
          TXNAMOUNT,
          TXNDATE,
        }),
      });

      const verifyJson = await verifyRes.json();
      console.log("Verify Response:", verifyJson);

      if (verifyRes.ok) {
        alert("Payment verified");
      } else {
        alert("Verification failed: " + verifyJson.message);
      }
    } catch (err) {
      console.error("Verification Error:", err);
      alert("Verification error: " + err.message);
    }
  };

  return <button onClick={startPayment}>Pay with Paytm</button>;
};

export default App;
