const gulp = require('gulp');
const browserify = require('gulp-browserify');
const babel = require('gulp-babel');

// Basic usage 
gulp.task('browser:dist', function() {
    // Single entry point to browserify 
    gulp.src('lib3/z.js')
        .pipe(browserify())
        .pipe(gulp.dest('./build/'));
});

gulp.task('dist', () => {
    gulp.src('lib/z.js')
        .pipe(babel({
            presets: ['env'],
            plugins: [
                ["conditional-compilation", {
                    DEBUG: false
                }]
            ]
        }))
        .pipe(gulp.dest('dist'));
});
