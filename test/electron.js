const taperun = require('tape-run');
const browserify = require('browserify');

browserify(__dirname + '/browser.js', {
    plugin: [
      [ require('esmify') ]
    ]
  })
  .bundle()
  .pipe(taperun({ sandbox: false }))
  .on('results', console.log)
  .pipe(process.stdout);
