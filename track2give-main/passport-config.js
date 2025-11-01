const passport = require("passport");
// Google OAuth temporarily disabled - using email/password only
// const GoogleStrategy = require("passport-google-oauth20").Strategy;
// const AppleStrategy = require("passport-apple");
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("./models/user");

module.exports = function (passport) {
  // Serialize and deserialize user for session management
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Google Strategy - COMMENTED OUT - Email/Password registration only for now
  /*
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          "https://nature-nexus-txv8.onrender.com/auth/google/callback",
        scope: ["profile", "email"],
        state: true,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // User exists, update Google profile info if needed
            return done(null, user);
          } else {
            // Create new user
            const newUser = new User({
              email: profile.emails[0].value,
              username:
                profile.displayName.replace(/\s/g, "") ||
                profile.emails[0].value.split("@")[0],
              password: "google-oauth-login", // Not used for OAuth login but required by model
              firstName: profile.name.givenName || "",
              lastName: profile.name.familyName || "",
              googleId: profile.id,
              profilePicture:
                profile.photos && profile.photos.length > 0
                  ? profile.photos[0].value
                  : "",
              stats: { birds: 0, plants: 0 },
              collections: [],
            });

            await newUser.save();
            return done(null, newUser);
          }
        } catch (error) {
          console.error("Google auth error:", error);
          return done(error, null);
        }
      }
    )
  );
  */

  // GitHub Strategy
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          callbackURL: process.env.GITHUB_CALLBACK_URL || "/auth/github/callback",
          scope: ["user:email"],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // GitHub profile may not have email in profile, might need to fetch separately
            let email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            
            // If no email in profile, use profile.username as identifier
            // In production, you might want to fetch email from GitHub API
            if (!email) {
              email = `${profile.username}@github.local`; // Temporary email format
            }

            // Check if user already exists by GitHub ID or email
            let user = await User.findOne({
              $or: [
                { githubId: profile.id },
                { email: email.toLowerCase() }
              ]
            });

            if (user) {
              // User exists, update GitHub info if needed
              if (!user.githubId) {
                user.githubId = profile.id;
                user.githubAccessToken = accessToken;
                if (!user.profilePicture && profile.photos && profile.photos[0]) {
                  user.profilePicture = profile.photos[0].value;
                }
                await user.save();
              } else if (user.githubAccessToken !== accessToken) {
                user.githubAccessToken = accessToken;
                await user.save();
              }
              return done(null, user);
            } else {
              // Create new user
              const newUser = new User({
                email: email.toLowerCase(),
                username: profile.username || email.split("@")[0],
                password: "github-oauth-login", // Not used for OAuth login but required by model
                githubId: profile.id,
                githubAccessToken: accessToken,
                profilePicture:
                  profile.photos && profile.photos.length > 0
                    ? profile.photos[0].value
                    : "",
              });

              await newUser.save();
              return done(null, newUser);
            }
          } catch (error) {
            console.error("GitHub auth error:", error);
            return done(error, null);
          }
        }
      )
    );
  }

  // Apple Strategy
  if (
    process.env.APPLE_CLIENT_ID &&
    process.env.APPLE_TEAM_ID &&
    process.env.APPLE_KEY_ID &&
    process.env.APPLE_PRIVATE_KEY
  ) {
    passport.use(
      new AppleStrategy(
        {
          clientID: process.env.APPLE_CLIENT_ID,
          teamID: process.env.APPLE_TEAM_ID,
          keyID: process.env.APPLE_KEY_ID,
          privateKeyLocation: process.env.APPLE_PRIVATE_KEY,
          callbackURL: "/auth/apple/callback",
          scope: ["name", "email"],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Apple profile might not have all information in one go
            // First login may have name, subsequent logins might not
            const email = profile.email;

            if (!email) {
              return done(new Error("No email provided by Apple"), null);
            }

            // Check if user already exists
            let user = await User.findOne({ email: email });

            if (user) {
              // User exists, update Apple profile info if needed
              return done(null, user);
            } else {
              // Create new user
              const newUser = new User({
                email: email,
                username: email.split("@")[0],
                password: "apple-oauth-login", // Not used for OAuth login but required by model
                firstName: profile.name?.firstName || "",
                lastName: profile.name?.lastName || "",
                appleId: profile.id,
                stats: { birds: 0, plants: 0 },
                collections: [],
              });

              await newUser.save();
              return done(null, newUser);
            }
          } catch (error) {
            console.error("Apple auth error:", error);
            return done(error, null);
          }
        }
      )
    );
  }
};
