const core = require('@actions/core');
const github = require('@actions/github');

(async () => {
  try {
    const githubToken = core.getInput('github-token');
    const octokit = github.getOctokit(githubToken);

    core.info(`GitHub Token is ${githubToken.length}`);
  } catch (error) {
    core.setFailed(error.message);
  }
})();