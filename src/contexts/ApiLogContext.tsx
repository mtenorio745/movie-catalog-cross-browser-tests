import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ApiLog {
  id: string;
  timestamp: Date;
  method: string;
  url: string;
  status?: number;
  requestData?: any;
  responseData?: any;
  error?: string;
  duration?: number;
}

interface ApiLogContextType {
  logs: ApiLog[];
  errors: ApiLog[];
  currentState: Record<string, any>;
  addLog: (log: Omit<ApiLog, 'id' | 'timestamp'>) => void;
  updateLog: (id: string, updates: Partial<ApiLog>) => void;
  clearLogs: () => void;
  updateCurrentState: (key: string, value: any) => void;
}

const ApiLogContext = createContext<ApiLogContextType | undefined>(undefined);

export const useApiLog = () => {
  const context = useContext(ApiLogContext);
  if (!context) {
    throw new Error('useApiLog must be used within an ApiLogProvider');
  }
  return context;
};

export const ApiLogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [currentState, setCurrentState] = useState<Record<string, any>>({});

  const addLog = (logData: Omit<ApiLog, 'id' | 'timestamp'>) => {
    const newLog: ApiLog = {
      ...logData,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    
    setLogs(prev => [newLog, ...prev].slice(0, 100)); // Keep only last 100 logs
  };

  const updateLog = (id: string, updates: Partial<ApiLog>) => {
    setLogs(prev => prev.map(log => 
      log.id === id ? { ...log, ...updates } : log
    ));
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const updateCurrentState = (key: string, value: any) => {
    setCurrentState(prev => ({ ...prev, [key]: value }));
  };

  const errors = logs.filter(log => log.error || (log.status && log.status >= 400));

  return (
    <ApiLogContext.Provider value={{
      logs,
      errors,
      currentState,
      addLog,
      updateLog,
      clearLogs,
      updateCurrentState,
    }}>
      {children}
    </ApiLogContext.Provider>
  );
};