const gulp = require('gulp');
const browserify = require('gulp-browserify');
const babel = require('gulp-babel');

const packageJSON  = require('./package');
const jscs = require('gulp-jscs');
const jshint = require('gulp-jshint');
const packageJson = require('./package.json');

const jshintConfig = packageJSON.jshintConfig;
jshintConfig.lookup = false;

// Basic usage 
gulp.task('browser:dist', function() {
    // Single entry point to browserify 
    gulp.src('lib3/z.js')
        .pipe(browserify())
        .pipe(gulp.dest('./build/'));
});

gulp.task('lint', () => {
   return gulp.src([
		'lib/**/*.js',
		'test/**/*.js'
	])
		.pipe(jshint(jshintConfig))
		.pipe(jshint.reporter('checkstyle'))
		.pipe(jshint.reporter('fail'))
		.pipe(jscs(packageJSON.jscsConfig));
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
