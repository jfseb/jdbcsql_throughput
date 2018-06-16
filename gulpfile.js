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


gulp.task('clean', ['clean:models']);

//console.log(' here config ' + JSON.stringify(webpackConfig)
//);

// Production build

/*
gulp.task('webpack', function(callback) {

	// run webpack
  webpack(webpackConfig, function(err, stats) {
    if(err) throw new gutil.PluginError('webpack_build', err);
    gutil.log('[webpack_build]', stats.toString({
      colors: true
    }));
    callback();
  });
});
*/









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

// gulp.task('copyInputFilterRules', ['tsc', 'babel'], function () {
//  return gulp.src([
//    genDir + '/match/inputFilterRules.js'
//  ], { 'base': genDir })
//    .pipe(gulp.dest('gen_cov'));
// });

/*
var instrument = require('gulp-instrument')

gulp.task('instrumentx', ['tsc', 'babel', 'copyInputFilterRules'], function () {
  return gulp.src([
    genDir + '/match/data.js',
    genDir + '/match/dispatcher.js',
    genDir + '/match/ifmatch.js',
    genDir + '/match/inputFilter.js',
    // genDir + '/match/inputFilterRules.js',
    genDir + '/match/matchData.js',
    //  genDir + '/match/inputFilterRules.js',
    genDir + '/utils/*.js',
    genDir + '/exec/*.js'],
    { 'base': genDir
    })
    .pipe(instrument())
    .pipe(gulp.dest('gen_cov'))
})

gulp.task('instrument', ['tsc', 'babel'], function () {
  return gulp.src([genDir + '/**REMOVEME/*.js'])
    .pipe(instrument())
    .pipe(gulp.dest('gen_cov'))
})
*/

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
      presets: ['es2015']
    }))
    .pipe(gulp.dest('gen'));
});


var nodeunit = require('gulp-nodeunit');
var env = require('gulp-env');

/**
 * This does not work, as we are somehow unable to
 * redirect the lvoc reporter output to a file
 */
gulp.task('nodeunit_testcov', [], function () {
  const envs = env.set({
    FSD_COVERAGE: '1',
    FSDEVSTART_COVERAGE: '1'
  });
  // the file does not matter
  gulp.src(['./**/match/dispatcher.nunit.js'])
    .pipe(envs)
    .pipe(nodeunit({
      reporter: 'lcov',
      reporterOptions: {
        output: 'testcov'
      }
    })).pipe(gulp.dest('./cov/lcov.info'));
});


var shell = require('gulp-shell');

gulp.task('test', shell.task([
  'tap test\\',
]));

gulp.task('autotest', ['test'], function() {
  gulp.watch(['app/**/*.js', 'test/**/*.js'], ['test']);
});

gulp.task('nodeunit_test', ['tsc', 'babel'], function () {
  gulp.src(['test/**/*.js'])
    .pipe(nodeunit({
      reporter: 'minimal'
      // reporterOptions: {
      //  output: 'testcov'
      // }
    })).on('error', function (err) { console.log('This is weird: ' + err.message); })
    .pipe(gulp.dest('./out/lcov.info'));
});

gulp.task('testmin', ['tsc', 'babel'], function () {
  gulp.src(['test/**/*.js'])
    .pipe(nodeunit({
      reporter: 'minimal'
      // reporterOptions: {
      //  output: 'testcov'
      // }
    })).on('error', function (err) { console.log('This is weird: ' + err.message); })
    .pipe(gulp.dest('./out/lcov.info'));
});

//    .pipe(gulp.dest('./cov')) // default file name: src-cov.js
// })

// shoudl be replaced by ESLINT and a typescript output
// compliant config

/*
var standard = require('gulp-standard');

gulp.task('standard', ['babel'], function () {
  return gulp.src(['src/*  * /*.js', 'test/* * / *.js', 'gulpfile.js'])
  .pipe(standard())
  .pipe(standard.reporter('default', {
    breakOnError: true,
    quiet: true
  }));
});
*/

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


var gulp_shell = require('gulp-shell');

gulp.task('graphviz', function () {
  gulp.src('model/*.gv')
  .pipe(gulp_shell([ 'dot -O -Tjpeg <%= file.path %>']));
});

// Default Task
gulp.task('default', ['tsc', 'babel', 'eslint', 'doc', 'test']);
gulp.task('build', ['tsc', 'babel']);
gulp.task('allhome', ['default']);
gulp.task('standard', ['tsc', 'babel', 'eslint', 'test']);
