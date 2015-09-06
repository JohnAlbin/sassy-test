'use strict';

/* eslint-disable no-unused-vars */
var should = require('chai').should(),
  sassyTest = require('../'),
  path = require('path');
/* eslint-enable no-unused-vars */

sassyTest.configurePaths({
  fixtures: path.join(__dirname, 'fixtures'),
  library: path.join(__dirname, 'fixtures/my-sass-library')
});

describe('sassy-test', function() {
  describe('API', function() {
    ['configurePaths',
      'fixture',
      'render',
      'renderFixture'
    ].forEach(function(method) {
      it('has ' + method + '() method', function(done) {
        sassyTest.should.have.property(method);
        sassyTest[method].should.be.function;
        done();
      });
    });
  });

  describe('.configurePaths()', function() {
    it('should not override the default fixtures path');
    it('should set the fixtures path');
    it('should set the library path');
  });

  describe('.fixture()', function() {
    it('should return the path to the fixtures directory');
    it('should return the path to the sub-directory of fixtures');
    it('should accept multiple arguments');
  });

  describe('.render()', function() {
    it('should be able to @import from the fixtures directory');
    it('should be able to @import from the library directory');
    it('should pass its options to node-sass’s render()');
    it('should pass its callback to node-sass’s render()');
    it('should catch errors and return it back to the callback');
  });

  describe('.renderFixture()', function() {
    it('should render the input.scss file of the given fixtures directory');
    it('should create a sourcemap');
    it('should return the node-sass result object');
    it('should return the node-sass error');
    it('should read the output.css file of the given fixtures directory');
    it('should throw an error if it cannot find output.css');
    it('should compare the expected result and the actual result');
  });
});
