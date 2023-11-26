/**
 * @typedef {Object} Result
 * @property {Promise<any>} first
 * @property {Promise<any[]>} flat
 * @property {Promise<any[]>} rows
 * @property {Promise<string[]>} cols
 * @property {Promise<{}[]>} objs
 * @property {Promise<Result>} sync
 * @property {Promise<void>} free
 *
 * @typedef {Object} MountOptions
 * @property {string} name
 * @property {ArrayBuffer | Blob | File | FileList | string} data
 *
 * @typedef {Object} AutoGeoJSON
 * @property {number} precision
 * @property {0|1|2|3|4|5} options
 *
 * @typedef {Object} Extension
 * @property {'db'|'spl'} extends
 * @property {{[name:string]: Function}} fns
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
 * @property {(path: string, options: MountOptions[]) => Spl} mount
 * @property {(string) => Spl} unmount
 * @property {() => Promise<any>} version
 *
 */

import spl from './spl-web.js';

/**
 * @param {SplOptions} [options={}]
 * @param {Extension[]} [extensions=[]]
 *
 * @returns {Promise<Spl>}
 */
export default (options={}, extensions=[]) => spl(options, extensions);