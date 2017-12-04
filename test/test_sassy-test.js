'use strict';

var expect = require('chai').expect,
  path = require('path'),
  Promise = require('bluebird'),
  sass = require('node-sass');

var SassyTest = require('../src/sassy-test.js');

describe('sassy-test', function() {
  describe('API', function() {
    ['configurePaths',
      'fixture',
      'render',
      'renderFixture'
    ].forEach(function(method) {
      it('has ' + method + '() method', function(done) {
        var sassyTest = new SassyTest();
        expect(sassyTest).to.have.property(method);
        expect(sassyTest[method]).to.be.function;
        done();
      });
    });
  });

  describe('SassyTest constructor', function() {
    it('should initialize the object', function(done) {
      var obj = new SassyTest();
      expect(obj).to.have.property('paths');
      expect(obj.paths).to.have.property('fixtures');
      expect(obj.paths.fixtures).to.equal(path.join(__dirname, '../../../', 'test/fixtures'));
      expect(obj.paths).to.have.property('includePaths');
      done();
    });

    it('should initialize the given data', function(done) {
      var obj = new SassyTest({
        fixtures: 'example',
        includePaths: ['include-example']
      });
      expect(obj.paths.fixtures).to.equal('example');
      expect(obj.paths.includePaths).to.deep.equal(['include-example']);
      done();
    });
  });

  describe('.configurePaths()', function() {
    it('should not override the default fixtures path', function(done) {
      var sassyTest = new SassyTest();
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
      var sassyTest = new SassyTest();
      sassyTest.configurePaths({
        fixtures: 'a/path'
      });
      expect(sassyTest.paths.fixtures).to.equal('a/path');
      done();
    });

    it('should set the includePaths path', function(done) {
      var sassyTest = new SassyTest();
      sassyTest.configurePaths({
        includePaths: ['b/path']
      });
      expect(sassyTest.paths.includePaths[0]).to.equal('b/path');
      done();
    });

    it('should not reset to the default value a previously set includePaths path', function(done) {
      var sassyTest = new SassyTest();
      sassyTest.configurePaths({
        includePaths: ['c/path']
      });
      sassyTest.configurePaths({});
      expect(sassyTest.paths.includePaths[0]).to.equal('c/path');
      done();
    });
  });

  describe('.fixture()', function() {
    before(function(done) {
      this.sassyTest = new SassyTest({
        fixtures: path.join(__dirname, 'fixtures')
      });
      done();
    });

    it('should return the path to the fixtures directory', function(done) {
      expect(this.sassyTest.fixture()).to.equal(path.join(__dirname, 'fixtures'));
      done();
    });

    it('should return the path to the sub-directory of fixtures', function(done) {
      expect(this.sassyTest.fixture('fixture')).to.equal(path.join(__dirname, 'fixtures/fixture'));
      done();
    });

    it('should accept multiple arguments', function(done) {
      expect(this.sassyTest.fixture('fixture', 'sassy-test-mock.js')).to.equal(path.join(__dirname, 'fixtures/fixture/sassy-test-mock.js'));
      done();
    });
  });

  describe('.render()', function() {
    before(function(done) {
      this.sassyTest = new SassyTest({
        fixtures: path.join(__dirname, 'fixtures'),
        includePaths: [path.join(__dirname, 'fixtures/my-sass-library')]
      });
      done();
    });

    it('should be able to @import from the fixtures directory', function(done) {
      this.sassyTest.render({
        data: '@import "init";\n.test {\n  content: $var-from-init;\n}'
      }, function(error, result) {
        expect(result.css).to.equal('.test {\n  content: "a variable from fixtures/_init.scss"; }\n');
        done();
      });
    });

    it('should be able to @import from the includePaths directory', function(done) {
      this.sassyTest.render({
        data: '@import "my-sass-library";\n@include my-sass-imported();'
      }, function(error, result) {
        expect(result.css).to.equal('.test {\n  content: "my-sass-imported"; }\n');
        done();
      });
    });

    it('should fail to @import if no includePaths directory specified', function(done) {
      var originalIncludePaths = this.sassyTest.paths.includePaths,
        self = this;
      this.sassyTest.paths.includePaths = [];
      this.sassyTest.render({
        data: '@import "my-sass-library";'
      }, function(error, result) {
        expect(error).to.exist;
        expect(result).to.not.exist;
        // Restore the original value.
        self.sassyTest.paths.includePaths = originalIncludePaths;
        done();
      });
    });

    it('should pass its options to node-sass’s render()', function(done) {
      this.sassyTest.render({
        data: '@import "my-sass-library";\n@include my-sass-imported();',
        outputStyle: 'compressed'
      }, function(error, result) {
        expect(result.css).to.equal('.test{content:"my-sass-imported"}\n');
        done();
      });
    });

    it('should not override functions passed to it', function(done) {
      this.sassyTest.render({
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
      this.sassyTest.render({
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
      this.sassyTest.render({
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
      this.sassyTest.render({
        file: this.sassyTest.fixture('render/some-file.scss'),
        sourceMap: true,
        outFile: this.sassyTest.fixture('render/output.css')
      }, function(error, result) {
        expect(error).to.not.exist;
        expect(result.map).to.be.object;
        done();
      });
    });

    it('should throw an error if not given an options object', function(done) {
      var self = this;
      this.sassyTest.render('', function(error, result) {
        expect(result).to.not.exist;
        expect(error).to.be.error;
        expect(error.message).to.equal('Options parameter of render method must be an object.');

        // Make render() return a Promise.
        return self.sassyTest.render('').then(function(result) {
          expect(result).to.not.exist;
          done();
        }).catch(function(error) {
          expect(error).to.be.error;
          expect(error.message).to.equal('Options parameter of render method must be an object.');
          done();
        });
      });
    });

    it('should capture @warn messages', function(done) {
      this.sassyTest.render({
        file: this.sassyTest.fixture('render/some-warn.scss')
      }, function(error, result) {
        expect(error).to.not.exist;
        expect(result.warn[0]).to.equal('render() test warning');
        done();
      });
    });

    it('should capture @debug messages', function(done) {
      this.sassyTest.render({
        file: this.sassyTest.fixture('render/some-debug.scss')
      }, function(error, result) {
        expect(error).to.not.exist;
        expect(result.debug[0]).to.equal('render() test debug');
        done();
      });
    });

    it('should return a Promise if not given a callback', function() {
      var obj = this.sassyTest.render({
        data: '@import "my-sass-library";\n@include my-sass-imported();'
      });
      expect(obj).to.be.instanceof(Promise);
      return obj.then(function(result) {
        expect(result.css).to.equal('.test {\n  content: "my-sass-imported"; }\n');
        expect(result).to.have.property('warn');
        expect(result.warn).to.be.array;
        expect(result).to.have.property('debug');
        expect(result.debug).to.be.array;
      }).catch(function(error) {
        expect(error).to.not.exist;
      });
    });
  });

  describe('.assertResult()', function() {
    it('should throw an error if result.expectedOutputFileError exists', function(done) {
      var sassyTest = new SassyTest(),
        result = {
          sassError: null,
          expectedOutputFileError: new Error('Test output error'),
          css: '.output {}',
          expectedOutput: '.output {}'
        };
      expect(sassyTest.assertResult.bind(null, result)).to.throw(Error, 'Test output error');
      done();
    });

    it('should throw an error if result.css does not match result.expectedOutput', function(done) {
      var sassyTest = new SassyTest(),
        result = {
          sassError: null,
          expectedOutputFileError: null,
          css: '.output {}',
          expectedOutput: '.output.does-not-match {}'
        };
      expect(sassyTest.assertResult.bind(null, result)).to.throw(Error, '\'.output {}\' === \'.output.does-not-match {}\'');
      done();
    });
  });

  describe('.renderFixture()', function() {
    before(function(done) {
      this.sassyTest = new SassyTest({
        fixtures: path.join(__dirname, 'fixtures'),
        includePaths: [path.join(__dirname, 'fixtures/my-sass-library')]
      });
      // Turn off the assertions to prevent errors from breaking these tests.
      this.sassyTest.assertResult = function() {};
      done();
    });

    it('should render the input.scss file of the given fixtures directory', function(done) {
      this.sassyTest.renderFixture('renderFixture/success', {}, function(error, result) {
        expect(error).to.not.exist;
        expect(result.css).to.be.string;
        expect(result.css).to.equal('.test {\n  content: "renderFixture() test"; }\n');
        expect(result.expectedOutput).to.exist;
        done();
      });
    });

    it('should create a sourcemap', function(done) {
      this.sassyTest.renderFixture('renderFixture/success', {}, function(error, result) {
        expect(error).to.not.exist;
        expect(result.expectedOutput).to.exist;
        expect(result.map).to.be.object;
        expect(result.map.file).to.equal('output.css');
        expect(result.map.sources).to.be.array;
        expect(result.map.sources).to.deep.equal(['input.scss']);
        done();
      });
    });

    it('should return the node-sass result object', function(done) {
      this.sassyTest.renderFixture('renderFixture/success', {}, function(error, result) {
        expect(error).to.not.exist;
        expect(result.expectedOutput).to.exist;
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
      this.sassyTest.renderFixture('renderFixture/failureSass', {}, function(error, result) {
        expect(result).to.not.exist;
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
      this.sassyTest.renderFixture('renderFixture/failureNoOutput', {}, function(error, result) {
        expect(result).to.not.exist;
        expect(error).to.be.error;
        expect(error.message).to.equal('renderFixture failure, not an output error.');
        expect(error).to.not.have.property('code');
        done();
      });
    });

    it('should read the output.css file of the given fixtures directory', function(done) {
      this.sassyTest.renderFixture('renderFixture/success', {}, function(error, result) {
        expect(error).to.not.exist;
        expect(result).to.exist;
        expect(result.expectedOutput).to.be.string;
        expect(result.expectedOutput).to.equal('.test {\n  content: "renderFixture() test"; }\n');
        done();
      });
    });

    it('should report an error if it cannot find output.css', function(done) {
      this.sassyTest.renderFixture('renderFixture/missingOutput', {}, function(error, result) {
        expect(result.expectedOutputFileError).to.exist;
        expect(result.expectedOutputFileError.code).to.equal('ENOENT');
        done();
      });
    });

    it('should compare the expected result and the actual result', function(done) {
      this.sassyTest.renderFixture('renderFixture/success', {}, function(error, result) {
        expect(error).to.not.exist;
        expect(result).to.exist;
        expect(result.css).to.equal(result.expectedOutput);
        done();
      });
    });

    describe('if not given a callback function', function() {
      it('should return a Promise', function() {
        var obj = this.sassyTest.renderFixture('renderFixture/success', {});
        expect(obj).to.be.instanceof(Promise);
        return obj;
      });

      it('should render the input.scss file of the given fixtures directory', function() {
        this.sassyTest.renderFixture('renderFixture/success', {}).catch(function(error) {
          expect(error).to.not.exist;
        }).then(function(result) {
          expect(result.css).to.be.string;
          expect(result.css).to.equal('.test {\n  content: "renderFixture() test"; }\n');
          expect(result.expectedOutput).to.exist;
        });
      });

      it('should create a sourcemap', function() {
        this.sassyTest.renderFixture('renderFixture/success').catch(function(error) {
          expect(error).to.not.exist;
        }).then(function(result) {
          expect(result.expectedOutput).to.exist;
          expect(result.map).to.be.object;
          expect(result.map.file).to.equal('output.css');
          expect(result.map.sources).to.be.array;
          expect(result.map.sources).to.deep.equal(['input.scss']);
        });
      });

      it('should return the node-sass result object', function() {
        this.sassyTest.renderFixture('renderFixture/success', {}).catch(function(error) {
          expect(error).to.not.exist;
        }).then(function(result) {
          expect(result.expectedOutput).to.exist;
          expect(result).to.be.object;
          expect(result).to.have.property('css');
          expect(result.css).to.be.string;
          expect(result).to.have.property('map');
          expect(result.map).to.be.object;
          expect(result).to.have.property('stats');
          expect(result.css).to.be.object;
        });
      });

      it('should return the node-sass error', function() {
        this.sassyTest.renderFixture('renderFixture/failureSass', {}).then(function(result) {
          expect(result).to.not.exist;
        }).catch(function(error) {
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
        });
      });

      it('should ignore the output error and return the node-sass error', function() {
        this.sassyTest.renderFixture('renderFixture/failureNoOutput', {}).then(function(result) {
          expect(result).to.not.exist;
        }).catch(function(error) {
          expect(error).to.be.error;
          expect(error.message).to.equal('renderFixture failure, not an output error.');
          expect(error).to.not.have.property('code');
        });
      });

      it('should read the output.css file of the given fixtures directory', function() {
        this.sassyTest.renderFixture('renderFixture/success', {}).catch(function(error) {
          expect(error).to.not.exist;
        }).then(function(result) {
          expect(result).to.exist;
          expect(result.expectedOutput).to.be.string;
          expect(result.expectedOutput).to.equal('.test {\n  content: "renderFixture() test"; }\n');
        });
      });

      it('should report an error if it cannot find output.css', function() {
        this.sassyTest.renderFixture('renderFixture/missingOutput', {}).catch(function(error) {
          expect(error).to.not.exist;
        }).then(function(result) {
          expect(result.expectedOutputFileError).to.exist;
          expect(result.expectedOutputFileError.code).to.equal('ENOENT');
        });
      });

      it('should compare the expected result and the actual result', function() {
        this.sassyTest.renderFixture('renderFixture/success', {}).catch(function(error) {
          expect(error).to.not.exist;
        }).then(function(result) {
          expect(result).to.exist;
          expect(result.css).to.equal(result.expectedOutput);
        });
      });
    });
  });
});
