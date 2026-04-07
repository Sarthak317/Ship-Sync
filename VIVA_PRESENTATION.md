# 🚚 SHIPMENT TRACKER DASHBOARD
## Feature & Technology Presentation for Viva

**Project**: Shipment Tracker Dashboard  
**Organization**: Wear Well India  
**Date**: March 2026

---

# PAGE 1: PROJECT OVERVIEW

## What is This Project?

A **web-based shipment management system** that allows:
- **Users** to create and track their shipments
- **Admins** to manage, approve, and monitor all shipments
- **Real-time updates** when shipment status changes
- **Email notifications** when shipments are approved/rejected

## Business Problem Solved

| Problem | Solution |
|---------|----------|
| Manual tracking via phone/email | Centralized digital dashboard |
| No visibility on shipment status | Real-time status updates |
| No record keeping | Cloud database stores everything |
| Security concerns | User authentication & role-based access |
| No communication to users | Automated email notifications |

---

# PAGE 2: TECHNOLOGY STACK

## Frontend Technologies

| Technology | What It Does |
|------------|--------------|
| **React** | Builds the user interface with reusable components |
| **Vite** | Fast development server & build tool |
| **Tailwind CSS** | Styles the application (colors, layouts, responsive design) |

## Backend Technologies

| Technology | What It Does |
|------------|--------------|
| **Node.js** | JavaScript runtime for server-side code |
| **Express.js** | Web server framework to create API endpoints |
| **Resend** | Email delivery service (sends approval/rejection emails) |

## Cloud Services

| Service | What It Does |
|---------|--------------|
| **Firebase Firestore** | Cloud database that stores shipments & notifications |
| **Clerk** | Handles user login, signup, and authentication |

## Supporting Libraries

| Library | What It Does |
|---------|--------------|
| **Lucide React** | Provides icons (search, bell, truck icons) |
| **Recharts** | Creates analytics charts and graphs |
| **CORS** | Allows frontend to communicate with backend |
| **dotenv** | Manages environment variables (API keys) |

---

# PAGE 3: WHY THESE TECHNOLOGIES?

## React - Frontend Framework

**Why React over plain HTML/JavaScript?**
- **Components**: Build once, reuse everywhere (like building blocks)
- **Automatic Updates**: When data changes, UI updates automatically
- **Industry Standard**: Used by Facebook, Instagram, Netflix, Airbnb

## Firebase Firestore - Database

**Why Firestore over MySQL/MongoDB?**
- **Real-time**: Data syncs instantly (no refresh needed)
- **No Server Required**: Directly connects from browser
- **Auto-scaling**: Handles any amount of data
- **Free Tier**: Good for small projects

## Clerk - Authentication

**Why Clerk over building our own login?**
- **Secure**: Handles passwords, sessions, encryption
- **Pre-built UI**: Login/signup forms ready to use
- **Social Login**: Google, GitHub login with one click
- **Fast Setup**: Minutes instead of weeks

## Express.js + Resend - Email Backend

**Why separate backend for emails?**
- **Security**: API keys stay on server (not exposed in browser)
- **Reliability**: Resend handles email delivery, retries, spam prevention
- **Professional**: Branded emails with HTML templates

---

# PAGE 4: USER ROLES & PERMISSIONS

## Two Types of Users

### 👤 Regular User (Customer)
| Can Do | Cannot Do |
|--------|-----------|
| ✅ Create new shipments | ❌ View other users' shipments |
| ✅ View their own shipments | ❌ Approve/reject shipments |
| ✅ See notifications about their shipments | ❌ Access admin dashboard |
| ✅ Receive email notifications | ❌ Delete shipments |
| ✅ Search & filter their shipments | ❌ Delete shipments |

### 👨‍💼 Admin
| Can Do | Special Powers |
|--------|----------------|
| ✅ View ALL shipments from all users | 🔐 Separate admin login |
| ✅ Approve or reject shipments | 📊 Access analytics page |
| ✅ Update shipment status | 🔔 See all new shipment alerts |
| ✅ Delete shipments | 📈 View business statistics |

---

# PAGE 5: CORE FEATURES - SHIPMENT MANAGEMENT

## Feature 1: Create Shipment

**User Action**: Fill form with shipment details

