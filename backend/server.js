const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const mobileOrderRoutes = require('./routes/mobileOrderRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const walletRoutes = require('./routes/walletRoutes');

// Config
dotenv.config();
connectDB();
const app = express();
const server = http.createServer(app);

// WebSocket server kurulumu
const wss = new WebSocket.Server({ 
  server,
  path: '/ws/orders'
});

// Aktif bağlantıları takip etmek için
const clients = new Map(); // Set yerine Map kullanıyoruz

// WebSocket bağlantıları
wss.on('connection', (ws, req) => {
  let userId = null;
  
  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      
      if (parsedMessage.type === 'AUTH' && parsedMessage.userId) {
        userId = parsedMessage.userId;
        
        // Eğer aynı kullanıcının önceki bağlantısı varsa kapat
        const existingConnection = clients.get(userId);
        if (existingConnection && existingConnection !== ws) {
          existingConnection.close();
        }
        
        clients.set(userId, ws);
      }
    } catch (error) {
      // Hata durumunda sessizce geç
    }
  });
  
  ws.on('close', () => {
    if (userId) {
      clients.delete(userId);
    }
  });
  
  // İlk bağlantı bildirimi
  ws.send(JSON.stringify({ 
    type: 'CONNECTED', 
    message: 'Server ile bağlantı kuruldu',
    timestamp: Date.now()
  }));
});

// Bağlantı kontrolü 
setInterval(() => {
  clients.forEach((ws, userId) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    } else {
      clients.delete(userId);
    }
  });
}, 60000);

// Global WebSocket bildirim fonksiyonu
global.notifyClients = (data) => {
  const messageData = {
    ...data,
    timestamp: Date.now()
  };
  
  if (data.order && data.order.user) {
    const userWs = clients.get(data.order.user.toString());
    if (userWs && userWs.readyState === WebSocket.OPEN) {
      try {
        userWs.send(JSON.stringify(messageData));
      } catch (error) {
        clients.delete(data.order.user.toString());
      }
    }
  }
};

// Middleware
app.use(cors());
app.use(express.json());
// Debug route
app.get('/api/debug', (req, res) => {
  res.json({ 
    message: 'API çalışıyor',
    timestamp: new Date().toISOString(),
    routes: 'Routes yüklendi'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/mobile-orders', mobileOrderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/wallet', walletRoutes);

// Uploads klasörü
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Production ortamında static dosyaları servis et
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API çalışıyor...');
  });
}

// MongoDB Bağlantısı
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB bağlantısı başarılı');
  })
  .catch((error) => {
    console.error('MongoDB bağlantı hatası:', error);
  });

// Ana route
app.get('/', (req, res) => {
  res.json({ message: 'YanPOS API Çalışıyor' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Bir şeyler ters gitti!' });
});

// Port
const PORT = process.env.PORT || 5001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
}); 