const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

const roleClaimPath = (process.env.JWT_ROLE_CLAIM || 'role').split('.');
const roleValues = {
  Citizen: process.env.JWT_CITIZEN_ROLE || 'Citizen',
  Tech: process.env.JWT_TECH_ROLE || 'Tech',
  Admin: process.env.JWT_ADMIN_ROLE || 'Admin'
};

const jwksClient = process.env.JWT_JWKS_URI
  ? jwksRsa({
      jwksUri: process.env.JWT_JWKS_URI,
      cache: true,
      rateLimit: true
    })
  : null;

const getClaim = (payload, path) => path.reduce((value, key) => value?.[key], payload);

const getBearerToken = (req) => {
  const authorization = req.get('authorization') || '';
  const tokenMatch = authorization.match(/^Bearer\s+(.+)$/i);
  return tokenMatch ? tokenMatch[1] : null;
};

const requireLocalAuth = async (req, next, token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return next(new ApiError(503, 'AUTH_NOT_CONFIGURED', 'Authentication is not configured.'));
  }

  try {
    const payload = jwt.verify(token, secret);
    const user = await User.findById(payload.sub).select('-password');

    if (!user) {
      return next(new ApiError(401, 'UNAUTHENTICATED', 'The token does not match a valid user.'));
    }

    req.user = user;
    req.auth = { userId: user._id.toString(), role: user.role };
    return next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(401, 'INVALID_TOKEN', 'The bearer token is invalid or expired.'));
    }
    return next(error);
  }
};

const requireExternalAuth = (req, next, token) => {
  const issuer = process.env.JWT_ISSUER;
  const audience = process.env.JWT_AUDIENCE;

  if (!issuer || !audience || !jwksClient) {
    return next(new ApiError(503, 'AUTH_NOT_CONFIGURED', 'Authentication is not configured.'));
  }

  const getSigningKey = (header, callback) => {
    jwksClient.getSigningKey(header.kid, (error, key) => {
      callback(error, key?.getPublicKey());
    });
  };

  jwt.verify(token, getSigningKey, {
    algorithms: ['RS256'],
    issuer,
    audience
  }, (error, payload) => {
    if (error || !payload || typeof payload === 'string') {
      return next(new ApiError(401, 'INVALID_TOKEN', 'The bearer token is invalid or expired.'));
    }

    const claimedRoles = getClaim(payload, roleClaimPath);
    const values = Array.isArray(claimedRoles) ? claimedRoles : [claimedRoles];
    const role = Object.entries(roleValues).find(([, claimValue]) => values.includes(claimValue))?.[0];

    if (!role) {
      return next(new ApiError(403, 'FORBIDDEN', 'The token does not contain an allowed role.'));
    }

    req.auth = { userId: payload.sub, role };
    next();
  });
};

const requireAuth = async (req, res, next) => {
  const issuer = process.env.JWT_ISSUER;
  const audience = process.env.JWT_AUDIENCE;
  const hasExternalConfig = Boolean(issuer && audience && jwksClient);
  const hasLocalConfig = Boolean(process.env.JWT_SECRET);

  if (!hasExternalConfig && !hasLocalConfig) {
    return next(new ApiError(503, 'AUTH_NOT_CONFIGURED', 'Authentication is not configured.'));
  }

  const token = getBearerToken(req);
  if (!token) {
    return next(new ApiError(401, 'UNAUTHENTICATED', 'A valid bearer token is required.'));
  }

  if (hasLocalConfig) {
    return requireLocalAuth(req, next, token);
  }

  return requireExternalAuth(req, next, token);
};

const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.auth && !req.user) return next(new ApiError(401, 'UNAUTHENTICATED', 'A valid bearer token is required.'));
  const currentRole = req.auth?.role || req.user?.role;
  if (!currentRole) return next(new ApiError(403, 'FORBIDDEN', 'The token does not contain an allowed role.'));
  if (!allowedRoles.includes(currentRole)) {
    return next(new ApiError(403, 'FORBIDDEN', 'You are not allowed to perform this action.'));
  }
  next();
};

const verifyToken = requireAuth;
const verifyRole = requireRole;

module.exports = {
  requireAuth,
  requireRole,
  verifyToken,
  verifyRole
};