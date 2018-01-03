const gulp = require("gulp");
const browserify = require("gulp-browserify");
const babel = require("gulp-babel");

const packageJSON  = require("./package");
const jscs = require("gulp-jscs");
const jshint = require("gulp-jshint");

const jshintConfig = packageJSON.jshintConfig;
jshintConfig.lookup = false;

// Basic usage
gulp.task("browser:dist", () => {
    // Single entry point to browserify
    gulp.src("lib3/z.js")
        .pipe(browserify())
        .pipe(gulp.dest("./build/"));
});

gulp.task("lint", () => {
   return gulp.src([
		"lib/**/*.js",
		"!lib/manager/transitions/parsing/zparser.js"
	])
		.pipe(jshint(jshintConfig))
		.pipe(jshint.reporter("checkstyle"))
		.pipe(jshint.reporter("fail"))
		.pipe(jscs(packageJSON.jscsConfig))
		.pipe(jscs.reporter());
});

gulp.task("lint-tests", () => {
    return gulp.src([
		"test/**/*.js"
	])
		.pipe(jshint(jshintConfig))
		.pipe(jshint.reporter("checkstyle"))
		.pipe(jshint.reporter("fail"))
		.pipe(jscs(packageJSON.jscsConfig))
		.pipe(jscs.reporter());
});

gulp.task("code-quality", ["lint", "lint-tests"]);

gulp.task("dist", () => {
    gulp.src("lib/z.js")
        .pipe(babel({
            presets: ["env"],
            plugins: [
                ["conditional-compilation", {
                    DEBUG: false
                }]
            ]
        }))
        .pipe(gulp.dest("dist"));
});
