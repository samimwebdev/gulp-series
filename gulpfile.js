/*eslint-disable*/

//lossy compression
// https://gist.github.com/LoyEgor/e9dba0725b3ddbb8d1a68c91ca5452b5
const gulp = require('gulp');
const sass = require('gulp-sass');
const browserSync = require('browser-sync').create();
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const cssnano = require('gulp-cssnano');
const sourcemaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');
const imagemin = require('gulp-imagemin');
const imageminPngquant = require('imagemin-pngquant');
const imageminZopfli = require('imagemin-zopfli');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminGiflossy = require('imagemin-giflossy');
const useref = require('gulp-useref');
const gulpif = require('gulp-if');
const sequence = require('run-sequence');
const cache = require('gulp-cache');
const clean = require('gulp-clean');

gulp.task('css', () => {
  return (
    gulp
      .src('./src/sass/**/*.scss')
      .pipe(sourcemaps.init())
      .pipe(sass().on('error', sass.logError))
      // .pipe(cssnano())
      // .pipe(concat('style.css'))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest('./dist/css'))
      .pipe(
        browserSync.stream({
          reload: true
        })
      )
  );
});

gulp.task('js', () => {
  return gulp
    .src('./src/js/**/*.js')
    .pipe(sourcemaps.init())
    .pipe(
      babel({
        presets: ['@babel/env']
      })
    )
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./dist/js'))
    .pipe(
      browserSync.stream({
        reload: true
      })
    );
});

gulp.task('html', ['css', 'js'], () => {
  return gulp
    .src('./src/*.html')
    .pipe(
      useref({
        searchPath: './dist'
      })
    )
    .pipe(gulpif('*.css', cssnano()))
    .pipe(gulpif('*.js', uglify()))
    .pipe(gulp.dest('./dist'))
    .pipe(
      browserSync.stream({
        reload: true
      })
    );
});

gulp.task('css:clean', ['html'], () => {
  return gulp.src(['./dist/css', './dist/js']).pipe(clean());
});
gulp.task('image', () => {
  return gulp
    .src('./src/img/**/*.+(jpg|png|gif|svg)')
    .pipe(
      cache(
        imagemin([
          //png
          imageminPngquant({
            speed: 1,
            quality: 98 //lossy settings
          }),
          imageminZopfli({
            more: true
            // iterations: 50 // very slow but more effective
          }),
          //gif
          // imagemin.gifsicle({
          //     interlaced: true,
          //     optimizationLevel: 3
          // }),
          //gif very light lossy, use only one of gifsicle or Giflossy
          imageminGiflossy({
            optimizationLevel: 3,
            optimize: 3, //keep-empty: Preserve empty transparent frames
            lossy: 2
          }),
          //svg
          imagemin.svgo({
            plugins: [
              {
                removeViewBox: false
              }
            ]
          }),
          //jpg lossless
          imagemin.jpegtran({
            progressive: true
          }),
          //jpg very light lossy, use vs jpegtran
          imageminMozjpeg({
            quality: 65
          })
        ])
      )
    )
    .pipe(gulp.dest('./dist/img'));
});
gulp.task('server', () => {
  browserSync.init({
    server: {
      baseDir: './dist'
    }
  });
});

gulp.task('clean', () => {
  return gulp.src('./dist', { allowEmpty: true, read: false }).pipe(clean());
});

gulp.task('watch', sequence('clean', ['server', 'css:clean']), () => {
  gulp.watch('./src/sass/**/*.scss', ['css']);
  gulp.watch('./src/js/**/*.js', ['js']);
  gulp.watch('./src/*.html', ['html']);
});

gulp.task('default', sequence('watch', 'image'));

gulp.task('build', sequence('clean', 'css:clean', 'image'));
