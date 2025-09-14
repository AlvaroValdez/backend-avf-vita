// middleware/requireAuth.js
const jwt = require('jsonwebtoken');
module.exports = (req,res,next)=>{
  const fromCookie = req.cookies?.sid;
  const auth = req.headers.authorization || '';
  const fromHeader = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const token = fromCookie || fromHeader;
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); return next(); }
  catch { return res.status(401).json({ message: 'Invalid token' }); }
};