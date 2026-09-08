import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card, { CardContent } from '../../components/ui/Card';
import { User, Mail, Phone, Lock, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import finovaLogo from '../../assets/finova-logo.png';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'customer',
  });
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    const result = await register({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      role: formData.role,
    });
    setIsLoading(false);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setFormError(result.error || 'Registration failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 relative">
      <div className="w-full max-w-md space-y-6">
        {/* Navigation back to landing page */}
        <div className="flex justify-between items-center px-1">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Header Branding */}
        <div className="text-center">
          <Link to="/" className="inline-block group focus:outline-none">
            <img
              src={finovaLogo}
              alt="Finova"
              className="mx-auto h-24 sm:h-28 w-auto object-contain drop-shadow-sm transition-all duration-200 group-hover:scale-105"
            />
          </Link>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">
            Create your Finova account
          </h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Smart Banking. Smarter Future.
          </p>
        </div>

        {/* Form Card */}
        <Card className="shadow-lg border-slate-200/80">
          <CardContent className="p-6 sm:p-8 space-y-5">
            {formError && (
              <div className="flex items-center gap-2.5 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <Input
                label="Full Name"
                name="name"
                placeholder="Sarah Smith"
                leftIcon={User}
                value={formData.name}
                onChange={handleChange}
                required
              />

              <Input
                label="Email Address"
                name="email"
                type="email"
                placeholder="sarah@example.com"
                leftIcon={Mail}
                value={formData.email}
                onChange={handleChange}
                required
              />

              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                placeholder="+1 (555) 019-2834"
                leftIcon={Phone}
                value={formData.phone}
                onChange={handleChange}
                required
              />

              <Input
                label="Password (min 6 characters)"
                name="password"
                type="password"
                placeholder="••••••••"
                leftIcon={Lock}
                value={formData.password}
                onChange={handleChange}
                required
              />

              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                leftIcon={Lock}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />

              {/* Role selector for testing customer / admin */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-semibold text-slate-700">Account Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, role: 'customer' }))}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                      formData.role === 'customer'
                        ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Customer Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, role: 'admin' }))}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                      formData.role === 'admin'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Admin Account
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-3"
                isLoading={isLoading}
              >
                Create Account
              </Button>
            </form>

            <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-0.5"
              >
                <span>Sign in</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
