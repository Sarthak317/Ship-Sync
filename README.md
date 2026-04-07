# 🚚 Shipment Tracker App

A modern and responsive **Shipment Management System** built using **React, Firebase Firestore, and Clerk Authentication**.  
This application enables businesses to efficiently manage shipments with real-time updates, filtering, search, and a professional dashboard UI.

---

## ✨ Features

### ✅ Core Functionalities
- Add new shipments with tracking number, customer details, product info, and shipment date.
- Update shipment status through workflow:
  **Pending → In Transit → Delivered**
- Delete shipments safely with confirmation.
- Automatic data handling through Firebase Firestore.

---

### 🔎 Search, Filter & Sort
- Search by:
  - Tracking Number  
  - Customer Name  
  - Product Name
- Filter shipments by **status** (Pending / In Transit / Delivered).
- Sort shipments by:
  - Shipment Date  
  - Customer Name  
  - Product Name  
  - Tracking Number

---

### 🔐 Authentication (Clerk)
- Secure login system using **ClerkProvider**.
- User profile dropdown (`<UserButton />`).
- Display logged-in user details in the header.

---

### 🔥 Firebase Firestore Integration
- Real-time CRUD operations.
- Firestore auto-generates document IDs.
- Clean separation of Firebase config.

---

### 🎨 Modern, Responsive UI
- Styled using **Tailwind CSS**.
- Beautiful table design with hover effects.
- Mobile-friendly layout.
- Form validation for reliable data entry.


