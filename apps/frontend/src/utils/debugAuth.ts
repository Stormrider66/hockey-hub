// Debug utility for authentication issues

export function debugAuthState() {
  console.log('🔍 === AUTH DEBUG INFO ===');
  
  // Check all possible auth tokens
  console.log('📦 LocalStorage:');
  console.log('  - access_token:', localStorage.getItem('access_token') ? '✅ Present' : '❌ Missing');
  console.log('  - authToken:', localStorage.getItem('authToken') ? '✅ Present' : '❌ Missing');
  console.log('  - user_data:', localStorage.getItem('user_data') ? '✅ Present' : '❌ Missing');
  console.log('  - token_expiry:', localStorage.getItem('token_expiry') ? '✅ Present' : '❌ Missing');
  console.log('  - mock_user_role:', localStorage.getItem('mock_user_role') || 'Not set');
  console.log('  - current_user_id:', localStorage.getItem('current_user_id') || 'Not set');
  
  console.log('\n📦 SessionStorage:');
  console.log('  - user_data:', sessionStorage.getItem('user_data') ? '✅ Present' : '❌ Missing');
  console.log('  - token_expiry:', sessionStorage.getItem('token_expiry') ? '✅ Present' : '❌ Missing');
  
  console.log('\n🔧 Environment:');
  console.log('  - Mock Auth Enabled:', process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH);
  
  // Parse user data if available
  const userData = localStorage.getItem('user_data') || sessionStorage.getItem('user_data');
  if (userData) {
    try {
      const user = JSON.parse(userData);
      console.log('\n👤 User Info:');
      console.log('  - Email:', user.email);
      console.log('  - Role:', user.role?.name);
      console.log('  - ID:', user.id);
    } catch (e) {
      console.error('❌ Failed to parse user data:', e);
    }
  }
  
  console.log('\n💡 Quick Fix Commands:');
  console.log('  - Clear all auth: localStorage.clear(); sessionStorage.clear(); location.reload();');
  console.log('  - Force login page: localStorage.clear(); window.location.href = "/login";');
  console.log('======================');
}

// Auto-run in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debugAuth = debugAuthState;
  console.log('💡 Type "debugAuth()" in console to check auth state');
}