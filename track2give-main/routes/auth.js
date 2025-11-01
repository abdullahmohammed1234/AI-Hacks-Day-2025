const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const passport = require("passport");

// ------------------------
// REMEMBER TOKEN MIDDLEWARE (moved to top for early eval)
// ------------------------
const checkRememberToken = async (req, res, next) => {
  if (!req.session.user && req.cookies.remember_token) {
    try {
      const user = await User.findOne({
        rememberToken: req.cookies.remember_token,
        rememberTokenExpiresAt: { $gt: new Date() },
      });

      if (user) {
        req.session.user = user;
        user.lastLoginAt = new Date();
        await user.save();
        console.log("Auto-login via remember token:", user.email);
      }
    } catch (err) {
      console.error("Remember token check error:", err);
    }
  }
  next();
};

// ------------------------
// LOGIN PAGE
// ------------------------
router.get("/login", (req, res) => {
  // If already logged in, redirect to dashboard
  if (req.session.user) {
    return res.redirect("/dashboard");
  }

  const passwordResetSuccess = req.session.passwordResetSuccess;
  if (passwordResetSuccess) delete req.session.passwordResetSuccess;

  res.render("login", {
    title: "Track2Give - Login & Register",
    error: passwordResetSuccess
      ? "Your password has been reset successfully. Please log in with your new credentials."
      : req.query.error || null,
    success: passwordResetSuccess ? true : false,
    user: null,
    currentPage: "login",
  });
});

// ------------------------
// LOGIN SUBMISSION + REMEMBER ME
// ------------------------
router.post("/login", async (req, res) => {
  const { email, password, remember_me } = req.body;
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user && (await bcrypt.compare(password, user.password))) {
      // Handle remember me
      if (remember_me === "on" || remember_me) {
        const token = crypto.randomBytes(32).toString("hex");
        const tokenExpiry = new Date();
        tokenExpiry.setDate(tokenExpiry.getDate() + 30);

        user.rememberToken = token;
        user.rememberTokenExpiresAt = tokenExpiry;

        res.cookie("remember_token", token, {
          maxAge: 30 * 24 * 60 * 60 * 1000,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        });
      } else {
        user.rememberToken = null;
        user.rememberTokenExpiresAt = null;
        res.clearCookie("remember_token");
      }

      await user.save();

      // Create session with user data
      req.session.user = {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
      };

      res.redirect("/dashboard");
    } else {
      res.render("login", {
        title: "Track2Give - Login & Register",
        error: "Invalid email or password",
        success: false,
        user: null,
        currentPage: "login",
      });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.redirect("/login?error=Something went wrong. Please try again.");
  }
});

// ------------------------
// GOOGLE OAUTH LOGIN
// ------------------------
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login?error=Google auth failed",
    session: false,
  }),
  async (req, res) => {
    try {
      req.session.user = req.user;
      await User.findByIdAndUpdate(req.user._id, {
        lastLoginAt: new Date(),
      });
      res.redirect("/dashboard");
    } catch (err) {
      console.error("Google auth callback error:", err);
      res.redirect("/login?error=Google auth failed");
    }
  }
);

