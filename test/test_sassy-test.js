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

    it('should not reset to the default value a previously set library path', function(done) {
      sassyTest.configurePaths({
        library: 'c/path'
      });
      sassyTest.configurePaths({});
      sassyTest.paths.library.should.equal('c/path');
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
    it('should return the path to the fixtures directory', function(done) {
      sassyTest.fixture().should.equal(path.join(__dirname, 'fixtures'));
      done();
    });

    it('should return the path to the sub-directory of fixtures', function(done) {
      sassyTest.fixture('fixture').should.equal(path.join(__dirname, 'fixtures/fixture'));
      done();
    });

    it('should accept multiple arguments', function(done) {
      sassyTest.fixture('fixture', 'sassy-test-mock.js').should.equal(path.join(__dirname, 'fixtures/fixture/sassy-test-mock.js'));
      done();
    });
  });

  describe('.render()', function() {
    it('should be able to @import from the fixtures directory', function(done) {
      sassyTest.render({
        data: '@import "init";\n.test {\n  content: $var-from-init;\n}'
      }, function(error, result) {
        result.css.should.equal('.test {\n  content: "a variable from fixtures/_init.scss"; }\n');
        done();
      });
    });

    it('should be able to @import from the library directory', function(done) {
      sassyTest.render({
        data: '@import "my-sass-library";\n@include my-sass-imported();'
      }, function(error, result) {
        result.css.should.equal('.test {\n  content: "my-sass-imported"; }\n');
        done();
      });
    });

    it('should fail to @import if no library directory specified', function(done) {
      var originalLibraryPath = sassyTest.paths.library;
      sassyTest.paths.library = '';
      sassyTest.render({
        data: '@import "my-sass-library";'
      }, function(error, result) {
        error.should.exist;
        should.not.exist(result);
        // Restore the original value.
        sassyTest.paths.library = originalLibraryPath;
        done();
      });
    });

    it('should pass its options to node-sass’s render()', function(done) {
      sassyTest.render({
        data: '@import "my-sass-library";\n@include my-sass-imported();',
        outputStyle: 'compressed'
      }, function(error, result) {
        result.css.should.equal('.test{content:"my-sass-imported"}\n');
        done();
      });
    });

    it('should return the node-sass result object', function(done) {
      sassyTest.render({
        data: '@import "my-sass-library";\n@include my-sass-imported();'
      }, function(error, result) {
        should.not.exist(error);
        result.should.be.object;
        result.should.have.property('css');
        result.css.should.be.string;
        result.should.have.property('map');
        should.not.exist(result.map);
        result.should.have.property('stats');
        result.css.should.be.object;
        done();
      });
    });

    it('should return the node-sass error', function(done) {
      sassyTest.render({
        data: '@import "non-existant-sass-library";'
      }, function(error, result) {
        should.not.exist(result);
        error.should.be.error;
        error.should.have.property('message');
        error.message.should.be.string;
        error.should.have.property('column');
        error.column.should.be.number;
        error.should.have.property('line');
        error.line.should.be.number;
        error.should.have.property('file');
        error.file.should.be.string;
        error.should.have.property('status');
        error.status.should.be.number;
        done();
      });
    });

    it('should convert the sourcemap into an object', function(done) {
      sassyTest.render({
        file: sassyTest.fixture('render/some-file.scss'),
        sourceMap: true,
        outFile: sassyTest.fixture('render/output.css')
      }, function(error, result) {
        should.not.exist(error);
        result.map.should.be.object;
        done();
      });
    });

    it('should throw an error if not given an options object', function(done) {
      sassyTest.render('', function(error, result) {
        should.not.exist(result);
        error.should.be.error;
        done();
      });
    });
  });

  describe('.renderFixture()', function() {
    it('should render the input.scss file of the given fixtures directory', function(done) {
      sassyTest.renderFixture('renderFixture/success', {}, function(error, result, expectedOutput) {
        should.not.exist(error);
        result.css.should.be.string;
        result.css.should.equal('.test {\n  content: "renderFixture() test"; }\n');
        expectedOutput.should.exist;
        done();
      });
    });

    it('should create a sourcemap', function(done) {
      sassyTest.renderFixture('renderFixture/success', {}, function(error, result, expectedOutput) {
        should.not.exist(error);
        expectedOutput.should.exist;
        result.map.should.be.object;
        result.map.file.should.equal('output.css');
        result.map.sources.should.be.array;
        result.map.sources.should.eql(['input.scss']);
        done();
      });
    });

    it('should return the node-sass result object', function(done) {
      sassyTest.renderFixture('renderFixture/success', {}, function(error, result, expectedOutput) {
        should.not.exist(error);
        expectedOutput.should.exist;
        result.should.be.object;
        result.should.have.property('css');
        result.css.should.be.string;
        result.should.have.property('map');
        result.map.should.be.object;
        result.should.have.property('stats');
        result.css.should.be.object;
        done();
      });
    });

    it('should return the node-sass error', function(done) {
      sassyTest.renderFixture('renderFixture/failure', {}, function(error, result, expectedOutput) {
        should.not.exist(result);
        expectedOutput.should.exist;
        error.should.be.error;
        error.should.have.property('message');
        error.message.should.be.string;
        error.message.should.equal('renderFixture failure.');
        error.should.have.property('column');
        error.column.should.be.number;
        error.should.have.property('line');
        error.line.should.be.number;
        error.should.have.property('file');
        error.file.should.be.string;
        error.should.have.property('status');
        error.status.should.be.number;
        done();
      });
    });

    it('should ignore the output error and return the node-sass error', function(done) {
      sassyTest.renderFixture('renderFixture/failureNoOutput', {}, function(error, result, expectedOutput) {
        should.not.exist(result);
        should.not.exist(expectedOutput);
        error.should.be.error;
        error.message.should.equal('renderFixture failure, not an output error.');
        error.should.not.have.property('code');
        done();
      });
    });

    it('should read the output.css file of the given fixtures directory', function(done) {
      sassyTest.renderFixture('renderFixture/success', {}, function(error, result, expectedOutput) {
        should.not.exist(error);
        result.should.exist;
        expectedOutput.should.be.string;
        expectedOutput.should.equal('.test {\n  content: "renderFixture() test"; }\n');
        done();
      });
    });

    it('should throw an error if it cannot find output.css', function(done) {
      sassyTest.renderFixture('renderFixture/missingOutput', {}, function(error, result, expectedOutput) {
        error.should.exist;
        error.code.should.equal('ENOENT');
        should.not.exist(result);
        should.not.exist(expectedOutput);
        done();
      });
    });

    it('should compare the expected result and the actual result', function(done) {
      sassyTest.renderFixture('renderFixture/success', {}, function(error, result, expectedOutput) {
        should.not.exist(error);
        result.should.exist;
        result.css.should.equal(expectedOutput);
        done();
      });
    });
  });
});
