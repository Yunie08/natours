class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    // to string then if code starts with 4 => fail else (500) => error
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    // to discriminate operational errors from dev erros or packages bugs
    this.isOperational = true;

    // to capture stackTrace without adding call by constructor to this stackTrace
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