**Information Captured**:
- Tracking Number (auto-generated or manual)
- Customer Name
- Product Name
- Shipment Date
- Destination Address

**What Happens Behind the Scenes**:
1. Form validates all fields
2. Data sent to Firebase Firestore
3. Admin receives notification
4. User sees shipment in their list

---

## Feature 2: Shipment Status Workflow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   PENDING    │ ──► │  IN TRANSIT  │ ──► │  DELIVERED   │
│  (Yellow)    │     │   (Blue)     │     │   (Green)    │
└──────────────┘     └──────────────┘     └──────────────┘
      │
      ▼
┌──────────────┐
│   REJECTED   │
│    (Red)     │
└──────────────┘
```

**Status Meanings**:
- **Pending**: Waiting for admin approval
- **In Transit**: Shipment is on the way
- **Delivered**: Successfully delivered
- **Rejected**: Admin declined the shipment

---

# PAGE 6: CORE FEATURES - SEARCH & FILTER

## Feature 3: Search Functionality

**Users can search by**:
- 🔍 Tracking Number
- 👤 Customer Name
- 📦 Product Name

**How It Works**:
- Type in search box
- Results filter instantly (no button click needed)
- Case-insensitive (finds "JOHN" when you type "john")

---

## Feature 4: Filter by Status

**Filter Options**:
| Filter | Shows |
|--------|-------|
| All | Every shipment |
| Pending | Only pending shipments |
| In Transit | Only shipments in transit |
| Delivered | Only delivered shipments |

**Use Case**: Admin wants to see only pending shipments to approve them quickly

---

## Feature 5: Sort Functionality

**Sort Options**:
- By Shipment Date (newest/oldest first)
- By Customer Name (A-Z / Z-A)
- By Product Name (A-Z / Z-A)
- By Tracking Number

---

## Feature 6: Export to CSV

**What it does**:
- Downloads all shipment data as a spreadsheet file
- Works with Excel, Google Sheets
- Includes all filtered/sorted data

**Data Exported**:
- Tracking Number, Brand, Category, Type, Size
- Age Group, Quantity, Phone Number
- Shipment Date, Status, User Email, Created Date

**Use Case**: Admin needs to generate reports or share data with management

---

# PAGE 7: EMAIL NOTIFICATION SYSTEM

## How Email Notifications Work

### When Emails Are Sent

| Event | Email Sent To | Email Content |
|-------|---------------|---------------|
| Admin Approves | User | Professional approval email with shipment details |
| Admin Rejects | User | Rejection email with reason and next steps |

### Approval Email Contains:
- ✅ Green header with "Shipment Approved!"
- Tracking number in large font
- Full shipment details table
- "What happens next?" section
- Professional Wear Well India branding

### Rejection Email Contains:
- ⚠️ Red header with "Shipment Rejected"
- Tracking number
- **Rejection reason** (highlighted)
- Shipment details table
- "What can you do?" action steps

### Rejection Reasons (Admin Selects One):
1. Invalid Date
2. Incorrect Quantity
3. Product Unavailable
4. Incomplete Information
5. Duplicate Request

---

# PAGE 8: IN-APP NOTIFICATION SYSTEM

## How In-App Notifications Work

### Bell Icon 🔔
- Shows unread count badge
- Click to see notification list
- Mark as read option

### User Notifications
| Event | Notification Message |
|-------|---------------------|
| Shipment Approved | "Your shipment #12345 has been approved!" |
| Shipment Rejected | "Your shipment #12345 was rejected" |
| Status Changed | "Your shipment #12345 is now In Transit" |

### Admin Notifications
| Event | Notification Message |
|-------|---------------------|
| New Shipment | "New shipment #12345 from user@email.com" |

### Real-Time Updates
- Notifications appear **instantly** without page refresh
- Firebase real-time listeners detect new notifications
- Badge count updates automatically

---

# PAGE 8: AUTHENTICATION SYSTEM

## User Authentication (Clerk)

### Login Options
- 📧 Email + Password
- 🔵 Google Account
- ⚫ GitHub Account

### Security Features
| Feature | Description |
|---------|-------------|
| **Session Management** | Stay logged in across browser tabs |
| **Secure Tokens** | Encrypted authentication tokens |
| **Auto Logout** | Session expires for security |
| **Password Reset** | Email-based password recovery |

---

## Admin Authentication (Custom)

### Separate Admin Portal
- Different login page for admins
- Username + Password based
- No social login (more controlled access)

### Why Separate Admin Auth?
- Admins need different permissions
- More control over who becomes admin
- Separate session management

---

# PAGE 9: USER INTERFACE FEATURES

## Dark/Light Theme Toggle

### How It Works
- 🌙 Dark Mode: Easy on eyes, modern look
- ☀️ Light Mode: Traditional bright interface
- **Remembers Choice**: Saves preference in browser storage

### Technical Implementation
- Theme state stored in Context (global state)
- localStorage persists choice across sessions
- Tailwind CSS classes switch based on theme

---

## Responsive Design

### Works On All Devices
| Device | Layout |
|--------|--------|
| 💻 Desktop | Full table view with all columns |
| 📱 Mobile | Stacked cards, touch-friendly buttons |
| 📱 Tablet | Adaptive layout |

### Tailwind CSS Breakpoints
- Mobile First approach
- Automatically adjusts at different screen sizes

---

# PAGE 10: BACKEND ARCHITECTURE

## Node.js Email Server

### What is Backend?
The backend is a separate server that runs alongside the frontend. It handles sensitive operations like sending emails.

### Why Separate Backend for Emails?
| Reason | Explanation |
|--------|-------------|
| **Security** | API keys stay on server, not exposed in browser code |
| **Reliability** | Server handles retries if email fails |
| **Professional** | Can send HTML-formatted emails with branding |

### Backend Tech Stack
| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime (runs JS outside browser) |
| **Express.js** | Web framework to create API endpoints |
| **Resend** | Email delivery service |
| **CORS** | Allows frontend to call backend |
| **dotenv** | Reads API keys from .env file |

### API Endpoints
| Endpoint | Method | What It Does |
|----------|--------|--------------|
| `/` | GET | Health check - confirms server is running |
| `/api/email/approval` | POST | Sends approval email to user |
| `/api/email/rejection` | POST | Sends rejection email with reason |

### How Email Sending Works

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ADMIN clicks "Approve" button                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. FRONTEND calls backend API                               │
│    POST /api/email/approval                                 │
│    Body: { to: "user@email.com", shipment: {...} }         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. BACKEND receives request                                 │
│    - Reads Resend API key from .env                        │
│    - Creates HTML email from template                       │
│    - Sends to Resend API                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. RESEND delivers email to user's inbox                   │
└─────────────────────────────────────────────────────────────┘
```

