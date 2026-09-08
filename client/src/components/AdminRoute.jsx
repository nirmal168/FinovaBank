import React from 'react';
import { Navigate, useLocation, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './ui/Loader';
import Card, { CardContent, CardTitle, CardDescription } from './ui/Card';
import Button from './ui/Button';
import { ShieldAlert } from 'lucide-react';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <Loader size="lg" label="Verifying security permissions..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-6 border-rose-200 shadow-md">
          <CardContent className="space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-900">Access Denied</CardTitle>
              <CardDescription className="mt-1 text-slate-600">
                Administrative privileges are required to view this portal. Your account does not have the 'admin' role.
              </CardDescription>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <Link to="/">
                <Button variant="primary" size="sm">
                  Return to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return children ? children : <Outlet />;
};

export default AdminRoute;
