const assert = require('node:assert/strict');
const test = require('node:test');

for (const name of ['JWT_ISSUER', 'JWT_AUDIENCE', 'JWT_JWKS_URI']) {
  delete process.env[name];
}

const ApiError = require('../utils/ApiError');
const { errorHandler } = require('../middleware/errorMiddleware');
const { requireAuth } = require('../middleware/authMiddleware');
const AssetLog = require('../models/AssetLog');
const User = require('../models/User');
const Asset = require('../models/Asset');
const { register, login } = require('../controllers/authController');
const { getAssets } = require('../controllers/assetController');

const createResponse = () => ({
  headersSent: false,
  status(statusCode) {
    this.statusCode = statusCode;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  }
});

test('API errors use the shared JSON envelope without leaking internal details', () => {
  const response = createResponse();
  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    errorHandler(new Error('database password detail'), {}, response, () => {});
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.body, {
    success: false,
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred.' }
  });
});

test('JWT-protected routes fail closed when the IdP is not configured', () => {
  let receivedError;
  requireAuth({ get: () => '' }, {}, (error) => {
    receivedError = error;
  });

  assert.ok(receivedError instanceof ApiError);
  assert.equal(receivedError.statusCode, 503);
  assert.equal(receivedError.code, 'AUTH_NOT_CONFIGURED');
});

test('asset logs declare the compound chronological timeline index', () => {
  const hasTimelineIndex = AssetLog.schema.indexes().some(([keys]) => (
    keys.asset_id === 1 && keys.timestamp === 1
  ));

  assert.equal(hasTimelineIndex, true);
});

test('asset log updates are rejected by the model', async () => {
  await assert.rejects(
    AssetLog.updateOne({}, { $set: { new_status: 'Retired' } }).exec(),
    /Asset logs are immutable/
  );
});

test('local auth registration and login issue JWTs for valid users', async (t) => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'test-secret';

  const email = 'phase1-user@example.com';
  const password = 'Password123!';
  let storedUser = null;

  t.mock.method(User, 'findOne', () => {
    const query = Promise.resolve(storedUser);
    query.select = async () => storedUser;
    return query;
  });
  t.mock.method(User, 'create', async (userData) => {
    storedUser = new User(userData);
    storedUser.comparePassword = async (candidatePassword) => candidatePassword === password;
    return storedUser;
  });

  const registerRequest = { body: { email, password, role: 'Citizen' } };
  const registerResponse = {
    statusCode: 0,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    }
  };

  try {
    await register(registerRequest, registerResponse, () => {});

    assert.equal(registerResponse.statusCode, 201);
    assert.equal(registerResponse.payload.user.email, email);
    assert.equal(registerResponse.payload.user.role, 'Citizen');
    assert.ok(registerResponse.payload.token);

    const loginRequest = { body: { email, password } };
    const loginResponse = {
      statusCode: 0,
      payload: null,
      status(statusCode) {
        this.statusCode = statusCode;
        return this;
      },
      json(body) {
        this.payload = body;
        return this;
      }
    };

    await login(loginRequest, loginResponse, () => {});

    assert.equal(loginResponse.statusCode, 200);
    assert.equal(loginResponse.payload.user.email, email);
    assert.equal(loginResponse.payload.user.role, 'Citizen');
    assert.ok(loginResponse.payload.token);
  } finally {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  }
});

test('asset listings support page and limit query parameters', async () => {
  const originalFind = Asset.find;
  const originalCountDocuments = Asset.countDocuments;
  const filteredCalls = [];
  let countFilter;

  Asset.find = (filter) => {
    filteredCalls.push(filter);
    return {
      sort: () => ({
        skip: (skipValue) => ({
          limit: (limitValue) => {
            filteredCalls.push({ skipValue, limitValue });
            return Promise.resolve([{ _id: 'asset-1' }]);
          }
        })
      })
    };
  };
  Asset.countDocuments = (filter) => {
    countFilter = filter;
    return Promise.resolve(21);
  };

  try {
    const response = {
      statusCode: 0,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      }
    };

    await getAssets({ query: { status: 'Active', page: '2', limit: '10' } }, response, () => {});

    assert.deepEqual(filteredCalls[0], { status: 'Active' });
    assert.deepEqual(filteredCalls[1], { skipValue: 10, limitValue: 10 });
    assert.deepEqual(countFilter, { status: 'Active' });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body.assets, [{ _id: 'asset-1' }]);
    assert.equal(response.body.page, 2);
    assert.equal(response.body.limit, 10);
    assert.equal(response.body.total, 21);
    assert.equal(response.body.totalPages, 3);
  } finally {
    Asset.find = originalFind;
    Asset.countDocuments = originalCountDocuments;
  }
});