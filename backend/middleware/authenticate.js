const jwt = require("jsonwebtoken");
const { error } = require("../utils/responseHelper");

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return error(res, 401, "Token tidak ditemukan");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decode;
    next();
  } catch (err) {
    return error(res, 401, 'Token tidak valid atau hangus');
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return error(res, 403, "Anda tidak memiliki akses");
    }

    next();
  };
};

const validateBody = (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ success: false, message: "Data input tidak boleh kosong.", data: null });
  }
  next();
};


module.exports = { authenticate, authorize, validateBody };
