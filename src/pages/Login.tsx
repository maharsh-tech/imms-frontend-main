export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">IMMS</h1>
        <p className="text-gray-600 mb-8">Internal Marks Management System</p>
        {/* Google OAuth button will be implemented in Epic 1.3 */}
        <button
          className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
          onClick={() => {
            // Will redirect to GET /auth/google
          }}
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
