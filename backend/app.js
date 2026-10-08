require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const publicRoutes = require('./routes/publicRoutes');
const adminRoutes = require('./routes/adminRoutes');
const siswaRoutes = require('./routes/siswaRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// API URL
app.use('/api/', publicRoutes);
app.use('/api/admin/', adminRoutes);
app.use('/api/siswa/', siswaRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'AbsensiKu API is running' });
});

// Error handler (harus setelah semua route)
app.use(errorHandler);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server berjalan di localhost:${PORT}`);
});