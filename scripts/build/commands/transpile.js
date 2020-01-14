const {transpile} = require('../../utils/build');
const {getAllPackages} = require('../../utils/package');

module.exports = {
  command: 'transpile <packageName> [packagePath]',
  desc: 'Transpile a package with babel',
  builder: {},
  handler: ({packageName, packagePath}) => {
    if (packageName) {
      if (packageName === 'all') {
        const omitPrivatePackages = true;

        getAllPackages(omitPrivatePackages).forEach((pkg) => {
          transpile(pkg, `./packages/node_modules/${pkg}`);
        });
      }
      else {
        if (packagePath) {
          transpile(packageName, packagePath);
        }
        transpile(packageName, `./packages/node_modules/@webex/${packageName}`);
      }
    }
  }
};
