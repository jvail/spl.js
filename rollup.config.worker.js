import { terser } from 'rollup-plugin-terser';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import json from '@rollup/plugin-json';

const ts = typescript({
    useTsconfigDeclarationDir: true
});

export default args => ({
    input: 'src/spl-worker.ts',
    output: [
        { file: 'src/build/js/worker.js', format: 'es', preferConst: true }
    ],
    plugins: args.configDebug ?
        [nodeResolve(), json(), ts, commonjs()] :
        [nodeResolve(), json(), ts, commonjs(), terser()]
});
