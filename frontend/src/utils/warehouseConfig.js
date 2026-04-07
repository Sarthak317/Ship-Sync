// Warehouse Configuration
// Source location for all shipments

export const WAREHOUSE = {
  name: "ShipSync Warehouse",
  address: "Sector 44, Gurgaon, Haryana 122003",
  city: "Gurgaon",
  state: "Haryana",
  pincode: "122003",
  coordinates: {
    lat: 28.4595,
    lng: 77.0266
  }
};

// Status flow for shipments
export const STATUS_FLOW = [
  'Pending Approval',
  'Approved',
  'In Transit',
  'Dispatched',
  'Out for Delivery',
  'Delivered'
];

// Get next status in the flow
export const getNextStatus = (currentStatus) => {
  const currentIndex = STATUS_FLOW.indexOf(currentStatus);
  if (currentIndex === -1 || currentIndex === STATUS_FLOW.length - 1) {
    return null;
  }
  return STATUS_FLOW[currentIndex + 1];
};

// Check if status is final
export const isFinalStatus = (status) => {
  return status === 'Delivered';
};

// Get status index for progress calculation
export const getStatusIndex = (status) => {
  return STATUS_FLOW.indexOf(status);
};

// Calculate progress percentage
export const getProgressPercentage = (status) => {
  const index = getStatusIndex(status);
  if (index === -1) return 0;
  return Math.round((index / (STATUS_FLOW.length - 1)) * 100);
};
