import terser from '@rollup/plugin-terser';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json';

// Replace import.meta.url for worker context - Emscripten 4.x uses it
// to locate WASM files, but it's not available in Blob URL workers.
const replaceImportMeta = replace({
    preventAssignment: true,
    'import.meta.url': 'self.location.href'
});

export default args => ({
    input: 'src/spl-worker.js',
    output: [
        { file: 'src/build/js/worker.js', format: 'es' }
    ],
    plugins: args.configDebug ?
        [replaceImportMeta, nodeResolve(), json(), commonjs()] :
        [replaceImportMeta, nodeResolve(), json(), commonjs(), terser()]
});
