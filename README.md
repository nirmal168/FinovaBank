# 🏦 Finova Bank — Smart Banking. Smarter Future.

[![Live Backend](https://img.shields.io/badge/Backend%20API-Live%20on%20Render-46E3B7.svg?style=for-the-badge&logo=render)](https://finovabank.onrender.com/api/health)
[![Vercel Deployment](https://img.shields.io/badge/Frontend-Vercel%20Deployed-000000.svg?style=for-the-badge&logo=vercel)](https://finovabank.vercel.app)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF.svg?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas-47A248.svg?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/atlas)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-010101.svg?style=for-the-badge&logo=socket.io)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg?style=for-the-badge)](LICENSE)

---

## 🌐 Live Deployments & Health Check

* **Live Web Application (Vercel)**: [https://finovabank.vercel.app](https://finovabank.vercel.app)
* **Live Production API (Render)**: [https://finovabank.onrender.com](https://finovabank.onrender.com)
* **API Health & Diagnostics**: [https://finovabank.onrender.com/api/health](https://finovabank.onrender.com/api/health)

---

## 📑 Table of Contents
1. [Project Overview](#-project-overview)
2. [Key Architecture & Design Philosophy](#-key-architecture--design-philosophy)
3. [Feature Highlights](#-feature-highlights)
   - [Customer Banking Portal](#1-customer-banking-portal)
   - [Deposit & Withdrawal Management (New)](#2-deposit--withdrawal-management-module)
   - [Admin Command Center](#3-administrator-command-center)
   - [Security & Compliance](#4-security--compliance-framework)
4. [Currency & Theming Engine](#-currency--theming-engine)
5. [Complete Project Structure](#-complete-project-structure)
6. [REST API Documentation](#-rest-api-documentation)
7. [Local Development & Quick Start](#-local-development--quick-start)
8. [Demo Credentials](#-demo-credentials)
9. [Automated Testing Suite](#-automated-testing-suite)
10. [Cloud Deployment Architecture](#-cloud-deployment-architecture)

---

## 🏦 Project Overview

**Finova Bank** is an enterprise-grade digital banking web application built with the **MERN** stack (MongoDB Atlas, Express.js, React 18, Node.js). It delivers a bank-grade retail banking simulation featuring:
- Strict **Role-Based Access Control (RBAC)** distinguishing Customers and System Administrators.
- Institutional **Deposit & Withdrawal Management** with complete authorization workflows.
- Centralized **Account Balance Protection** preventing any direct client-side balance manipulation.
- Atomic MongoDB transactions with standalone fallback support.
- Hybrid **Fraud Intelligence & Real-Time Security Alerts** via WebSocket (Socket.IO).
- Full **Indian Rupee (INR / ₹)** localization adhering to the `en-IN` numbering system.
- Adaptive multi-theme engine supporting **Light**, **Dark**, and OLED **Night** modes.

---

## 🛡️ Key Architecture & Design Philosophy

### The Core Accounting Rule
> [!IMPORTANT]
> **Customers can NEVER directly mutate account balances.**
> All balance modifications occur strictly through backend transaction services (`accountBalanceService.js`) after explicit administrator review and verification.

```
┌─────────────────────────┐
│     CUSTOMER PORTAL     │
└────────────┬────────────┘
             │ 1. Submits Request (Account, Amount, Reason)
             ▼
┌─────────────────────────┐
│     PENDING STATUS      │  ← Customer balance remains UNTOUCHED
└────────────┬────────────┘
             │ 2. Real-time alert dispatched to Admin Console
             ▼
┌─────────────────────────┐
│     ADMIN DASHBOARD     │
└────────────┬────────────┘
             │ 3. Admin verifies customer identity & account status
             ├── Approved ──┐
             │              ▼
             │   ┌────────────────────────────────────────┐
             │   │    BACKEND ATOMIC TRANSACTION          │
             │   │    • Atomic findOneAndUpdate check     │
             │   │    • Re-checks available balance       │
             │   │    • Gated balance update (Credit/Debit)│
             │   │    • Immutable Transaction generated   │
             │   │    • Request marked APPROVED           │
             │   │    • In-app Socket notification sent   │
             │   │    • Nodemailer branded email sent     │
             │   │    • Institutional AuditLog recorded   │
             │   └────────────────────────────────────────┘
             └── Rejected ──┐
                            ▼
                 ┌────────────────────────────────────────┐
                 │    REQUEST REJECTED                    │
                 │    • Balance remains untouched         │
                 │    • Admin note / justification stored │
                 │    • Customer notified with remarks    │
                 │    • Institutional AuditLog recorded   │
                 └────────────────────────────────────────┘
```

---

## 🌟 Feature Highlights

### 1. Customer Banking Portal
* **Live Financial Dashboard**: Primary accounts overview, real-time total balance, monthly income/expense metrics, Recharts cashflow visualization, and quick actions.
* **Pending Request Tracker**: Real-time widget highlighting all cash deposit and withdrawal requests currently awaiting administrative review.
* **Account Portfolio**: Manage Savings and Current accounts with 12-digit masked account numbers, transaction limits, and status badges.
* **P2P Fund Transfers**: Transfer funds between accounts with instant counterparty lookup, balance verification, and daily limit enforcement.
* **Beneficiary Address Book**: Add and manage frequent counterparties for rapid 1-click fund transfers.
* **Virtual Debit Cards**: Provision Visa Platinum and Mastercard World debit cards with 16-digit card masking, CVV generation, daily limits, and freeze/unfreeze controls.
* **Loan Center**: Self-service loan application (Personal, Education, Vehicle, Home) with dynamic tenure selector and real-time EMI calculation.
* **Cheque & Passbook Requests**: Request physical cheque books (20, 25, 50, 100 leaves) and passbook re-issuance with delivery tracking.
* **Official Bank Statements**: Filterable transaction statement export with running balance and period summaries.
* **Profile & Security**: Manage authentication preferences, view customer ID, and update security credentials.

---

### 2. Deposit & Withdrawal Management Module
* **Customer Deposit Requests (`/deposit`)**:
  - Select active bank account.
  - Enter deposit amount with live formatted INR preview (`₹25,000.00`).
  - Provide deposit reason/description.
  - Immediate generation of institutional ticket (`FIN-REQ-XXXXX`).
  - Account balance remains untouched until approval.
* **Customer Withdrawal Requests (`/withdraw`)**:
  - Live available balance verification at submission time.
  - Real-time projected balance calculation.
  - Prevents submissions exceeding current account funds.
* **Request History (`/deposit-withdrawal-requests`)**:
  - Filterable table displaying Request ID, Type, Account, Amount, Status, Requested Date, Processed Date, and Admin Notes.
  - Allows customers to cancel their own `PENDING` requests.
* **Double-Approval Protection**:
  - Backend concurrency locks guarantee that a request cannot be processed or approved twice.
  - Re-checks available balance at approval time to prevent overdrafts.

---

### 3. Administrator Command Center
* **Executive Dashboard (`/admin`)**:
  - Macro-level banking statistics: total customers, accounts, deposits, withdrawals, transfers, loan liabilities, and suspicious activity.
  - Quick action banner for **Review Requests** with pending counters.
* **Deposit & Withdrawal Management (`/admin/deposit-withdrawal`)**:
  - 6 KPI summary cards: Pending Deposits, Pending Withdrawals, Approved Today, Rejected Today, Total Deposits, Total Withdrawals (all formatted in INR).
  - Multi-parameter filtering: Type (All, Deposit, Withdrawal), Status (All, Pending, Approved, Rejected, Cancelled), Date Range (Today, Week, Month, Custom), Search (Customer name, Customer ID, Request ID, Account).
  - One-click approval and rejection modals with balance previews.
* **Request Audit Ledger (`/admin/deposit-withdrawal/:id`)**:
  - Complete verification view: customer profile, KYC details, masked account number, current live balance, customer reason, and admin processing note.
* **Customer Management (`/admin/customers`)**:
  - Full customer roster with customer ID, search, profile details, password reset trigger, and freeze/activate toggles.
* **Bank Accounts Control (`/admin/accounts`)**:
  - Freeze, unfreeze, and close accounts.
* **Debit Card Issuance (`/admin/cards`)**:
  - Issue branded debit cards with custom daily spending limits.
* **Cheque & Passbook Issuance (`/admin/service-requests`)**:
  - Review cheque book leaves requests and dispatch passbooks.
* **Loan Underwriting (`/admin/loans`)**:
  - Approve or reject loan applications with administrative underwriting remarks.
* **Fraud Intelligence & AML (`/admin/fraud-alerts`)**:
  - Real-time monitoring of suspicious high-value transfers, abnormal velocities, and high risk scores.
* **System Audit Logs (`/admin/audit-logs`)**:
  - Immutable chronological audit trail of all institutional decisions, logins, and approvals.

---

### 4. Security & Compliance Framework
* **Strict RBAC**: Route-level and controller-level authorization ensuring customers receive `403 Forbidden` if attempting to reach admin APIs.
* **IDOR Prevention**: Customer requests strictly resolve `req.user._id` from validated JWTs; frontend-supplied `userId` fields are discarded.
* **Atomic Ledger Updates**: Powered by MongoDB sessions with automated fallback for standalone MongoDB deployments.
* **Input Sanitization**: Recursive NoSQL injection protection and XSS payload cleanup.
* **Rate Limiting**: Targeted rate limiters on authentication, fund transfers, and sensitive operations.
* **Security Headers**: Configured with Helmet for CSP, HSTS, X-Content-Type-Options, and Referrer-Policy.
* **Nodemailer SMTP Integration**: Automated branded HTML transaction and decision emails via Mailtrap sandbox with graceful non-blocking execution.

---

## 🇮🇳 Currency & Theming Engine

### Indian Rupee (INR / ₹) Standardization
* Monetary amounts are stored internally as clean numeric types (e.g. `25000`).
* All user interfaces and emails render amounts using Indian numbering standards (`en-IN`):
  - `₹1,000.00`
  - `₹25,000.00`
  - `₹1,00,000.00`
  - `₹10,00,000.00`

### Multi-Theme Engine
Seamlessly switch between three themes with CSS variable bindings:
- **Light Theme**: Institutional crisp cream and navy palette (`#FCFBF8`, `#102A43`).
- **Dark Theme**: Low-strain slate and emerald tones for low-light environments.
- **Night Theme**: OLED pitch black (`#0B0F19`) for maximum contrast and battery preservation.

---

## 📁 Complete Project Structure

```bash
banking-system/
├── README.md                                # Project documentation
├── backend/                                 # Node.js & Express API server
│   ├── config/
│   │   ├── db.js                            # MongoDB Mongoose connection
│   │   └── mail.js                          # Nodemailer SMTP transporter
│   ├── controllers/
│   │   ├── accountController.js             # Accounts & balance lookups
│   │   ├── adminController.js               # Admin command center & telemetry
│   │   ├── authController.js                # JWT login, registration & reset
│   │   ├── beneficiaryController.js         # Counterparty management
│   │   ├── cardController.js                # Debit card issuance & controls
│   │   ├── depositWithdrawalController.js   # Deposit/Withdrawal request workflow
│   │   ├── loanController.js                # Loan applications & EMI calculations
│   │   ├── notificationController.js        # Notification inbox & reads
│   │   ├── otpController.js                 # 6-digit cryptographic OTP engine
│   │   ├── serviceRequestController.js      # Cheque book & passbook requests
│   │   └── transactionController.js         # Transfers & transaction statements
│   ├── middleware/
│   │   ├── adminMiddleware.js               # Role 'admin' access enforcement
│   │   ├── authMiddleware.js                # Bearer JWT & cookie verification
│   │   ├── errorMiddleware.js               # Centralized 404 & error handlers
│   │   ├── rateLimitMiddleware.js           # express-rate-limit definitions
│   │   └── sanitizationMiddleware.js        # NoSQL operator & XSS cleanup
│   ├── models/
│   │   ├── Account.js                       # Bank Account Mongoose schema
│   │   ├── AuditLog.js                      # Immutable audit log schema
│   │   ├── Beneficiary.js                   # Beneficiary counterparty schema
│   │   ├── Card.js                          # Virtual debit card schema
│   │   ├── DepositWithdrawalRequest.js      # Deposit/Withdrawal request schema
│   │   ├── EmailLog.js                      # Dispatched email audit schema
│   │   ├── FraudAlert.js                    # Flagged AML fraud alert schema
│   │   ├── Loan.js                          # Loan application & schedule schema
│   │   ├── Notification.js                  # In-app notification schema
│   │   ├── Otp.js                           # OTP token TTL schema
│   │   ├── ServiceRequest.js                # Cheque book & passbook schema
│   │   ├── Transaction.js                   # Ledger transaction record schema
│   │   └── User.js                          # User credentials & profile schema
│   ├── routes/
│   │   ├── accountRoutes.js                 # /api/accounts
│   │   ├── adminRoutes.js                   # /api/admin
│   │   ├── authRoutes.js                    # /api/auth
│   │   ├── beneficiaryRoutes.js             # /api/beneficiaries
│   │   ├── cardRoutes.js                    # /api/cards
│   │   ├── depositWithdrawalRoutes.js       # /api/deposit-withdrawal-requests
│   │   ├── healthRoutes.js                  # /api/health
│   │   ├── loanRoutes.js                    # /api/loans
│   │   ├── notificationRoutes.js            # /api/notifications
│   │   ├── otpRoutes.js                     # /api/otp
│   │   ├── serviceRequestRoutes.js          # /api/service-requests
│   │   └── transactionRoutes.js             # /api/transactions
│   ├── scripts/
│   │   ├── seedAdmin.js                     # Default admin & demo seeder
│   │   ├── test_all_endpoints.js            # General API test script
│   │   ├── test_deposit_withdrawal.js       # 43-test deposit/withdrawal suite
│   │   └── test_rbac_matrix.js              # Strict RBAC verification suite
│   ├── services/
│   │   ├── accountBalanceService.js         # Gated balance mutation service
│   │   ├── emailService.js                  # Central email dispatcher
│   │   ├── fraudDetectionService.js         # Rule-based fraud scoring
│   │   └── otpService.js                    # Cryptographic OTP generator
│   ├── templates/emails/
│   │   ├── baseTemplate.js                  # Finova responsive email layout
│   │   ├── depositWithdrawalEmail.js        # Approval & rejection email layout
│   │   ├── fraudAlertEmail.js               # Critical security alert email
│   │   ├── loanEmail.js                     # Loan decision email layout
│   │   ├── otpEmail.js                      # Verification code email layout
│   │   ├── passwordResetEmail.js            # Password reset email layout
│   │   ├── transactionEmail.js              # Transaction confirmation email
│   │   └── welcomeEmail.js                  # Customer onboarding email
│   ├── utils/
│   │   ├── auditLogger.js                   # Institutional audit logger helper
│   │   ├── calculateEmi.js                  # Financial EMI formula helper
│   │   ├── currency.js                      # Backend INR formatting helper
│   │   ├── generateAccountNumber.js         # 12-digit account generator
│   │   ├── generateToken.js                 # JWT token signer
│   │   ├── generateTransactionId.js         # Unique TXN- prefix generator
│   │   ├── notificationService.js           # Socket.IO & DB notification creator
│   │   └── socket.js                        # Socket.IO server initialization
│   ├── package.json                         # Backend npm dependencies
│   └── server.js                            # Main Express server entry point
│
└── frontend/                                # React 18 + Vite client application
    ├── public/                              # Static public assets & brand icons
    ├── src/
    │   ├── assets/                          # Shield and Finova branding assets
    │   ├── components/
    │   │   ├── AdminRoute.jsx               # Protected route guard for admins
    │   │   ├── BrandLogo.jsx                # Vector brand logo component
    │   │   ├── ErrorBoundary.jsx            # React error boundary
    │   │   ├── Layout.jsx                   # Main layout with Navbar & Sidebar
    │   │   ├── Navbar.jsx                   # Header with notifications & theme
    │   │   ├── ProtectedRoute.jsx           # JWT route guard for customers
    │   │   ├── Sidebar.jsx                  # Navigation drawer with RBAC items
    │   │   ├── ThemeSelector.jsx            # Light/Dark/Night picker
    │   │   ├── ThemeToggle.jsx              # Quick theme toggle button
    │   │   ├── admin/                       # Recharts admin chart components
    │   │   └── ui/                          # Button, Card, Table, Modal, Loader
    │   ├── context/
    │   │   ├── AuthContext.jsx              # User session, JWT & role state
    │   │   ├── NotificationContext.jsx      # Socket.IO client notification state
    │   │   ├── ThemeContext.jsx             # Theme provider (Light, Dark, Night)
    │   │   └── ToastContext.jsx             # Floating toast notification system
    │   ├── pages/
    │   │   ├── LandingPage.jsx              # Public landing page
    │   │   ├── Unauthorized.jsx             # 403 Forbidden access page
    │   │   ├── admin/
    │   │   │   ├── Accounts.jsx             # Admin bank account management
    │   │   │   ├── AdminSettings.jsx        # Admin portal settings
    │   │   │   ├── AuditLogs.jsx            # Immutable audit trail explorer
    │   │   │   ├── Cards.jsx                # Admin card issuance portal
    │   │   │   ├── Customers.jsx            # Customer directory & controls
    │   │   │   ├── Dashboard.jsx            # Admin analytics & KPI summary
    │   │   │   ├── DepositWithdrawalDetails.jsx # Request audit ledger details
    │   │   │   ├── DepositWithdrawalManagement.jsx # Deposit/Withdrawal requests table
    │   │   │   ├── FraudAlerts.jsx          # Fraud triage & review center
    │   │   │   ├── Loans.jsx                # Loan application decisions
    │   │   │   ├── ServiceRequests.jsx      # Cheque book & passbook approval
    │   │   │   └── Transactions.jsx         # Institution-wide transaction audit
    │   │   ├── auth/                        # Login, Register, Forgot Password
    │   │   └── customer/
    │   │       ├── AccountDetails.jsx       # Individual account ledger
    │   │       ├── Accounts.jsx             # Customer account overview
    │   │       ├── BankStatement.jsx        # Statement export with running balance
    │   │       ├── Beneficiaries.jsx        # Saved payees address book
    │   │       ├── Cards.jsx                # Virtual debit card manager
    │   │       ├── Dashboard.jsx            # Customer financial dashboard
    │   │       ├── DepositRequest.jsx       # /deposit request submission page
    │   │       ├── DepositWithdrawalHistory.jsx # /deposit-withdrawal-requests history
    │   │       ├── LoanApply.jsx            # Interactive loan application form
    │   │       ├── LoanDetails.jsx          # Individual loan repayment schedule
    │   │       ├── Loans.jsx                # Customer loan center
    │   │       ├── Notifications.jsx        # Notification inbox
    │   │       ├── Profile.jsx              # Customer profile & security
    │   │       ├── ServiceRequests.jsx      # Cheque & passbook service requests
    │   │       ├── Settings.jsx             # Customer preferences
    │   │       ├── TransactionDetails.jsx   # Individual receipt view
    │   │       ├── Transactions.jsx         # Filterable transaction explorer
    │   │       ├── Transfer.jsx             # P2P fund transfer page
    │   │       └── WithdrawalRequest.jsx    # /withdraw request submission page
    │   ├── services/
    │   │   ├── accountService.js            # Account APIs
    │   │   ├── adminService.js              # Admin APIs
    │   │   ├── api.js                       # Axios instance with interceptors
    │   │   ├── authService.js               # Auth & JWT APIs
    │   │   ├── beneficiaryService.js        # Beneficiary APIs
    │   │   ├── cardService.js               # Card APIs
    │   │   ├── depositWithdrawalService.js  # Deposit/Withdrawal request APIs
    │   │   ├── loanService.js               # Loan APIs
    │   │   ├── notificationService.js       # Notification APIs
    │   │   ├── otpService.js                # OTP APIs
    │   │   ├── serviceRequestService.js     # Cheque/passbook APIs
    │   │   └── transactionService.js        # Transaction APIs
    │   ├── utils/
    │   │   └── currency.js                  # Frontend INR formatting helper
    │   ├── App.jsx                          # Main routing tree
    │   ├── index.css                        # Tailwind CSS & custom design tokens
    │   └── main.jsx                         # React DOM mount point
    ├── package.json                         # Frontend npm dependencies
    ├── vercel.json                          # Vercel proxy & SPA routing config
    └── vite.config.js                       # Vite bundler configuration
```

---

## 📡 REST API Documentation

### 1. Deposit & Withdrawal Request Management (New)
| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `POST` | `/api/deposit-withdrawal-requests` | Customer (`protect`) | Submit a new deposit or withdrawal request |
| `GET` | `/api/deposit-withdrawal-requests` | Customer (`protect`) | Fetch customer's own request history (supports type/status filters) |
| `GET` | `/api/deposit-withdrawal-requests/:id` | Customer / Admin | Get detailed record of a single request |
| `PUT` | `/api/deposit-withdrawal-requests/:id/cancel` | Customer (`protect`) | Cancel a pending request owned by the customer |
| `GET` | `/api/admin/deposit-withdrawal-requests` | Admin (`adminMiddleware`) | Filter, search, and calculate KPI summaries for all requests |
| `GET` | `/api/admin/deposit-withdrawal-requests/:id` | Admin (`adminMiddleware`) | Inspect full customer KYC and ledger details for a request |
| `POST` | `/api/admin/deposit-withdrawal-requests/:id/approve` | Admin (`adminMiddleware`) | Atomically approve request, mutate balance, and create transaction |
| `POST` | `/api/admin/deposit-withdrawal-requests/:id/reject` | Admin (`adminMiddleware`) | Reject request with mandatory administrative remarks |

### 2. Authentication & Sessions
| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public (Rate Limited) | Authenticate via email or customer ID and obtain JWT |
| `GET` | `/api/auth/me` | Authenticated | Retrieve authenticated user session details |
| `POST` | `/api/auth/forgot-password` | Public | Generate password reset token with email notification |
| `PUT` | `/api/auth/reset-password/:token` | Public | Reset password using verified cryptographic token |
| `PUT` | `/api/auth/change-password` | Authenticated | Update user password |

### 3. Accounts & Balance
| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `GET` | `/api/accounts` | Authenticated | List accounts for authenticated customer |
| `GET` | `/api/accounts/:id` | Authenticated | Get detailed account information |
| `GET` | `/api/accounts/lookup/:accountNumber` | Authenticated | Lookup counterparty name for transfers |
| `PUT` | `/api/accounts/:id/status` | Authenticated | Freeze, unfreeze, or close account |

### 4. Transactions & Statements
| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `GET` | `/api/transactions` | Authenticated | Filterable, paginated transaction history |
| `GET` | `/api/transactions/statement` | Authenticated | Official statement with running balances |
| `GET` | `/api/transactions/:id` | Authenticated | Single transaction receipt details |
| `POST` | `/api/transactions/transfer` | Authenticated | P2P fund transfer with OTP challenge support |

### 5. Administrative Control Center
| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `GET` | `/api/admin/dashboard` | Admin Only | Macro system KPIs & Recharts visualization datasets |
| `GET` | `/api/admin/customers` | Admin Only | Search and list registered customer profiles |
| `POST` | `/api/admin/customers` | Admin Only | Onboard new customer and generate customer ID |
| `PUT` | `/api/admin/customers/:id/status`| Admin Only | Activate or deactivate customer account access |
| `GET` | `/api/admin/audit-logs` | Admin Only | Searchable immutable institutional audit trail |
| `GET` | `/api/admin/fraud-alerts` | Admin Only | Flagged transactions & risk score triage |

---

## 🚀 Local Development & Quick Start

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or free MongoDB Atlas URI

### 1. Clone the Repository
```bash
git clone https://github.com/nirmal168/FinovaBank.git
cd FinovaBank
```

### 2. Configure Backend Environment
Navigate to `backend/` and create `.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/securebank
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
JWT_SECRET=finova_development_jwt_secret_key_2026
JWT_EXPIRES_IN=30d

# Mailtrap Sandbox SMTP Configuration (Optional)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your_mailtrap_user
SMTP_PASSWORD=your_mailtrap_password
MAIL_FROM_NAME=Finova
MAIL_FROM_ADDRESS=security@finovabank.com
```

### 3. Install Dependencies & Seed Database
```bash
# In backend directory
cd backend
npm install

# Seed Admin and Demo Customer Accounts
npm run seed:admin

# Start backend development server
npm run dev
```
The backend will launch at `http://localhost:5000`.

### 4. Configure & Start Frontend
In a new terminal window:
```bash
cd frontend
npm install

# Start Vite development server
npm run dev
```
The frontend will open at `http://localhost:5173`.

---

## 🔑 Demo Credentials

| Role | Email | Customer ID | Password | Access Level |
|---|---|---|---|---|
| **System Administrator** | `admin@finova.com` | `N/A` | `admin123` | Full Admin Console, Ledger Decisions, Audit Logs |
| **Retail Customer** | `customer@finova.com` | `FIN-CUS-10002` | `password123` | Personal Dashboard, Transfers, Deposit/Withdraw Requests |

---

## 🧪 Automated Testing Suite

The repository includes a comprehensive automated test suite verifying all 43 security, accounting, and role-based access rules.

Run the test suite against the backend:
```bash
cd backend
node scripts/test_deposit_withdrawal.js
```

### Test Coverage Highlights
- ✅ Rejects negative, zero, and non-numeric amounts (HTTP 400).
- ✅ Rejects unauthorized account access and prevents IDOR (HTTP 403).
- ✅ Customers cannot access admin routes (`/api/admin/*` returns HTTP 403).
- ✅ Deposit request creation leaves customer balance **untouched**.
- ✅ Double-approval protection: already processed requests cannot be re-approved (HTTP 400).
- ✅ Atomic credit upon approval: updates balance and creates `Transaction` and `AuditLog`.
- ✅ Re-checks available balance on withdrawal approval: insufficient funds prevent approval.
- ✅ Rejection workflow: requires administrative note, notifies customer, leaves balance untouched.
- ✅ Customer cancellation: only `PENDING` requests can be cancelled by their owner.

---

## ☁️ Cloud Deployment Architecture

### Frontend (Vercel)
* Managed by `frontend/vercel.json`.
* Single Page Application (SPA) rewrite rules ensure seamless React Router navigation on page reloads.
* API calls to `/api/*` are transparently proxied to the live Render backend:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://finovabank.onrender.com/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Backend (Render)
* Hosted on Render as a Web Service.
* Connected to MongoDB Atlas cluster.
* Auto-detects and accepts requests from any `*.vercel.app` origin via CORS configuration in `backend/server.js`.

---

## 📄 License
This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Finova Bank</strong> — Smart Banking. Smarter Future.<br>
  Built with ❤️ by Nirmal Prajapat
</p>
