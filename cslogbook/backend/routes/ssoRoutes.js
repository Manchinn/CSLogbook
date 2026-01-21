const express = require('express');
const router = express.Router();
const ssoController = require('../controllers/ssoController');

/**
 * KMUTNB SSO Routes
 * Base path: /api/auth/sso
 */

// GET /api/auth/sso/authorize - Redirect to KMUTNB SSO login
router.get('/authorize', ssoController.authorize);

// GET /api/auth/sso/callback - Handle callback from KMUTNB SSO
router.get('/callback', ssoController.callback);

// GET /api/auth/sso/url - Get authorization URL (for frontend)
router.get('/url', ssoController.getAuthUrl);

// GET /api/auth/sso/status - Check SSO status
router.get('/status', ssoController.getStatus);

module.exports = router;
