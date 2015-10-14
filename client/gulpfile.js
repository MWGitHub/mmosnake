var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var browserify = require('browserify');
var watchify = require('watchify');
var babelify = require('babelify');
var notify = require('gulp-notify');
var gutil = require('gulp-util');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

var sass = require('gulp-sass');
var minify = require('gulp-minify-css');


var mainJS = './src/main.js';
var cssDir = './src/css/**/*.scss';
var destJS = './media/js';
var destCSS = './media/css';

function bundleProduction(bundler) {
    var time = new Date().getTime();
    bundler.bundle()
        .on('error', function(err) { console.error(err) })
        .pipe(source('snake.min.js'))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(gulp.dest(destJS))
        .on('end', function() { gutil.log('Done bundling js after '
            + (new Date().getTime() - time).toString() + ' ms' )})
        .pipe(notify({message: 'Done bundling!'}));
}

function bundle(bundler) {
    var time = new Date().getTime();
    bundler.bundle()
        .on('error', function(err) { console.error(err) })
        .pipe(source('snake.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(destJS))
        .on('end', function() { gutil.log('Done bundling js after '
            + (new Date().getTime() - time).toString() + ' ms' )})
        .pipe(notify({message: 'Done bundling js!'}));
}

function watch() {
    var args = { debug: true };
    var bundler = watchify(browserify(mainJS, args).transform(babelify));

    bundle(bundler);
    bundler.on('update', function() {
        console.log('bundling...');
        bundle(bundler);
    });
}

function build(isProduction) {
    var bundler = null;
    if (isProduction) {
        bundler = browserify(mainJS, { debug: false }).transform(babelify);
        return bundleProduction(bundler);
    } else {
        bundler = browserify(mainJS, { debug: true }).transform(babelify);
        return bundle(bundler);
    }
}

gulp.task('sass-production', function() {
    gulp.src(cssDir)
        .pipe(sass().on('error', sass.logError))
        .pipe(minify({compatibility: 'ie8'}))
        .pipe(rename('main.min.css'))
        .pipe(gulp.dest(destCSS))
        .pipe(notify({message: 'Done compiling css!'}));
});

gulp.task('sass', function() {
    gulp.src(cssDir)
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(destCSS))
        .pipe(notify({message: 'Done compiling css!'}));
});

gulp.task('sass:watch', function() {
    gulp.watch(cssDir, ['sass']);
});

gulp.task('build-production', ['sass-production'], function() {
    build(true);
});

gulp.task('build', ['sass'], function() {
    build(false);
});

gulp.task('watch', ['sass:watch'], function() {
    watch();
});

gulp.task('default', ['watch']);