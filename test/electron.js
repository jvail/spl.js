import taperun from 'tape-run';
import browserify from 'browserify';
import path from 'path';
import { fileURLToPath } from 'url';
import esmify from 'esmify';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

browserify(__dirname + '/browser.js', {
    plugin: [[esmify]],
})
    .bundle()
    .pipe(taperun({ sandbox: false, static: 'test' }))
    .on('results', console.log)
    .pipe(process.stdout);
