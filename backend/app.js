require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const webRoutes = require('./routes/web');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// API URL
app.use('/api', webRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'AbsensiKu API is running' });
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server berjalan di localhost:${PORT}`);
});