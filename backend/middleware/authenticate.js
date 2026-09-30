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

module.exports = authenticate;