---

# PAGE 11: DATABASE STRUCTURE

## Firebase Firestore Collections

### Collection: `shipments`
| Field | Type | Description |
|-------|------|-------------|
| trackingNumber | String | Unique shipment identifier |
| brand | String | Brand name (Zara, H&M, etc.) |
| category | String | Men, Women, Children, GenZ |
| clothingType | String | T-Shirt, Dress, etc. |
| size | String | XS, S, M, L, XL, etc. |
| quantity | Number | Number of items |
| phoneNumber | String | Customer phone |
| shipmentDate | String | Date of shipment |
| status | String | Current status |
| userEmail | String | Who created it |
| rejectionReason | String | Why rejected (if applicable) |
| createdAt | Timestamp | When created |
| updatedAt | Timestamp | Last modified |

---

### Collection: `notifications`
| Field | Type | Description |
|-------|------|-------------|
| type | String | "new_shipment" or "status_change" |
| recipientType | String | "admin" or "user" |
| recipientEmail | String | User's email (for user notifications) |
| trackingNumber | String | Related shipment |
| message | String | Notification text |
| read | Boolean | Has been read? |
| createdAt | Timestamp | When created |

---

# PAGE 11: REAL-TIME DATA FLOW

## How Real-Time Updates Work

### Scenario: User Creates Shipment

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER fills form and clicks "Create Shipment"             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. DATA sent to Firebase Firestore                          │
│    - Shipment saved to 'shipments' collection               │
│    - Notification saved to 'notifications' collection       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. FIREBASE detects change and triggers listeners           │
└─────────────────────────────────────────────────────────────┘
                    │                       │
                    ▼                       ▼
        ┌───────────────────┐    ┌───────────────────┐
        │ USER'S DASHBOARD  │    │ ADMIN'S DASHBOARD │
        │ updates instantly │    │ shows notification│
        └───────────────────┘    └───────────────────┘
