const errorHandler = (err, req, res, next) => {
  console.error('[SERVER ERROR]:', err);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    status: 'FAILED',
    error: err.message || 'An unexpected internal server error occurred.',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler;
