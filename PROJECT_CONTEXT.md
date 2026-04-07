# Shipment Tracker Dashboard - Project Context Document

> **Purpose**: Copy and paste this document at the start of any new conversation with AI to provide full project context and continue development seamlessly.

---

## ⚠️ IMPORTANT: How I Want to Work

**I am completely new to backend development and learning as I go.** Please follow these rules STRICTLY:

1. **DO NOT auto-create files or make changes automatically** - Let ME do it
2. **Explain step-by-step** what I need to do
3. **Tell me what to install** with exact terminal commands
4. **Show me the code** and tell me **exactly which file to paste it in** (with line numbers if possible)
5. **One task at a time** - don't rush to complete everything
6. **Explain WHY** so I understand what I'm building
7. **For backend tasks** - explain concepts simply, guide me through setup, tell me every package to install

**Example of how to guide me:**
```
Step 1: Install the package
Run this command in your terminal:
npm install package-name

Step 2: Create a new file
Create a file at: src/utils/emailService.js

Step 3: Paste this code
[code block here]

Step 4: Now open src/App.jsx and find this line...
```

**🚨 CRITICAL: Do NOT edit my files directly. Show me the code and I will copy-paste it myself. This helps me learn!**

**Never assume I know something - explain everything!**

---

## Project Overview

**Project Name**: Shipment Tracker Dashboard  
**Organization**: Wear Well India  
**Type**: Logistics & Shipment Management System  
**Last Updated**: February 17, 2026

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1.1 | Frontend framework |
| Vite | 7.1.6 | Build tool & dev server |
| Tailwind CSS | 4.1.13 | Styling |
| Firebase Firestore | 12.6.0 | Real-time database |
| Clerk | 5.47.0 | User authentication |
| Lucide React | 0.544.0 | Icons |
| Recharts | 3.7.0 | Analytics charts |

---

## Current Project Structure

```
src/
├── App.jsx                    # Main app with routing logic
├── main.jsx                   # Entry point with providers
├── index.css                  # Global styles & animations
├── components/
│   ├── index.js               # Component exports
│   ├── AdminDashboard.jsx     # Admin portal (sees ALL shipments)
│   ├── AdminLogin.jsx         # Admin login form
│   ├── AnalyticsPage.jsx      # Charts & statistics
│   ├── ShipmentForm.jsx       # Create new shipment form
│   ├── ShipmentRow.jsx        # Individual shipment row
│   ├── ShipmentTable.jsx      # Shipments list with search/filter
│   └── layout/
│       ├── Header.jsx         # Top navigation bar
│       ├── ThemeToggle.jsx    # Dark/Light mode switch
│       └── index.js
├── context/
│   ├── AuthContext.jsx        # Admin auth state (localStorage)
│   └── ThemeContext.jsx       # Theme state (dark/light)
├── firebase/
│   └── config.js              # Firebase initialization
└── utils/
    └── StorageHelper.js       # Storage utilities
```

---

## Current Features (Implemented)

### User Features
- [x] **Clerk Authentication** - Sign in/up with Google, email, etc.
- [x] **Create Shipments** - Form with Brand, Category, Clothing Type, Size, Age Group, Quantity, Date
- [x] **Auto Tracking Number** - Generated as `TRK-XXXXXX`
- [x] **View Own Shipments** - Users only see shipments linked to their email
- [x] **Real-time Updates** - Firestore listeners for live data
- [x] **Search & Filter** - Search by tracking, brand, category, etc.
- [x] **Sort Table** - Click column headers to sort
- [x] **View Status** - Users see status as read-only (FIXED ✅)
- [x] **Delete Shipments** - Users can delete their shipments
- [x] **Analytics Page** - View shipment trends, brand distribution, category breakdown

### Admin Features
- [x] **Separate Admin Login** - Email/password authentication
- [x] **View ALL Shipments** - See every user's shipments
- [x] **Update Shipment Status** - Admin can change status (ADDED ✅)
- [x] **Admin Statistics** - Total users, shipments, success rate
- [x] **24-hour Session** - Auto-logout after 24 hours

### UI/UX
- [x] **Dark/Light Theme** - Toggle with localStorage persistence
- [x] **Responsive Design** - Mobile-friendly
- [x] **Animated Elements** - Floating backgrounds, fade-ins
- [x] **Modern Styling** - Gradient cards, glassmorphism effects

---

## Firebase Data Structure

### Collection: `shipments`