```

### Key Concept: Firestore Listeners
- Application "subscribes" to data changes
- Firebase pushes updates (no polling needed)
- UI updates automatically without refresh

---

# PAGE 12: ANALYTICS DASHBOARD

## Feature: Business Analytics

### Charts & Statistics Available

| Chart Type | Shows |
|------------|-------|
| **Pie Chart** | Shipments by status (Pending, In Transit, Delivered) |
| **Bar Chart** | Shipments per day/week |
| **Line Chart** | Trend over time |
| **Summary Cards** | Total shipments, pending count, delivered count |

### How Charts Are Built
- **Recharts Library**: React-friendly charting
- Data fetched from Firestore
- Aggregated and formatted for visualization
- Responsive design (works on mobile)

---

# PAGE 13: SECURITY MEASURES

## Data Security

| Layer | Protection |
|-------|------------|
| **Authentication** | Only logged-in users can access |
| **Authorization** | Users only see their own data |
| **Firebase Rules** | Database-level security rules |
| **HTTPS** | Encrypted data transmission |

## User Data Isolation

### How User A Cannot See User B's Shipments
1. Every shipment stores `userEmail` field
2. Query filters: `WHERE userEmail == currentUser.email`
3. Firebase security rules enforce this at database level
4. Even if someone hacks frontend, database rejects unauthorized requests

---

# PAGE 14: APPLICATION ARCHITECTURE

## Component Hierarchy

```
┌─────────────────────────────────────────────────┐
│                    App.jsx                       │
│         (Main application container)             │
└─────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│    Header     │ │   Dashboard   │ │   Analytics   │
│ (Navigation)  │ │   (Main UI)   │ │   (Charts)    │
└───────────────┘ └───────────────┘ └───────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ ShipmentForm  │ │ ShipmentTable │ │NotificationBell│
│ (Create new)  │ │ (List view)   │ │ (Alerts)       │
└───────────────┘ └───────────────┘ └───────────────┘
                        │
                        ▼
                ┌───────────────┐
                │  ShipmentRow  │
                │ (Single item) │
                └───────────────┘
```

## State Management

| State | Where Stored | Why |
|-------|--------------|-----|
| Theme (dark/light) | ThemeContext | Needed by all components |
| Admin login status | AuthContext | Needed for routing |
| User session | Clerk | Managed by Clerk SDK |
| Shipments list | App.jsx useState | Parent manages, passes to children |

---

# PAGE 15: KEY TECHNICAL CONCEPTS FOR VIVA

## React Concepts Used

| Concept | Where Used | Purpose |
|---------|------------|---------|
| **Components** | Every file | Reusable UI pieces |
| **useState** | Forms, lists | Store changing data |
| **useEffect** | Data fetching | Run code after render |
| **useContext** | Theme, Auth | Share data globally |
| **Props** | Parent to child | Pass data down |
| **Conditional Rendering** | Admin vs User view | Show different UI based on condition |

## Firebase Concepts Used

| Concept | Where Used | Purpose |
|---------|------------|---------|
| **addDoc** | Create shipment | Add new document |
| **onSnapshot** | Real-time list | Listen for changes |
| **query + where** | Filter shipments | Get specific documents |
| **updateDoc** | Status change | Modify existing document |
| **deleteDoc** | Remove shipment | Delete document |
| **serverTimestamp** | Created/Updated times | Server-generated timestamps |

## Tailwind CSS Concepts Used

| Concept | Example | Purpose |
|---------|---------|---------|
| **Utility Classes** | `bg-blue-500`, `p-4` | Quick styling |
| **Responsive** | `md:flex`, `lg:grid` | Different layouts per screen |
| **Dark Mode** | `dark:bg-gray-800` | Theme-based colors |
| **Hover States** | `hover:bg-blue-600` | Interactive feedback |

## Backend Concepts Used

| Concept | Where Used | Purpose |
|---------|------------|---------|
| **Express.js** | server.js | Create HTTP server and routes |
| **API Endpoints** | POST /api/email/* | Handle requests from frontend |
| **Environment Variables** | .env file | Store API keys securely |
| **CORS** | Middleware | Allow cross-origin requests |
| **async/await** | Email sending | Handle asynchronous operations |

---

# QUICK REFERENCE SUMMARY

## Project At a Glance

| Aspect | Details |
|--------|---------|
| **Frontend** | React + Vite + Tailwind CSS |
| **Backend** | Node.js + Express.js |
| **Database** | Firebase Firestore (NoSQL, Real-time) |
| **Email Service** | Resend |
| **Auth** | Clerk (Users) + Custom (Admin) |
| **Features** | CRUD, Search, Filter, Sort, Export CSV, Email Notifications, Analytics, Live Tracking |
| **Users** | Regular Users + Admin |
| **Real-time** | Yes (Firebase listeners + Live Map) |
| **Responsive** | Yes (Mobile + Desktop) |
| **Theme** | Dark + Light mode |

---

# PAGE 16: COMPLETE API REFERENCE

## All API Endpoints

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/` | GET | Health check - confirms server running | None |
| `/api/email/approval` | POST | Send shipment approval email | `{ to, shipment }` |
| `/api/email/rejection` | POST | Send rejection email with reason | `{ to, shipment, reason }` |
| `/api/email/delivery` | POST | Send delivery email with PDF invoice | `{ to, shipment }` |
| `/api/shipment/update-status` | POST | Manual status update (demo mode) | `{ shipmentId, newStatus }` |
| `/api/shipment/toggle-manual-override` | POST | Enable/disable manual control | `{ shipmentId, isManualOverride }` |

