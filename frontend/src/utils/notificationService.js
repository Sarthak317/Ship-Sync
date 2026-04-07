import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Create a notification for admin when user creates a shipment
 */
export const notifyAdminNewShipment = async (trackingNumber, userEmail) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      type: 'new_shipment',
      recipientType: 'admin',
      recipientEmail: null,
      trackingNumber,
      userEmail,
      message: `New shipment ${trackingNumber} from ${userEmail} awaiting approval`,
      status: 'Pending Approval',
      read: false,
      createdAt: serverTimestamp()
    });
    console.log('📬 Admin notification created for new shipment');
  } catch (error) {
    console.error('Error creating admin notification:', error);
  }
};

/**
 * Create a notification for user when admin approves/rejects shipment
 */
export const notifyUserStatusChange = async (trackingNumber, userEmail, newStatus) => {
  try {
    let message = '';

    if (newStatus === 'Approved') {
      message = `Your shipment ${trackingNumber} has been approved!`;
    } else if (newStatus === 'Rejected') {
      message = `Your shipment ${trackingNumber} has been rejected.`;
    } else if (newStatus === 'In Transit') {
      message = `Your shipment ${trackingNumber} is now in transit.`;
    } else if (newStatus === 'Delivered') {
      message = `Your shipment ${trackingNumber} has been delivered!`;
    } else {
      message = `Your shipment ${trackingNumber} status changed to ${newStatus}`;
    }

    await addDoc(collection(db, 'notifications'), {
      type: 'status_change',
      recipientType: 'user',
      recipientEmail: userEmail,
      trackingNumber,
      message,
      status: newStatus,
      read: false,
      createdAt: serverTimestamp()
    });
    console.log(`📬 User notification created for ${newStatus}`);
  } catch (error) {
    console.error('Error creating user notification:', error);
  }
};
