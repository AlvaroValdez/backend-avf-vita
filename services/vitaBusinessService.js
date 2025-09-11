// backend/services/vitaBusinessService.js
const vitaService = require('./vitaService');

exports.getAvailableCountries = async () => {
  return await vitaService.getAvailableCountries();
};
