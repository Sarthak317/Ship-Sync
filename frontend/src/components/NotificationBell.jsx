import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Package, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { db } from '../firebase/config';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch
} from 'firebase/firestore';

const NotificationBell = ({ userEmail, isAdmin = false }) => {
  const { isDark } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen to notifications in real-time
  useEffect(() => {
    let q;

    if (isAdmin) {
      // Admin sees notifications for new shipments
      q = query(
        collection(db, 'notifications'),
        where('recipientType', '==', 'admin'),
        orderBy('createdAt', 'desc')
      );
    } else if (userEmail) {
      // User sees notifications for their shipment status changes
      q = query(
        collection(db, 'notifications'),
        where('recipientType', '==', 'user'),
        where('recipientEmail', '==', userEmail),
        orderBy('createdAt', 'desc')
      );
    } else {
      return;
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = [];
      snapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() });
      });
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    }, (error) => {
      console.error('Error fetching notifications:', error);
    });

    return () => unsubscribe();
  }, [userEmail, isAdmin]);

  // Mark single notification as read
  const markAsRead = async (notifId) => {
    try {
      await updateDoc(doc(db, 'notifications', notifId), { read: true });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.filter(n => !n.read).forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      const batch = writeBatch(db);
      notifications.forEach(n => {
        batch.delete(doc(db, 'notifications', n.id));
      });
      await batch.commit();
      setIsOpen(false);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  // Delete single notification
  const deleteNotification = async (notifId, e) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'notifications', notifId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type, status) => {
    if (type === 'new_shipment') {
      return <Package className="w-4 h-4 text-amber-400" />;
    }
    if (status === 'Approved') {
      return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    }
    if (status === 'Rejected') {
      return <XCircle className="w-4 h-4 text-red-400" />;
    }
    return <Package className="w-4 h-4 text-blue-400" />;
  };

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const seconds = Math.floor((new Date() - timestamp.toDate()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all duration-200 ${
          isDark
            ? 'hover:bg-slate-700/50 text-slate-300 hover:text-white'
            : 'hover:bg-slate-200/50 text-slate-600 hover:text-slate-800'
        }`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-80 rounded-xl shadow-2xl border z-50 overflow-hidden ${
            isDark
              ? 'bg-slate-800 border-slate-700'
              : 'bg-white border-slate-200'
          }`}
        >
          {/* Header */}
          <div
            className={`px-4 py-3 border-b flex items-center justify-between ${
              isDark ? 'border-slate-700 bg-slate-800/80' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Notifications
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] text-emerald-500 hover:text-emerald-400 font-medium"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className={`w-10 h-10 mx-auto mb-2 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.read && markAsRead(notif.id)}
                  className={`px-4 py-3 border-b cursor-pointer transition-colors duration-200 ${
                    isDark
                      ? `border-slate-700/50 ${notif.read ? 'bg-slate-800/50' : 'bg-slate-700/30'} hover:bg-slate-700/50`
                      : `border-slate-100 ${notif.read ? 'bg-white' : 'bg-blue-50/50'} hover:bg-slate-50`
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                      {getNotificationIcon(notif.type, notif.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                        {notif.message}
                      </p>
                      <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {formatTimeAgo(notif.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notif.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                      <button
                        onClick={(e) => deleteNotification(notif.id, e)}
                        className={`p-1 rounded hover:bg-red-500/20 ${isDark ? 'text-slate-500 hover:text-red-400' : 'text-slate-400 hover:text-red-500'}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              className={`px-4 py-2 border-t ${
                isDark ? 'border-slate-700 bg-slate-800/80' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <button
                onClick={clearAllNotifications}
                className="w-full text-[11px] text-red-500 hover:text-red-400 font-medium flex items-center justify-center gap-1 py-1"
              >
                <Trash2 className="w-3 h-3" />
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
