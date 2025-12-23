const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const connectDB = require('../config/db');

// Config
dotenv.config();
connectDB();

const createAdmin = async () => {
  try {
    // Daha önce admin varsa kontrol et
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      console.log('Admin kullanıcısı zaten var:');
      console.log({
        id: adminExists._id,
        name: adminExists.name,
        email: adminExists.email,
        role: adminExists.role
      });
      
      // Şifreyi güncelle
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      adminExists.password = hashedPassword;
      await adminExists.save();
      
      console.log('Admin şifresi güncellendi: admin123');
    } else {
      // Admin oluştur
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const admin = await User.create({
        name: 'Admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin'
      });
      
      console.log('Admin kullanıcısı oluşturuldu:');
      console.log({
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        password: 'admin123'
      });
    }
    
    // Ayrıca roleü 'admin' olarak ayarlı tüm kullanıcıları listele
    const allAdmins = await User.find({ role: 'admin' }).select('-password');
    console.log('\nTüm admin kullanıcıları:');
    console.log(allAdmins);

    mongoose.connection.close();
    console.log('MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('Hata:', error);
    mongoose.connection.close();
  }
};

createAdmin(); 