```javascript
{
  id: "auto-generated-firestore-id",
  trackingNumber: "TRK-123456",
  brand: "Zara",
  category: "Men",           // Men, Women, Children, GenZ
  clothingType: "T-Shirt",
  size: "M",
  age: "18-25",
  quantity: 10,
  shipmentDate: "2026-02-20",
  status: "Pending",         // Pending, In Transit, Out for Delivery, Delivered
  userEmail: "user@example.com",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## Current Admin Credentials (Hardcoded)

```
Email: admin@gmail.com
Password: admin123
```

> ⚠️ **TODO**: Move to secure backend authentication

---

## Form Options

### Brands
Zara, H&M, Mango, Next, Uniqlo, Gap, Forever 21, Massimo Dutti, Pull & Bear, Bershka

### Categories & Clothing Types
| Category | Clothing Types |
|----------|---------------|
| Men | T-Shirt, Shirt, Jeans, Trousers, Jacket, Blazer |
| Women | Dress, Top, Skirt, Jeans, Blouse, Cardigan |
| Children | T-Shirt, Shorts, Dress, Hoodie, Pants, Jacket |
| GenZ | Hoodie, Joggers, Crop Top, Oversized Tee, Cargo Pants, Bomber Jacket |

### Sizes by Category
| Category | Sizes |
|----------|-------|
| Men | XS, S, M, L, XL, XXL, XXXL |
| Women | XS, S, M, L, XL, XXL |
| Children | 2-3Y, 4-5Y, 6-7Y, 8-9Y, 10-11Y, 12-13Y |
| GenZ | XS, S, M, L, XL, XXL |

### Age Groups
0-5, 6-12, 13-17, 18-25, 26-35, 36-45, 46-55, 56+

---

# FUTURE DEVELOPMENT PLAN

## Priority 1: Remove User Status Control ✅ COMPLETED

**Goal**: Users should NOT be able to change shipment status manually.

**Changes Made (Feb 17, 2026)**:
- [x] Added `readOnly` prop to ShipmentRow.jsx
- [x] Updated ShipmentTable.jsx to pass `readOnly` prop
- [x] Set `readOnly={true}` for users in App.jsx (users can't change status)
- [x] Added `handleUpdateStatus` function in AdminDashboard.jsx
- [x] Set `readOnly={false}` for admin (admin CAN change status)

---

## Priority 2: Admin Approval Workflow

**Goal**: All new shipments require admin approval before processing.

### New Shipment Status Flow
```
User Creates Shipment
        ↓
  "Pending Approval" (Default for new shipments)
        ↓
    Admin Reviews
       ↙    ↘
  Approve    Reject
     ↓          ↓
 "Approved"  "Rejected"
     ↓
  (Day dividing starts from Approval Date)
     ↓
 "In Transit"
     ↓
 "Delivered"
```

### Complete Status Options:
| Status | Description | Who Can Set |
|--------|-------------|-------------|
| Pending Approval | New shipment awaiting admin review | System (auto) |
| Approved | Admin approved, ready for processing | Admin only |
| Rejected | Admin rejected with reason | Admin only |
| In Transit | Shipment on the way | Auto/Admin |
| Delivered | Shipment delivered | Auto/Admin |

### Changes Required:
- [ ] Add new statuses: `Pending Approval`, `Approved`, `Rejected`
- [ ] New shipments default to "Pending Approval"
- [ ] Admin dashboard shows pending approval shipments prominently
- [ ] Admin can Approve or Reject with reason
- [ ] Notification system for admin when new shipment arrives

### Data Model Updates (Priority 2):
```javascript
{
  // ... existing fields
  status: "Pending Approval",  // New default status (replaces "Pending")
  approvalDate: Timestamp,     // Set when admin approves
  rejectionReason: "",         // If rejected by admin
  adminNotes: ""               // Optional admin comments
}
```

---

## Priority 3: Email Notifications

**Goal**: Automated professional emails at key moments.

### Email Triggers:
| Event | Recipient | Content |
|-------|-----------|---------|
| Shipment Approved | User | Confirmation, tracking number, estimated delivery |
| Shipment Rejected | User | Reason for rejection, next steps, contact info |
| Status Change | User | Current status update, expected timeline |
| Final Delivery | User | Order summary, invoice, delivery confirmation |

### Technical Options:
- **Firebase Functions** + **SendGrid/Mailgun** (Recommended)
- **Resend** (Modern, simple API)
- **Nodemailer** (Self-hosted option)

### Backend Requirements:
- [ ] Set up Firebase Cloud Functions or separate Node.js backend
- [ ] Email service integration (SendGrid API key)
- [ ] Email templates (HTML/CSS)
- [ ] Trigger functions on Firestore document changes

---

## Priority 4: Automatic Status Progression

**Goal**: Status changes automatically based on delivery timeline.

### ⚠️ IMPORTANT: Day Counting Starts From APPROVAL DATE
The automatic status progression only begins AFTER admin approves the shipment.

### Algorithm:
```
Total Days = Delivery Date - Approval Date (NOT Booking Date)

