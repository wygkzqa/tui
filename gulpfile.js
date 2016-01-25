var gulp = require('gulp'),
	// JS压缩
	uglify = require('gulp-uglify'),
	// CSS压缩
	minifyCss = require('gulp-minify-css'),
	// JS合并
	concat = require('gulp-concat'),
	// JS代码检测
	jshint = require('gulp-jshint'),
	// 重命名
	rename = require('gulp-rename');

gulp.task('jshint', function() {
	return gulp.src('./tui/build/tui.js')
				.pipe(jshint())
				.pipe(jshint.reporter('default'));
});

// 压缩TUI JS
gulp.task('minify-tui', function() {
	return gulp.src('./tui/build/tui.js')
		.pipe(uglify())
		.pipe(rename({suffix: '.min'}))
		.pipe(gulp.dest('./tui/build'));
});

// 压缩合并TUI CSS
gulp.task('minify-concat-tui-css', function() {
	var url = './tui/css/';

	return gulp.src([url + 'tui.css', url + 'components/datepicker.css'])
				.pipe(concat('tui.all.css'))
				.pipe(gulp.dest(url))
				.pipe(rename({suffix: '.min'}))
				.pipe(minifyCss())
				.pipe(gulp.dest(url));
});

// 压缩合并TUI JS
gulp.task('minify-concat-tui-js', ['minify-concat-tui-css'], function() {
	var tuiUrl = './tui/build/';

	return gulp.src([tuiUrl + 'tui.js', tuiUrl + 'components/datepicker.js'])
				.pipe(concat('tui.all.js'))
				.pipe(gulp.dest(tuiUrl))
				.pipe(rename({suffix: '.min'}))
				.pipe(uglify())
				.pipe(gulp.dest(tuiUrl));
});

// 合并simditor
gulp.task('minify-simditor', function() {
	var rootUrl = './simditor/';

	return gulp.src([rootUrl + 'module.js', rootUrl + 'uploader.js', rootUrl + 'hotkeys.js', rootUrl + 'simditor.js'])
				.pipe(concat('simditor.all.js'))
				.pipe(gulp.dest('./simditor'))
				.pipe(rename({suffix: '.min'}))
				.pipe(uglify())
				.pipe(gulp.dest('./simditor'));
});


gulp.task('default', ['minify-concat-tui-css', 'minify-concat-tui-js'], function() {});