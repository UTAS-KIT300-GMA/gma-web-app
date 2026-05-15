import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
 /**
  * server for forward api calls from client to our backend server.
  * using port 4242 as specified in stripeApi.tsx and shown as example from web doc.
  * change if needed.
  */
  server: { 

    proxy: {
      '/create-checkout-session': {
        target: 'http://localhost:4242',
        changeOrigin: true,
      },
      '/session-status': {
        target: 'http://localhost:4242',
        changeOrigin: true,
      },
    },
  },
})
