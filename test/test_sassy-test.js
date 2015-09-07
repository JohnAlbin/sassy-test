'use strict';

/* eslint-disable no-unused-vars */
var path = require('path'),
  sassyTest = require('../lib/sassy-test.js'),
  should = require('chai').should();
/* eslint-enable no-unused-vars */

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
    it('should not override the default fixtures path', function(done) {
      path.relative(
        path.join(__dirname, '../../../'),
        sassyTest.paths.fixtures
      ).should.equal('test/fixtures');

      // Simulate sassy-test being installed in node-modules/sassy-test/.
      var sassyTestMock = require('./fixtures/node_modules/sassy-test-mock');

      path.relative(
        path.join(__dirname, '../'),
        sassyTestMock.paths.fixtures
      ).should.equal('test/fixtures');
      done();
    });

    it('should set the fixtures path', function(done) {
      sassyTest.configurePaths({
        fixtures: 'a/path'
      });
      sassyTest.paths.fixtures.should.equal('a/path');
      done();
    });

    it('should set the library path', function(done) {
      sassyTest.configurePaths({
        library: 'b/path'
      });
      sassyTest.paths.library.should.equal('b/path');
      done();
    });

    after(function(done) {
      // Reset the paths for the rest of the tests.
      sassyTest.configurePaths({
        fixtures: path.join(__dirname, 'fixtures'),
        library: path.join(__dirname, 'fixtures/my-sass-library')
      });
      done();
    });
  });

  describe('.fixture()', function() {
    it('should return the path to the fixtures directory');
    it('should return the path to the sub-directory of fixtures');
    it('should accept multiple arguments');
  });

  describe('.render()', function() {
    it('should be able to @import from the fixtures directory');

    it('should be able to @import from the library directory', function(done) {
      sassyTest.render({
        data: '@import "my-sass-library";\n@include my-sass-imported();'
      }, function(err, result) {
        result.css.should.equal('.test {\n  content: "my-sass-imported"; }\n');
        done();
      });
    });

    it('should pass its options to node-sass’s render()');
    it('should return the node-sass result object');
    it('should return the node-sass error');
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
