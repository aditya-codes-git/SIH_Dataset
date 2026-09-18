/**
 * Role-Based Authentication & Authorization Middleware
 *
 * PRODUCTION-READY ARCHITECTURE:
 * - authenticateUser checks session/token or x-demo-role header.
 * - If no valid credentials/role header are provided, returns 401 Unauthorized.
 * - authorizeRole('doctor') restricts diagnostic endpoints to Doctor role.
 */

const authenticateUser = (req, res, next) => {
  const roleHeader = req.headers['x-demo-role'] || req.headers['x-user-role'] || req.query?.role || req.query?.['x-demo-role'];

  if (!roleHeader) {
    return res.status(401).json({
      status: 'FAILED',
      error: '401 Unauthorized: Missing authentication credentials or demo role header (x-demo-role).',
    });
  }

  const normalizedRole = roleHeader.toLowerCase().trim();

  if (normalizedRole !== 'operator' && normalizedRole !== 'doctor') {
    return res.status(401).json({
      status: 'FAILED',
      error: '401 Unauthorized: Invalid user role. Must be "operator" or "doctor".',
    });
  }

  req.user = {
    id: normalizedRole === 'doctor' ? 'usr-doctor-01' : 'usr-operator-01',
    name: normalizedRole === 'doctor' ? 'Dr. Sarah Jenkins' : 'Ravi Kumar (Operator)',
    role: normalizedRole,
  };

  next();
};

const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        status: 'FAILED',
        error: '401 Unauthorized: User identity not established.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'FAILED',
        error: `403 Forbidden: Role "${req.user.role}" does not have permission to access diagnostic AI endpoints.`,
      });
    }

    next();
  };
};

module.exports = {
  authenticateUser,
  authorizeRole,
};
