const Location = require("../models/Location");
const { success, error } = require("../utils/responseHelper");

// Ambil semua lokasi (khusus admin)
const getAllLocations = async (req, res) => {
  try {
    const locations = await Location.find().sort({ createdAt: -1 });
    return success(res, 200, "Berhasil mengambil daftar lokasi", locations);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

// Ambil daftar lokasi aktif (bisa diakses siswa untuk cek status)
const getActiveLocations = async (req, res) => {
  try {
    const locations = await Location.find({ isActive: true }).select("name latitude longitude radius address");
    return success(res, 200, "Berhasil mengambil lokasi aktif", locations);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

// Buat lokasi baru
const createLocation = async (req, res) => {
  try {
    const { name, latitude, longitude, radius, address, isActive } = req.body;

    if (!name || latitude === undefined || longitude === undefined) {
      return error(res, 400, "Nama lokasi, latitude, dan longitude wajib diisi");
    }

    const latNum = Number(latitude);
    const lonNum = Number(longitude);
    const radiusNum = radius ? Number(radius) : 100;

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      return error(res, 400, "Nilai latitude tidak valid (-90 s/d 90)");
    }

    if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
      return error(res, 400, "Nilai longitude tidak valid (-180 s/d 180)");
    }

    if (isNaN(radiusNum) || radiusNum < 5) {
      return error(res, 400, "Radius minimal 5 meter");
    }

    const location = await Location.create({
      name: name.trim(),
      latitude: latNum,
      longitude: lonNum,
      radius: radiusNum,
      address: address ? address.trim() : "",
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return success(res, 201, "Lokasi absensi berhasil ditambahkan", location);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

// Update lokasi
const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, latitude, longitude, radius, address, isActive } = req.body;

    const location = await Location.findById(id);
    if (!location) {
      return error(res, 404, "Lokasi tidak ditemukan");
    }

    if (name) location.name = name.trim();
    if (address !== undefined) location.address = address.trim();
    if (isActive !== undefined) location.isActive = Boolean(isActive);

    if (latitude !== undefined) {
      const latNum = Number(latitude);
      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        return error(res, 400, "Nilai latitude tidak valid (-90 s/d 90)");
      }
      location.latitude = latNum;
    }

    if (longitude !== undefined) {
      const lonNum = Number(longitude);
      if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
        return error(res, 400, "Nilai longitude tidak valid (-180 s/d 180)");
      }
      location.longitude = lonNum;
    }

    if (radius !== undefined) {
      const radiusNum = Number(radius);
      if (isNaN(radiusNum) || radiusNum < 5) {
        return error(res, 400, "Radius minimal 5 meter");
      }
      location.radius = radiusNum;
    }

    await location.save();
    return success(res, 200, "Lokasi berhasil diperbarui", location);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

// Toggle aktif / non-aktif
const toggleLocationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const location = await Location.findById(id);
    if (!location) {
      return error(res, 404, "Lokasi tidak ditemukan");
    }

    location.isActive = !location.isActive;
    await location.save();

    return success(
      res,
      200,
      `Lokasi berhasil di${location.isActive ? "aktifkan" : "nonaktifkan"}`,
      location
    );
  } catch (err) {
    return error(res, 500, err.message);
  }
};

// Hapus lokasi
const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const location = await Location.findByIdAndDelete(id);
    if (!location) {
      return error(res, 404, "Lokasi tidak ditemukan");
    }

    return success(res, 200, "Lokasi berhasil dihapus", location);
  } catch (err) {
    return error(res, 500, err.message);
  }
};

module.exports = {
  getAllLocations,
  getActiveLocations,
  createLocation,
  updateLocation,
  toggleLocationStatus,
  deleteLocation,
};
