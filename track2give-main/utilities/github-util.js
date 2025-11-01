const { Octokit } = require("@octokit/rest");
const User = require("../models/user");

/**
 * Get GitHub API client for a user
 * @param {string} userId - User ID
 * @returns {Octokit|null} GitHub API client or null if no token
 */
async function getGitHubClient(userId) {
  try {
    const user = await User.findById(userId);
    if (!user || !user.githubAccessToken) {
      return null;
    }
    return new Octokit({
      auth: user.githubAccessToken,
    });
  } catch (error) {
    console.error("Error getting GitHub client:", error);
    return null;
  }
}

/**
 * Get user's GitHub profile information
 * @param {string} userId - User ID
 * @returns {Object|null} GitHub user profile or null
 */
async function getUserProfile(userId) {
  try {
    const octokit = await getGitHubClient(userId);
    if (!octokit) return null;

    const { data } = await octokit.rest.users.getAuthenticated();
    return data;
  } catch (error) {
    console.error("Error fetching GitHub profile:", error);
    return null;
  }
}

/**
 * Get user's repositories
 * @param {string} userId - User ID
 * @param {Object} options - Options (type, sort, direction, per_page, page)
 * @returns {Array} List of repositories
 */
async function getUserRepositories(userId, options = {}) {
  try {
    const octokit = await getGitHubClient(userId);
    if (!octokit) return [];

    const { data } = await octokit.rest.repos.listForAuthenticatedUser({
      type: options.type || "all",
      sort: options.sort || "updated",
      direction: options.direction || "desc",
      per_page: options.per_page || 30,
      page: options.page || 1,
    });
    return data;
  } catch (error) {
    console.error("Error fetching repositories:", error);
    return [];
  }
}

/**
 * Get repository details
 * @param {string} userId - User ID
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Object|null} Repository details or null
 */
async function getRepository(userId, owner, repo) {
  try {
    const octokit = await getGitHubClient(userId);
    if (!octokit) return null;

    const { data } = await octokit.rest.repos.get({
      owner,
      repo,
    });
    return data;
  } catch (error) {
    console.error("Error fetching repository:", error);
    return null;
  }
}

/**
 * Get repository commits
 * @param {string} userId - User ID
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Object} options - Options (sha, path, per_page, page)
 * @returns {Array} List of commits
 */
async function getRepositoryCommits(userId, owner, repo, options = {}) {
  try {
    const octokit = await getGitHubClient(userId);
    if (!octokit) return [];

    const { data } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      sha: options.sha || undefined,
      path: options.path || undefined,
      per_page: options.per_page || 30,
      page: options.page || 1,
    });
    return data;
  } catch (error) {
    console.error("Error fetching commits:", error);
    return [];
  }
}

/**
 * Create a new repository
 * @param {string} userId - User ID
 * @param {Object} repoData - Repository data (name, description, private, etc.)
 * @returns {Object|null} Created repository or null
 */
async function createRepository(userId, repoData) {
  try {
    const octokit = await getGitHubClient(userId);
    if (!octokit) return null;

    const { data } = await octokit.rest.repos.createForAuthenticatedUser({
      name: repoData.name,
      description: repoData.description || "",
      private: repoData.private || false,
      auto_init: repoData.auto_init || false,
    });
    return data;
  } catch (error) {
    console.error("Error creating repository:", error);
    return null;
  }
}

/**
 * Get user's GitHub email addresses
 * @param {string} userId - User ID
 * @returns {Array} List of email addresses
 */
async function getUserEmails(userId) {
  try {
    const octokit = await getGitHubClient(userId);
    if (!octokit) return [];

    const { data } = await octokit.rest.users.listEmailsForAuthenticated();
    return data;
  } catch (error) {
    console.error("Error fetching emails:", error);
    return [];
  }
}

/**
 * Check if user has GitHub connected
 * @param {string} userId - User ID
 * @returns {boolean} True if user has GitHub connected
 */
async function hasGitHubConnected(userId) {
  try {
    const user = await User.findById(userId);
    return !!(user && user.githubId && user.githubAccessToken);
  } catch (error) {
    console.error("Error checking GitHub connection:", error);
    return false;
  }
}

module.exports = {
  getGitHubClient,
  getUserProfile,
  getUserRepositories,
  getRepository,
  getRepositoryCommits,
  createRepository,
  getUserEmails,
  hasGitHubConnected,
};

