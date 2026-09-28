const ApiError = require('../utils/ApiError');

const notFound = (req, res, next) => {
  next(new ApiError(404, 'NOT_FOUND', 'The requested resource was not found.'));
};

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred.';

  if (error instanceof ApiError) {
    ({ statusCode, code, message } = error);
  } else if (error.name === 'CastError' || error.type === 'entity.parse.failed') {
    statusCode = 400;
    code = error.type === 'entity.parse.failed' ? 'INVALID_JSON' : 'INVALID_IDENTIFIER';
    message = error.type === 'entity.parse.failed' ? 'The request body contains invalid JSON.' : 'The supplied identifier is invalid.';
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'The request data is invalid.';
  } else if (error.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_RESOURCE';
    message = 'A resource with the supplied values already exists.';
  }

  if (statusCode >= 500) console.error(error);

  res.status(statusCode).json({
    success: false,
    error: { code, message }
  });
};

module.exports = { notFound, errorHandler };