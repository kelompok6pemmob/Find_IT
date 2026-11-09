// Hanya user dengan id_role = 2 (Admin) yang boleh lewat
export function adminMiddleware(req, res, next) {
  if (!req.user || req.user.id_role !== 2)
    return res.status(403).json({ message: 'Khusus admin' });
  next();
}