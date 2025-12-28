import terser from '@rollup/plugin-terser';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';


const cp = copy({
    targets: [
        { src: 'src/build/js/index.wasm', dest: 'dist' },
        { src: 'src/build/bc/share/proj', dest: 'dist' },
        { src: 'src/index.mjs', dest: 'dist' },
        { src: 'src/typedefs.js', dest: 'dist' },
    ]
});

export default args => ({
    input: 'src/spl-node.mjs',
    output: [
        { file: 'dist/spl-node.mjs', format: 'es', exports: 'auto'}
    ],
    plugins: args.configDebug ? [
        replace({
            preventAssignment: true,
            delimiters: ["'", "'"],
            values: { './build/js/em-worker.js': JSON.stringify('./build/js/index.js') }
        }),
        nodeResolve(),
        json(),
        commonjs(),
        cp
    ] : [
        replace({
            preventAssignment: true,
            delimiters: ["'", "'"],
            values: { './build/js/em-worker.js': JSON.stringify('./build/js/index.js') }
        }),
        nodeResolve(),
        json(),
        commonjs(),
        terser(),
        cp
    ]
});
