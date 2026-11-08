/**
 * Menghitung jarak antara dua koordinat (lat1, lon1) dan (lat2, lon2)
 * Menggunakan Haversine Formula.
 * @returns {number} jarak dalam meter
 */
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radius bumi dalam meter
  const toRad = (angle) => (angle * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 10) / 10; // Pembulatan 1 desimal
}

module.exports = {
  getDistanceInMeters,
};
