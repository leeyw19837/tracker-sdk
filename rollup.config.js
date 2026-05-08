import resolve from '@rollup/plugin-node-resolve';
import commonjs from "@rollup/plugin-commonjs";
import babel from '@rollup/plugin-babel';

export default [
    {
        input: 'src/index.js',
        output: [
            {
                file: 'dist/index.cjs.js',
                format: 'cjs',
                exports: 'auto'
            },
            {
                file: 'dist/index.esm.js',
                format: 'es'
            }
        ],
        plugins: [
            resolve(),
            commonjs(),
            babel({
                babelHelpers: 'bundled', // 关键：将 helper 函数打包进文件
                exclude: 'node_modules/**' // 排除 node_modules
            })
        ]
    }
]