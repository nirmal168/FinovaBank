import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ThemeSelector from '../../components/ThemeSelector';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Camera,
  Trash2,
  Lock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Shield,
  Key,
  Clock,
  Check,
  Palette,
} from 'lucide-react';

const Profile = () => {
  const { user, updateProfile, changePassword, refreshUser } = useAuth();
  const fileInputRef = useRef(null);

  // Active section tab: 'personal' | 'address' | 'security'
  const [activeTab, setActiveTab] = useState('personal');

  // Form states
  const [personalForm, setPersonalForm] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
  });

  const [addressForm, setAddressForm] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarError, setAvatarError] = useState('');

  // Status feedback states
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // RBAC Test state
  const [adminTestResult, setAdminTestResult] = useState(null);
  const [adminTestLoading, setAdminTestLoading] = useState(false);

  // Synchronize state when user changes
  useEffect(() => {
    if (user) {
      setPersonalForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.substring(0, 10) : '',
      });

      setAddressForm({
        street: user.address?.street || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        postalCode: user.address?.postalCode || '',
        country: user.address?.country || '',
      });

      setAvatarPreview(user.profileImage || '');
    }
  }, [user]);

  // Handle Profile Image Selection
  const handleImageChange = (e) => {
    setAvatarError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please upload an image file (PNG, JPG, WebP).');
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Profile photo must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result);
    };
    reader.onerror = () => {
      setAvatarError('Error reading file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle Personal Details & Address Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    // Frontend validation
    if (!personalForm.name.trim()) {
      setProfileError('Name is required.');
      return;
    }
    if (!personalForm.phone.trim()) {
      setProfileError('Phone number is required.');
      return;
    }

    setIsSavingProfile(true);

    const payload = {
      name: personalForm.name.trim(),
      phone: personalForm.phone.trim(),
      dateOfBirth: personalForm.dateOfBirth || null,
      address: addressForm,
      profileImage: avatarPreview,
    };

    const result = await updateProfile(payload);
    setIsSavingProfile(false);

    if (result.success) {
      setProfileSuccess('Profile details saved successfully!');
      refreshUser();
      setTimeout(() => setProfileSuccess(''), 4000);
    } else {
      setProfileError(result.error || 'Failed to save profile.');
    }
  };

  // Handle Password Change Save
  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    // Frontend validation
    if (!passwordForm.currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (!passwordForm.newPassword) {
      setPasswordError('Please enter a new password.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError('New password must be different from current password.');
      return;
    }

    setIsSavingPassword(true);
    const result = await changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
    setIsSavingPassword(false);

    if (result.success) {
      setPasswordSuccess(result.message || 'Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(''), 4000);
    } else {
      setPasswordError(result.error || 'Failed to change password.');
    }
  };

  // RBAC Test
  const handleTestAdmin = async () => {
    setAdminTestLoading(true);
    setAdminTestResult(null);
    try {
      const data = await authService.testAdminAccess();
      setAdminTestResult({
        success: true,
        message: data.message,
      });
    } catch (err) {
      setAdminTestResult({
        success: false,
        message: err.message || 'Access Denied: 403 Forbidden',
      });
    } finally {
      setAdminTestLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            {/* Avatar with Upload Badge */}
            <div className="relative group">
              <div className="h-24 w-24 rounded-2xl overflow-hidden bg-brand-700/60 border-2 border-white/20 shadow-xl flex items-center justify-center text-white text-3xl font-extrabold select-none">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={user?.name || 'Profile'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                )}
              </div>

              {/* Upload trigger overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-xl bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                title="Upload Photo"
              >
                <Camera className="h-4 w-4" />
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* User Meta */}
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight">{user?.name}</h1>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    user?.role === 'admin'
                      ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/40'
                      : 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{user?.role}</span>
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-1 flex items-center justify-center sm:justify-start gap-2">
                <span>{user?.email}</span>
                <span>•</span>
                <span>{user?.phone || 'No phone'}</span>
              </p>

              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="mt-2 text-[11px] text-rose-300 hover:text-rose-200 inline-flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Remove Avatar</span>
                </button>
              )}

              {avatarError && (
                <p className="text-xs text-rose-300 font-medium mt-1">{avatarError}</p>
              )}
            </div>
          </div>

          {/* Quick Account Health Chips */}
          <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-xs border border-white/10">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="font-semibold text-[11px]">
                {user?.isActive ? 'Account Active' : 'Account Disabled'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-xs border border-white/10">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-semibold text-[11px]">
                {user?.isVerified ? 'KYC Verified' : 'Unverified'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap border-b border-[var(--finova-border)] gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('personal')}
          className={`pb-3 px-4 text-xs font-bold transition-colors relative ${
            activeTab === 'personal'
              ? 'text-[var(--finova-primary)] border-b-2 border-[var(--finova-primary)]'
              : 'text-[var(--finova-text-secondary)] hover:text-[var(--finova-text-heading)]'
          }`}
        >
          Personal & Contact Details
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('address')}
          className={`pb-3 px-4 text-xs font-bold transition-colors relative ${
            activeTab === 'address'
              ? 'text-[var(--finova-primary)] border-b-2 border-[var(--finova-primary)]'
              : 'text-[var(--finova-text-secondary)] hover:text-[var(--finova-text-heading)]'
          }`}
        >
          Residential Address
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`pb-3 px-4 text-xs font-bold transition-colors relative ${
            activeTab === 'security'
              ? 'text-[var(--finova-primary)] border-b-2 border-[var(--finova-primary)]'
              : 'text-[var(--finova-text-secondary)] hover:text-[var(--finova-text-heading)]'
          }`}
        >
          Security & Password
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('appearance')}
          className={`pb-3 px-4 text-xs font-bold transition-colors relative flex items-center gap-1.5 ${
            activeTab === 'appearance'
              ? 'text-[var(--finova-primary)] border-b-2 border-[var(--finova-primary)]'
              : 'text-[var(--finova-text-secondary)] hover:text-[var(--finova-text-heading)]'
          }`}
        >
          <Palette className="h-3.5 w-3.5" />
          <span>Appearance & Theme</span>
        </button>
      </div>

      {/* Main Grid: Form Content + Account Status Sidepanel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Tabbed Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* TAB 1: Personal Details */}
          {activeTab === 'personal' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personal Information</CardTitle>
                <CardDescription>
                  Update your identity information registered with Finova
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileSuccess && (
                  <div className="flex items-center gap-2.5 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                {profileError && (
                  <div className="flex items-center gap-2.5 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                    <span>{profileError}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Legal Name"
                      name="name"
                      leftIcon={User}
                      value={personalForm.name}
                      onChange={(e) =>
                        setPersonalForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      required
                    />

                    <Input
                      label="Phone Number"
                      name="phone"
                      type="tel"
                      leftIcon={Phone}
                      value={personalForm.phone}
                      onChange={(e) =>
                        setPersonalForm((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Email Address"
                      name="email"
                      type="email"
                      leftIcon={Mail}
                      value={personalForm.email}
                      disabled
                      helperText="Verified banking identity email. Cannot be modified."
                    />

                    <Input
                      label="Date of Birth"
                      name="dateOfBirth"
                      type="date"
                      leftIcon={Calendar}
                      value={personalForm.dateOfBirth}
                      onChange={(e) =>
                        setPersonalForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))
                      }
                      helperText="Required for statutory compliance & KYC."
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      isLoading={isSavingProfile}
                    >
                      Save Personal Details
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* TAB 2: Address Details */}
          {activeTab === 'address' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Billing & Residential Address</CardTitle>
                <CardDescription>
                  Your physical address on file for card delivery and statement notices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileSuccess && (
                  <div className="flex items-center gap-2.5 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                {profileError && (
                  <div className="flex items-center gap-2.5 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                    <span>{profileError}</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <Input
                    label="Street Address"
                    name="street"
                    placeholder="123 Financial Way, Suite 400"
                    leftIcon={MapPin}
                    value={addressForm.street}
                    onChange={(e) =>
                      setAddressForm((prev) => ({ ...prev, street: e.target.value }))
                    }
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="City"
                      name="city"
                      placeholder="New York"
                      value={addressForm.city}
                      onChange={(e) =>
                        setAddressForm((prev) => ({ ...prev, city: e.target.value }))
                      }
                    />

                    <Input
                      label="State / Province"
                      name="state"
                      placeholder="NY"
                      value={addressForm.state}
                      onChange={(e) =>
                        setAddressForm((prev) => ({ ...prev, state: e.target.value }))
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Postal / ZIP Code"
                      name="postalCode"
                      placeholder="10001"
                      value={addressForm.postalCode}
                      onChange={(e) =>
                        setAddressForm((prev) => ({ ...prev, postalCode: e.target.value }))
                      }
                    />

                    <Input
                      label="Country"
                      name="country"
                      placeholder="United States"
                      value={addressForm.country}
                      onChange={(e) =>
                        setAddressForm((prev) => ({ ...prev, country: e.target.value }))
                      }
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      isLoading={isSavingProfile}
                    >
                      Save Address Details
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* TAB 3: Security & Password */}
          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Change Password</CardTitle>
                <CardDescription>
                  Ensure your account is protected with a strong, unique password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {passwordSuccess && (
                  <div className="flex items-center gap-2.5 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {passwordError && (
                  <div className="flex items-center gap-2.5 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handleSavePassword} className="space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    placeholder="••••••••"
                    leftIcon={Lock}
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="New Password"
                      type="password"
                      placeholder="••••••••"
                      leftIcon={Lock}
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      helperText="Minimum 6 characters with mixed characters."
                      required
                    />

                    <Input
                      label="Confirm New Password"
                      type="password"
                      placeholder="••••••••"
                      leftIcon={Lock}
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      isLoading={isSavingPassword}
                    >
                      Update Password
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* TAB 4: Appearance & Theme */}
          {activeTab === 'appearance' && (
            <Card>
              <CardContent className="p-6">
                <ThemeSelector />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right 1 Col: Account Status & Security Card */}
        <div className="space-y-6">
          {/* Account Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Account Status & KYC</CardTitle>
              <CardDescription>Official verification status and audit info</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Account Role</span>
                <span className="font-bold capitalize text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                  {user?.role}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Operational Status</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                  <Check className="h-3.5 w-3.5" />
                  <span>Active & In Good Standing</span>
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">KYC Verification</span>
                <span className="inline-flex items-center gap-1 font-bold text-brand-600">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Tier 1 Verified</span>
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Member Since</span>
                <span className="text-slate-700 font-medium">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-500">Last Profile Update</span>
                <span className="text-slate-700 font-medium">
                  {user?.updatedAt ? new Date(user.updatedAt).toLocaleTimeString() : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Role Authorization Test Widget */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Role Authorization Test</CardTitle>
              <CardDescription>
                Verify backend protected RBAC access control
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Test your current session permissions against <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">GET /api/auth/admin-test</code>:
              </p>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                icon={Key}
                onClick={handleTestAdmin}
                isLoading={adminTestLoading}
              >
                Run Authorization Probe
              </Button>

              {adminTestResult && (
                <div
                  className={`p-3 rounded-lg border text-xs ${
                    adminTestResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <p className="font-bold">
                    {adminTestResult.success ? '200 OK — Authorized' : '403 Forbidden — Blocked'}
                  </p>
                  <p className="mt-1 text-[11px]">{adminTestResult.message}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