// ------------------------
// GITHUB OAUTH LOGIN
// ------------------------
router.get(
  "/auth/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

router.get(
  "/auth/github/callback",
  passport.authenticate("github", {
    failureRedirect: "/login?error=GitHub auth failed",
    session: false,
  }),
  async (req, res) => {
    try {
      req.session.user = req.user;
      await User.findByIdAndUpdate(req.user._id, {
        lastLoginAt: new Date(),
      });
      res.redirect("/dashboard");
    } catch (err) {
      console.error("GitHub auth callback error:", err);
      res.redirect("/login?error=GitHub auth failed");
    }
  }
);

// ------------------------
// REGISTER (Uses same login page with tabs)
// ------------------------
router.post("/register", async (req, res) => {
  const { email, username, password, confirmPassword } = req.body;

  if (!email || !password) {
    return res.render("login", {
      title: "Track2Give - Login & Register",
      error: "Email and password are required",
      success: false,
      user: null,
      currentPage: "login",
    });
  }

  if (password !== confirmPassword) {
    return res.render("login", {
      title: "Track2Give - Login & Register",
      error: "Passwords do not match",
      success: false,
      user: null,
      currentPage: "login",
    });
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.render("login", {
        title: "Track2Give - Login & Register",
        error: "Email already registered",
        success: false,
        user: null,
        currentPage: "login",
      });
    }

    if (username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.render("login", {
          title: "Track2Give - Login & Register",
          error: "Username already taken",
          success: false,
          user: null,
          currentPage: "login",
        });
      }
    }

    const saltRounds = parseInt(process.env.SALT_ROUND) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      email: email.toLowerCase(),
      username: username || email.split("@")[0],
      password: hashedPassword,
      notificationPreferences: {
        email: true,
        push: true,
        expiryReminder: true,
        daysBeforeExpiry: 3,
      },
    });

    await newUser.save();

    // Auto-login after registration
    req.session.user = {
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      profilePicture: newUser.profilePicture,
    };

    res.redirect("/dashboard");
  } catch (err) {
    console.error("Registration error:", err);
    res.render("login", {
      title: "Track2Give - Login & Register",
      error: "Registration failed. Please try again.",
      success: false,
      user: null,
      currentPage: "login",
    });
  }
});

// ------------------------
// LOGOUT
// ------------------------
router.post("/logout", async (req, res) => {
  try {
    // Clear remember me token if it exists
    if (req.cookies.remember_token && req.session.user) {
      await User.findByIdAndUpdate(req.session.user._id, {
        rememberToken: null,
        rememberTokenExpiresAt: null,
      });
      res.clearCookie("remember_token");
    }

    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      res.redirect("/");
    });
  } catch (err) {
    console.error("Logout error:", err);
    res.redirect("/");
  }
});

// ------------------------
// FORGOT PASSWORD
// ------------------------
router.get("/forgot-password", (req, res) => {
  res.render("forgot-password", {
    title: "Track2Give - Forgot Password",
    error: req.query.error || null,
    success: req.query.success || null,
  });
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.redirect(
        "/forgot-password?error=No account found with that email"
      );
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000);

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpiry;
    await user.save();

    // TODO: Send email with link: http://localhost:3000/reset-password/${resetToken}
    console.log(
      `Password reset link: http://localhost:3000/reset-password/${resetToken}`
    );

    res.redirect(
      "/forgot-password?success=Password reset instructions have been sent to your email."
    );
  } catch (err) {
    console.error("Forgot password error:", err);
    res.redirect("/forgot-password?error=Something went wrong.");
  }
});

// ------------------------
// RESET PASSWORD
// ------------------------
router.get("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.render("reset-password", {
        title: "Track2Give - Reset Password",
        tokenValid: false,
        token,
      });
    }

    res.render("reset-password", {
      title: "Track2Give - Reset Password",
      tokenValid: true,
      token,
    });
  } catch (err) {
    console.error("Reset password page error:", err);
    res.render("reset-password", {
      title: "Track2Give - Reset Password",
      tokenValid: false,
      token,
    });
  }
});

router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.render("reset-password", {
      title: "Track2Give - Reset Password",
      tokenValid: true,
      token,
      error: "Passwords do not match.",
    });
  }

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.render("reset-password", {
        title: "Track2Give - Reset Password",
        tokenValid: false,
        token,
      });
    }

    const saltRounds = parseInt(process.env.SALT_ROUND) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    req.session.passwordResetSuccess = true;
    res.redirect("/login");
  } catch (err) {
    console.error("Reset password error:", err);
    res.render("reset-password", {
      title: "Track2Give - Reset Password",
      tokenValid: true,
      token,
      error: "An error occurred while resetting your password.",
    });
  }
});

// ------------------------
// CHECK LOGIN STATUS
// ------------------------
router.get("/check-login", (req, res) => {
  if (req.session.user) {
    res.status(200).send();
  } else {
    res.status(401).json({ error: "User not authenticated." });
  }
});

module.exports = {
  router,
  checkRememberToken,
};
