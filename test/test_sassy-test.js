import { expect } from 'chai';
import path from 'node:path';
import * as sass from 'sass';
import SassyTest from '../lib/sassy-test.js';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('sassy-test', function() {
  describe('API', function() {
    ['configurePaths',
      'fixture',
      'compile',
      'compileString',
      'compileFixture'
    ].forEach(function(method) {
      it('has ' + method + '() method', function(done) {
        const sassyTest = new SassyTest();
        expect(sassyTest).to.have.property(method);
        expect(sassyTest[method]).to.be.a('function');
        done();
      });
    });
  });

  describe('SassyTest constructor', function() {
    it('should initialize the object', function(done) {
      const obj = new SassyTest();
      expect(obj).to.have.property('paths');
      expect(obj.paths).to.have.property('fixtures');
      expect(obj.paths.fixtures).to.equal(path.join(__dirname, '../../../', 'test/fixtures'));
      expect(obj.paths).to.have.property('loadPaths');
      done();
    });

    it('should initialize the given data', function(done) {
      const obj = new SassyTest({
        fixtures: 'example',
        loadPaths: ['include-example']
      });
      expect(obj.paths.fixtures).to.equal('example');
      expect(obj.paths.loadPaths).to.deep.equal(['include-example']);
      done();
    });
  });

  describe('.configurePaths()', function() {
    it('should not override the default fixtures path', function(done) {
      const sassyTest = new SassyTest();
      expect(path.relative(
        path.join(__dirname, '../../../'),
        sassyTest.paths.fixtures
      )).to.equal('test/fixtures');
      done();
    });

    it('should set the fixtures path', function(done) {
      const sassyTest = new SassyTest();
      sassyTest.configurePaths({
        fixtures: 'a/path'
      });
      expect(sassyTest.paths.fixtures).to.equal('a/path');
      done();
    });

    it('should set the loadPaths path', function(done) {
      const sassyTest = new SassyTest();
      sassyTest.configurePaths({
        loadPaths: ['b/path']
      });
      expect(sassyTest.paths.loadPaths[0]).to.equal('b/path');
      done();
    });

    it('should not reset to the default value a previously set loadPaths path', function(done) {
      const sassyTest = new SassyTest();
      sassyTest.configurePaths({
        loadPaths: ['c/path']
      });
      sassyTest.configurePaths({});
      expect(sassyTest.paths.loadPaths[0]).to.equal('c/path');
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

  describe('.compile()', function() {
    before(function(done) {
      this.sassyTest = new SassyTest({
        fixtures: path.join(__dirname, 'fixtures'),
        loadPaths: [path.join(__dirname, 'fixtures/my-sass-library')]
      });
      done();
    });

    it('should return a Promise', async function() {
      const obj = this.sassyTest.compileString(
        '@import "my-sass-library";\n@include my-sass-imported();'
      );
      expect(obj).to.be.instanceof(Promise);
      let result;
      try {
        result = await obj;
      } catch (error) {
        expect(error).to.not.exist;
      }
      expect(result.css).to.equal('.test {\n  content: "my-sass-imported";\n}');
    });

    it('should be able to @import from the fixtures directory', async function() {
      let result;
      try {
        result = await this.sassyTest.compileString(
          '@import "init";\n.test {\n  content: $var-from-init;\n}'
        );
      } catch (error) {
        expect(error).to.not.exist;
      }
      expect(result.css).to.equal('.test {\n  content: "a variable from fixtures/_init.scss";\n}');
    });

    it('should be able to @import from the loadPaths directory', async function() {
      let result;
      try {
        result = await this.sassyTest.compileString(
          '@import "my-sass-library";\n@include my-sass-imported();'
        );
      } catch (error) {
        expect(error).to.not.exist;
      }
      expect(result.css).to.equal('.test {\n  content: "my-sass-imported";\n}');
    });

    it('should fail to @import if no loadPaths directory specified', async function() {
      const originalLoadPaths = this.sassyTest.paths.loadPaths,
        self = this;
      this.sassyTest.paths.loadPaths = [];
      let result;
      try {
        result = await this.sassyTest.compileString(
          '@import "my-sass-library";'
        );
      } catch (error) {
        expect(error).to.exist;
      }
      expect(result).to.not.exist;
      // Restore the original value.
      self.sassyTest.paths.loadPaths = originalLoadPaths;
    });

    it('should pass its options to sass’s compile()', async function() {
      let result;
      try {
        result = await this.sassyTest.compileString(
          '@import "my-sass-library";\n@include my-sass-imported();',
          {
            style: 'compressed'
          }
        );
      } catch (error) {
        expect(error).to.not.exist;
      }
      expect(result.css).to.equal('.test{content:"my-sass-imported"}');
    });

    it('should not override functions passed to it', async function() {
      let result;
      try {
        result = await this.sassyTest.compileString(
          '.test { content: test-function(MYTEST); }',
          {
            style: 'compressed',
            functions: {
              'test-function($val)': function(args) {
                return new sass.SassString(`You have called test-function(${args[0].assertString('val')}).`);
              }
            }
          }
        );
      } catch (error) {
        expect(error).to.not.exist;
      }
      expect(result.css).to.equal('.test{content:"You have called test-function(MYTEST)."}');
    });

    it('should return the sass result object', async function() {
      let result;
      try {
        result = await this.sassyTest.compileString(
          '@import "my-sass-library";\n@include my-sass-imported();'
        );
      } catch (error) {
        expect(error).to.not.exist;
      }
      expect(result).to.be.an('object');
      expect(result).to.have.property('css');
      expect(result.css).to.be.a('string');
      expect(result).to.not.have.property('sourceMap');
      expect(result).to.have.property('warn');
      expect(result.warn).to.be.an('array');
      expect(result).to.have.property('debug');
      expect(result.debug).to.be.an('array');
    });

    it('should return the sass exception', async function() {
      let result;
      try {
        result = await this.sassyTest.compileString(
          '@import "non-existant-sass-library";'
        );
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error).to.have.property('message');
        expect(error.message).to.be.a('string');
        expect(error).to.have.property('span');
        expect(error.span.start.column).to.be.a('number');
        expect(error.span.start.line).to.be.a('number');
        expect(error.span.start.offset).to.be.a('number');
        expect(error.span.end.column).to.be.a('number');
        expect(error.span.end.line).to.be.a('number');
        expect(error.span.end.offset).to.be.a('number');
        expect(error.span.url).to.be.a('null');
      }
      expect(result).to.not.exist;
    });

    it('should have a sourcemap object', async function() {
      let result;
      try {
        result = await this.sassyTest.compile(
          this.sassyTest.fixture('compile/some-file.scss'),
          { sourceMap: true }
        );
      } catch (error) {
        expect(error).to.not.exist;
      }
      expect(result.sourceMap).to.be.an('object');
    });

    it('should throw an error if not given an options object', async function() {
      let result;
      try {
        result = await this.sassyTest.compileString('', '');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.equal('Options parameter of compile method must be an object.');
      }
      expect(result).to.not.exist;
    });

    it('should capture @warn messages', async function() {
      let result;
      try {
        result = await this.sassyTest.compile(
          this.sassyTest.fixture('compile/some-warn.scss')
        );
      } catch (error) {
        expect(error).to.not.exist;
      }
      expect(result.warn[0]).to.equal('compile() test warning');
    });

    it('should capture @debug messages', async function() {
      let result;
      try {
        result = await this.sassyTest.compile(
          this.sassyTest.fixture('compile/some-debug.scss')
        );
      } catch (error) {
        expect(error).to.not.exist;
      }
      expect(result.debug[0]).to.equal('compile() test debug');
    });
  });

  describe('.assertResult()', function() {
    it('should throw an error if result.expectedOutputFileError exists', function(done) {
      const sassyTest = new SassyTest(),
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
      const sassyTest = new SassyTest(),
        result = {
          sassError: null,
          expectedOutputFileError: null,
          css: '.output {}',
          expectedOutput: '.output.does-not-match {}'
        };
      expect(sassyTest.assertResult.bind(null, result)).to.throw(Error, 'Expected values to be strictly equal');
      done();
    });
  });

  describe('.compileFixture()', function() {
    before(function(done) {
      this.sassyTest = new SassyTest({
        fixtures: path.join(__dirname, 'fixtures'),
        loadPaths: [path.join(__dirname, 'fixtures/my-sass-library')]
      });
      // Turn off the assertions to prevent errors from breaking these tests.
      this.sassyTest.assertResult = function() {};
      done();
    });

    it('should return a Promise', function() {
      const obj = this.sassyTest.compileFixture('compileFixture/success', {});
      expect(obj).to.be.instanceof(Promise);
      return obj;
    });

    it('should compile the input.scss file of the given fixtures directory', async function() {
      let result;
      try {
        result = await this.sassyTest.compileFixture('compileFixture/success', {});
      } catch (error) {
        expect(error).to.not.exist;
      }
      expect(result.css).to.be.a('string');
      expect(result.css).to.equal('.test {\n  content: "compileFixture() test";\n}');
      expect(result.expectedOutput).to.exist;
    });

    it('should create a sourcemap', async function() {
      const fixture = 'compileFixture/success';
      const url = `file://${this.sassyTest.fixture('compileFixture/success')}/input.scss`;
      let result;
      try {
        result = await this.sassyTest.compileFixture(fixture);
      } catch (error) {
        expect(error).to.not.exist;
      }
      expect(result.expectedOutput).to.exist;
      expect(result.sourceMap).to.be.an('object');
      expect(result.sourceMap.file).to.be.undefined;
      expect(result.sourceMap.sources).to.be.an('array');
      expect(result.sourceMap.sources).to.deep.equal([url]);
    });

    it('should return the sass result object', async function() {
      let result;
      try {
        result = await this.sassyTest.compileFixture('compileFixture/success');
      } catch (error) {
        expect(error).to.not.exist;
      }
      expect(result.expectedOutput).to.exist;
      expect(result).to.be.an('object');
      expect(result).to.have.property('css');
      expect(result.css).to.be.a('string');
      expect(result).to.have.property('sourceMap');
      expect(result.sourceMap).to.be.an('object');
    });

    it('should return the sass exception', async function() {
      let result;
      try {
        result = await this.sassyTest.compileFixture('compileFixture/failureSass');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error).to.have.property('message');
        expect(error.message).to.be.a('string');
        expect(error.message).to.include('compileFixture failure.');
        expect(error).to.have.property('span');
        expect(error.span.start.column).to.be.a('number');
      }
      expect(result).to.not.exist;
    });

    it('should ignore the output error and return the sass exception', async function() {
      let result;
      try {
        result = await this.sassyTest.compileFixture('compileFixture/failureNoOutput');
      } catch (error) {
        expect(error).to.be.an('error');
        expect(error.message).to.include('compileFixture failure, not an output error.');
        expect(error).to.not.have.property('code');
      }
      expect(result).to.not.exist;
    });

    it('should read the output.css file of the given fixtures directory', async function() {
      let result;
      try {
        result = await this.sassyTest.compileFixture('compileFixture/success');
      } catch (error) {
        expect(error).to.not.exist;
      }
      expect(result).to.exist;
      expect(result.expectedOutput).to.be.a('string');
      expect(result.expectedOutput).to.equal('.test {\n  content: "compileFixture() test";\n}');
    });

    it('should report an error if it cannot find output.css', async function() {
      let result;
      try {
        result = await this.sassyTest.compileFixture('compileFixture/missingOutput');
      } catch (error) {
        expect(error).to.not.exist;
      }
      expect(result.expectedOutputFileError).to.exist;
      expect(result.expectedOutputFileError.code).to.equal('ENOENT');
    });

    it('should compare the expected result and the actual result', async function() {
      let result;
      try {
        result = await this.sassyTest.compileFixture('compileFixture/success');
      } catch (error) {
        expect(error).to.not.exist;
      }
      expect(result).to.exist;
      expect(result.css).to.equal(result.expectedOutput);
    });
  });
});
