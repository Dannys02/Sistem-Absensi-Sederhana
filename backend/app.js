require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const classRoutes = require('./routes/classRoutes');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// API URL
app.use('/api/auth', authRoutes);

app.use('/api/class', classRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'AbsensiKu API is running' });
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});