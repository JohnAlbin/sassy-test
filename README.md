[![Coverage Status](https://coveralls.io/repos/JohnAlbin/sassy-test/badge.svg?branch=master&service=github)](https://coveralls.io/github/JohnAlbin/sassy-test?branch=master)

# Sassy Test

Sassy Test is a simple helper utility for creating unit tests of Sass modules.

Sassy Test models its testing after the unit tests in LibSass. The tests are a series of sub-folders in the "test/fixtures" directory that contain an "input" Sass file and an "output" CSS file. Its unit tests then reference a particular folder, compile the input.scss and compare the results to the output.css file.

To get started, just install Sassy Test as a development dependency of your Sass module with: `npm install --save-dev sassy-test`

Sassy Test will work with any Node.js test runner, like mocha or jasmine.

## A quick demo of Mocha + Sassy Test

Example project's root directory:
```
|   # You can put your module's Sass files anywhere.
|   # We use "sass" as an example.
├─┬ sass/
│ └── _mymodule.scss
│   # Mocha prefers your tests to live in a "test" folder.
│   # Sassy Test will automatically find your fixtures if
│   # they are in /test/fixtures, but you can change the
│   # path with configurePaths().
└─┬ test/
  ├─┬ fixtures/
  │ │   # Test fixtures can be deeply nested.
  │ ├─┬ my-modules-function/
  │ │ ├── input.scss
  │ │ └── output.css
  │ ├─┬ my-modules-error/
  │ │ ├── input.scss
  │ │ └── output.css
  │ └─┬ my-modules-warn/
  │   ├── input.scss
  │   └── output.css
  └── test_mymodule.scss
```

Then in our test file, test/test_mymodule.js, we can use `sassyTest` to simplify our tests:

```JavaScript
import path from 'node:path';
import { expect } from 'chai';
import SassyTest from 'sassy-test';

const sassyTest = new SassyTest({
  // Path to the Sass module we are testing and its dependencies.
  loadPaths: [
    path.join(__dirname, '../sass'),
    path.join(__dirname, '../node_modules/breakpoint-sass/stylesheets')
  ]
  // Since our fixtures are in test/fixtures, we don't need to override
  // the default value by setting the "fixtures" path here.
  // fixtures: path.join(__dirname, 'fixtures'),
});

describe('@import "mymodule";', function() {
  describe('@function my-modules-function()', function() {
    it('should test an aspect of this function', async function() {
      // Sassy Test's compileFixture() will run a comparison test between the
      // compiled input.scss and the output.css found in the fixtures
      // sub-directory specified in its first parameter, in this case:
      // test/fixtures/my-modules-function
      return sassyTest.compileFixture('my-modules-function')
        .catch(error => {
          // If we expect the comparison test to succeed, we just need to test
          // that no error occurred.
          expect(error).to.not.exist;
        })
        .then(result => {
          // No additional assertions are needed, but we can run other tests
          // here if we desire.
        });
    });

    it('should throw an error in this situation', async function() {
      // Sassy Test's compileFixture() can also test if your module produces an
      // intentional error with Sass' @error directive.
      return sassyTest.compileFixture('my-modules-error')
        .catch(error => {
          // If the Sass in test/fixtures/my-modules-error/input.scss triggers an
          // @error in your module, you should expect the error object to exist
          // and to contain the error message from your module.
          expect(error).to.exist;
          expect(error.message).to.equal('Some helpful error message from your module.');
        });
    });

    it('should warn in another situation', async function() {
      // Sassy Test's compileFixture() can also test if your module produces an
      // intentional warning message with Sass' @warn directive.
      return sassyTest.compileFixture('my-modules-warn')
        .catch(error => {
          // If the Sass in test/fixtures/my-modules-warn/input.scss triggers a
          // @warn in your module, you should expect the result object to exist
          // and to contain the warn message from your module.
          expect(error).to.not.exist;
        })
        .then(result => {
          // Sassy Test adds two new arrays to sass' result object:
          // result.warn and result.debug are arrays of strings.
          expect(result.warn[0]).to.equal('Some helpful warning from your module.');
        });
    });
  });
});
```

For more information about configuring a SassyTest object, see the [`configurePaths()` method documentation](https://johnalbin.github.io/sassy-test/module-sassy-test-SassyTest.html#configurePaths).

## JavaScript Promises

SassyTest's `compile()`, `compileString()` and `compileFixture()` methods return a `Promise`.

```JavaScript
describe('@import "mymodule";', function() {
  describe('@function my-modules-function()', function() {
    it('should test an aspect of this function', function() {
      // Mocha accepts sassyTest's returned Promise.
      return sassyTest.compileFixture('my-modules-function');
    });

    it('should throw an error in this situation', function() {
      return sassyTest.compileFixture('my-modules-error').then(function(result) {
        // If the expected Sass error does not occur, we need to fail the test.
        expect(result).to.not.exist('An error should have occurred');
      }).catch(function(error) {
        expect(error).to.exist;
        expect(error.message).to.include('Some helpful error message from your module.');
      });
    });

    it('should warn in another situation', function() {
      return sassyTest.compileFixture('my-modules-warn').then(function(result) {
        expect(result.warn[0]).to.equal('Some helpful warning from your module.');
      });
    });
  });
});
```

[Full documentation of Sassy Test’s JavaScript API](https://johnalbin.github.io/sassy-test/) is available online.

## Development

Forking, hacking, and tearing apart of this software is welcome! It's still very simple and could use additional features and conveniences.

After you've cloned this repository, run `npm install` and then you'll be able to run the module's mocha and eslint tests with `npm test`.

## Contributors

None but me yet. All are welcome! https://github.com/JohnAlbin/sassy-test/graphs/contributors
