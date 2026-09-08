const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { createNotification } = require('../utils/notificationService');
const otpService = require('../services/otpService');
const { logAuditEvent } = require('../utils/auditLogger');

// @desc    Register a new user (Customer or Admin)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    // Default role is customer; allow admin if specified (useful for initial admin setup/testing)
    const assignedRole = role === 'admin' ? 'admin' : 'customer';

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password,
      role: assignedRole,
      isVerified: true,
      isActive: true,
    });

    const token = generateToken(user._id, user.role);

    // Set secure HTTP-only cookie
    const cookieOptions = {
      httpOnly: true,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    };
    res.cookie('token', token, cookieOptions);

    // Audit registration
    await logAuditEvent({
      req,
      user: user._id,
      action: 'USER_REGISTER',
      entity: 'User',
      entityId: user._id,
      metadata: { name: user.name, email: user.email, role: user.role },
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Fetch user with password explicitly included
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user._id, user.role);

    // Set secure HTTP-only cookie
    const cookieOptions = {
      httpOnly: true,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    };
    res.cookie('token', token, cookieOptions);

    // Automatically trigger LOGIN notification
    await createNotification({
      user: user._id,
      title: 'Security Notice: New Sign In',
      message: `Successful login detected from IP ${req.ip || 'local'} at ${new Date().toLocaleTimeString()}.`,
      type: 'LOGIN',
    });

    // Audit login
    await logAuditEvent({
      req,
      user: user._id,
      action: 'USER_LOGIN',
      entity: 'Auth',
      entityId: user._id,
      metadata: { email: user.email, role: user.role },
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / invalidate session client-side
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res) => {
  res.cookie('token', 'none', {
    httpOnly: true,
    expires: new Date(Date.now() + 5 * 1000),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  await logAuditEvent({
    req,
    user: req.user?._id,
    action: 'USER_LOGOUT',
    entity: 'Auth',
    metadata: { email: req.user?.email || 'unauthenticated' },
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully.',
  });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private (Bearer token)
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      isVerified: req.user.isVerified,
      isActive: req.user.isActive,
      dateOfBirth: req.user.dateOfBirth || null,
      address: req.user.address || {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
      profileImage: req.user.profileImage || '',
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt,
    },
  });
};

// @desc    Update user profile (Users can only modify their own profile)
// @route   PUT /api/auth/profile
// @access  Private (Bearer token)
const updateProfile = async (req, res, next) => {
  try {
    // Strictly retrieve currently authenticated user from req.user._id
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const { name, phone, dateOfBirth, address, profileImage } = req.body;

    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;

    if (address && typeof address === 'object') {
      user.address = {
        street: address.street !== undefined ? address.street.trim() : user.address?.street || '',
        city: address.city !== undefined ? address.city.trim() : user.address?.city || '',
        state: address.state !== undefined ? address.state.trim() : user.address?.state || '',
        postalCode: address.postalCode !== undefined ? address.postalCode.trim() : user.address?.postalCode || '',
        country: address.country !== undefined ? address.country.trim() : user.address?.country || '',
      };
    }

    if (profileImage !== undefined) {
      // Validate image length if base64 (prevent exceeding mongo 16MB document limit; max 2.5MB payload)
      if (profileImage && profileImage.length > 3 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'Profile image must be smaller than 2MB.',
        });
      }
      user.profileImage = profileImage;
    }

    const updatedUser = await user.save();

    await logAuditEvent({
      req,
      user: user._id,
      action: 'PROFILE_UPDATE',
      entity: 'User',
      entityId: user._id,
      metadata: {
        updatedFields: Object.keys(req.body).filter((k) => req.body[k] !== undefined),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        isVerified: updatedUser.isVerified,
        isActive: updatedUser.isActive,
        dateOfBirth: updatedUser.dateOfBirth,
        address: updatedUser.address,
        profileImage: updatedUser.profileImage,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password for authenticated user
// @route   PUT /api/auth/change-password
// @access  Private (Bearer token)
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current password and new password.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    // Find user with password included
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password.',
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be the same as your current password.',
      });
    }

    user.password = newPassword;
    await user.save();

    await logAuditEvent({
      req,
      user: user._id,
      action: 'PASSWORD_CHANGE',
      entity: 'User',
      entityId: user._id,
      metadata: { method: 'AUTHENTICATED_CHANGE' },
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request password reset token
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account with that email address exists.',
      });
    }

    // Dispatch 6-digit OTP for password reset
    const otpResult = await otpService.sendOtp({
      user: user._id,
      email: user.email,
      purpose: 'PASSWORD_RESET',
      metadata: { userId: user._id },
    });

    // Generate random 32-byte hex reset token (for link-based fallback)
    const rawResetToken = crypto.randomBytes(32).toString('hex');

    // Hash token to store in database
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(rawResetToken)
      .digest('hex');

    // Set expiry to 1 hour
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Password reset instructions and 6-digit OTP dispatched to your email.',
      resetToken: rawResetToken, // Legacy token fallback
      expiresIn: '5 minutes for OTP / 1 hour for link',
      cooldown: otpResult.cooldown,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using token OR 6-digit OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { token, otp, email, newPassword } = req.body;

    if ((!token && (!otp || !email)) || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either reset token or email with 6-digit OTP, along with new password.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    let user = null;

    // Verify via 6-digit OTP if provided
    if (otp && email) {
      const verification = await otpService.verifyOtp({
        email,
        otp,
        purpose: 'PASSWORD_RESET',
      });

      if (!verification.valid) {
        return res.status(400).json({
          success: false,
          message: verification.message,
          remainingAttempts: verification.remainingAttempts,
        });
      }

      user = await User.findOne({ email: email.toLowerCase().trim() });
    } else if (token) {
      // Hash token from request to compare with stored hash
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
      });
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset code or token is invalid or has expired.',
      });
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    await createNotification({
      user: user._id,
      title: 'Security Alert: Password Changed',
      message: `Your account password was reset successfully on ${new Date().toLocaleDateString()}.`,
      type: 'LOGIN',
    });

    await logAuditEvent({
      req,
      user: user._id,
      action: 'PASSWORD_CHANGE',
      entity: 'User',
      entityId: user._id,
      metadata: { method: 'PASSWORD_RESET' },
    });

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
