/*
var ts = require("gulp-typescript")

// according to https://www.npmjs.com/package/gulp-typescript
// not supported
var tsProject = ts.createProject('tsconfig.json', { inlineSourceMap : false })

*/
// gulp.task('scripts', function() {
//    var tsResult = tsProject.src() // gulp.src("lib/*  * / * .ts") // or tsProject.src()
//        .pipe(tsProject())
//
//    return tsResult.js.pipe(gulp.dest('release'))
// })
// *

var gulp = require('gulp');

var ts = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');

/**
 * Directory containing generated sources which still contain
 * JSDOC etc.
 */
// var genDir = 'gen';
var srcDir = 'src';
var testDir = 'test';

gulp.task('watch', function () {
  gulp.watch([srcDir + '/**/*.js', testDir + '/**/*.js', srcDir + '/**/*.tsx',  srcDir + '/**/*.ts', 'gulpfile.js'],
    ['tsc', 'babel','standard']);
});

const babel = require('gulp-babel');

/**
 * compile tsc (including srcmaps)
 * @input srcDir
 * @output genDir
 */
gulp.task('tsc', function () {
  var tsProject = ts.createProject('tsconfig.json', { inlineSourceMap: true });
  var tsResult = tsProject.src() // gulp.src('lib/*.ts')
    .pipe(sourcemaps.init()) // This means sourcemaps will be generated
    .pipe(tsProject());

  return tsResult.js
  //    .pipe(babel({
  //      comments: true,
  //      presets: ['es2015']
  //    }))
    // .pipe( ... ) // You can use other plugins that also support gulp-sourcemaps
    .pipe(sourcemaps.write('.',{
      sourceRoot : function(file) {
        // file.sourceMap.sources[0] = '/projects/nodejs/botbuilder/fdevstart/src/' + file.sourceMap.sources[0];
        //  file.sourceMap.sources[0] = './src/' + file.sourceMap.sources[0];
        //console.log('here is************* file' + JSON.stringify(file, undefined, 2));
        return 'ABC';
      },
      mapSources: function(src) {
        console.log('here we remap' + src);
        return '/projects/nodejs/botbuilder/fdevstart/' + src;
      }}
    )) // ,  { sourceRoot: './' } ))
  // Now the sourcemaps are added to the .js file
    .pipe(gulp.dest('gen'));
});


/**
 * compile tsc (including srcmaps)
 * @input srcDir
 * @output genDir
 */
gulp.task('tscx', function () {
  var tsProject = ts.createProject('tsconfig.json', { inlineSourceMap: true });
  var tsResult = tsProject.src() // gulp.src('lib/*.ts')
    .pipe(sourcemaps.init()) // This means sourcemaps will be generated
    .pipe(tsProject());

  return tsResult
    .pipe(babel({
      comments: true,
      presets: ['es2015']
    }))
    // .pipe( ... ) // You can use other plugins that also support gulp-sourcemaps
    .pipe(sourcemaps.write()) // ,  { sourceRoot: './' } ))
  // Now the sourcemaps are added to the .js file
    .pipe(gulp.dest('gen2'));
});

/**
 * compile tsc (including srcmaps)
 * @input srcDir
 * @output genDir
 */
/*
gulp.task('tsc2', function () {
  var tsProject = ts.createProject('tsconfig.json', { inlineSourceMap: false });
  var tsResult = tsProject.src() // gulp.src('lib/*.ts')
    .pipe(sourcemaps.init()) // This means sourcemaps will be generated
    .pipe(tsProject());

  return tsResult.js
    .pipe(babel({
      comments: true,
      presets: ['es2015']
    }))
    // .pipe( ... ) // You can use other plugins that also support gulp-sourcemaps
    .pipe(sourcemaps.write()) // Now the sourcemaps are added to the .js file
    .pipe(gulp.dest('gen2'));
});
*/


var jsdoc = require('gulp-jsdoc3');

gulp.task('doc', function (cb) {
  gulp.src([srcDir + '/**/*.js', 'README.md', './gen/**/*.js'], { read: false })
    .pipe(jsdoc(cb));
});

var newer = require('gulp-newer');

var imgSrc = 'src/**/*.js';
var imgDest = 'gen';

// compile standard sources with babel,
// as the coverage input requires this
//
gulp.task('babel', ['tsc'], function () {
  // Add the newer pipe to pass through newer images only
  return gulp.src([imgSrc, 'gen_tsc/**/*.js'])
    .pipe(newer(imgDest))
    .pipe(babel({
      comments: true,
      presets: ['env']
    }))
    .pipe(gulp.dest('gen'));
});

var gulp_shell = require('gulp-shell');

gulp.task('test', gulp_shell.task([
  'tap test\\',
]));

gulp.task('autotest', ['test'], function() {
  gulp.watch(['app/**/*.js', 'test/**/*.js'], ['test']);
});


const eslint = require('gulp-eslint');

gulp.task('eslint', () => {
  // ESLint ignores files with "node_modules" paths.
  // So, it's best to have gulp ignore the directory as well.
  // Also, Be sure to return the stream from the task;
  // Otherwise, the task may end before the stream has finished.
  return gulp.src(['src/**/*.js', 'test/**/*.js', 'gulpfile.js'])
    // eslint() attaches the lint output to the "eslint" property
    // of the file object so it can be used by other modules.
    .pipe(eslint())
    // eslint.format() outputs the lint results to the console.
    // Alternatively use eslint.formatEach() (see Docs).
    .pipe(eslint.format())
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failAfterError last.
    .pipe(eslint.failAfterError());
});


gulp.task('graphviz', function () {
  gulp.src('model/*.gv')
    .pipe(gulp_shell([ 'dot -O -Tjpeg <%= file.path %>']));
});

// Default Task
gulp.task('default', ['tsc', 'babel', 'eslint', 'doc', 'test']);
gulp.task('build', ['tsc', 'babel']);
gulp.task('allhome', ['default']);
gulp.task('standard', ['tsc', 'babel', 'eslint', 'test']);
