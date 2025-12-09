export const useAuth = () => ({
  user: null,
  loading: false,
  isAuthenticated: false,
  hasRole: () => false,
  hasPermission: () => false,
});
export default useAuth;




