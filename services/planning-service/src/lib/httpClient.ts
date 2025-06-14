import axios from 'axios';
import axiosRetry from 'axios-retry';
import CircuitBreaker from 'opossum';

const baseURL = process.env.API_GATEWAY_URL || process.env.USER_SERVICE_URL || 'http://localhost:3001/api/v1';

const axiosInstance = axios.create({
  baseURL,
  timeout: 5000,
});

// Retry on network errors & 5xx
axiosRetry(axiosInstance, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

// Wrap request in circuit breaker
const breaker = new CircuitBreaker((config: any) => axiosInstance.request(config), {
  timeout: 6000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
});

export async function request(config: any) {
  return breaker.fire(config);
}

export default axiosInstance;
export { axiosInstance as client }; 