const VitaEvent = require('../models/VitaEvent');
exports.listEvents = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const count = Math.max(1, Math.min(100, parseInt(req.query.count || '20', 10)));
    const skip = (page - 1) * count;
    const [items, total] = await Promise.all([
      VitaEvent.find().sort({ createdAt: -1 }).skip(skip).limit(count).lean(),
      VitaEvent.countDocuments()
    ]);
    res.json({ items, total, count, page });
  } catch (e) { next(e); }
};