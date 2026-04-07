// Email Service - Calls backend to send emails

const API_URL = 'http://localhost:3001';

// Send approval email
export const sendApprovalEmail = async (userEmail, shipment) => {
  try {
    const response = await fetch(`${API_URL}/api/email/approval`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: userEmail,
        shipment: shipment
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send email');
    }

    console.log('✅ Approval email sent successfully!');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error sending approval email:', error);
    return { success: false, error: error.message };
  }
};

// Send rejection email
export const sendRejectionEmail = async (userEmail, shipment, reason) => {
  try {
    const response = await fetch(`${API_URL}/api/email/rejection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: userEmail,
        shipment: shipment,
        reason: reason
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send email');
    }

    console.log('📧 Rejection email sent successfully!');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error sending rejection email:', error);
    return { success: false, error: error.message };
  }
};

// Send delivery email
export const sendDeliveryEmail = async (userEmail, shipment) => {
  try {
    const response = await fetch(`${API_URL}/api/email/delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: userEmail,
        shipment: shipment
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send email');
    }

    console.log('📦 Delivery email sent successfully!');
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error sending delivery email:', error);
    return { success: false, error: error.message };
  }
};
