# 🚀 YANPOS – Full Stack & Mobile POS System

YANPOS; restoran ve kafe işletmeleri için geliştirilmiş **tam kapsamlı bir POS (Point of Sale) sistemidir**.  
Proje; **Backend, Web ve Mobile** olmak üzere üç ana bileşenden oluşur ve modern full-stack mimari ile geliştirilmiştir.

---

## 🧩 Proje Yapısı

yanpos-fullstack/
├── backend/ → Node.js + MongoDB REST API
├── web/ → React Web Uygulaması (Admin & Kullanıcı Paneli)
├── mobile/ → React Native (Expo) Mobil Uygulama

---

## ⚙️ Kullanılan Teknolojiler

### 🔙 Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Role-Based Authorization
- RESTful API
- Middleware (Auth, Error Handling)

### 🌐 Web
- React
- React Router
- Context API
- Axios
- Tailwind CSS
- Protected & Admin Routes

### 📱 Mobile
- React Native
- Expo
- Context API
- Axios
- Bottom Tab Navigation
- Auth Flow (Login / Register)

---

## ✨ Özellikler

### 🔐 Kimlik Doğrulama
- JWT tabanlı giriş / kayıt
- Admin & kullanıcı yetkilendirme
- Korumalı sayfa yapısı

### 🛒 POS & Sipariş Sistemi
- Ürün listeleme
- Sepet yönetimi
- Sipariş oluşturma
- Sipariş geçmişi

### 🎯 Kampanya & Favoriler
- Kampanya görüntüleme
- Favori ürünler
- Kullanıcıya özel öneriler

### 👛 Cüzdan Sistemi
- Bakiye görüntüleme
- Ödeme ekranı
- Kullanıcı işlemleri

---

## 🔗 API Endpoint Örnekleri

| Method | Endpoint | Açıklama |
|------|---------|----------|
| POST | /api/auth/login | Kullanıcı girişi |
| POST | /api/auth/register | Kullanıcı kaydı |
| GET | /api/products | Ürünleri listele |
| POST | /api/orders | Sipariş oluştur |
| GET | /api/orders | Sipariş geçmişi |
| GET | /api/campaigns | Kampanyalar |

## ▶️ Kurulum & Çalıştırma

### 🔧 Backend
```bash
cd backend
npm install
npm run dev
.env örneği:

env
Kodu kopyala
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
🌐 Web
bash
Kodu kopyala
cd web
npm install
npm start
📱 Mobile
bash
Kodu kopyala
cd mobile
npm install
npx expo start
```

🧠 Mimari Yaklaşım

Modüler klasör yapısı

MVC mimarisi (Backend)

Context tabanlı state yönetimi

Tek backend API → Web & Mobile ortak kullanım

Ölçeklenebilir ve genişletilebilir yapı

🎯 Proje Amacı

Bu proje;

Full Stack & Mobile geliştirme pratiği

Gerçek dünya POS senaryosu

Profesyonel mimari tasarım

amacıyla geliştirilmiştir.

👨‍💻 Geliştirici

Yasin Arslan
Computer Engineering Student
Full Stack & Mobile Developer

Teknolojiler:
Node.js • React • React Native • MongoDB

🔗 GitHub: https://github.com/yasin19arslan


