require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');
const cron = require('node-cron');
const admin = require('firebase-admin');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Firebase Admin (will be configured with service account)
// For now, we'll use the frontend Firebase config approach
let db = null;

// Check if Firebase Admin is configured
if (process.env.FIREBASE_PROJECT_ID) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
  db = admin.firestore();
  console.log('✅ Firebase Admin initialized');
}

// Middleware
app.use(cors());
app.use(express.json());

// Warehouse Configuration
const WAREHOUSE = {
  name: "ShipSync Warehouse",
  address: "Sector 44, Gurgaon, Haryana 122003",
  city: "Gurgaon",
  state: "Haryana",
  pincode: "122003"
};

// Status Flow
const STATUS_FLOW = [
  'Pending Approval',
  'Approved',
  'In Transit',
  'Dispatched',
  'Out for Delivery',
  'Delivered'
];

// Get next status
const getNextStatus = (currentStatus) => {
  const index = STATUS_FLOW.indexOf(currentStatus);
  if (index === -1 || index === STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[index + 1];
};

// Professional Approval Email Template
const getApprovalEmailHTML = (shipment) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shipment Approved</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f4f8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f4f8; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);">
          
          <!-- Logo Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px 40px; text-align: center;">
              <h2 style="margin: 0; font-size: 24px; font-style: italic;">
                <span style="color: #3b82f6;">Ship</span><span style="color: #10b981;">Sync</span>
              </h2>
              <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">
                Shipment Tracking
              </p>
            </td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                ✅ Shipment Approved!
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                Your shipment request has been approved and is being processed
              </p>
            </td>
          </tr>

          <!-- Tracking Number Card -->
          <tr>
            <td style="padding: 30px 40px 20px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; border: 2px solid #10b981;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #166534; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                      Tracking Number
                    </p>
                    <p style="margin: 0; color: #059669; font-size: 32px; font-weight: 700; letter-spacing: 3px;">
                      ${shipment.trackingNumber || 'N/A'}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Status Badge -->
          <tr>
            <td style="padding: 0 40px 20px 40px; text-align: center;">
              <span style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 10px 24px; border-radius: 50px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                ✓ APPROVED
              </span>
            </td>
          </tr>

          <!-- Shipment Details -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
                📦 Shipment Details
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 14px 16px; color: #64748b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e2e8f0; width: 40%;">Brand</td>
                  <td style="padding: 14px 16px; color: #1e293b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${shipment.brand || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 16px; color: #64748b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">Category</td>
                  <td style="padding: 14px 16px; color: #1e293b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${shipment.category || 'N/A'}</td>
                </tr>
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 14px 16px; color: #64748b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Product Type</td>
                  <td style="padding: 14px 16px; color: #1e293b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${shipment.clothingType || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 16px; color: #64748b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">Size</td>
                  <td style="padding: 14px 16px; color: #1e293b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${shipment.size || 'N/A'}</td>
                </tr>
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 14px 16px; color: #64748b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Age Group</td>
                  <td style="padding: 14px 16px; color: #1e293b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${shipment.age || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 16px; color: #64748b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">Quantity</td>
                  <td style="padding: 14px 16px; color: #1e293b; font-size: 14px; font-weight: 700; border-bottom: 1px solid #e2e8f0;">${shipment.quantity || 'N/A'} units</td>
                </tr>
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 14px 16px; color: #64748b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Phone Number</td>
                  <td style="padding: 14px 16px; color: #1e293b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${shipment.phoneNumber || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 16px; color: #64748b; font-size: 14px; font-weight: 600; background-color: #f8fafc;">Shipment Date</td>
                  <td style="padding: 14px 16px; color: #1e293b; font-size: 14px; font-weight: 700;">${shipment.shipmentDate || 'N/A'}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Next Steps -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-radius: 12px; border-left: 4px solid #10b981;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 10px 0; color: #166534; font-size: 16px; font-weight: 600;">
                      🚀 What happens next?
                    </h3>
                    <ul style="margin: 0; padding: 0 0 0 20px; color: #166534; font-size: 14px; line-height: 1.8;">
                      <li>Your shipment will be dispatched soon</li>
                      <li>You'll receive status updates via email</li>
                      <li>Track your shipment using the tracking number above</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1e293b; padding: 30px 40px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #ffffff; font-size: 18px; font-weight: 600;">
                ShipSync
              </p>
              <p style="margin: 0 0 16px 0; color: #94a3b8; font-size: 14px;">
                Your Shipment Management Solution
              </p>
              <hr style="border: none; border-top: 1px solid #334155; margin: 16px 0;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                This is an automated email. Please do not reply directly to this message.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Professional Rejection Email Template
