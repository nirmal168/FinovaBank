const Beneficiary = require('../models/Beneficiary');
const Account = require('../models/Account');

// @desc    Add a new beneficiary
// @route   POST /api/beneficiaries
// @access  Private (Bearer token)
const addBeneficiary = async (req, res, next) => {
  try {
    const { name, accountNumber, bankName, nickname } = req.body;

    const trimmedAccount = accountNumber?.trim();
    const trimmedName = name?.trim();

    if (!trimmedAccount || !trimmedName) {
      return res.status(400).json({
        success: false,
        message: 'Beneficiary name and account number are required.',
      });
    }

    // Validation: User cannot add their own account as a beneficiary
    const ownAccount = await Account.findOne({
      user: req.user._id,
      accountNumber: trimmedAccount,
    });

    if (ownAccount) {
      return res.status(400).json({
        success: false,
        message: 'Cannot add your own account as a beneficiary.',
      });
    }

    // Validation: Check if user already saved this account number
    const existingBeneficiary = await Beneficiary.findOne({
      user: req.user._id,
      accountNumber: trimmedAccount,
    });

    if (existingBeneficiary) {
      return res.status(400).json({
        success: false,
        message: 'A beneficiary with this account number already exists in your saved list.',
      });
    }

    const beneficiary = await Beneficiary.create({
      user: req.user._id,
      name: trimmedName,
      accountNumber: trimmedAccount,
      bankName: bankName?.trim() || 'SecureBank',
      nickname: nickname?.trim() || '',
      status: 'Active',
    });

    res.status(201).json({
      success: true,
      message: 'Beneficiary added successfully.',
      beneficiary,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's beneficiaries with search & filter
// @route   GET /api/beneficiaries
// @access  Private (Bearer token)
const getBeneficiaries = async (req, res, next) => {
  try {
    const { search, status } = req.query;

    const query = { user: req.user._id };

    if (status && status.toUpperCase() !== 'ALL') {
      const normalizedStatus = status.toLowerCase() === 'active' ? 'Active' : 'Inactive';
      query.status = normalizedStatus;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { nickname: searchRegex },
        { accountNumber: searchRegex },
        { bankName: searchRegex },
      ];
    }

    const beneficiaries = await Beneficiary.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: beneficiaries.length,
      beneficiaries,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update beneficiary details or status
// @route   PUT /api/beneficiaries/:id
// @access  Private (Bearer token)
const updateBeneficiary = async (req, res, next) => {
  try {
    const { name, nickname, bankName, accountNumber, status } = req.body;

    const beneficiary = await Beneficiary.findById(req.params.id);

    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        message: 'Beneficiary not found.',
      });
    }

    // Ownership check
    if (
      beneficiary.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to modify this beneficiary.',
      });
    }

    // If updating account number, check for self account and duplicates
    if (accountNumber && accountNumber.trim() !== beneficiary.accountNumber) {
      const trimmedAccount = accountNumber.trim();

      const ownAccount = await Account.findOne({
        user: req.user._id,
        accountNumber: trimmedAccount,
      });

      if (ownAccount) {
        return res.status(400).json({
          success: false,
          message: 'Cannot use your own account as a beneficiary.',
        });
      }

      const duplicate = await Beneficiary.findOne({
        user: req.user._id,
        accountNumber: trimmedAccount,
        _id: { $ne: beneficiary._id },
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Another beneficiary with this account number already exists.',
        });
      }

      beneficiary.accountNumber = trimmedAccount;
    }

    if (name !== undefined) beneficiary.name = name.trim();
    if (nickname !== undefined) beneficiary.nickname = nickname.trim();
    if (bankName !== undefined) beneficiary.bankName = bankName.trim() || 'SecureBank';

    if (status !== undefined) {
      const validStatuses = ['Active', 'Inactive'];
      const matched = validStatuses.find(
        (s) => s.toLowerCase() === status.toLowerCase()
      );
      if (matched) {
        beneficiary.status = matched;
      }
    }

    await beneficiary.save();

    res.status(200).json({
      success: true,
      message: 'Beneficiary updated successfully.',
      beneficiary,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete beneficiary
// @route   DELETE /api/beneficiaries/:id
// @access  Private (Bearer token)
const deleteBeneficiary = async (req, res, next) => {
  try {
    const beneficiary = await Beneficiary.findById(req.params.id);

    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        message: 'Beneficiary not found.',
      });
    }

    // Ownership check
    if (
      beneficiary.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to delete this beneficiary.',
      });
    }

    await beneficiary.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Beneficiary deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addBeneficiary,
  getBeneficiaries,
  updateBeneficiary,
  deleteBeneficiary,
};
