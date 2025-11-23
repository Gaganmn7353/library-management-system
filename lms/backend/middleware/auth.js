export const requireAuth = (req, res, next) => {
  if (req.session && req.session.librarianId) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
};

export const requireAdmin = (req, res, next) => {
  if (req.session && req.session.librarianId && req.session.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Forbidden: Admin access required' });
};
