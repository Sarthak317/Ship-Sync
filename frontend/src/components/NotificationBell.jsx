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
  const [activeToasts, setActiveToasts] = useState([]);
  
  const dropdownRef = useRef(null);
  const isSessionInitialized = useRef(false);
  const notificationsRef = useRef([]);

  // Sync state notifications to a ref to avoid stale closure issues in Firestore snapshot
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  // Close drawer when clicking outside (on the main dashboard body)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Trigger custom toast alert helper
  const triggerToast = (notif) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      message: notif.message,
      type: notif.type,
      status: notif.status
    };
    setActiveToasts(prev => [...prev, newToast]);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setActiveToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

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

      // Trigger animated toast notifications for new unread notifications received in-session
      if (isSessionInitialized.current) {
        const added = notifs.filter(n => 
          !n.read && !notificationsRef.current.some(prev => prev.id === n.id)
        );
        added.forEach(n => {
          triggerToast(n);
        });
      } else {
        isSessionInitialized.current = true;
      }

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

      {/* Sliding Drawer Backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sliding Drawer Panel */}
      <div
        className={`fixed right-0 top-0 h-screen w-96 z-50 shadow-2xl border-l backdrop-blur-md transition-transform duration-300 ease-in-out transform flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${
          isDark
            ? 'bg-slate-900/95 border-slate-800'
            : 'bg-white/95 border-slate-200'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-5 border-b flex items-center justify-between ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-emerald-500 hover:text-emerald-400 font-semibold"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className={`p-1.5 rounded-lg border transition-colors ${
                isDark 
                  ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white' 
                  : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className={`p-4 rounded-full mb-4 ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                <Bell className={`w-8 h-8 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              </div>
              <p className={`font-bold text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                All caught up!
              </p>
              <p className={`text-xs mt-1 max-w-[200px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                You'll receive alerts here when shipment statuses update.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.read && markAsRead(notif.id)}
                className={`p-5 cursor-pointer transition-all duration-200 flex gap-4 ${
                  isDark
                    ? `${notif.read ? 'bg-slate-900/10' : 'bg-slate-800/30'} hover:bg-slate-800/50`
                    : `${notif.read ? 'bg-white' : 'bg-blue-50/20'} hover:bg-slate-50`
                }`}
              >
                <div className={`p-2 h-9 w-9 rounded-xl flex items-center justify-center shadow-md ${isDark ? 'bg-slate-800 border border-slate-700/50' : 'bg-slate-100 border border-slate-200'}`}>
                  {getNotificationIcon(notif.type, notif.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <p className={`text-xs font-semibold leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      {notif.message}
                    </p>
                    {!notif.read && (
                      <span className="w-2 h-2 mt-1.5 bg-blue-500 rounded-full shrink-0 animate-pulse"></span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2.5">
                    <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {formatTimeAgo(notif.createdAt)}
                    </p>
                    <button
                      onClick={(e) => deleteNotification(notif.id, e)}
                      className={`p-1 rounded-md opacity-100 transition-opacity ${
                        isDark ? 'text-slate-500 hover:text-red-400 hover:bg-slate-800' : 'text-slate-400 hover:text-red-500 hover:bg-slate-100'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
            className={`p-4 border-t ${
              isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <button
              onClick={clearAllNotifications}
              className="w-full text-xs text-red-500 hover:text-red-400 font-semibold flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-500/20 hover:bg-red-500/5 transition-all duration-200"
            >
              <Trash2 className="w-4 h-4" />
              Clear all notifications
            </button>
          </div>
        )}
      </div>

      {/* Toast Feed Container (Bottom-Right overlay) */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {activeToasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-md animate-slide-in-right transition-all duration-300 ${
              isDark 
                ? 'bg-slate-950/90 border-slate-800/80 text-white shadow-black/60' 
                : 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-200/50'
            }`}
          >
            <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-slate-100'}`}>
              {getNotificationIcon(toast.type, toast.status)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold">New Update</p>
              <p className="text-xs mt-0.5 opacity-90 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => setActiveToasts(prev => prev.filter(t => t.id !== toast.id))}
              className={`p-1 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-500`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationBell;
