[![Build Status](https://secure.travis-ci.org/JohnAlbin/sassy-test.png?branch=master)](http://travis-ci.org/JohnAlbin/sassy-test) [![Coverage Status](https://coveralls.io/repos/JohnAlbin/sassy-test/badge.svg?branch=master&service=github)](https://coveralls.io/github/JohnAlbin/sassy-test?branch=master)


# Sassy Test

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
  ├── helper.js
  └── test_mymodule.scss
```

With mocha, we can place a call to `before()` in the root of any test file and it will be run once before all the other tests in every `test_*.js` file. We can also `require()` files and assign them to the `global` object to make them available to all `test_*.js` files. A file called helper.js can be used to set up our mocha global requires and `before()`:

```JavaScript
'use strict';

// Globals for all test_*.js files.
global.path = require('path');
global.should = require('chai').should();
global.sassyTest = require('sassy-test');

// This before() is run before any test_*.js file.
before(function(done) {
  sassyTest.configurePaths({
    // Path to the Sass module we are testing.
    library: path.join(__dirname, '../sass')
    // Since our fixtures are in test/fixtures, we don't need to override
    // the default value by setting the "fixtures" path here.
  });
  done();
});
```

For more information, see the [`configurePaths()` documentation](http://johnalbin.github.io/sassy-test/module-sassy-test.html#.configurePaths).

Then in our test file, test_mymodule.js, we can use `sassyTest` to simplify our tests:

```JavaScript
'use strict';

describe('@import "mymodule";', function() {
  describe('@function my-modules-function()', function() {
    it('should test an aspect of this function', function(done) {
      // Sassy Test's renderFixture() will run a comparison test between the
      // rendered input.scss and the output.css found in the fixtures
      // sub-directory specified in its first parameter, in this case:
      // test/fixtures/my-modules-function
      sassyTest.renderFixture('my-modules-function', {}, function(error, result, expectedOutput) {
        // If we expect the comparison test to succeed, we just need to test
        // that no error occurred and then done(), but we can run other tests
        // here if we desire; both expectedOutput (the contents of output.css)
        // and node-sass's result object are available.
        should.not.exist(error);
        done();
      });
    });

    it('should throw an error in this situation', function(done) {
      // Sassy Test's renderFixture() can also test if your module produces an
      // intentional error with Sass' @error directive.
      sassyTest.renderFixture('my-modules-error', {}, function(error, result, expectedOutput) {
        // If the Sass in test/fixtures/my-modules-error/input.scss triggers an
        // @error in your module, you should expect the error object to exist
        // and to contain the error message from your module.
        error.should.exist;
        error.message.should.equal('Some helpful error message from your module.');
        done();
      });
    });

    it('should warn in another situation', function(done) {
      // Sassy Test's renderFixture() can also test if your module produces an
      // intentional warning message with Sass' @warn directive.
      sassyTest.renderFixture('my-modules-warn', {}, function(error, result, expectedOutput) {
        // If the Sass in test/fixtures/my-modules-warn/input.scss triggers a
        // @warn in your module, you should expect the result object to exist
        // and to contain the warn message from your module.
        should.not.exist(error);
        // Sassy Test adds two new arrays to node-sass' result object:
        // result.warn and result.debug are arrays of strings.
        result.warn[0].should.equal('Some helpful warning from your module.');
        done();
      });
    });
  });
});
```

[Full documentation of Sassy Test’s JavaScript API](http://johnalbin.github.io/sassy-test) is available online.

## Development

Forking, hacking, and tearing apart of this software is welcome! It's still very simple and could use additional features and conveniences.

After you've cloned this repository, run `npm install` and then you'll be able to run the module's mocha and eslint tests with `npm test`.

## Contributors

None but me yet. All are welcome! https://github.com/JohnAlbin/sassy-test/graphs/contributors
