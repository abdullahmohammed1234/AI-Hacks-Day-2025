# Track2Give - Authentication Setup

## ✅ Completed Setup

### 1. **Authentication Routes Created** (`routes/auth.js`)

**Available Routes:**

- `GET /login` - Login/Register page (tabbed interface)
- `POST /login` - Login submission with "Remember Me" support
- `POST /register` - Register new user (auto-login after registration)
- `POST /logout` - Logout and clear session
- `GET /forgot-password` - Password reset page
- `POST /forgot-password` - Send password reset email
- `GET /reset-password/:token` - Reset password page with token
- `POST /reset-password/:token` - Submit new password

### 2. **Features Implemented**

#### Login & Registration

- ✅ Tabbed interface (Login/Register on same page)
- ✅ Email/password authentication
- ✅ Password validation (match confirmation)
- ✅ Duplicate email/username check
- ✅ Auto-login after registration
- ✅ Session management
- ✅ Remember Me functionality (30-day cookie)
- ✅ Error handling with user feedback

#### Security

- ✅ Password hashing with bcrypt
- ✅ HTTP-only cookies for remember token
- ✅ Session expiration (7 days)
- ✅ Remember token expiration (30 days)
- ✅ Password reset tokens with expiration

### 3. **Database Models Updated**

**User Model** (`models/user.js`):

```javascript
{
  username: String,
  email: String (lowercase, unique),
  password: String (hashed),
  googleId: String (optional),
  profilePicture: String,
  notificationPreferences: {
    email: Boolean,
    push: Boolean,
    expiryReminder: Boolean,
    daysBeforeExpiry: Number
  },
  rememberToken: String,
  rememberTokenExpiresAt: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  timestamps: true
}
```

### 4. **Views Updated**

#### index.ejs

- ✅ Now uses `partials/header.ejs` for navigation
- ✅ Now uses `partials/footer.ejs` for footer
- ✅ Shows different nav menu for logged-in vs logged-out users
- ✅ Responsive mobile menu

#### login.ejs

- ✅ Tabbed interface (Login/Register)
- ✅ Uses custom CSS from `/style.css`
- ✅ Form validation
- ✅ Error/success message display
- ✅ Remember Me checkbox
- ✅ Forgot password link
- ✅ Mobile responsive

### 5. **Server Configuration**

**Updated `server.js`:**

```javascript
// Enabled imports
const User = require("./models/user");
const FoodItem = require("./models/foodItem");
const ImpactStats = require("./models/impactStats");
const SharedItem = require("./models/sharedItem");
const { router: authRoutes, checkRememberToken } = require("./routes/auth");

// Middleware order
app.use(checkRememberToken); // Check remember token before routes
app.use(authRoutes); // Auth routes enabled
app.use(dashboardRoutes);
app.use(foodItemsRoutes);
// ... other routes
```

## 🔐 Authentication Flow

### Registration Flow

1. User fills registration form
2. Validate email, username, password
3. Check for existing user
4. Hash password with bcrypt
5. Create user in MongoDB
6. Auto-login (create session)
7. Redirect to dashboard

### Login Flow

1. User enters email/password
2. Find user by email (case-insensitive)
3. Compare password with bcrypt
4. If "Remember Me" checked:
   - Generate secure token
   - Store in user record with expiration
   - Set HTTP-only cookie (30 days)
5. Create session
6. Redirect to dashboard

### Remember Me Flow

1. On each request, `checkRememberToken` middleware runs
2. If no session but remember token cookie exists:
   - Find user with matching token
   - Check token not expired
   - Auto-login user
   - Create session

### Logout Flow

1. Clear remember token from database
2. Clear remember token cookie
3. Destroy session
4. Redirect to homepage

## 🎨 UI/UX Features

### Header/Navigation

- Fixed top navbar
- Logo links to homepage
- Different menus for logged-in/out users
- Mobile hamburger menu
- Active page highlighting

### Login Page

- Clean, centered design
- Tabbed interface (no page reload)
- Form validation
- Error messages in alerts
- Remember Me checkbox
- Forgot password link
- Responsive design

## 🔑 Environment Variables

Add to `.env`:

```env
SESSION_SECRET=your-secret-key-here
SALT_ROUND=10
NODE_ENV=development
```

## 🚀 Testing the Auth System

### 1. Start the Server

```bash
npm run dev
```

### 2. Test Registration

1. Visit `http://localhost:3000/login`
2. Click "Register" tab
3. Fill in email, username, password
4. Submit - should redirect to dashboard

### 3. Test Login

1. Visit `http://localhost:3000/login`
2. Enter registered email/password
3. Check "Remember Me" (optional)
4. Submit - should redirect to dashboard

### 4. Test Remember Me

1. Login with "Remember Me" checked
2. Close browser
3. Open browser and visit site
4. Should be auto-logged in

### 5. Test Logout

1. While logged in, click "Logout"
2. Should redirect to homepage
3. Session cleared
4. Remember token cleared

## 📝 Notes

- Google OAuth is commented out but available in code
- Password reset requires email configuration (TODO)
- All routes protected with session check
- Case-insensitive email login
- Auto-login after successful registration
- Passwords hashed with bcrypt (salt rounds: 10)

## 🐛 Common Issues

**Issue: "Cannot find module './models/user'"**

- Solution: Ensure all model files exist in `/models` directory

**Issue: Session not persisting**

- Solution: Check SESSION_SECRET in .env file

**Issue: Remember Me not working**

- Solution: Ensure cookies are enabled and check browser dev tools

**Issue: Login redirects to login page**

- Solution: Check MongoDB connection and user exists in database
