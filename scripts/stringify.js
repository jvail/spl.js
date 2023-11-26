import fs from 'fs';
import pako from 'pako';

const wasm = Buffer.from(pako.deflate(fs.readFileSync('src/build/js/em-worker.wasm'), { level: 9 })).toString('base64');
fs.writeFileSync('src/build/js/wasm.str.js', `export default "${wasm}"`);

const worker = Buffer.from(pako.deflate(fs.readFileSync('src/build/js/worker.js'), { level: 9 })).toString('base64');
fs.writeFileSync('src/build/js/worker.str.js', `export default "${worker}";\n`);