const getRejectionEmailHTML = (shipment, reason) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shipment Rejected</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f4f8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f4f8; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);">
          
          <!-- Logo Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px 40px; text-align: center;">
              <h2 style="margin: 0; font-size: 24px; font-style: italic;">
                <span style="color: #3b82f6;">Ship</span><span style="color: #10b981;">Sync</span>
              </h2>
              <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">
                Shipment Tracking
              </p>
            </td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                ⚠️ Shipment Request Rejected
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                Unfortunately, your shipment request could not be approved
              </p>
            </td>
          </tr>

          <!-- Tracking Number Card -->
          <tr>
            <td style="padding: 30px 40px 20px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 12px; border: 2px solid #ef4444;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #991b1b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                      Tracking Number
                    </p>
                    <p style="margin: 0; color: #dc2626; font-size: 32px; font-weight: 700; letter-spacing: 3px;">
                      ${shipment.trackingNumber || 'N/A'}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Status Badge -->
          <tr>
            <td style="padding: 0 40px 20px 40px; text-align: center;">
              <span style="display: inline-block; background-color: #ef4444; color: #ffffff; padding: 10px 24px; border-radius: 50px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                ✗ REJECTED
              </span>
            </td>
          </tr>

          <!-- Rejection Reason -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border-radius: 12px; border-left: 4px solid #ef4444;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 10px 0; color: #991b1b; font-size: 16px; font-weight: 600;">
                      📋 Reason for Rejection
                    </h3>
                    <p style="margin: 0; color: #b91c1c; font-size: 15px; line-height: 1.6;">
                      ${reason}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shipment Details -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
                📦 Shipment Details
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 14px 16px; color: #64748b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e2e8f0; width: 40%;">Brand</td>
                  <td style="padding: 14px 16px; color: #1e293b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${shipment.brand || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 16px; color: #64748b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">Category</td>
                  <td style="padding: 14px 16px; color: #1e293b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${shipment.category || 'N/A'}</td>
                </tr>
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 14px 16px; color: #64748b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Product Type</td>
                  <td style="padding: 14px 16px; color: #1e293b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${shipment.clothingType || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 16px; color: #64748b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">Size</td>
                  <td style="padding: 14px 16px; color: #1e293b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${shipment.size || 'N/A'}</td>
                </tr>
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 14px 16px; color: #64748b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Quantity</td>
                  <td style="padding: 14px 16px; color: #1e293b; font-size: 14px; font-weight: 700; border-bottom: 1px solid #e2e8f0;">${shipment.quantity || 'N/A'} units</td>
                </tr>
                <tr>
                  <td style="padding: 14px 16px; color: #64748b; font-size: 14px; font-weight: 600; background-color: #f8fafc;">Shipment Date</td>
                  <td style="padding: 14px 16px; color: #1e293b; font-size: 14px; font-weight: 700;">${shipment.shipmentDate || 'N/A'}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What to do next -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-radius: 12px; border-left: 4px solid #10b981;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 10px 0; color: #166534; font-size: 16px; font-weight: 600;">
                      💡 What can you do?
                    </h3>
                    <ul style="margin: 0; padding: 0 0 0 20px; color: #166534; font-size: 14px; line-height: 1.8;">
                      <li>Review the rejection reason mentioned above</li>
                      <li>Correct the issue and submit a new shipment request</li>
                      <li>Contact support if you need assistance</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1e293b; padding: 30px 40px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #ffffff; font-size: 18px; font-weight: 600;">
                ShipSync
              </p>
              <p style="margin: 0 0 16px 0; color: #94a3b8; font-size: 14px;">
                Your Shipment Management Solution
              </p>
              <hr style="border: none; border-top: 1px solid #334155; margin: 16px 0;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                This is an automated email. Please do not reply directly to this message.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// API Routes

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'ShipSync Email Server is running!' });
});

