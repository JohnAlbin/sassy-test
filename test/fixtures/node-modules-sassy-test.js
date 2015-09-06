'use strict';

// We simulate sassy-test being installed in node-modules/sassy-test/ by putting
// this file in test/node-modules/sassy-test/ and then exporting sassy-test.
var sassyTest = require('../../index.js'),
  path = require('path');

// Reset the default paths variable for this new file location.
sassyTest.paths = {
  fixtures: path.join(__dirname, '../../', 'test/fixtures'),
  library: ''
};

module.exports = sassyTest;
