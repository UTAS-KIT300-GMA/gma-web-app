/**
 * Again this might need to be moved into the app.tsx page (aka intergrate it into the main app)
 * but it is being left sperate for now to make it easier to build and test.
 */


import React, { useMemo } from "react";
import {loadStripe} from '@stripe/stripe-js';

import {
  CheckoutElementsProvider
} from '@stripe/react-stripe-js/checkout';
import {
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom";
import CheckoutForm from './pages/partner/CheckoutForm';
import Complete from './pages/partner/Complete';

import "./Stripe.css";

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
// This is your test publishable API key.
const stripePromise = loadStripe("pk test key here");

const App = () => {
  const clientSecret = useMemo(() => {
    return fetch('/create-checkout-session', {
      method: 'POST',
    })
      .then((res) => res.json())
      .then((data) => data.clientSecret);
  }, []);

  const appearance = { //appearance options to match stripe payment elements to our GMA colour scheme.
    theme: 'stripe',
    variables: {
      colorPrimary: '#9d1969',
      colorBackground: '#f9efe3',
      colorText: '#3d0d32',
    },
  };

  return (
    <div className="App">
      <Router>

        <CheckoutElementsProvider
          stripe={stripePromise}
          options={{
            clientSecret,
            elementsOptions: {appearance},
          }}
        >
          <Routes>
            <Route path="/checkout" element={<CheckoutForm />} />
            <Route path="/complete" element={<Complete />} />
          </Routes>
        </CheckoutElementsProvider>
      </Router>
    </div>
  )
}

export default App;