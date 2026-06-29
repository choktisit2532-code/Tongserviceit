// Starter middleware.
// For production, verify Supabase JWT here and attach req.user.
export function requireAuth(req, res, next) {
  next();
}
