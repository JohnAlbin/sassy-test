'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var assert = require('assert'),
    path = require('path'),
    Promise = require('bluebird');

var fs = Promise.promisifyAll(require('fs')),
    sass = Promise.promisifyAll(require('node-sass'));

/**
 * A sassy-test helper object can be created with:
 * ```
 * // Import the SassyTest class.
 * var SassyTest = require('sassy-test');
 * // Create a SassyTest object.
 * var sassyTest = new SassyTest();
 * ```
 * @module sassy-test
 */

/**
 * A SassyTest object represents test helper for testing node-sass modules.
 *
 * This class is normally accessed via the
 * [`sassy-test`]{@link module:sassy-test} module:
 * ```
 * var SassyTest = require('sassy-test');
 * var sassyTest = new SassyTest();
 * ```
 */

var SassyTest = function () {
  /**
   * Creates a SassyTest object.
   *
   * If the optional initialization object is given to the constructor, it will
   * be passed to the `configurePaths()` method.
   *
   * For example, this:
   * ```
   * var SassyTest = require('sassy-test');
   * var sassyTest = new SassyTest({includePaths: ['/my/path/to/library']});
   * ```
   * is equivalent to:
   * ```
   * var SassyTest = require('sassy-test');
   * var sassyTest = new SassyTest();
   * sassyTest.configurePaths({includePaths: ['/my/path/to/library']});
   * ```
   *
   * @param {object} [config] Optional initialization object.
   */
  function SassyTest(config) {
    _classCallCheck(this, SassyTest);

    config = config || {};

    this.paths = {};

    // Assuming this is normally installed in ./node_modules/sassy-test/lib, we
    // will also assume that the fixtures directory is in ./test/fixtures
    this.paths.fixtures = path.join(__dirname, '../../../', 'test/fixtures');

    // No idea where the library's Sass files are, so no default.
    this.paths.includePaths = [];

    this.configurePaths(config);
  }

  /**
   * Configures the paths needed for the sassyTest object.
   *
   * ```
   * var SassyTest = require('sassy-test');
   * var sassyTest = new SassyTest();
   * sassyTest.configurePaths({
   *   fixtures: '/my/path/to/fixtures',
   *   includePaths: ['/my/path/to/library']
   * });
   * ```
   *
   * If sassy-test is installed in node_modules and your test fixtures are in
   * `./test/fixtures` (relative to the root of your project), then sassy-test
   * will automatically configure the `fixtures` path without you having to set
   * `fixtures` with `configurePaths()`.
   *
   * @param {object} config - A configuration object containing the properties:
   *   `fixtures` and `includePaths`.
   */


  _createClass(SassyTest, [{
    key: 'configurePaths',
    value: function configurePaths(config) {
      // Don't override the default values or previously-set values, if no new
      // values are provided.
      if (config.fixtures) {
        this.paths.fixtures = config.fixtures;
      }
      if (config.includePaths) {
        this.paths.includePaths = config.includePaths;
      }
    }

    /**
     * Returns the full path to the requested test fixture.
     *
     * When called without any parameters, this method returns the path to the
     * test fixtures directory. If one or more parameters are given, the method
     * will append them to the returned path.
     *
     * ```
     * var SassyTest = require('sassy-test');
     * var sassyTest = new SassyTest();
     *
     * // Returns full path to the test fixtures.
     * var fixturePath = sassyTest.fixture();
     * // Returns full path to [fixtures]/sub-folder.
     * var fixturePath = sassyTest.fixture('sub-folder');
     * // Returns full path to [fixtures]/sub-folder/_file.scss.
     * var fixturePath = sassyTest.fixture('sub-folder', '_file.scss');
     * ```
     *
     * @param {...string} path - Optional paths inside the fixtures directory.
     * @returns {string} The path to the requested test fixture.
     */

  }, {
    key: 'fixture',
    value: function fixture() {
      // Add the fixtures path to the start our list of paths.
      var args = Array.prototype.slice.call(arguments);
      args.unshift(this.paths.fixtures);
      return path.join.apply(this, args);
    }

    /**
     * Runs node-sass' render() with a light-weight wrapper.
     *
     * In addition to running node-sass' render(), this method:
     * - adds the test fixtures path directory to the includePaths
     * - ensures the includePaths are passed to node-sass
     *
     * And sassy-test modifies the [node-sass result
     * object](https://github.com/sass/node-sass#result-object) by
     * - converting the `css` property from a buffer to a string
     * - converting the `map` property from a buffer to an object (Note: you will
     *   need to configure the proper sourcemap options before node-sass will add
     *   a `map` property.)
     *
     * Sassy-test also adds the following properties to the node-sass result
     * object:
     * - `warn`: An array containing the output of any @warn statements.
     * - `debug`: An array containing the output of any @debug statements.
     *
     * ```
     * var SassyTest = require('sassy-test');
     * var sassyTest = new SassyTest();
     *
     * describe('a test suite', function() {
     *   it('should test something', function(done) {
     *     var options = {
     *       data: '@import "init"; // Imports fixtures/_init.scss.'
     *     };
     *     sassyTest.render(options, function(error, result) {
     *       assert.ifError(error);
     *       assert.ok(result.css);
     *       done();
     *     });
     *   });
     * });
     * ```
     *
     * @param {object} options - The options to pass to node-sass' render(). For
     *   the full list of options, see the [node-sass documentation for
     *   "options"](https://github.com/sass/node-sass#options).
     * @param {function} [callback] - An asynchronous callback with the signature
     *   of `function(error, result)`. In error conditions, the error argument is
     *   populated with the [node-sass error
     *   object](https://github.com/sass/node-sass#error-object). In success
     *   conditions, the result object is populated with an object describing the
     *   result of the render call.
     * @returns {Promise|*} If no `callback` function is given, this method
     *   returns a Promise that resolves to node-sass' result object or rejects to
     *   node-sass' error object.
     */

  }, {
    key: 'render',
    value: function render(options, callback) {
      if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) !== 'object') {
        var error = new Error('Options parameter of render method must be an object.');
        if (callback) {
          return callback(error, null);
        } else {
          return Promise.reject(error);
        }
      }

      options.includePaths = options.includePaths || [];

      // Add the test fixtures directory.
      options.includePaths.push(this.fixture());

      // Add the includePaths to node-sass' include paths.
      if (this.paths.includePaths.length) {
        Array.prototype.push.apply(options.includePaths, this.paths.includePaths);
      }

      // Collect Sass warn() and debug() messages.
      var warn = [],
          debug = [];
      options.functions = options.functions || {};
      options.functions['@warn'] = function (message) {
        warn.push(message.getValue());
        return sass.NULL;
      };
      options.functions['@debug'] = function (message) {
        debug.push(message.getValue());
        return sass.NULL;
      };

      var handleResult = function handleResult(result) {
        // Convert sass' result.css buffer to a string.
        result.css = result.css.toString();
        // Convert sass' sourcemap string to a JSON object.
        if (result.map) {
          result.map = JSON.parse(result.map.toString());
        }
        result.warn = warn;
        result.debug = debug;

        return result;
      };

      // Run node-sass' render().
      if (callback) {
        sass.render(options, function (error, result) {
          if (error) {
            callback(error, null);
          } else {
            callback(null, handleResult(result));
          }
        });
      } else {
        return sass.renderAsync(options).then(handleResult);
      }
    }

    /**
     * Runs assertions against `renderFixture()`'s result object.
     *
     * The `renderFixture()` automatically calls this method to run a standard set
     * of assertions against the result object before it is returned. If no Sass
     * error occurs, `assertResult()` checks for an error when reading the
     * output.css file using `assert.ifError()` and compares the results to the
     * expected output using `assert.strictEqual()`.
     *
     * If the SassyTest user chooses, this method can be overridden to perform
     * different assertions.
     *
     * @param {object} result The result object returned by `renderFixture()`.
     */

  }, {
    key: 'assertResult',
    value: function assertResult(result) {
      // A missing output.css file is a hard fail.
      assert.ifError(result.expectedOutputFileError);

      // Compare the Sass compilation to the expected output file.
      assert.strictEqual(result.css, result.expectedOutput);
    }

    /**
     * Renders the test fixture and returns the result.
     *
     * Looks inside the specified folder in test/fixtures, renders the input.scss
     * file and reads the output.css file. Before it returns the node-sass result
     * object, it calls `assertResult()` to run a standard set of assertions.
     *
     * renderFixture() does not test for errors itself; it requires the callback
     * to decide if a Sass error is a test failure or not. Good Sass libraries
     * should `@error` if used incorrectly and sassy-test lets you see these
     * errors and assert they were the expected result.
     *
     * Sassy-test modifies the [node-sass result
     * object](https://github.com/sass/node-sass#result-object) by
     * - converting the `css` property from a buffer to a string
     * - converting the `map` property from a buffer to an object (Note: you will
     *   need to configure the proper sourcemap options before node-sass will add
     *   a `map` property.)
     *
     * Sassy-test also adds the following properties to the node-sass result
     * object:
     * - `warn`: An array containing the output of any @warn statements.
     * - `debug`: An array containing the output of any @debug statements.
     * - sassError: A node-sass error object which contains @error statements, if
     *   any.
     * - expectedOutput: The text of the output.css file; should match the `css`
     *   property provided by node-sass.
     *
     * ```
     * var SassyTest = require('sassy-test');
     * var sassyTest = new SassyTest();
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
     *       done();
     *     });
     *   });
     * });
     * ```
     *
     * @param {string} fixtureDirectory - The path (relative to the fixtures base
     *   directory) to the fixture to test.
     * @param {object} options - The options to pass to node-sass' render(). For
     *   the full list of options, see the [node-sass documentation for
     *   "options"](https://github.com/sass/node-sass#options).
     * @param {function} [callback] - An asynchronous callback with the signature
     *   of `function(error, result)`. In error conditions, the error argument is
     *   populated with the [node-sass error
     *   object](https://github.com/sass/node-sass#error-object). In success
     *   conditions, the result object is populated with an object describing the
     *   result of the render call.
     * @returns {Promise|*} If no `callback` function is given, this method
     *   returns a Promise that resolves to node-sass' result object or rejects to
     *   node-sass' error object.
     */

  }, {
    key: 'renderFixture',
    value: function renderFixture(fixtureDirectory, options, callback) {
      var _this = this;

      options = options || /* istanbul ignore next */{};

      // Read the test from input.scss file in the specified fixture directory.
      options.file = this.fixture(fixtureDirectory, 'input.scss');
      // Include the sourcemap in the results object, but don't put the sourcemap
      // URL in the output file.
      options.sourceMap = true;
      options.omitSourceMapUrl = true;
      options.outFile = this.fixture(fixtureDirectory, 'output.css');

      var test = {
        result: null,
        expectedOutput: null,
        expectedOutputFileError: null
      };

      var handleResult = function handleResult(test) {
        // Move our properties into the node-sass result object.
        var result = test.result || /* istanbul ignore next */{};
        result.expectedOutput = test.expectedOutput;
        result.expectedOutputFileError = test.expectedOutputFileError;

        _this.assertResult(result);

        return result;
      };

      if (callback) {
        test.completedSassRender = false;
        test.completedReadFile = false;
        test.sassError = null;

        var compareResults = function compareResults() {
          // We are waiting for all tasks to complete before completing this task.
          if (!test.completedSassRender || !test.completedReadFile) {
            return;
          }

          // Give the callback access to the results.
          if (test.sassError) {
            callback(test.sassError, null);
          } else {
            callback(null, handleResult(test));
          }
        };

        // Do a sass.render() on the input.scss file.
        this.render(options, function (error, result) {
          test.result = result;
          test.sassError = error;

          // Declare this task completed.
          test.completedSassRender = true;
          compareResults();
        });

        // Read the output.css file.
        fs.readFile(options.outFile, function (error, expectedOutput) {
          test.expectedOutputFileError = error;
          test.expectedOutput = expectedOutput;

          // Convert fs' data buffer to a string.
          if (!error) {
            test.expectedOutput = expectedOutput.toString();
          }

          // Declare this task completed.
          test.completedReadFile = true;
          compareResults();
        });
      } else {
        return Promise.all([
        // Do a sass.render() on the input.scss file.
        this.render(options).then(function (result) {
          test.result = result;
          return Promise.resolve();
        }),

        // Read the output.css file.
        fs.readFileAsync(options.outFile).then(function (expectedOutput) {
          // Convert fs' data buffer to a string.
          test.expectedOutput = expectedOutput.toString();
          return Promise.resolve();
        }).catch(function (error) {
          test.expectedOutputFileError = error;
          return Promise.resolve();
        })]).then(function () {
          return Promise.resolve(handleResult(test));
        });
      }
    }
  }]);

  return SassyTest;
}();

module.exports = SassyTest;