const express = require('express');
const session = require('express-session');
const { createProxyMiddleware } = require('http-proxy-middleware');
const auth = require('basic-auth');

const app = express();

// Set up session middleware
app.use(session({
  secret: 'mysecretkey',  // A secret key to sign the session ID cookie
  resave: false,          // Don't resave the session if it wasn't modified
  saveUninitialized: true, // Save uninitialized sessions (empty)
  cookie: { secure: false } // Set secure to true if using https
}));

// Middleware to allow embedding in iframes and configure CORS
app.use((req, res, next) => {
  // Allow embedding in iframes
  res.setHeader('X-Frame-Options', 'ALLOWALL'); // This allows your proxy to be embedded in an iframe

  // Configure Content Security Policy (CSP) to allow embedding
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self' *"); // Allow the iframe to be embedded anywhere

  // Enable CORS for cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all domains, or specify a domain to restrict

  // Allow credentials and methods for cross-origin requests
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // Proceed to the next middleware
  next();
});

// Basic Authentication middleware
const basicAuthMiddleware = (req, res, next) => {
  // If the user is already authenticated (session exists), skip authentication
  if (req.session.authenticated) {
    return next();
  }

  // Otherwise, check for basic auth credentials
  const credentials = auth(req);

  // Check if credentials are valid
  if (!credentials || credentials.name !== 'hyper' || credentials.pass !== 'roblox') {
    // If credentials are missing or incorrect, respond with 401 and WWW-Authenticate header
    // Uncomment line 49 and 50 if you want a password
   // res.setHeader('WWW-Authenticate', 'Basic realm="Restricted Area"');
   //  return res.status(401).send('Access Denied: You must provide a valid username and password.');
  }

  // If credentials are valid, store session and allow access
  req.session.authenticated = true; // Mark user as authenticated in the session
  next(); // Continue with the request
};

// Apply the authentication middleware before the proxy middleware
app.use(basicAuthMiddleware);

// Set up the proxy to https://newalgebra.com, but only after successful authentication
app.use('/', createProxyMiddleware({
  target: 'https://newalgebra.com',   // The target URL for the proxy
  changeOrigin: true,                 // Changes the origin of the host header to match the target URL
  pathRewrite: {
    '/': '/',      // Rewrite the root path ("/") to "/?partner=monbile"
  },
  secure: true,                       // Ensure secure HTTPS requests are handled correctly
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying request for ${req.originalUrl}`);
  },
}));

// Start the server on port 3000 (or any port of your choice)
app.listen(3000, () => {
  console.log('Proxy server is running on http://localhost:3000');
});
