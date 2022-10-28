import nodeResolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default _ => ({
    input: 'index.js',
    output: [
        {
            file: 'lib.js',
            format: 'es',
            exports: 'auto'
        }
    ],
    plugins: [
        nodeResolve(),
        terser()
    ]
});
