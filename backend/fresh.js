require('dotenv').config();
const mongoose = require('mongoose');

const resetDatabase = async () => {
  try {
    console.log('🔄 Menghubungkan ke database...');
    // Menghubungkan ke MongoDB menggunakan URI yang sama dengan aplikasi Anda
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'absensiku'});
    
    console.log('🗑️  Memulai proses penghapusan data...');
    
    // Mengambil semua nama collection yang ada di database aktif
    const collections = await mongoose.connection.db.collections();
    
    for (let collection of collections) {
      await collection.drop();
      console.log(`✅ Collection [${collection.collectionName}] berhasil dihapus.`);
    }
    
    console.log('\n✨ Database berhasil di-reset total (kosong seperti baru)!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Gagal mereset database:', error.message);
    process.exit(1);
  }
};

resetDatabase();
