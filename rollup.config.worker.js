import terser from '@rollup/plugin-terser';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';


export default args => ({
    input: 'src/spl-worker.js',
    output: [
        { file: 'src/build/js/worker.js', format: 'es' }
    ],
    plugins: args.configDebug ?
        [nodeResolve(), json(), commonjs()] :
        [nodeResolve(), json(), commonjs(), terser()]
});
