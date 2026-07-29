import { useState, useEffect } from 'react';
import { getAllowedUsers, createAllowedUser, deleteAllowedUser } from '../../api/allowedUsers';
import type { AllowedUser, UserCredentials } from '../../types';
import { Trash2, UserPlus, Copy, Check } from 'lucide-react';

const AllowedUsersManagement = () => {
  const [users, setUsers] = useState<AllowedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newCredentials, setNewCredentials] = useState<UserCredentials | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('TEACHER');
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getAllowedUsers();
      setUsers(data);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || 'Failed to fetch allowed users');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (value: string, field: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setAddLoading(true);
    setError('');
    setNewCredentials(null);

    try {
      const result = await createAllowedUser({ email, role });
      setEmail('');
      setNewCredentials(result.credentials);
      fetchUsers();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || 'Failed to add user');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke access for this user?')) return;

    try {
      await deleteAllowedUser(id);
      fetchUsers();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || 'Failed to delete user');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Loading users...</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Allowed Users (Whitelist)</h2>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {newCredentials && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            User created — copy this into the welcome email (Plan A: activation link only)
          </h3>
          <dl className="space-y-2 text-sm">
            {[
              ['Email', newCredentials.email, 'email'],
              ['Activation link', newCredentials.activationLink, 'activationLink'],
            ].map(([label, value, field]) => (
              <div key={field} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <dt className="font-medium text-blue-800 w-40 shrink-0">{label}</dt>
                <dd className="flex-1 font-mono text-blue-900 break-all">{value}</dd>
                <button
                  type="button"
                  onClick={() => handleCopy(String(value), field)}
                  className="inline-flex items-center text-blue-700 hover:text-blue-900 text-xs"
                  aria-label={`Copy ${label}`}
                >
                  {copiedField === field ? (
                    <Check className="w-4 h-4 mr-1" />
                  ) : (
                    <Copy className="w-4 h-4 mr-1" />
                  )}
                  {copiedField === field ? 'Copied' : 'Copy'}
                </button>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-md mb-8 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
          <UserPlus className="w-5 h-5 mr-2 text-blue-600" />
          Add New User to Whitelist
        </h3>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-grow">
            <input
              type="email"
              required
              placeholder="student@charusat.edu.in"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={addLoading}
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={addLoading}
            >
              <option value="TEACHER">Teacher</option>
              <option value="STUDENT">Student</option>
              <option value="COORDINATOR">Coordinator</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={addLoading}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {addLoading ? 'Adding...' : 'Add User'}
          </button>
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added On</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  No users found in whitelist.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${user.role === 'COORDINATOR' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'TEACHER' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                      title="Revoke Access"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllowedUsersManagement;
