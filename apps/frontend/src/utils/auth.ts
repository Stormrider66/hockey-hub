export const logout = () => {
  // Clear all auth tokens
  localStorage.removeItem('authToken');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  
  // Clear cookies
  document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  
  // Redirect to login
  window.location.href = '/login';
};

export const clearAuthTokens = () => {
  // Clear all possible auth tokens
  localStorage.clear();
  
  // Clear all cookies
  document.cookie.split(";").forEach((c) => {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
};