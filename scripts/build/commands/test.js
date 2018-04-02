const path = require('path');

const fse = require('fs-extra');
const rimraf = require('rimraf');

const {exec} = require('../../utils/exec');

module.exports = {
  command: 'test <distPath>',
  desc: 'Bundle the main widgets into a distributable folder for testing',
  builder: {
    distPath: {
      describe: 'path to output test distributables',
      default: './dist-test'
    }
  },
  handler: ({distPath}) => {
    if (distPath) {
      const cwd = process.cwd();
      const dest = path.resolve(cwd, distPath);
      rimraf.sync(dest);
      fse.ensureDir(dest)
        .then(() => {
          fse.copy(path.resolve(cwd, './test/journeys/server'), dest);
          const axeCore = path.join(dest, 'axe-core');
          fse.mkdir(axeCore)
            .then(() => {
              fse.copy(path.resolve(cwd, './node_modules/axe-core'), axeCore);
            });
          return Promise.all([
            exec(`BUILD_DIST_PATH=${dest}/dist-space npm run build:package widget-space`),
            exec(`BUILD_DIST_PATH=${dest}/dist-recents npm run build:package widget-recents`)
          ]);
        })
        .catch((err) => {
          console.log(err);
        });
    }
    return false;
  }
};
