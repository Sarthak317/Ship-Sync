// Utility helper for data management
// In a real app, this would handle localStorage operations

const StorageHelper = {
  getShipments: (shipments) => shipments,
  saveShipments: (setShipments) => setShipments,
  
  // Future localStorage functions can be added here
  saveToStorage: (key, data) => {
    // localStorage.setItem(key, JSON.stringify(data));
  },
  
  loadFromStorage: (key) => {
    // return JSON.parse(localStorage.getItem(key) || '[]');
    return [];
  }
};

export default StorageHelper;