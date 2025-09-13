import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Building2, Crown, User } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getPlanBadgeColor = (plan: string) => {
    return plan === 'pro' 
      ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
      : 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'admin' 
      ? 'bg-purple-100 text-purple-800 border-purple-300'
      : 'bg-blue-100 text-blue-800 border-blue-300';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Building2 className="h-8 w-8 text-primary-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {user.tenant.name} Notes
                  </h1>
                  <div className="flex items-center space-x-2">
                    <span 
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getPlanBadgeColor(user.tenant.subscription.plan)}`}
                    >
                      {user.tenant.subscription.plan === 'pro' && <Crown className="h-3 w-3 mr-1" />}
                      {user.tenant.subscription.plan.toUpperCase()}
                    </span>
                    <span 
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getRoleBadgeColor(user.role)}`}
                    >
                      {user.role === 'admin' ? <Crown className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
                      {user.role.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{user.email}</div>
                <div className="text-xs text-gray-500">{user.tenant.slug}</div>
              </div>
              
              <button
                onClick={logout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;