// Send Approval Email
app.post('/api/email/approval', async (req, res) => {
  try {
    const { to, shipment } = req.body;
    
    if (!to || !shipment) {
      return res.status(400).json({ error: 'Missing required fields: to, shipment' });
    }

    const { data, error } = await resend.emails.send({
      from: 'ShipSync <onboarding@resend.dev>',
      to: [to],
      subject: `✅ Shipment Approved - ${shipment.trackingNumber} | ShipSync`,
      html: getApprovalEmailHTML(shipment)
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('✅ Approval email sent to:', to);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send Rejection Email
app.post('/api/email/rejection', async (req, res) => {
  try {
    const { to, shipment, reason } = req.body;
    
    if (!to || !shipment || !reason) {
      return res.status(400).json({ error: 'Missing required fields: to, shipment, reason' });
    }

    const { data, error } = await resend.emails.send({
      from: 'ShipSync <onboarding@resend.dev>',
      to: [to],
      subject: `⚠️ Shipment Rejected - ${shipment.trackingNumber} | Action Required`,
      html: getRejectionEmailHTML(shipment, reason)
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('📧 Rejection email sent to:', to);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delivery Email Template
const getDeliveryEmailHTML = (shipment) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shipment Delivered</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f4f8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f4f8; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);">
          
          <!-- Logo Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px 40px; text-align: center;">
              <h2 style="margin: 0; font-size: 24px; font-style: italic;">
                <span style="color: #3b82f6;">Ship</span><span style="color: #10b981;">Sync</span>
              </h2>
              <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">
                Shipment Tracking
              </p>
            </td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🎉 Shipment Delivered!
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                Your package has been successfully delivered
              </p>
            </td>
          </tr>

          <!-- Tracking Number Card -->
          <tr>
            <td style="padding: 30px 40px 20px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px; border: 2px solid #3b82f6;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #1e40af; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                      Tracking Number
                    </p>
                    <p style="margin: 0; color: #1d4ed8; font-size: 32px; font-weight: 700; letter-spacing: 3px;">
                      ${shipment.trackingNumber || 'N/A'}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Status Badge -->
          <tr>
            <td style="padding: 0 40px 20px 40px; text-align: center;">
              <span style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 10px 24px; border-radius: 50px; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                📦 DELIVERED
              </span>
            </td>
          </tr>

          <!-- Delivery Details -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border-radius: 12px; border-left: 4px solid #10b981;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 10px 0; color: #166534; font-size: 16px; font-weight: 600;">
                      📍 Delivered To
                    </h3>
                    <p style="margin: 0; color: #166534; font-size: 14px; line-height: 1.6;">
                      ${shipment.deliveryAddress?.street || ''}<br>
                      ${shipment.deliveryAddress?.city || ''}, ${shipment.deliveryAddress?.state || ''}<br>
                      ${shipment.deliveryAddress?.pincode || ''}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shipment Details -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 18px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
                📦 Package Details
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 14px 16px; color: #64748b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e2e8f0; width: 40%;">Brand</td>
                  <td style="padding: 14px 16px; color: #1e293b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${shipment.brand || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 16px; color: #64748b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">Product</td>
                  <td style="padding: 14px 16px; color: #1e293b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${shipment.clothingType || 'N/A'}</td>
                </tr>
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 14px 16px; color: #64748b; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Size</td>
                  <td style="padding: 14px 16px; color: #1e293b; font-size: 14px; border-bottom: 1px solid #e2e8f0;">${shipment.size || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 16px; color: #64748b; font-size: 14px; font-weight: 600; background-color: #f8fafc;">Quantity</td>
                  <td style="padding: 14px 16px; color: #1e293b; font-size: 14px; font-weight: 700;">${shipment.quantity || 'N/A'} units</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Thank You -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-radius: 12px; border-left: 4px solid #3b82f6;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px; font-weight: 600;">
                      🙏 Thank you for using ShipSync!
                    </h3>
                    <p style="margin: 0; color: #1e40af; font-size: 14px;">
                      We hope you enjoy your purchase. See you again soon!
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1e293b; padding: 30px 40px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #ffffff; font-size: 18px; font-weight: 600;">
                ShipSync
              </p>
              <p style="margin: 0 0 16px 0; color: #94a3b8; font-size: 14px;">
                Your Shipment Management Solution
              </p>
              <hr style="border: none; border-top: 1px solid #334155; margin: 16px 0;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                This is an automated email. Please do not reply directly to this message.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Generate Invoice PDF
const generateInvoicePDF = (shipment) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4',
        margin: 50,
        info: {
          Title: `Invoice - ${shipment.trackingNumber}`,
          Author: 'ShipSync',
          Subject: 'Shipment Delivery Invoice'
        }
      });
      
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const deliveryDate = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;

      // Header gradient background simulation with colored rectangle
      doc.rect(0, 0, 595.28, 140).fill('#0f172a');
      
      // Logo area - circle with S
      doc.circle(70, 70, 25).fill('#3b82f6');
      doc.fontSize(28).fillColor('#ffffff').text('S', 58, 55);
      
      // Company name
      doc.fontSize(28).fillColor('#ffffff').text('ShipSync', 110, 50);
      doc.fontSize(12).fillColor('#94a3b8').text('Your Shipment Management Solution', 110, 82);
      
      // Invoice title
      doc.fontSize(24).fillColor('#ffffff').text('DELIVERY INVOICE', 350, 55, { align: 'right' });
      doc.fontSize(11).fillColor('#94a3b8').text(`Invoice #: ${invoiceNumber}`, 350, 88, { align: 'right' });
      doc.text(`Date: ${deliveryDate}`, 350, 103, { align: 'right' });

      // Reset fill color for body
      doc.fillColor('#1e293b');

      // Tracking Number Box
      doc.rect(50, 160, 495, 50).fill('#eff6ff');
      doc.rect(50, 160, 5, 50).fill('#3b82f6');
      doc.fontSize(12).fillColor('#64748b').text('TRACKING NUMBER', 70, 172);
      doc.fontSize(18).fillColor('#1e40af').font('Helvetica-Bold').text(shipment.trackingNumber || 'N/A', 70, 188);
      
      // Status badge
      doc.rect(430, 170, 100, 30).fill('#10b981');
      doc.fontSize(12).fillColor('#ffffff').text('DELIVERED', 445, 179);

      // Reset font
      doc.font('Helvetica');

      // Two column layout for addresses
      const leftCol = 50;
      const rightCol = 310;
      let y = 235;

      // From section
      doc.rect(leftCol, y, 240, 100).stroke('#e2e8f0');
      doc.fontSize(11).fillColor('#64748b').text('FROM:', leftCol + 15, y + 15);
      doc.fontSize(13).fillColor('#1e293b').font('Helvetica-Bold').text(shipment.senderName || 'ShipSync Warehouse', leftCol + 15, y + 32);
      doc.font('Helvetica').fontSize(11).fillColor('#64748b');
      doc.text('Sector 44, Gurgaon', leftCol + 15, y + 52);
      doc.text('Haryana 122003', leftCol + 15, y + 67);
      doc.text('India', leftCol + 15, y + 82);

      // To section
      doc.rect(rightCol, y, 235, 100).stroke('#e2e8f0');
      doc.fontSize(11).fillColor('#64748b').text('DELIVERED TO:', rightCol + 15, y + 15);
      doc.fontSize(13).fillColor('#1e293b').font('Helvetica-Bold').text(shipment.receiverName || 'Customer', rightCol + 15, y + 32);
      doc.font('Helvetica').fontSize(11).fillColor('#64748b');
      if (shipment.deliveryAddress) {
        doc.text(shipment.deliveryAddress.street || '', rightCol + 15, y + 52);
        doc.text(`${shipment.deliveryAddress.city || ''}, ${shipment.deliveryAddress.state || ''}`, rightCol + 15, y + 67);
        doc.text(shipment.deliveryAddress.pincode || '', rightCol + 15, y + 82);
      }

      y = 360;

      // Package Details Table Header
      doc.rect(50, y, 495, 35).fill('#1e293b');
      doc.fontSize(11).fillColor('#ffffff');
      doc.text('ITEM DESCRIPTION', 65, y + 12);
      doc.text('SIZE', 280, y + 12);
      doc.text('QTY', 350, y + 12);
      doc.text('STATUS', 440, y + 12);

      y += 35;

      // Table Row
      doc.rect(50, y, 495, 50).stroke('#e2e8f0');
      doc.fillColor('#1e293b');
      doc.font('Helvetica-Bold').fontSize(12).text(shipment.brand || 'N/A', 65, y + 12);
      doc.font('Helvetica').fontSize(11).fillColor('#64748b').text(shipment.clothingType || 'Apparel', 65, y + 28);
      doc.fillColor('#1e293b').text(shipment.size || 'Standard', 280, y + 20);
      doc.font('Helvetica-Bold').text(String(shipment.quantity || 1), 350, y + 20);
      
      // Status in table
      doc.rect(420, y + 12, 80, 26).fill('#dcfce7');
      doc.fontSize(10).fillColor('#166534').text('Delivered', 435, y + 20);

      y += 70;

      // Delivery Timeline
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#1e293b').text('DELIVERY TIMELINE', 50, y);
      y += 25;
      
      doc.rect(50, y, 495, 2).fill('#e2e8f0');
      y += 15;

      const statuses = ['Approved', 'In Transit', 'Dispatched', 'Out for Delivery', 'Delivered'];
      const statusIcons = ['✓', '➤', '📦', '🚚', '✓'];
      
      statuses.forEach((status, index) => {
        doc.rect(50, y, 495, 30).fill(index % 2 === 0 ? '#f8fafc' : '#ffffff');
        doc.circle(70, y + 15, 8).fill('#10b981');
        doc.fontSize(10).fillColor('#ffffff').text(statusIcons[index], 65, y + 10);
        doc.fontSize(11).fillColor('#1e293b').text(status, 90, y + 10);
        doc.fillColor('#64748b').text('Completed', 450, y + 10);
        y += 30;
      });

      y += 20;

      // Footer
      doc.rect(0, 750, 595.28, 92).fill('#f8fafc');
      doc.fontSize(10).fillColor('#64748b').text('Thank you for choosing ShipSync!', 0, 770, { align: 'center', width: 595.28 });
      doc.text('For support, contact: support@shipsync.com', 0, 785, { align: 'center', width: 595.28 });
      doc.fontSize(9).text('This is a computer-generated invoice and does not require a signature.', 0, 810, { align: 'center', width: 595.28 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Send Delivery Email with Invoice PDF attachment
app.post('/api/email/delivery', async (req, res) => {
  try {
    const { to, shipment } = req.body;
    
    if (!to || !shipment) {
      return res.status(400).json({ error: 'Missing required fields: to, shipment' });
    }

    // Generate PDF invoice
    console.log('📄 Generating invoice PDF...');
    const pdfBuffer = await generateInvoicePDF(shipment);
    const pdfBase64 = pdfBuffer.toString('base64');
    console.log('✅ PDF generated successfully');

    const { data, error } = await resend.emails.send({
      from: 'ShipSync <onboarding@resend.dev>',
      to: [to],
      subject: `🎉 Shipment Delivered - ${shipment.trackingNumber} | ShipSync`,
      html: getDeliveryEmailHTML(shipment),
      attachments: [
        {
          filename: `ShipSync-Invoice-${shipment.trackingNumber}.pdf`,
          content: pdfBase64
        }
      ]
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('📦 Delivery email with invoice sent to:', to);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update Shipment Status (for Demo Mode / Manual Override)
app.post('/api/shipment/update-status', async (req, res) => {
  try {
    const { shipmentId, newStatus, sendEmail, userEmail, shipment } = req.body;
    
    if (!shipmentId || !newStatus) {
      return res.status(400).json({ error: 'Missing required fields: shipmentId, newStatus' });
    }

    // If Firebase is configured, update Firestore
    if (db) {
      const shipmentRef = db.collection('shipments').doc(shipmentId);
      await shipmentRef.update({
        status: newStatus,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        statusHistory: admin.firestore.FieldValue.arrayUnion({
          status: newStatus,
          timestamp: new Date().toISOString()
        })
      });
    }

    // Send delivery email if status is "Delivered"
    if (newStatus === 'Delivered' && sendEmail && userEmail && shipment) {
      await resend.emails.send({
        from: 'ShipSync <onboarding@resend.dev>',
        to: [userEmail],
        subject: `🎉 Shipment Delivered - ${shipment.trackingNumber} | ShipSync`,
        html: getDeliveryEmailHTML(shipment)
      });
      console.log('📦 Delivery email sent for manual status update');
    }

    console.log(`✅ Status updated: ${shipmentId} -> ${newStatus}`);
    res.json({ success: true, newStatus });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Toggle Manual Override for a shipment
app.post('/api/shipment/toggle-manual-override', async (req, res) => {
  try {
    const { shipmentId, isManualOverride } = req.body;
    
    if (!shipmentId || typeof isManualOverride !== 'boolean') {
      return res.status(400).json({ error: 'Missing required fields: shipmentId, isManualOverride' });
    }

    if (db) {
      const shipmentRef = db.collection('shipments').doc(shipmentId);
      await shipmentRef.update({
        isManualOverride: isManualOverride,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    console.log(`🔧 Manual override ${isManualOverride ? 'enabled' : 'disabled'} for: ${shipmentId}`);
    res.json({ success: true, isManualOverride });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Calculate status progression schedule
const calculateStatusSchedule = (approvalDate, deliveryDate) => {
  const approval = new Date(approvalDate);
  const delivery = new Date(deliveryDate);
  const duration = delivery - approval;
  const durationDays = duration / (1000 * 60 * 60 * 24);
  
  // Statuses to progress through (after Approved)
  const statuses = ['In Transit', 'Dispatched', 'Out for Delivery'];
  const schedule = [];
  
  if (durationDays > 1) {
    // Divide into day-based intervals
    const interval = duration / (statuses.length + 1);
    statuses.forEach((status, index) => {
      const time = new Date(approval.getTime() + interval * (index + 1));
      schedule.push({ status, scheduledTime: time });
    });
  } else {
    // Same day or next day - use hour intervals
    const interval = duration / (statuses.length + 1);
    statuses.forEach((status, index) => {
      const time = new Date(approval.getTime() + interval * (index + 1));
      schedule.push({ status, scheduledTime: time });
    });
  }
  
  // Delivery at 9 AM on delivery date
  const deliveryTime = new Date(delivery);
  deliveryTime.setHours(9, 0, 0, 0);
  schedule.push({ status: 'Delivered', scheduledTime: deliveryTime });
  
  return schedule;
};

// Cron job: Check and update shipment statuses every minute
cron.schedule('* * * * *', async () => {
  if (!db) {
    return; // Skip if Firebase not configured
  }
  
  try {
    const now = new Date();
    
    // Get all shipments that are not delivered and not manual override
    const shipmentsSnapshot = await db.collection('shipments')
      .where('status', 'not-in', ['Pending Approval', 'Delivered', 'Rejected'])
      .where('isManualOverride', '==', false)
      .get();
    
    for (const doc of shipmentsSnapshot.docs) {
      const shipment = { id: doc.id, ...doc.data() };
      
      // Skip if no expected delivery date
      if (!shipment.expectedDeliveryDate) continue;
      
      // Calculate schedule based on approval time and delivery date
      const approvalEntry = shipment.statusHistory?.find(h => h.status === 'Approved');
      if (!approvalEntry) continue;
      
      const schedule = calculateStatusSchedule(approvalEntry.timestamp, shipment.expectedDeliveryDate);
      const currentStatusIndex = STATUS_FLOW.indexOf(shipment.status);
      
      // Find next scheduled status
      for (const scheduled of schedule) {
        const scheduledIndex = STATUS_FLOW.indexOf(scheduled.status);
        if (scheduledIndex > currentStatusIndex && now >= scheduled.scheduledTime) {
          // Update status
          await db.collection('shipments').doc(doc.id).update({
            status: scheduled.status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            statusHistory: admin.firestore.FieldValue.arrayUnion({
              status: scheduled.status,
              timestamp: now.toISOString()
            })
          });
          
          console.log(`⏰ Auto-updated: ${shipment.trackingNumber} -> ${scheduled.status}`);
          
          // Send delivery email with PDF if delivered
          if (scheduled.status === 'Delivered' && shipment.userEmail) {
            const pdfBuffer = await generateInvoicePDF(shipment);
            const pdfBase64 = pdfBuffer.toString('base64');
            
            await resend.emails.send({
              from: 'ShipSync <onboarding@resend.dev>',
              to: [shipment.userEmail],
              subject: `🎉 Shipment Delivered - ${shipment.trackingNumber} | ShipSync`,
              html: getDeliveryEmailHTML(shipment),
              attachments: [
                {
                  filename: `ShipSync-Invoice-${shipment.trackingNumber}.pdf`,
                  content: pdfBase64
                }
              ]
            });
            console.log(`📦 Auto delivery email with invoice sent to: ${shipment.userEmail}`);
          }
          
          break; // Only update one status at a time
        }
      }
    }
  } catch (error) {
    console.error('Cron job error:', error);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
  🚀 ShipSync Server is running!
  
  📧 Email Endpoints:
  - POST /api/email/approval  - Send approval email
  - POST /api/email/rejection - Send rejection email
  - POST /api/email/delivery  - Send delivery email
  
  📦 Shipment Endpoints:
  - POST /api/shipment/update-status         - Manual status update (Demo Mode)
  - POST /api/shipment/toggle-manual-override - Toggle manual control
  
  ⏰ Cron Jobs:
  - Status auto-progression (every minute)
  
  🌐 Server: http://localhost:${PORT}
  `);
});
