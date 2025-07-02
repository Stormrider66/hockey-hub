export default function VerifyEmailLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-gray-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Loading email verification...</p>
      </div>
    </div>
  );
}