## API Response Formats

| Endpoint | Success Response | Error Response |
|----------|-----------------|----------------|
| Email endpoints | `{ success: true, data: {...} }` | `{ error: "message" }` |
| Status update | `{ success: true, newStatus: "..." }` | `{ error: "message" }` |

---

# PAGE 17: COMPLETE SERVICES REFERENCE

## All External Services Used

| Service | Provider | Purpose | Free Tier |
|---------|----------|---------|-----------|
| **Firestore** | Google Firebase | Real-time NoSQL database | 1GB storage, 50K reads/day |
| **Clerk** | Clerk.dev | User authentication (login/signup) | 10,000 monthly active users |
| **Resend** | Resend.com | Transactional email delivery | 3,000 emails/month |
| **Firebase Admin** | Google Firebase | Server-side database access | Same as Firestore |

## Service Configuration

| Service | Environment Variables Required |
|---------|------------------------------|
| Firebase (Frontend) | `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, etc. |
| Firebase Admin (Backend) | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` |
| Clerk | `VITE_CLERK_PUBLISHABLE_KEY` |
| Resend | `RESEND_API_KEY` |

---

# PAGE 18: COMPLETE LIBRARIES REFERENCE

## Frontend Libraries (package.json)

| Library | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.2.0 | UI component library |
| `react-dom` | ^18.2.0 | React DOM rendering |
| `react-router-dom` | ^6.x | Page routing/navigation |
| `firebase` | ^10.x | Firebase SDK for Firestore |
| `@clerk/clerk-react` | ^4.x | Authentication components |
| `lucide-react` | ^0.x | Icon library (200+ icons) |
| `recharts` | ^2.x | Charts and analytics |
| `tailwindcss` | ^3.x | Utility-first CSS framework |
| `vite` | ^5.x | Build tool & dev server |

## Backend Libraries (backend/package.json)

| Library | Version | Purpose |
|---------|---------|---------|
| `express` | ^4.18.2 | Web server framework |
| `cors` | ^2.8.5 | Cross-origin resource sharing |
| `dotenv` | ^16.4.5 | Environment variable loader |
| `resend` | ^3.2.0 | Email sending SDK |
| `firebase-admin` | ^12.0.0 | Server-side Firebase SDK |
| `node-cron` | ^3.0.3 | Scheduled task runner |
| `pdfkit` | ^0.15.0 | PDF document generation |

---

# PAGE 19: COMPLETE FEATURES LIST

## User Features

