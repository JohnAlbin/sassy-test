[![Build Status](https://secure.travis-ci.org/JohnAlbin/sassy-test.png?branch=master)](http://travis-ci.org/JohnAlbin/sassy-test/builds) [![Coverage Status](https://coveralls.io/repos/JohnAlbin/sassy-test/badge.svg?branch=master&service=github)](https://coveralls.io/github/JohnAlbin/sassy-test?branch=master)


# Sassy Test

[![Greenkeeper badge](https://badges.greenkeeper.io/JohnAlbin/sassy-test.svg)](https://greenkeeper.io/)

Sassy Test is a simple helper utility for creating unit tests of Sass modules.

Sassy Test models its testing after the unit tests in LibSass. LibSass has a series of sub-folders in its "test/fixtures" directory that contain an "input" Sass file and an "output" CSS file. Its unit tests then reference a particular folder, render the input.scss and compare the results to the output.css file.

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
'use strict';

var path = require('path');
var expect = require('chai').expect;
var SassyTest = require('sassy-test');

var sassyTest = new SassyTest({
  // Path to the Sass module we are testing and its dependencies.
  includePaths: [
    path.join(__dirname, '../sass'),
    path.join(__dirname, '../node_modules/breakpoint-sass/stylesheets')
  ]
  // Since our fixtures are in test/fixtures, we don't need to override
  // the default value by setting the "fixtures" path here.
  // fixtures: path.join(__dirname, 'fixtures'),
});

describe('@import "mymodule";', function() {
  describe('@function my-modules-function()', function() {
    it('should test an aspect of this function', function(done) {
      // Sassy Test's renderFixture() will run a comparison test between the
      // rendered input.scss and the output.css found in the fixtures
      // sub-directory specified in its first parameter, in this case:
      // test/fixtures/my-modules-function
      sassyTest.renderFixture('my-modules-function', {}, function(error, result) {
        // If we expect the comparison test to succeed, we just need to test
        // that no error occurred and then done(), but we can run other tests
        // here if we desire.
        expect(error).to.not.exist;
        done();
      });
    });

    it('should throw an error in this situation', function(done) {
      // Sassy Test's renderFixture() can also test if your module produces an
      // intentional error with Sass' @error directive.
      sassyTest.renderFixture('my-modules-error', {}, function(error, result) {
        // If the Sass in test/fixtures/my-modules-error/input.scss triggers an
        // @error in your module, you should expect the error object to exist
        // and to contain the error message from your module.
        expect(error).to.exist;
        expect(error.message).to.equal('Some helpful error message from your module.');
        done();
      });
    });

    it('should warn in another situation', function(done) {
      // Sassy Test's renderFixture() can also test if your module produces an
      // intentional warning message with Sass' @warn directive.
      sassyTest.renderFixture('my-modules-warn', {}, function(error, result) {
        // If the Sass in test/fixtures/my-modules-warn/input.scss triggers a
        // @warn in your module, you should expect the result object to exist
        // and to contain the warn message from your module.
        expect(error).to.not.exist;
        // Sassy Test adds two new arrays to node-sass' result object:
        // result.warn and result.debug are arrays of strings.
        expect(result.warn[0]).to.equal('Some helpful warning from your module.');
        done();
      });
    });
  });
});
```

For more information about configuring a SassyTest object, see the [`configurePaths()` method documentation](https://johnalbin.github.io/sassy-test/module-sassy-test-SassyTest.html#configurePaths).

## JavaScript Promises

SassyTest's `render()` and `renderFixture()` methods will return a `Promise` if you don't provide a callback. Promises are available with Node.js 4.0.0 and later, or a Promise-compliant module on earlier versions of Node.js.

```JavaScript
describe('@import "mymodule";', function() {
  describe('@function my-modules-function()', function() {
    it('should test an aspect of this function', function() {
      // Mocha accepts sassyTest's returned Promise.
      return sassyTest.renderFixture('my-modules-function');
    });

    it('should throw an error in this situation', function() {
      return sassyTest.renderFixture('my-modules-error').then(function(result) {
        // If the expected Sass error does not occur, we need to fail the test.
        throw new Error('An error should have occurred');
      }).catch(function(error) {
        expect(error).to.exist;
        expect(error.message).to.include('Some helpful error message from your module.');
      });
    });

    it('should warn in another situation', function() {
      return sassyTest.renderFixture('my-modules-warn').then(function(result) {
        expect(result.warn[0]).to.equal('Some helpful warning from your module.');
      });
    });
  });
});
```

[Full documentation of Sassy Test’s JavaScript API](https://johnalbin.github.io/sassy-test) is available online.

## Development

Forking, hacking, and tearing apart of this software is welcome! It's still very simple and could use additional features and conveniences.

After you've cloned this repository, run `npm install` and then you'll be able to run the module's mocha and eslint tests with `npm test`.

## Contributors

None but me yet. All are welcome! https://github.com/JohnAlbin/sassy-test/graphs/contributors
