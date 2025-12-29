/** @import { SplOptions } from './typedefs.js' */
/** @import { DbInstance, SplInstance } from './spl.js' */

import SPL from './spl.js';

/** @type {Object.<number, DbInstance>} */
const dbs = {};
/** @type {SplInstance|null} */
let spl = null;
/** @type {Object.<string, Function>} */
const extensions = {};

/**
 * Execute a command on the database or SPL instance
 * @param {number} id - Database instance ID
 * @param {string} fn - Function name to execute
 * @param {any[]} [args=[]] - Function arguments
 * @returns {[any, ArrayBuffer[]]} Result and transferables
 * @throws {Error} If database not found or unknown function
 */
const exec = (id, fn, args = []) => {
    let res = null,
        transferables = [],
        err = '';

    if ((fn.startsWith('db.') || fn.startsWith('res.')) && !(id in dbs)) {
        throw new Error(`Database not found`);
    }

    switch (fn) {
        case 'version':
            res = spl.version();
            break;
        case 'db':
            // @ts-ignore
            res = dbs[id] = spl.db(...args);
            break;
        case 'db.attach':
            // @ts-ignore
            res = dbs[id].attach(...args);
            break;
        case 'db.detach':
            // @ts-ignore
            res = dbs[id].detach(...args);
            break;
        case 'db.exec':
            // @ts-ignore
            res = dbs[id].exec(...args);
            break;
        // case 'db.exec2':
        //     // @ts-ignore
        //     res = dbs[id].exec2(...args);
        //     if (!(res instanceof spl.db)) {
        //         res = { __res: Math.round(Number.MAX_SAFE_INTEGER * Math.random()) };
        //         results[res.__res] = dbs[id].exec2(...args);
        //     }
        //     break;
        case 'db.close':
            res = dbs[id].close();
            break;
        case 'db.read':
            // @ts-ignore
            res = dbs[id].read(...args);
            break;
        case 'db.save':
            // @ts-ignore
            res = dbs[id].save(...args);
            break;
        case 'db.load':
            // @ts-ignore
            res = dbs[id].load(...args);
            break;
        case 'fs.mount':
            // @ts-ignore
            res = spl.fs.mount(...args);
            break;
        case 'fs.unmount':
            // @ts-ignore
            res = spl.fs.unmount(...args);
            break;
        case 'fs.file':
            // @ts-ignore
            res = spl.fs.file(...args);
            if (res instanceof ArrayBuffer) {
                transferables.push(res);
            }
            break;
        case 'fs.dir':
            // @ts-ignore
            res = spl.fs.dir(...args);
            break;
        case 'fs.unlink':
            // @ts-ignore
            res = spl.fs.unlink(...args);
            break;
        case 'fs.mkdir':
            // @ts-ignore
            res = spl.fs.mkdir(...args);
            break;
        case 'res.first':
            res = dbs[id].get.first;
            break;
        case 'res.flat':
            res = dbs[id].get.flat;
            break;
        case 'res.rows':
            res = dbs[id].get.rows;
            break;
        case 'res.cols':
            res = dbs[id].get.cols;
            break;
        case 'res.objs':
            res = dbs[id].get.objs;
            break;
        case 'res.sync':
            const db = dbs[id];
            const cols = db.get.cols;
            const rows = db.get.rows;
            res = [cols, rows];
            if (cols.length && rows.length) {
                for (let col = 0; col < cols.length; col++) {
                    for (let row = 0; row < rows.length; row++) {
                        const thing = rows[row][col];
                        if (thing instanceof ArrayBuffer) {
                            transferables.push(thing);
                        }
                    }
                }
            }
            db.get.free();
            break;
        case 'res.free':
            res = dbs[id].get.free();
            break;
        default:
            if (fn in extensions) {
                const that = fn.startsWith('db.') ? dbs[id] : spl;
                res = extensions[fn](that, ...args);
            } else {
                throw new Error(`Unkown function '${fn}'`);
            }
    }

    return [res, transferables];
};

self.onmessage = function (evt) {
    if (spl) {
        const { __id__, id, fn, args } = evt.data;
        let res = null,
            transferables = [],
            err = '';
        (async () => {
            try {
                async function* fnExec() {
                    let execArgs = Array.isArray(fn) ? fn : [{ id, fn, args }];
                    for (let execArg of execArgs) {
                        const { id, fn, args } = execArg;
                        const [maybePromise, transferables] = exec(
                            id,
                            fn,
                            args,
                        );
                        yield [await maybePromise, transferables];
                    }
                }
                for await (const _res of fnExec()) {
                    [res, transferables] = _res;
                }
            } catch (error) {
                err = error.message || error;
            } finally {
                if (res instanceof spl.db) {
                    res = { this: 'db' };
                } else if (res === spl) {
                    res = { this: 'spl' };
                }
                self.postMessage({ __id__, res, err }, transferables);
            }
        })();
    } else {
        (async () => {
            /** @typedef {{ extends: 'db' | 'spl', url: string, fns: { [name: string]: string } }} WorkerExtension */
            /** @type {{ wasmBinary: ArrayBuffer, exs: WorkerExtension[], options: SplOptions }} */
            const { wasmBinary, exs, options } = evt.data;
            // @ts-ignore
            const modules = await Promise.all(exs.map((ex) => import(ex.url)));
            exs.forEach((ex, i) => {
                const module = modules[i];
                if (ex.extends === 'db') {
                    Object.keys(ex.fns).forEach((fn) => {
                        extensions[`db.${fn}`] = module[ex.fns[fn]];
                    });
                } else if (ex.extends === 'spl') {
                    Object.keys(ex.fns).forEach((fn) => {
                        extensions[fn] = module[ex.fns[fn]];
                    });
                }
            });
            spl = await SPL(wasmBinary, options);
            self.postMessage(null);
        })();
    }
};
