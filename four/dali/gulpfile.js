// helpful example for gulpfile:
//  http://stackoverflow.com/questions/27554317/how-can-i-change-my-gulp-file-so-that-it-runs-build-task-whenever-theres-a-chan

var gulp = require('gulp'),
    uglifyjs = require('uglify-js'),
    minifier = require('gulp-uglify/minifier'),
    concat = require('gulp-concat'),
    jshint = require('gulp-jshint');

gulp.task('build', function () {

  var options = {
    preserveComments: 'license'
  };

  gulp.src([
      './deps/cannon.min.js',
      './deps/gl-matrix-min.js',
      './src/utils.js',
      './src/dali.js',
      './src/resources.js',
      './src/time.js',
      './src/events.js',
      './src/scenes.js',
      './src/graphx.js',
      './src/physx.js',
      './src/ai.js',
      './src/audio.js',
      './src/main.js',])
    .pipe(jshint())
    .pipe(concat('dali.min.js'))
    // .pipe(minifier(options, uglifyjs))
    .pipe(gulp.dest('./'));
});

gulp.task('default', function() {
  gulp.watch('./src/*.js', ['build']);
});
