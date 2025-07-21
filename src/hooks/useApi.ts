import { useApiLog } from '../contexts/ApiLogContext';

const API_BASE_URL = 'http://localhost:3001';

export const useApi = () => {
  const { addLog, updateLog, updateCurrentState } = useApiLog();

  const loggedFetch = async (url: string, options: RequestInit = {}) => {
    const startTime = Date.now();
    const logId = Date.now().toString();
    
    // Log the request
    addLog({
      id: logId,
      method: options.method || 'GET',
      url,
      requestData: options.body ? JSON.parse(options.body as string) : null,
    });

    try {
      const response = await fetch(url, options);
      const duration = Date.now() - startTime;
      
      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.clone().json();
      } else {
        responseData = await response.clone().text();
      }

      // Update the log with response data
      updateLog(logId, {
        status: response.status,
        responseData,
        duration,
      });

      // Update current state based on the endpoint
      const endpoint = url.split('/').pop();
      if (endpoint && responseData) {
        updateCurrentState(endpoint, responseData);
      }

      if (!response.ok) {
        updateLog(logId, {
          error: `HTTP ${response.status}: ${response.statusText}`,
        });
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      updateLog(logId, {
        error: error instanceof Error ? error.message : 'Network error',
        duration,
      });
      throw error;
    }
  };

  return { loggedFetch };
};