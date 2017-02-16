var gulp = require('gulp');

var browserify = require('gulp-browserify');
 
// Basic usage 
gulp.task('browser:dist', function() {
    // Single entry point to browserify 
    gulp.src('lib3/z.js')
        .pipe(browserify())
        .pipe(gulp.dest('./build/'));
});

