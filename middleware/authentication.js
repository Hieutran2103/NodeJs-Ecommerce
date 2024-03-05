const { UnauthenticatedError, UnauthorizedError } = require("../errors");

const { isTokenValid } = require("../utils");

const authenticateUser = async (req, res, next) => {
  // xđịnh thong tin user hiện tại
  const token = req.signedCookies.token;
  if (!token) {
    throw new UnauthenticatedError(` Authentication Invalid`);
  }
  try {
    const payload = isTokenValid({ token });
    req.user = {
      name: payload.name,
      userId: payload.userId,
      role: payload.role,
    };
    next();
  } catch (error) {
    throw new UnauthenticatedError(` Authentication Invalid`);
  }
};

// const authorizePermissions = async (req, res, next) => {
//   if (req.user.role !== "admin") {
//     throw new UnauthorizedError("Unauthorized to access this route");
//   }
//   next();
// };

// phân quyền
const authorizePermission = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new UnauthorizedError("Unauthorized to access this route");
    }
    next();
  };
};

module.exports = { authenticateUser, authorizePermission };
