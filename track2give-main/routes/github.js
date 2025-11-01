const express = require("express");
const router = express.Router();
const {
  getUserProfile,
  getUserRepositories,
  getRepository,
  getRepositoryCommits,
  createRepository,
  getUserEmails,
  hasGitHubConnected,
} = require("../utilities/github-util");

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// Middleware to check if user has GitHub connected
const requireGitHub = async (req, res, next) => {
  const connected = await hasGitHubConnected(req.session.user._id);
  if (!connected) {
    return res.status(403).json({
      error: "GitHub account not connected. Please connect your GitHub account first.",
    });
  }
  next();
};

// Get user's GitHub connection status
router.get("/status", requireAuth, async (req, res) => {
  try {
    const connected = await hasGitHubConnected(req.session.user._id);
    res.json({ connected });
  } catch (error) {
    console.error("Error checking GitHub status:", error);
    res.status(500).json({ error: "Failed to check GitHub status" });
  }
});

// Get user's GitHub profile
router.get("/profile", requireAuth, requireGitHub, async (req, res) => {
  try {
    const profile = await getUserProfile(req.session.user._id);
    if (!profile) {
      return res.status(404).json({ error: "Failed to fetch GitHub profile" });
    }
    res.json(profile);
  } catch (error) {
    console.error("Error fetching GitHub profile:", error);
    res.status(500).json({ error: "Failed to fetch GitHub profile" });
  }
});

// Get user's repositories
router.get("/repositories", requireAuth, requireGitHub, async (req, res) => {
  try {
    const options = {
      type: req.query.type || "all",
      sort: req.query.sort || "updated",
      direction: req.query.direction || "desc",
      per_page: parseInt(req.query.per_page) || 30,
      page: parseInt(req.query.page) || 1,
    };
    const repos = await getUserRepositories(req.session.user._id, options);
    res.json(repos);
  } catch (error) {
    console.error("Error fetching repositories:", error);
    res.status(500).json({ error: "Failed to fetch repositories" });
  }
});

// Get specific repository details
router.get("/repositories/:owner/:repo", requireAuth, requireGitHub, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const repository = await getRepository(req.session.user._id, owner, repo);
    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }
    res.json(repository);
  } catch (error) {
    console.error("Error fetching repository:", error);
    res.status(500).json({ error: "Failed to fetch repository" });
  }
});

// Get repository commits
router.get(
  "/repositories/:owner/:repo/commits",
  requireAuth,
  requireGitHub,
  async (req, res) => {
    try {
      const { owner, repo } = req.params;
      const options = {
        sha: req.query.sha || undefined,
        path: req.query.path || undefined,
        per_page: parseInt(req.query.per_page) || 30,
        page: parseInt(req.query.page) || 1,
      };
      const commits = await getRepositoryCommits(
        req.session.user._id,
        owner,
        repo,
        options
      );
      res.json(commits);
    } catch (error) {
      console.error("Error fetching commits:", error);
      res.status(500).json({ error: "Failed to fetch commits" });
    }
  }
);

// Create a new repository
router.post("/repositories", requireAuth, requireGitHub, async (req, res) => {
  try {
    const { name, description, private: isPrivate, auto_init } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Repository name is required" });
    }
    const repoData = {
      name,
      description,
      private: isPrivate || false,
      auto_init: auto_init || false,
    };
    const repository = await createRepository(req.session.user._id, repoData);
    if (!repository) {
      return res.status(500).json({ error: "Failed to create repository" });
    }
    res.status(201).json(repository);
  } catch (error) {
    console.error("Error creating repository:", error);
    res.status(500).json({ error: "Failed to create repository" });
  }
});

// Get user's GitHub emails
router.get("/emails", requireAuth, requireGitHub, async (req, res) => {
  try {
    const emails = await getUserEmails(req.session.user._id);
    res.json(emails);
  } catch (error) {
    console.error("Error fetching emails:", error);
    res.status(500).json({ error: "Failed to fetch emails" });
  }
});

module.exports = router;

