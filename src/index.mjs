/**
 * @typedef {Object} Result
 * @property {any} first
 * @property {any[]} flat
 * @property {any[]} rows
 * @property {string[]} cols
 * @property {{}[]} objs
 * @property {Result} sync
 *
 * @typedef {Object} AutoGeoJSON
 * @property {number} precision
 * @property {0|1|2|3|4|5} options
 *
 * @typedef {Object} SplOptions
 * @property {boolean} autoJSON
 * @property {AutoGeoJSON} autoGeoJSON
 *
 * @typedef {Object} Db
 * @property {(db: string, schema: string) => Db} attach
 * @property {(schema: string) => Db} detach
 * @property {(sql: string, parameters?: any[] | {[name:string]: any}) => Db} exec
 * @property {(sql: string) => Db} read
 * @property {(src: string) => Db} load
 * @property {(dest?: string) => Db} save
 * @property {() => Spl} close
 * @property {Result} get
 *
 * @typedef {Object} Spl
 * @property {(path?: string | ArrayBuffer) => Db} db
 * @property {(path: string, mountpoint?: string) => Spl} mount
 * @property {(path: string) => Spl} unmount
 * @property {() => any} version
 *
 */

import spl from './spl-node.mjs';

/**
 * @param {SplOptions} options
 *
 * @returns {Spl}
 */
export default (options={}) => spl(null, options);