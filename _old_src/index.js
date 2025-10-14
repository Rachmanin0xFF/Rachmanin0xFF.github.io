// Get our requirements, installed by npm

var Metalsmith  = require('metalsmith'),
    markdown    = require('metalsmith-markdown'),
    layouts     = require('metalsmith-layouts'),
	permalinks  = require('metalsmith-permalinks'),
	collections = require('metalsmith-collections'),
	helpers     = require('metalsmith-register-helpers'),
    writemetadata        = require('metalsmith-writemetadata'),
	sass        = require('metalsmith-sass'),
	assets = require('metalsmith-assets'),
	tags = require('metalsmith-tags'),
	pagination = require('metalsmith-pagination'),
	htmlMinifier = require("metalsmith-html-minifier"),
	metalsmithCleanCSS = require('metalsmith-clean-css'),
	links = require("metalsmith-relative-links");
	debug = require("metalsmith-debug")
	copy = require("metalsmith-copy")

// Run Metalsmith in the current directory.
// When the .build() method runs, this reads
// and strips the frontmatter from each of our
// source files and passes it on to the plugins.

Metalsmith(__dirname)
	
	.metadata({
		sitename: "Adam Lastowka",
		sitedescription: "Adam's website",
		siteURL: "www.adamlastowka.com",
		generatorname: "Metalsmith",
		generatorURL: "http://metalsmith.io/"
	})


	.use(debug({}))

	.use(helpers({
		directory: "./helpers"
	}))
	
	.source('./src')
	.destination('./build')
	
	.use(copy({
		pattern: '*.html',
		transform: function (file) {
			return file;
		  }
	}))
	.use(collections({
		posts: {
			pattern: 'articles/*.md',
			sortBy:'date',
			reverse: true,
            refer: true
		},
		arts: {
			pattern: ['arts/*.png', 'arts/*.jpg']
		},
		arts_thumb: {
			pattern: ['arts/thumb/*.png', 'arts/thumb/*.jpg']
		},
		arts_desc: {
			pattern: ['arts/descs/*.md'],
			sortBy:'date',
			reverse: true
		},

		audio: {
			pattern: ['audio/*.mp3', 'audio/*.MP3']
		},
		audio_desc: {
			pattern: ['audio/descs/*.md'],
			sortBy:'date',
			reverse: true
		},

		inter_desc: {
			pattern: ['interactive/descs/*.md'],
			sortBy:'date',
			reverse: true
		},

		misc: {
			pattern: ['misc/techgallery/*.md'],
			sortBy:'date',
			reverse: true
		}
	}))

	.use(pagination({
		'collections.posts': {
			perPage: 8,
			first: 'index.html',
			layout: 'paginated.hbs',
			path: 'articles/page/:num/index.html',
			filter: function (page) {
				return !page.private
			},
			pageMetadata: {
				title: 'Archive'
			}
		},
		'collections.arts_desc': {
			perPage: 24,
			first: 'index.html',
			layout: 'paginated_arts.hbs',
			path: 'arts/page/:num/index.html',
			filter: function (page) {
				return !page.private
			},
			pageMetadata: {
				title: 'Artwork'
			}
		},
		'collections.audio_desc': {
			perPage: 10,
			first: 'index.html',
			layout: 'paginated_audio.hbs',
			path: 'audio/page/:num/index.html',
			filter: function (page) {
				return !page.private
			},
			pageMetadata: {
				title: 'Audio'
			}
		},
		'collections.inter_desc': {
			perPage: 10,
			first: 'index.html',
			layout: 'paginated_inter.hbs',
			path: 'interactive/page/:num/index.html',
			filter: function (page) {
				return !page.private
			},
			pageMetadata: {
				title: 'Interactive'
			}
		}
	}))

	.use(tags({
		handle: 'tags',
		path: 'topics/:tag.html',
		layout: 'tag.hbs',
		normalize: true,
		sortBy: 'date',
		reverse: true,
		skipMetadata: false,
		slug: {mode: 'rfc3986'}
	}))
	
    // converts .md->.html
    .use(markdown({
		//highlight: function(code) {
		//	return require('highlight.js').highlightAuto(code).value;
		//},
		pedantic: false,
		gfm: true,
		tables: true,
		breaks: false,
		sanitize: false,
		smartLists: true,
		smartypants: false,
		xhtml: false
	}))

    // places html fragments
    .use(layouts())
	
	.use(permalinks({
		relative: false
	}))
	
	.use(sass({
		outputStyle: "expanded"
	}))

	.use(htmlMinifier({
		minifierOptions: {
			removeComments: false
        }
	}))
	
	.use(metalsmithCleanCSS({
		files: 'src/*.css',
		cleanCSS: {
		rebase: true,
		},
	}))

    // And tell Metalsmith to fire it all off.
    .build(function(err, files) {
        if (err) { throw err; }
    });