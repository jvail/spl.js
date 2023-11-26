import terser from '@rollup/plugin-terser';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import json from '@rollup/plugin-json';

const cp = copy({
    targets: [
        { src: 'src/index.js', dest: 'dist' },
    ]
});

export default args => ({
    input: 'src/spl-web.js',
    output: [
        { file: 'dist/spl-web.js', format: 'es', exports: 'auto'}
    ],
    plugins: args.configDebug ? [
        nodeResolve(),
        json(),
        commonjs(),
        cp
    ] : [
        nodeResolve(),
        json(),
        commonjs(),
        terser(),
        cp
    ]
});