Phase 1: Approved → In Transit   = Total Days × 0.5  (50%)
Phase 2: In Transit → Delivered  = Total Days × 0.5  (50%)
```

### Example:
- Booking Date: Feb 17, 2026 (user creates shipment)
- Approval Date: Feb 18, 2026 (admin approves) ← TIMER STARTS HERE
- Delivery Date: Feb 28, 2026
- Total Days from Approval: 10 days

| Phase | Duration | Status Change Date |
|-------|----------|-------------------|
| Approved | Immediate | Feb 18 (when admin approves) |
| In Transit | 5 days | Feb 23 |
| Delivered | 5 days | Feb 28 |

### Data Model Updates:
```javascript
{
  // ... existing fields
  status: "Pending Approval",     // Default for new shipments
  approvalDate: Timestamp,        // When admin approved (TIMER STARTS HERE)
  rejectionReason: "",            // If rejected by admin
  deliveryDate: "2026-02-28",     // Expected delivery date
  estimatedInTransitDate: Timestamp,  // Calculated: approvalDate + (totalDays * 0.5)
  estimatedDeliveryDate: Timestamp,   // The final delivery date
  actualDeliveryDate: Timestamp       // When actually delivered
}
```

### Technical Implementation:
- **Option A**: Firebase Cloud Functions with scheduled triggers (cron)
- **Option B**: Cloud Scheduler calling an API endpoint
- [ ] Function runs daily/hourly to check and update statuses
- [ ] Trigger email on each status change

---

## Priority 5: Delivery Confirmation with OTP

**Goal**: Secure delivery confirmation via SMS OTP.

### Flow:
```
Shipment Marked "Delivered"
        ↓
System Generates 6-digit OTP
        ↓
SMS sent to user's phone
        ↓
Email sent with order summary + invoice
        ↓
User enters OTP to confirm receipt
        ↓
Delivery confirmed in system
```

### Technical Requirements:
- [ ] Add phone number field to user profile/shipment
- [ ] SMS service integration (Twilio, MSG91, or AWS SNS)
- [ ] OTP generation and verification logic
- [ ] Invoice generation (PDF)
- [ ] Confirmation UI for user

### Data Model Updates:
```javascript
{
  // ... existing fields
  phoneNumber: "+91XXXXXXXXXX",
  deliveryOTP: "123456",
  otpGeneratedAt: Timestamp,
  otpVerified: false,
  deliveryConfirmedAt: Timestamp
}
```

---

## Technical Architecture Recommendations

### Frontend (React - Current)
- User interface
- Real-time data display
- Form handling
- Theme management

### Backend (To Be Added)
**Recommended**: Firebase Cloud Functions or separate Node.js/Express server

**Backend Responsibilities**:
- Email sending (SendGrid/Resend)
- SMS sending (Twilio/MSG91)
- Scheduled status updates (cron jobs)
- OTP generation & verification
- Invoice PDF generation
- Admin notifications
- Secure business logic

### Services Needed:
| Service | Provider Options | Purpose |
|---------|-----------------|---------|
| Email | SendGrid, Resend, Mailgun | Transactional emails |
| SMS | Twilio, MSG91, AWS SNS | OTP delivery |
| Scheduler | Firebase Functions, AWS Lambda | Auto status updates |
| PDF | PDFKit, Puppeteer | Invoice generation |

---

## Environment Variables Needed (Future)

```env
# Firebase (already configured)
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx

# Clerk (already configured)
VITE_CLERK_PUBLISHABLE_KEY=xxx

# Email Service
SENDGRID_API_KEY=xxx
EMAIL_FROM=noreply@wearwellindia.com

# SMS Service
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1xxx

# Admin (move from hardcoded)
ADMIN_EMAIL=admin@wearwellindia.com
ADMIN_PASSWORD_HASH=xxx
```

---

## Current Issues / Technical Debt

1. **Admin credentials hardcoded** in AuthContext.jsx - needs secure backend auth
2. **No email verification** for users
3. **No phone number collection** - needed for SMS
4. **Status editable by users** - needs to be removed
5. **No approval workflow** - shipments go directly to "Pending"
6. **No backend** - all logic is frontend only

---

## Development Phases

### Phase 1: Frontend Cleanup (No Backend Needed)
- [ ] Remove user status editing capability
- [ ] Add "Pending Approval" status
- [ ] Update UI for approval workflow
- [ ] Add phone number field to shipment form

### Phase 2: Backend Setup
- [ ] Initialize Firebase Cloud Functions OR Node.js backend
- [ ] Set up email service (SendGrid)
- [ ] Create email templates
- [ ] Implement approval email flow

### Phase 3: Automation
- [ ] Implement scheduled status progression
- [ ] Add status change email notifications
- [ ] Calculate delivery phases on shipment creation

### Phase 4: Delivery Confirmation
- [ ] Integrate SMS service (Twilio)
- [ ] Implement OTP generation & verification
- [ ] Create invoice PDF generation
- [ ] Build delivery confirmation UI

---

## How to Continue Development

When starting a new conversation, paste this document and specify:

1. **Which phase/priority** you want to work on
2. **Any new requirements** or changes to the plan
3. **Technical decisions made** (e.g., "I chose SendGrid for email")

**Remember**: I'm learning backend development, so guide me step-by-step with explanations!

Example prompts:
> "Here's my project context: [paste this doc]. I want to start Phase 1 - removing user status editing. Guide me step by step."

> "Here's my project context: [paste this doc]. Explain how Firebase Cloud Functions work and help me set it up."

> "Here's my project context: [paste this doc]. What should I learn first to implement the email feature?"

---

## Commands Reference

```bash
# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

---

## Project Location

```
c:\Users\sarth\OneDrive\Desktop\Wear Well India\Shipment Tracker Dashboard\Shipment\
```

---

*Document created: February 17, 2026*
