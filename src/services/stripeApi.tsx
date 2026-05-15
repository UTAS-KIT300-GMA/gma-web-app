
/**
 * This may need to be moved into another area as it is part of the server code not client side.
 * May need to rename to stripeApi.js as it is server side code???
*/

//this should use our test key at this stage. please double check it is test key to not 
// incurre any unwanted real payments.

//Optional: can change to process.env.STRIPE_SECRET_KEY if we want to use the .env file instead.
const stripe = require("stripe")("Stripe secret Key here");
const express = require("express");
const app = express();
app.use(express.static("public"));

// 
const YOUR_DOMAIN = "http://localhost:5173"; // our current local domain is 5173, but example uses 3000 change if needed.

//creates the checkout session.  have currently set for a one time payment of $20 AUD
app.post("/create-checkout-session", async (req, res) => {
  const session = await stripe.checkout.sessions.create({

   ui_mode: "elements",
    line_items: [{
      price_data: {
        product_data: {
          name: "Event Cost",
        },
        currency: "AUD",
        unit_amount: 2000,
      },
      quantity: 1,
    }],
    mode: 'payment',  //specify type. "payment": one off, "subcription": multiple, if want to charge later need to use "setup"
    //need to specify which page we want for return page after payment.
    return_url: `${YOUR_DOMAIN}/complete?session_id={CHECKOUT_SESSION_ID}`,
  });
  res.send({ clientSecret: session.client_secret });
  
});

app.get("/session-status", async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id, {expand: ["payment_intent", "subscription"]});

   res.send({
    status: session.status,
    payment_status: session.payment_status,
    payment_intent_id: session.payment_intent?.id,
    payment_intent_status: session.payment_intent?.status,
    subscription_id: session.payment_intent ? null : session.subscription?.id,
    subscription_status: session.payment_intent ? null : session.subscription?.status
  });
});

app.listen(4242, () => console.log("Running on port 4242"));