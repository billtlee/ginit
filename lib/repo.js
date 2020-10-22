const CLI = require('clui');
const fs = require('fs');
const simpleGit = require('simple-git');
const Spinner = CLI.Spinner;
const touch = require('touch');
const _ = require('lodash');

const git = simpleGit();
const inquire = require('./inquirer');
const gh = require('./github');
const { url } = require('inspector');
const chalk = require('chalk');

module.exports = {
  createRemoteRepo: async () => {
    const github = gh.getInstance();
    const answers = await inquire.askRepoDetails();

    const data = {
      name: answers.name,
      description: answers.description,
      private: (answers.visibility === 'private')
    };

    const status = new Spinner('Creating remote repository...');
    status.start();

    try {
      const response = await github.repos.createForAuthenticatedUser(data);
      return response.data.ssh_url;
    } catch(error) {
      console.log(chalk.red(error));
    } finally {
      status.stop();
    }
  },

  createGitignore: async () => {
    const filelist = _.without(fs.readdirSync('.'), '.git', '.gitignore');

    if (filelist.length) {
      const answers = await inquire.askIgnoreFiles(filelist);

      if (answers.ignore.length) {
        fs.writeFileSync('.gitignore', answers.ignore.join('\n'));
      } else {
        touch('.gitignore');
      }
    } else {
      touch('./gitignore');
    }
  },

  setupRepo: async (url) => {
    const status = new Spinner('Initializing local repository and pushing to remote...');
    status.start();

    try {
      await git.init();
      await git.add('.gitignore');
      await git.add('./*');
      await git.commit('Initial commit');
      await git.addRemote('origin', url);
      await git.push('origin', 'master');
    } catch(error) {
      console.log(chalk.red(error));
    } finally {
      status.stop();
    }
  },
}