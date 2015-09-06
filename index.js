'use strict';

var assert = require('assert'),
  fs = require('fs'),
  path = require('path'),
  sass = require('node-sass');

module.exports = {

  paths: {
    // Assuming this is normally installed in ./node_modules/sassy-test, we will
    // also assume that the fixtures directory is in ./test/fixtures
    fixtures: path.join(__dirname, '../../', 'test/fixtures'),

    // No idea where the library's Sass files are, so no default.
    library: ''
  },

  /**
   * Configures the paths needed for the sassyTest object.
   *
   * @param {object} config A configuration object containing the properties
   *   fixtures and library.
   */
  configurePaths: function(config) {
    // Don't override the default value if none is provided.
    if (config.fixtures) {
      this.paths.fixtures = config.fixtures;
    }
    this.paths.library = config.library || '';
  },

  /**
   * Returns the full path to requested test fixture.
   *
   * When called without any parameters, this method returns path to the test
   * fixtures directory. One or more parameters passed to the method will be
   * appended to the returned path.
   *
   * @returns {string} The path to the requested test fixture.
   */
  fixture: function() {
    // Add the fixtures path to the start our list of paths.
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.paths.fixtures);
    return path.join.apply(this, args);
  },

  /**
   * Runs node-sass' render() with a light weight wrapper.
   *
   * In addition to running node-sass' render(), this method:
   * - adds the test fixtures path directory to the includePaths
   * - adds the library path to the includePaths
   *
   * @see See the documentation for node-sass' render(). https://github.com/sass/node-sass#render-callback--v300
   * @param {object}   options  The options to pass to node-sass' render().
   * @param {function} callback Callback function that takes two parameters, an
   *   error object, and a result object.
   */
  render: function(options, callback) {
    try {
      options.includePaths = options.includePaths || [];
      // Add the test fixtures directory.
      options.includePaths.push(this.fixture());
      // Add the library's sass directory to node-sass' include paths.
      if (this.paths.library) {
        options.includePaths.push(this.paths.library);
      }

      // Run node-sass' render().
      sass.render(options, function(error, result) {
        if (result) {
          // Convert sass' result.css buffer to a string.
          result.css = result.css.toString();
          // Convert sass' sourcemap string to a JSON object.
          if (result.map) {
            result.map = JSON.parse(result.map.toString());
          }
        }
        callback(error, result);
      });
    } catch (err) {
      console.log(err, err.stack.split('\n'));
      callback(err, null);
    }
  },

  /**
   * Renders the test fixture and returns the result.
   *
   * Looks inside the specified folder in test/fixtures, renders the input.scss
   * file and compares it to the output.css file (if no Sass error.)
   *
   * @see See the documentation for node-sass' render(). https://github.com/sass/node-sass#render-callback--v300
   * @param {string} fixtureDirectory The path (relative to the fixtures base
   *   directory) to the fixture to test.
   * @param {object}   options  The options to pass to node-sass' render().
   * @param {function} callback Callback function that takes two parameters, an
   *   error object, and a result object.
   */
  renderFixture: function(fixtureDirectory, options, callback) {
    options = options || {};

    var results = {
      completedSassRender: false,
      completedReadFile: false
    };
    var compareResults = function() {
      // We are waiting for all tasks to complete before completing this task.
      if (!results.completedSassRender || !results.completedReadFile) {
        return;
      }

      // If no errors, compare the Sass compilation to the expected output file.
      if (!results.sassError) {
        assert.strictEqual(results.result.css, results.expectedOutput);
      }

      // Give the callback access to the results.
      callback(results.sassError, results.result, results.expectedOutput);
    };

    // Read the test from input.scss file in the specified fixture directory.
    options.file = this.fixture(fixtureDirectory, 'input.scss');
    // Include the sourcemap in the results object, but don't put the sourcemap
    // URL in the output file.
    options.sourceMap = true;
    options.omitSourceMapUrl = true;
    options.outFile = this.fixture(fixtureDirectory, 'output.css');

    // Do a sass.render() on the input.scss file.
    this.render(options, function(error, result) {
      results.result = result;
      results.sassError = error;

      // Declare this task completed.
      results.completedSassRender = true;
      compareResults();
    });

    // Read the output.css file.
    fs.readFile(options.outFile, function(error, expectedOutput) {
      if (error) {
        throw error;
      }

      // Convert fs' data buffer to a string.
      results.expectedOutput = expectedOutput.toString();

      // Declare this task completed.
      results.completedReadFile = true;
      compareResults();
    });
  }
};
