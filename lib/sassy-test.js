'use strict';

var assert = require('assert'),
  fs = require('fs'),
  path = require('path'),
  sass = require('node-sass');

/**
 * The core sassy-test API can be imported with:
 * ```
 * var sassyTest = require('sassy-test');
 * ```
 * @module sassy-test
 */

module.exports = {

  paths: {
    // Assuming this is normally installed in ./node_modules/sassy-test/lib, we
    // will also assume that the fixtures directory is in ./test/fixtures
    fixtures: path.join(__dirname, '../../../', 'test/fixtures'),

    // No idea where the library's Sass files are, so no default.
    library: ''
  },

  /**
   * Configures the paths needed for the sassyTest object.
   *
   * ```
   * var sassyTest = require('sassy-test');
   * sassyTest.configurePaths({
   *   fixtures: '/my/path/to/fixtures',
   *   library: '/my/path/to/library'
   * });
   * ```
   *
   * If sassy-test is installed in node_modules and your test fixtures are in
   * `./test/fixtures` (relative to the root of your project), then sassy-test
   * will automatically configure the `fixtures` path without you having to set
   * `fixtures` with `configurePaths()`.
   *
   * @param {object} config - A configuration object containing the properties:
   *   `fixtures` and `library`.
   */
  configurePaths: function(config) {
    // Don't override the default value if none is provided.
    if (config.fixtures) {
      this.paths.fixtures = config.fixtures;
    }
    this.paths.library = config.library || '';
  },

  /**
   * Returns the full path to the requested test fixture.
   *
   * When called without any parameters, this method returns the path to the
   * test fixtures directory. If one or more parameters are given, the method
   * will append them to the returned path.
   *
   * ```
   * var sassyTest = require('sassy-test');
   *
   * // Returns full path to the test fixtures.
   * var fixturePath = sassyTest.fixture();
   * // Returns full path to fixtures/sub-folder.
   * var fixturePath = sassyTest.fixture('sub-folder');
   * // Returns full path to fixtures/sub-folder/_file.scss.
   * var fixturePath = sassyTest.fixture('sub-folder', '_file.scss');
   * ```
   *
   * @param {...string} path - Optional paths inside the fixtures directory.
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
   * - converts render.css from a buffer to a string
   * - converts render.map to an object (if you configured the proper sourcemap
   *   options)
   *
   * ```
   * var sassyTest = require('sassy-test');
   *
   * describe('a test suite', function() {
   *   it('should test something', function(done) {
   *     var options = {
   *       data: '@import "init"; // Imports fixtures/_init.scss.'
   *     };
   *     sassyTest.render(options, function(error, result) {
   *       assert.ifError(error);
   *       assert.ok(result.css);
   *     });
   *     done();
   *   });
   * });
   * ```
   *
   * @param {object} options - The options to pass to node-sass' render(). For
   *   the full list of options, see the [node-sass documentation for
   *   "options"](https://github.com/sass/node-sass#options).
   * @param {function} callback - An asynchronous callback with the signature of
   *   `function(error, result)`. In error conditions, the error argument is
   *   populated with the error object. In success conditions, the result object
   *   is populated with an object describing the result of the render call. For
   *   full details, see the [node-sass documentation for the error and result
   *   objects](https://github.com/sass/node-sass#error-object).
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
      callback(err, null);
    }
  },

  /**
   * Renders the test fixture and returns the result.
   *
   * Looks inside the specified folder in test/fixtures, renders the input.scss
   * file and reads the output.css file. If no Sass error occurs, it compares
   * the results to the expected output using `assert.strictEqual()`.
   *
   * renderFixture() does not test for errors itself; it requires the callback
   * to decide if a Sass error is a test failure or not. Good Sass libraries
   * should `@error` if used incorrectly and sassy-test lets you see these
   * errors and assert they were the expected result.
   *
   * ```
   * var sassyTest = require('sassy-test');
   *
   * describe('a test suite', function() {
   *   it('should test something', function(done) {
   *     var options = {
   *       data: '@import "init"; // Imports fixtures/_init.scss.'
   *     };
   *     sassyTest.renderFixture('sometest', options, function(error, result) {
   *       // If there was no error, renderFixture() has already compared
   *       // the rendered output of fixtures/sometest/input.scss to
   *       // fixtures/sometest/output.css.
   *       assert.ifError(error);
   *     });
   *     done();
   *   });
   * });
   * ```
   *
   * @param {string} fixtureDirectory - The path (relative to the fixtures base
   *   directory) to the fixture to test.
   * @param {object} options - The options to pass to node-sass' render(). For
   *   the full list of options, see the [node-sass documentation for
   *   "options"](https://github.com/sass/node-sass#options).
   * @param {function} callback - An asynchronous callback with the signature of
   *   `function(error, result, expectedOutput)`. The expectedOutput is always
   *   given the contents of the output.css file in the specified fixture. In
   *   error conditions, the error argument is populated with the error object.
   *   In success conditions, the result object is populated with an object
   *   describing the result of the render call. For full details, see the
   *   [node-sass documentation for the error and result
   *   objects](https://github.com/sass/node-sass#error-object).
   */
  renderFixture: function(fixtureDirectory, options, callback) {
    options = options || /* istanbul ignore next */ {};

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
      if (!results.sassError && !results.outputError) {
        assert.strictEqual(results.result.css, results.expectedOutput);
      }

      // Give the callback access to the results.
      if (results.outputError) {
        callback(results.outputError, null, null);
      } else {
        callback(results.sassError, results.result, results.expectedOutput);
      }
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
      results.outputError = error;
      results.expectedOutput = expectedOutput;

      // Convert fs' data buffer to a string.
      if (!error) {
        results.expectedOutput = expectedOutput.toString();
      }

      // Declare this task completed.
      results.completedReadFile = true;
      compareResults();
    });
  }
};