| Feature | Description | Technology Used |
|---------|-------------|-----------------|
| Create Shipment | Fill form with brand, product, address, delivery date | React Forms, Firestore |
| View Shipments | See all personal shipments in table | Firestore onSnapshot |
| Search Shipments | Filter by tracking number, brand, status | JavaScript filter() |
| Sort Shipments | Sort by date, status, brand | JavaScript sort() |
| Track Shipment | Visual timeline of shipment journey | React State, CSS |
| Live Map Tracking | See truck moving when "Out for Delivery" | CSS Animation, SVG |
| Receive Notifications | In-app alerts when status changes | Firestore Listeners |
| Email Notifications | Receive approval/rejection/delivery emails | Resend API |
| Export CSV | Download shipment data | JavaScript Blob |
| Dark/Light Theme | Toggle between themes | React Context |

## Admin Features

| Feature | Description | Technology Used |
|---------|-------------|-----------------|
| View All Shipments | See shipments from all users | Firestore query |
| Approve Shipments | Change status to "Approved" | Firestore updateDoc |
| Reject Shipments | Reject with predefined reason | Firestore + Email |
| Delete Shipments | Remove shipments permanently | Firestore deleteDoc |
| Quick Status Manager | Easily control shipment status for demo | React State + Firestore |
| Analytics Dashboard | View stats (total, pending, delivered) | Firestore aggregation |

---

# PAGE 20: STATUS FLOW SYSTEM

## Shipment Status Progression

| # | Status | Description | Trigger |
|---|--------|-------------|---------|
| 1 | Pending Approval | Shipment created, awaiting admin | User creates shipment |
| 2 | Approved | Admin accepted shipment | Admin clicks approve |
| 3 | In Transit | Package picked up, in transport | Auto/Manual progression |
| 4 | Dispatched | Package at local distribution center | Auto/Manual progression |
| 5 | Out for Delivery | Package on delivery vehicle | Auto/Manual progression |
| 6 | Delivered | Package delivered to customer | Auto/Manual + Email sent |

## Status Colors

| Status | Color | Tailwind Class |
|--------|-------|----------------|
| Pending Approval | Amber/Yellow | `bg-amber-500` |
| Approved | Emerald/Green | `bg-emerald-500` |
| In Transit | Cyan/Blue | `bg-cyan-500` |
| Dispatched | Purple | `bg-purple-500` |
| Out for Delivery | Blue | `bg-blue-500` |
| Delivered | Green | `bg-green-500` |

---

# PAGE 21: DATABASE SCHEMA (UPDATED)

## Collection: `shipments`

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `trackingNumber` | String | Unique identifier | "TRK-123456" |
| `brand` | String | Brand name | "Zara" |
| `category` | String | Target category | "Men" |
| `clothingType` | String | Product type | "T-Shirt" |
| `size` | String | Product size | "L" |
| `quantity` | Number | Item count | 50 |
| `status` | String | Current status | "In Transit" |
| `senderName` | String | Sender name | "John Doe" |
| `receiverName` | String | Receiver name | "Jane Doe" |
| `phoneNumber` | String | Contact number | "9876543210" |
| `userEmail` | String | User's email | "user@email.com" |
| `deliveryAddress` | Object | Delivery location | `{ street, city, state, pincode }` |
| `expectedDeliveryDate` | String | Expected delivery | "2026-04-10" |
| `statusHistory` | Array | Status change log | `[{ status, timestamp }]` |
| `isManualOverride` | Boolean | Demo mode flag | false |
| `createdAt` | Timestamp | Creation time | Server timestamp |
| `updatedAt` | Timestamp | Last update | Server timestamp |

## Collection: `notifications`

| Field | Type | Description |
|-------|------|-------------|
| `userId` | String | User identifier |
| `trackingNumber` | String | Related shipment |
| `message` | String | Notification text |
| `type` | String | "status_update" |
| `read` | Boolean | Read status |
| `createdAt` | Timestamp | Creation time |

---

# PAGE 22: FILE STRUCTURE

## Complete Project Structure

