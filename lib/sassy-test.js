import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileAsync, compileStringAsync } from 'sass';

/**
 * A sassy-test helper object can be created with:
 * ```
 * // Import the SassyTest class.
 * import SassyTest from 'sassy-test';
 * // Create a SassyTest object.
 * const sassyTest = new SassyTest();
 * ```
 * @module sassy-test
 */

/**
 * A SassyTest object represents test helper for testing sass modules.
 *
 * This class is normally accessed via the
 * [`sassy-test`]{@link module:sassy-test} module:
 * ```
 * import SassyTest from 'sassy-test';
 * const sassyTest = new SassyTest();
 * ```
 */
export default class SassyTest {
  /**
   * Creates a SassyTest object.
   *
   * If the optional initialization object is given to the constructor, it will
   * be passed to the `configurePaths()` method.
   *
   * For example, this:
   * ```
   * import SassyTest from 'sassy-test';
   * const sassyTest = new SassyTest({loadPaths: ['/my/path/to/library']});
   * ```
   * is equivalent to:
   * ```
   * import SassyTest from 'sassy-test';
   * const sassyTest = new SassyTest();
   * sassyTest.configurePaths({loadPaths: ['/my/path/to/library']});
   * ```
   *
   * @param {object} [config] Optional initialization object.
   */
  constructor(config) {
    config = config || {};

    this.paths = {};

    // Assuming this is normally installed in ./node_modules/sassy-test/lib, we
    // will also assume that the fixtures directory is in ./test/fixtures
    this.paths.fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../', 'test/fixtures');

    // No idea where the library's Sass files are, so no default.
    this.paths.loadPaths = [];

    this.configurePaths(config);
  }

