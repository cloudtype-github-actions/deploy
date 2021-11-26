import * as core from '@actions/core';
import * as github from '@actions/github';

async function run(): Promise<void> {
  try {
    const githubToken = core.getInput('github-token');
    const octokit = github.getOctokit(githubToken);

    core.info(`GitHub Token is ${githubToken.length}`);
    core.info('Done');
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();