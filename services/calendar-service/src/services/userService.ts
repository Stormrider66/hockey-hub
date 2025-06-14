// Stub for user existence validation until User-Service API is ready
export async function doesUserExist(userId: string): Promise<boolean> {
  // Replace with real HTTP call
  if (userId === '00000000-0000-0000-0000-000000000000') return false;
  return true;
} 