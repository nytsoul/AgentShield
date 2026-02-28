import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  time: string;
  read: boolean;
  layer?: number;
}

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, 'id' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearAll: () => {},
});

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Prompt Injection Blocked',
    message: 'Hinglish prompt injection attempt detected and blocked on Layer 1.',
    type: 'critical',
    time: '2 min ago',
    read: false,
    layer: 1,
  },
  {
    id: '2',
    title: 'Memory Integrity Alert',
    message: 'system_prompt.json shows signs of tampering. Forensic review recommended.',
    type: 'warning',
    time: '5 min ago',
    read: false,
    layer: 3,
  },
  {
    id: '3',
    title: 'Honeypot Engaged',
    message: 'Attacker redirected to decoy AI. Wasting attacker time successfully.',
    type: 'info',
    time: '12 min ago',
    read: false,
    layer: 6,
  },
  {
    id: '4',
    title: 'New Rule Learned',
    message: 'Adaptive engine learned 3 new attack patterns from recent incidents.',
    type: 'success',
    time: '18 min ago',
    read: true,
    layer: 8,
  },
  {
    id: '5',
    title: 'Agent Token Expired',
    message: 'Zero Trust bridge detected expired auth token for Agent_X44.',
    type: 'warning',
    time: '25 min ago',
    read: true,
    layer: 7,
  },
  {
    id: '6',
    title: 'PII Exfiltration Attempt',
    message: 'Output firewall blocked SSN-like pattern in LLM response.',
    type: 'critical',
    time: '32 min ago',
    read: true,
    layer: 5,
  },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (n: Omit<Notification, 'id' | 'read'>) => {
    const newNotif: Notification = {
      ...n,
      id: Date.now().toString(),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Simulate live notifications every 45 seconds
  useEffect(() => {
    const alerts = [
      { title: 'Semantic Drift Spike', message: 'Session sess-88f2 showing abnormal drift variance.', type: 'warning' as const, layer: 4 },
      { title: 'Tool Scan Complete', message: 'MCP scanner completed batch scan. 2 tools quarantined.', type: 'info' as const, layer: 2 },
      { title: 'Multi-Turn Escalation', message: 'Conversation intelligence flagged gradual escalation.', type: 'critical' as const, layer: 4 },
    ];
    let idx = 0;
    const interval = setInterval(() => {
      addNotification({ ...alerts[idx % alerts.length], time: 'just now' });
      idx++;
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