  /**
   * Configures the paths needed for the sassyTest object.
   *
   * ```
   * import SassyTest from 'sassy-test';
   * const sassyTest = new SassyTest();
   * sassyTest.configurePaths({
   *   fixtures: '/my/path/to/fixtures',
   *   loadPaths: ['/my/path/to/library']
   * });
   * ```
   *
   * If sassy-test is installed in node_modules and your test fixtures are in
   * `./test/fixtures` (relative to the root of your project), then sassy-test
   * will automatically configure the `fixtures` path without you having to set
   * `fixtures` with `configurePaths()`.
   *
   * @param {object} config - A configuration object containing the properties:
   *   `fixtures` and `loadPaths`.
   */
  configurePaths(config) {
    // Don't override the default values or previously-set values, if no new
    // values are provided.
    if (config.fixtures) {
      this.paths.fixtures = config.fixtures;
    }
    if (config.loadPaths) {
      this.paths.loadPaths = config.loadPaths;
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
   * import SassyTest from 'sassy-test';
   * const sassyTest = new SassyTest();
   *
   * // Returns full path to the test fixtures.
   * const fixturePath = sassyTest.fixture();
   * // Returns full path to [fixtures]/sub-folder.
   * const fixturePath = sassyTest.fixture('sub-folder');
   * // Returns full path to [fixtures]/sub-folder/_file.scss.
   * const fixturePath = sassyTest.fixture('sub-folder', '_file.scss');
   * ```
   *
   * @param {...string} path - Optional paths inside the fixtures directory.
   * @returns {string} The path to the requested test fixture.
   */
  fixture() {
    // Add the fixtures path to the start our list of paths.
    const args = Array.prototype.slice.call(arguments);
    args.unshift(this.paths.fixtures);
    return path.join.apply(this, args);
  }

  /**
   * Runs sass' compile() with a light-weight wrapper.
   *
   * In addition to running sass' compile(), this method:
   * - adds the test fixtures path directory to the loadPaths
   * - ensures the loadPaths are passed to sass
   *
   * Sassy-test also adds the following properties to the sass result object:
   * - `warn`: An array containing the output of any @warn statements.
   * - `debug`: An array containing the output of any @debug statements.
   *
   * ```
   * import SassyTest from 'sassy-test';
   * const sassyTest = new SassyTest();
   *
   * describe('a test suite', function() {
   *   it('should test something', function(done) {
   *     const path = 'fixtures/_init.scss';
   *     sassyTest.compile(path, options, function(error, result) {
   *       assert.ifError(error);
   *       assert.ok(result.css);
   *       done();
   *     });
   *   });
   * });
   * ```
   *
   * @param {string} path The path to the file to be compiled.
   * @param {object?} options The options to pass to sass' compile(). For
   *   the full list of options, see the [sass documentation for
   *   "options"](https://sass-lang.com/documentation/js-api/interfaces/options/).
   * @returns {Promise} A Promise that resolves to sass' result object or
   *   rejects to sass' exception object.
   */
  compile(path, options = {}) {
    return this._compileStringOrPath(path, null, options);
  }

  /**
   * Runs sass' compileString() with a light-weight wrapper.
   *
   * In addition to running sass' compileString(), this method:
   * - adds the test fixtures path directory to the loadPaths
   * - ensures the loadPaths are passed to sass
   *
   * Sassy-test also adds the following properties to the sass result object:
   * - `warn`: An array containing the output of any @warn statements.
   * - `debug`: An array containing the output of any @debug statements.
   *
   * ```
   * import SassyTest from 'sassy-test';
   * const sassyTest = new SassyTest();
   *
   * describe('a test suite', function() {
   *   it('should test something', async function() {
   *     let result;
   *     try {
   *       result = sassyTest.compileString(
   *         '@import "init"; // Imports fixtures/_init.scss.'
   *         options
   *       );
   *     } catch (error) {
   *       assert.ifError(error);
   *     }
   *     assert.ok(result.css);
   *   });
   * });
   * ```
   *
   * @param {string} string The path to the file to be compiled.
   * @param {object?} options The options to pass to sass' compile(). For
   *   the full list of options, see the [sass documentation for
   *   "options"](https://sass-lang.com/documentation/js-api/interfaces/options/).
   * @returns {Promise} A Promise that resolves to sass' result object or
   *   rejects to sass' exception object.
   */
  compileString(string, options = {}) {
    return this._compileStringOrPath(null, string, options);
  }

  _compileStringOrPath(filePath = null, string = null, options) {
    if (typeof options !== 'object') {
      const error = new Error('Options parameter of compile method must be an object.');
      return Promise.reject(error);
    }

    options.loadPaths = options.loadPaths || [];

    // Add the test fixtures directory.
    options.loadPaths.push(this.fixture());

    // Add the loadPaths to sass' load paths.
    if (this.paths.loadPaths.length) {
      Array.prototype.push.apply(options.loadPaths, this.paths.loadPaths);
    }

    // Collect Sass warn() and debug() messages.
    const warn = [],
      debug = [];
    options.logger = {
      warn: function(message) {
        warn.push(message);
      },
      debug: function(message) {
        debug.push(message);
      }
    };

    const handleResult = (result) => {
      result.warn = warn;
      result.debug = debug;

      return result;
    };

    // Run sass' compile method.
    if (string) {
      return compileStringAsync(string, options).then(handleResult);
    } else {
      return compileAsync(filePath, options).then(handleResult);
    }
  }

  /**
   * Runs assertions against `compileFixture()`'s result object.
   *
   * The `compileFixture()` automatically calls this method to run a standard set
   * of assertions against the result object before it is returned. If no Sass
   * error occurs, `assertResult()` checks for an error when reading the
   * output.css file using `assert.ifError()` and compares the results to the
   * expected output using `assert.strictEqual()`.
   *
   * If the SassyTest user chooses, this method can be overridden to perform
   * different assertions.
   *
   * @param {object} result The result object returned by `compileFixture()`.
   */
  assertResult(result) {
    // A missing output.css file is a hard fail.
    assert.ifError(result.expectedOutputFileError);

    // Compare the Sass compilation to the expected output file.
    assert.strictEqual(result.css, result.expectedOutput);
  }

  /**
   * Compiles the test fixture and returns the result.
   *
   * Looks inside the specified folder in test/fixtures, compiles the input.scss
   * file and reads the output.css file. Before it returns the sass result
   * object, it calls `assertResult()` to run a standard set of assertions.
   *
   * compileFixture() does not test for errors itself; it requires the caller
   * to decide if a Sass error is a test failure or not. Good Sass libraries
   * should `@error` if used incorrectly and sassy-test lets you see these
   * errors and assert they were the expected result.
   *
   * Sassy-test also adds the following properties to the sass result object:
   * - `warn`: An array containing the output of any @warn statements.
   * - `debug`: An array containing the output of any @debug statements.
   * - sassError: A sass error object which contains @error statements, if any.
   * - expectedOutput: The text of the output.css file; should match the `css`
   *   property provided by sass.
   *
   * ```
   * import SassyTest from 'sassy-test';
   * const sassyTest = new SassyTest();
   *
   * describe('a test suite', function() {
   *   it('should test something', async function() {
   *     sassyTest.compileFixture('sometest', options, function(error, result) {
   *       // If there was no error, compileFixture() has already compared
   *       // the compiled output of fixtures/sometest/input.scss to
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
   * @param {object} options - The options to pass to sass' compile(). For the
   *   full list of options, see the [sass documentation for
   *   "options"](https://sass-lang.com/documentation/js-api/interfaces/options/).
   * @returns {Promise} A Promise that resolves to sass' result object or
   *   rejects to sass' exception object.
   */
  compileFixture(fixtureDirectory, options = {}) {
    options = options || /* c8 ignore next */ {};

    // Read the test from input.scss file in the specified fixture directory.
    const file = this.fixture(fixtureDirectory, 'input.scss');
    const outFile = this.fixture(fixtureDirectory, 'output.css');

    // Include the sourcemap in the results object.
    options.sourceMap = true;

    const test = {
      result: null,
      expectedOutput: null,
      expectedOutputFileError: null
    };

    const handleResult = (test) => {
      // Move our properties into the sass result object.
      const result = test.result || /* c8 ignore next */ {};
      result.expectedOutput = test.expectedOutput;
      result.expectedOutputFileError = test.expectedOutputFileError;

      this.assertResult(result);

      return result;
    };

    return Promise.all([
      // Do a sass.compile() on the input.scss file.
      this.compile(file, options).then(result => {
        test.result = result;
        return Promise.resolve();
      }),

      // Read the output.css file.
      readFile(outFile).then(expectedOutput => {
        // Convert fs' data buffer to a string.
        test.expectedOutput = expectedOutput.toString();
        return Promise.resolve();
      }).catch(error => {
        test.expectedOutputFileError = error;
        return Promise.resolve();
      })
    ]).then(() => {
      return Promise.resolve(handleResult(test));
    });
  }
}
