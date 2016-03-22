'use strict';

var expect = require('chai').expect,
  path = require('path'),
  sass = require('node-sass'),
  sassyTest = require('../lib/sassy-test.js');

describe('sassy-test', function() {
  describe('API', function() {
    ['configurePaths',
      'fixture',
      'render',
      'renderFixture'
    ].forEach(function(method) {
      it('has ' + method + '() method', function(done) {
        expect(sassyTest).to.have.property(method);
        expect(sassyTest[method]).to.be.function;
        done();
      });
    });
  });

  describe('.configurePaths()', function() {
    it('should not override the default fixtures path', function(done) {
      expect(path.relative(
        path.join(__dirname, '../../../'),
        sassyTest.paths.fixtures
      )).to.equal('test/fixtures');

      // Simulate sassy-test being installed in node-modules/sassy-test/.
      var sassyTestMock = require('./fixtures/node_modules/sassy-test-mock');

      expect(path.relative(
        path.join(__dirname, '../'),
        sassyTestMock.paths.fixtures
      )).to.equal('test/fixtures');
      done();
    });

    it('should set the fixtures path', function(done) {
      sassyTest.configurePaths({
        fixtures: 'a/path'
      });
      expect(sassyTest.paths.fixtures).to.equal('a/path');
      done();
    });

    it('should set the includePaths path', function(done) {
      sassyTest.configurePaths({
        includePaths: ['b/path']
      });
      expect(sassyTest.paths.includePaths[0]).to.equal('b/path');
      done();
    });

    it('should not reset to the default value a previously set includePaths path', function(done) {
      sassyTest.configurePaths({
        includePaths: ['c/path']
      });
      sassyTest.configurePaths({});
      expect(sassyTest.paths.includePaths[0]).to.equal('c/path');
      done();
    });

    after(function(done) {
      // Reset the paths for the rest of the tests.
      sassyTest.configurePaths({
        fixtures: path.join(__dirname, 'fixtures'),
        includePaths: [path.join(__dirname, 'fixtures/my-sass-library')]
      });
      done();
    });
  });

  describe('.fixture()', function() {
    it('should return the path to the fixtures directory', function(done) {
      expect(sassyTest.fixture()).to.equal(path.join(__dirname, 'fixtures'));
      done();
    });

    it('should return the path to the sub-directory of fixtures', function(done) {
      expect(sassyTest.fixture('fixture')).to.equal(path.join(__dirname, 'fixtures/fixture'));
      done();
    });

    it('should accept multiple arguments', function(done) {
      expect(sassyTest.fixture('fixture', 'sassy-test-mock.js')).to.equal(path.join(__dirname, 'fixtures/fixture/sassy-test-mock.js'));
      done();
    });
  });

  describe('.render()', function() {
    it('should be able to @import from the fixtures directory', function(done) {
      sassyTest.render({
        data: '@import "init";\n.test {\n  content: $var-from-init;\n}'
      }, function(error, result) {
        expect(result.css).to.equal('.test {\n  content: "a variable from fixtures/_init.scss"; }\n');
        done();
      });
    });

    it('should be able to @import from the includePaths directory', function(done) {
      sassyTest.render({
        data: '@import "my-sass-library";\n@include my-sass-imported();'
      }, function(error, result) {
        expect(result.css).to.equal('.test {\n  content: "my-sass-imported"; }\n');
        done();
      });
    });

    it('should fail to @import if no includePaths directory specified', function(done) {
      var originalIncludePaths = sassyTest.paths.includePaths;
      sassyTest.paths.includePaths = [];
      sassyTest.render({
        data: '@import "my-sass-library";'
      }, function(error, result) {
        expect(error).to.exist;
        expect(result).to.not.exist;
        // Restore the original value.
        sassyTest.paths.includePaths = originalIncludePaths;
        done();
      });
    });

    it('should pass its options to node-sass’s render()', function(done) {
      sassyTest.render({
        data: '@import "my-sass-library";\n@include my-sass-imported();',
        outputStyle: 'compressed'
      }, function(error, result) {
        expect(result.css).to.equal('.test{content:"my-sass-imported"}\n');
        done();
      });
    });

    it('should not override functions passed to it', function(done) {
      sassyTest.render({
        data: '.test { content: test-function(MYTEST); }',
        outputStyle: 'compressed',
        functions: {
          'test-function($val)': function(val) {
            return sass.types.String('"You have called test-function(' + val.getValue() + ')."');
          }
        }
      }, function(error, result) {
        expect(result.css).to.equal('.test{content:"You have called test-function(MYTEST)."}\n');
        done();
      });
    });

    it('should return the node-sass result object', function(done) {
      sassyTest.render({
        data: '@import "my-sass-library";\n@include my-sass-imported();'
      }, function(error, result) {
        expect(error).to.not.exist;
        expect(result).to.be.object;
        expect(result).to.have.property('css');
        expect(result.css).to.be.string;
        expect(result).to.have.property('map');
        expect(result.map).to.not.exist;
        expect(result).have.property('stats');
        expect(result.css).to.be.object;
        expect(result).to.have.property('warn');
        expect(result.warn).to.be.array;
        expect(result).to.have.property('debug');
        expect(result.debug).to.be.array;
        done();
      });
    });

    it('should return the node-sass error', function(done) {
      sassyTest.render({
        data: '@import "non-existant-sass-library";'
      }, function(error, result) {
        expect(result).to.not.exist;
        expect(error).to.be.error;
        expect(error).to.have.property('message');
        expect(error.message).to.be.string;
        expect(error).to.have.property('column');
        expect(error.column).to.be.number;
        expect(error).to.have.property('line');
        expect(error.line).to.be.number;
        expect(error).to.have.property('file');
        expect(error.file).to.be.string;
        expect(error).to.have.property('status');
        expect(error.status).to.be.number;
        done();
      });
    });

    it('should convert the sourcemap into an object', function(done) {
      sassyTest.render({
        file: sassyTest.fixture('render/some-file.scss'),
        sourceMap: true,
        outFile: sassyTest.fixture('render/output.css')
      }, function(error, result) {
        expect(error).to.not.exist;
        expect(result.map).to.be.object;
        done();
      });
    });

    it('should throw an error if not given an options object', function(done) {
      sassyTest.render('', function(error, result) {
        expect(result).to.not.exist;
        expect(error).to.be.error;
        done();
      });
    });

    it('should capture @warn messages', function(done) {
      sassyTest.render({
        file: sassyTest.fixture('render/some-warn.scss')
      }, function(error, result) {
        expect(error).to.not.exist;
        expect(result.warn[0]).to.equal('render() test warning');
        done();
      });
    });

    it('should capture @debug messages', function(done) {
      sassyTest.render({
        file: sassyTest.fixture('render/some-debug.scss')
      }, function(error, result) {
        expect(error).to.not.exist;
        expect(result.debug[0]).to.equal('render() test debug');
        done();
      });
    });
  });

  describe('.renderFixture()', function() {
    it('should render the input.scss file of the given fixtures directory', function(done) {
      sassyTest.renderFixture('renderFixture/success', {}, function(error, result, expectedOutput) {
        expect(error).to.not.exist;
        expect(result.css).to.be.string;
        expect(result.css).to.equal('.test {\n  content: "renderFixture() test"; }\n');
        expect(expectedOutput).to.exist;
        done();
      });
    });

    it('should create a sourcemap', function(done) {
      sassyTest.renderFixture('renderFixture/success', {}, function(error, result, expectedOutput) {
        expect(error).to.not.exist;
        expect(expectedOutput).to.exist;
        expect(result.map).to.be.object;
        expect(result.map.file).to.equal('output.css');
        expect(result.map.sources).to.be.array;
        expect(result.map.sources).to.deep.equal(['input.scss']);
        done();
      });
    });

    it('should return the node-sass result object', function(done) {
      sassyTest.renderFixture('renderFixture/success', {}, function(error, result, expectedOutput) {
        expect(error).to.not.exist;
        expect(expectedOutput).to.exist;
        expect(result).to.be.object;
        expect(result).to.have.property('css');
        expect(result.css).to.be.string;
        expect(result).to.have.property('map');
        expect(result.map).to.be.object;
        expect(result).to.have.property('stats');
        expect(result.css).to.be.object;
        done();
      });
    });

    it('should return the node-sass error', function(done) {
      sassyTest.renderFixture('renderFixture/failure', {}, function(error, result, expectedOutput) {
        expect(result).to.not.exist;
        expect(expectedOutput).to.exist;
        expect(error).to.be.error;
        expect(error).to.have.property('message');
        expect(error.message).to.be.string;
        expect(error.message).to.equal('renderFixture failure.');
        expect(error).to.have.property('column');
        expect(error.column).to.be.number;
        expect(error).to.have.property('line');
        expect(error.line).to.be.number;
        expect(error).to.have.property('file');
        expect(error.file).to.be.string;
        expect(error).to.have.property('status');
        expect(error.status).to.be.number;
        done();
      });
    });

    it('should ignore the output error and return the node-sass error', function(done) {
      sassyTest.renderFixture('renderFixture/failureNoOutput', {}, function(error, result, expectedOutput) {
        expect(result).to.not.exist;
        expect(expectedOutput).to.not.exist;
        expect(error).to.be.error;
        expect(error.message).to.equal('renderFixture failure, not an output error.');
        expect(error).to.not.have.property('code');
        done();
      });
    });

    it('should read the output.css file of the given fixtures directory', function(done) {
      sassyTest.renderFixture('renderFixture/success', {}, function(error, result, expectedOutput) {
        expect(error).to.not.exist;
        expect(result).to.exist;
        expect(expectedOutput).to.be.string;
        expect(expectedOutput).to.equal('.test {\n  content: "renderFixture() test"; }\n');
        done();
      });
    });

    it('should throw an error if it cannot find output.css', function(done) {
      sassyTest.renderFixture('renderFixture/missingOutput', {}, function(error, result, expectedOutput) {
        expect(error).to.exist;
        expect(error.code).to.equal('ENOENT');
        expect(result).to.not.exist;
        expect(expectedOutput).to.not.exist;
        done();
      });
    });

    it('should compare the expected result and the actual result', function(done) {
      sassyTest.renderFixture('renderFixture/success', {}, function(error, result, expectedOutput) {
        expect(error).to.not.exist;
        expect(result).to.exist;
        expect(result.css).to.equal(expectedOutput);
        done();
      });
    });
  });
});
