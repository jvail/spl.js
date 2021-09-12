import { terser } from 'rollup-plugin-terser';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import copy from 'rollup-plugin-copy';
import json from '@rollup/plugin-json';

const ts = typescript({
    useTsconfigDeclarationDir: true
});

const cp = copy({
    targets: [
        { src: 'src/build/js/spl.wasm', dest: 'dist' },
        { src: 'src/build/bc/share/proj', dest: 'dist' },
        { src: 'src/spl.d.ts', dest: 'dist' }
    ]
});

export default args => ({
    input: 'src/spl-node.ts',
    output: [
        { file: 'dist/spl.js', format: 'cjs', preferConst: true, exports: 'auto'}
    ],
    plugins: args.configDebug ? [
        nodeResolve(),
        json(),
        ts,
        commonjs(),
        cp
    ] : [
        nodeResolve(),
        json(),
        ts,
        commonjs(),
        terser(),
        cp
    ]
});
