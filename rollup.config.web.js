import terser from '@rollup/plugin-terser';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default args => ({
    input: 'src/spl-web.js',
    output: [
        { file: 'dist/index.js', format: 'es', exports: 'auto'}
    ],
    plugins: args.configDebug ? [
        nodeResolve(),
        json(),
        commonjs(),
    ] : [
        nodeResolve(),
        json(),
        commonjs(),
        terser(),
    ]
});