```
Shipment/
├── public/
│   └── shipsync-logo.png          # Logo image
│
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── Header.jsx         # Navigation header
│   │   ├── AdminDashboard.jsx     # Admin panel with Quick Status Manager
│   │   ├── ShipmentForm.jsx       # Create shipment form
│   │   ├── ShipmentTable.jsx      # Shipment list table
│   │   ├── ShipmentRow.jsx        # Single shipment row
│   │   ├── TrackShipment.jsx      # Tracking UI + Live Map
│   │   ├── RejectionModal.jsx     # Rejection reason modal
│   │   ├── NotificationBell.jsx   # Notification dropdown
│   │   └── StatCard.jsx           # Dashboard statistics card
│   │
│   ├── context/
│   │   ├── ThemeContext.jsx       # Dark/Light theme state
│   │   └── AuthContext.jsx        # Admin authentication state
│   │
│   ├── firebase/
│   │   └── config.js              # Firebase initialization
│   │
│   ├── utils/
│   │   ├── emailService.js        # Backend API calls
│   │   ├── notificationService.js # Create notifications
│   │   └── warehouseConfig.js     # Warehouse & status config
│   │
│   ├── App.jsx                    # Main app with routing
│   ├── main.jsx                   # React entry point
│   └── index.css                  # Global styles
│
├── backend/
│   ├── server.js                  # Express server with all APIs
│   ├── package.json               # Backend dependencies
│   └── .env                       # API keys (git ignored)
│
├── index.html                     # HTML entry point
├── package.json                   # Frontend dependencies
├── vite.config.js                 # Vite configuration
├── tailwind.config.js             # Tailwind configuration
├── DEVELOPMENT_LOG.md             # Development history
├── VIVA_PRESENTATION.md           # This file
└── README.md                      # Project overview
```

---

# PAGE 23: CRON JOB & AUTOMATION

## Automatic Status Progression

| Aspect | Details |
|--------|---------|
| **Schedule** | Every minute (`* * * * *`) |
| **Library** | node-cron |
| **Purpose** | Auto-update shipment status based on delivery date |

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Cron job runs every minute                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Query: Get all shipments where:                          │
│    - status NOT IN ['Pending Approval', 'Delivered']        │
│    - isManualOverride = false                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. For each shipment:                                       │
│    - Calculate schedule (approval date → delivery date)     │
│    - Check if current time >= next scheduled status time    │
│    - If yes, update status in Firestore                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. If status = "Delivered":                                 │
│    - Generate PDF invoice                                   │
│    - Send delivery email with PDF attachment               │
└─────────────────────────────────────────────────────────────┘
```

---

# PAGE 24: LIVE MAP TRACKING

## How Live Tracking Works

| Step | What Happens | Technology |
|------|--------------|------------|
| 1 | User opens Track Shipment | React Component |
| 2 | Selects shipment with "Out for Delivery" status | React State |
| 3 | LiveTrackingMap component renders | SVG + CSS |
| 4 | Truck animation starts (moves every 1.5s) | setInterval |
| 5 | Position updates (0% → 100%) | React useState |
| 6 | ETA countdown displayed | Calculated value |
| 7 | When position ≥ 95%: | Trigger delivery |
| 8 | - Status updated to "Delivered" | Firestore updateDoc |
| 9 | - Delivery email sent with PDF | Resend API |
| 10 | Celebration screen shown | Conditional render |

## Animation Timing

| Parameter | Value | Purpose |
|-----------|-------|---------|
| Update interval | 1.5 seconds | Smooth animation |
| Position increment | 0.7-1.0% per update | ~2 min total journey |
| Trigger threshold | 95% | Start delivery process |
| Total duration | ~2 minutes | Ideal for viva demo |

---

## 6 Things to Remember

1. **React** = Component-based UI library
2. **Firebase** = Real-time cloud database (no traditional backend needed for data)
3. **Clerk** = Pre-built authentication service
4. **Tailwind** = Utility-first CSS framework
5. **Express.js** = Backend framework for API endpoints (used for email)
6. **Resend** = Email delivery service

---

## How to Run the Project

### Terminal 1 - Backend:
```
cd backend
npm start
```

### Terminal 2 - Frontend:
```
npm run dev
```

**Both servers must run for emails to work!**

---

## Demo Flow for Viva

### Quick Demo (2 minutes):
1. Show homepage → Click "Get Started"
2. Login as user → Create shipment with address
3. Login as admin → Approve shipment
4. Admin: Set "Out for Delivery" in Quick Status Manager
5. User: Open Track Shipment → Watch live map
6. Truck arrives → "Delivered" + Email sent with PDF
7. Show email inbox with invoice attachment

### What to Highlight:
- Real-time updates (no refresh needed)
- Professional email templates
- PDF invoice generation
- Live map tracking animation
- Dark/Light theme toggle
- Mobile responsive design

---

*End of Presentation*
*Last Updated: April 7, 2026*
