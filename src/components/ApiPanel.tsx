import React, { useState } from 'react';
import { useApiLog } from '../contexts/ApiLogContext';
import { X, Activity, AlertTriangle, Database, ChevronRight, ChevronDown } from 'lucide-react';

interface ApiPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiPanel: React.FC<ApiPanelProps> = ({ isOpen, onClose }) => {
  const { logs, errors, currentState, clearLogs } = useApiLog();
  const [activeTab, setActiveTab] = useState<'logs' | 'errors' | 'state'>('logs');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  if (!isOpen) return null;

  const formatJson = (data: any) => {
    if (!data) return 'N/A';
    return JSON.stringify(data, null, 2);
  };

  const getStatusColor = (status?: number) => {
    if (!status) return 'text-gray-400';
    if (status >= 200 && status < 300) return 'text-green-400';
    if (status >= 400) return 'text-red-400';
    return 'text-yellow-400';
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black bg-opacity-50" onClick={onClose} />
      <div className="w-96 bg-dark-bg border-l border-dark-border flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-border">
          <h2 className="text-lg font-semibold text-white flex items-center">
            <Activity className="h-5 w-5 mr-2 text-accent-blue" />
            API Monitor
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-dark-hover rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-dark-border">
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'logs'
                ? 'text-accent-blue border-b-2 border-accent-blue'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Logs ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('errors')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'errors'
                ? 'text-accent-blue border-b-2 border-accent-blue'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="h-4 w-4 inline mr-1" />
            Erros ({errors.length})
          </button>
          <button
            onClick={() => setActiveTab('state')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'state'
                ? 'text-accent-blue border-b-2 border-accent-blue'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Database className="h-4 w-4 inline mr-1" />
            Estado
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'logs' && (
            <div className="p-4 space-y-2">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-400">Requisições recentes</span>
                <button
                  onClick={clearLogs}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Limpar
                </button>
              </div>
              {logs.map((log) => (
                <div key={log.id} className="bg-dark-card rounded-lg p-3 border border-dark-border">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleLogExpansion(log.id)}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-mono px-2 py-1 rounded ${
                        log.method === 'GET' ? 'bg-green-900 text-green-300' :
                        log.method === 'POST' ? 'bg-blue-900 text-blue-300' :
                        log.method === 'PUT' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-red-900 text-red-300'
                      }`}>
                        {log.method}
                      </span>
                      <span className="text-sm text-white truncate">{log.url.split('/').pop()}</span>
                      {log.status && (
                        <span className={`text-xs ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      )}
                    </div>
                    {expandedLogs.has(log.id) ? (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  
                  {expandedLogs.has(log.id) && (
                    <div className="mt-3 space-y-2 text-xs">
                      <div>
                        <span className="text-gray-400">URL:</span>
                        <span className="text-white ml-2 font-mono">{log.url}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Tempo:</span>
                        <span className="text-white ml-2">{log.timestamp.toLocaleTimeString()}</span>
                      </div>
                      {log.duration && (
                        <div>
                          <span className="text-gray-400">Duração:</span>
                          <span className="text-white ml-2">{log.duration}ms</span>
                        </div>
                      )}
                      {log.requestData && (
                        <div>
                          <span className="text-gray-400">Request:</span>
                          <pre className="text-green-300 mt-1 p-2 bg-dark-bg rounded text-xs overflow-x-auto">
                            {formatJson(log.requestData)}
                          </pre>
                        </div>
                      )}
                      {log.responseData && (
                        <div>
                          <span className="text-gray-400">Response:</span>
                          <pre className="text-blue-300 mt-1 p-2 bg-dark-bg rounded text-xs overflow-x-auto">
                            {formatJson(log.responseData)}
                          </pre>
                        </div>
                      )}
                      {log.error && (
                        <div>
                          <span className="text-gray-400">Erro:</span>
                          <span className="text-red-400 ml-2">{log.error}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  Nenhuma requisição registrada
                </div>
              )}
            </div>
          )}

          {activeTab === 'errors' && (
            <div className="p-4 space-y-2">
              {errors.map((error) => (
                <div key={error.id} className="bg-red-900 bg-opacity-20 border border-red-800 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <span className="text-sm font-medium text-red-300">
                      {error.method} {error.url.split('/').pop()}
                    </span>
                    {error.status && (
                      <span className="text-xs text-red-400">{error.status}</span>
                    )}
                  </div>
                  <p className="text-xs text-red-200">{error.error}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {error.timestamp.toLocaleString()}
                  </p>
                </div>
              ))}
              {errors.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Nenhum erro registrado
                </div>
              )}
            </div>
          )}

          {activeTab === 'state' && (
            <div className="p-4">
              <div className="space-y-4">
                {Object.entries(currentState).map(([key, value]) => (
                  <div key={key} className="bg-dark-card rounded-lg p-3 border border-dark-border">
                    <h3 className="text-sm font-medium text-white mb-2 capitalize">{key}</h3>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      {formatJson(value)}
                    </pre>
                  </div>
                ))}
                {Object.keys(currentState).length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Nenhum estado registrado
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};