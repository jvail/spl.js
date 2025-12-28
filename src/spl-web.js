/** @import { SplOptions, Extension, ResultData, MountOption } from './typedefs.js' */

import * as pako from 'pako';
import workerStr from './build/js/worker.str.js';
import wasmStr from './build/js/wasm.str.js';
import result from './result.js';

/** @type {string|null} */
let workerURL = null;

/** @type {ArrayBuffer|null} */
let wasmBinary = null;

/**
 * Get or create the worker URL (lazy initialization)
 * @returns {string} Blob URL for the worker
 */
const getWorkerURL = () => {
    if (!workerURL) {
        workerURL = URL.createObjectURL(
            new Blob(
                [
                    pako.inflate(
                        Uint8Array.from(atob(workerStr), (c) =>
                            c.charCodeAt(0),
                        ),
                        { to: 'string' },
                    ),
                ],
                { type: 'text/javascript' },
            ),
        );
    }
    return workerURL;
};

/**
 * Get or create the WASM binary (lazy initialization)
 * @returns {ArrayBuffer} WASM binary
 */
const getWasmBinary = () => {
    if (!wasmBinary) {
        wasmBinary = pako.inflate(
            Uint8Array.from(atob(wasmStr), (c) => c.charCodeAt(0)),
        ).buffer;
    }
    return wasmBinary;
};

/**
 * Clean up shared resources (Blob URL and WASM binary)
 */
const cleanupResources = () => {
    if (workerURL) {
        URL.revokeObjectURL(workerURL);
        workerURL = null;
    }
    wasmBinary = null;
};

/**
 * @typedef {Object} ProcessedExtension
 * @property {'db'|'spl'} extends
 * @property {string} url
 * @property {{[name: string]: string}} fns
 */

/**
 * Create and initialize a WebWorker
 * @param {SplOptions} [options={}]
 * @param {Extension[]} [extensions=[]]
 * @returns {Promise<Worker>}
 */
const worker = (options = {}, extensions = []) => {
    return new Promise((resolve, reject) => {
        const exs = extensions.reduce((exs, ex) => {
            if (ex.url) {
                return [...exs, ex];
            } else {
                return [
                    ...exs,
                    ...Object.keys(ex.fns).map((fn) => {
                        const ex_ = {
                            extends: ex.extends,
                            url: URL.createObjectURL(
                                new Blob(
                                    [`export default ${ex.fns[fn].toString()}`],
                                    { type: 'text/javascript' },
                                ),
                            ),
                            fns: {},
                        };
                        ex_.fns[fn] = 'default';
                        return ex_;
                    }),
                ];
            }
        }, []);
        const worker = new Worker(getWorkerURL());
        worker.onmessage = () => {
            resolve(worker);
        };
        worker.onerror = (err) => {
            reject(err.message);
        };
        worker.postMessage({ wasmBinary: getWasmBinary(), exs, options });
    });
};

/**
 * @typedef {Object} QueueItem
 * @property {(res: any) => void} resolve
 * @property {(err: any) => void} reject
 */

/**
 * @template T
 * @typedef {T & PromiseLike<T>} Thenable
 */

/**
 * @typedef {Object} SplFs
 * @property {(path: string, options?: MountOption[]) => Thenable<Spl>} mount - Mount files
 * @property {(path: string) => Thenable<Spl>} unmount - Unmount files
 * @property {(path: string) => Promise<ArrayBuffer>} file - Read file from virtual filesystem
 * @property {(path: string) => Promise<string[]>} dir - List directory contents
 * @property {(path: string) => Thenable<Spl>} unlink - Delete file from virtual filesystem
 * @property {(path: string) => Thenable<Spl>} mkdir - Create directory in virtual filesystem
 */

/**
 * @typedef {Object} Spl
 * @property {(path?: string|ArrayBuffer) => Db} db - Open a database
 * @property {() => Thenable<any>} version - Get version info
 * @property {(cleanup?: boolean) => void} terminate - Terminate the WebWorker
 * @property {SplFs} fs - Filesystem operations
 */

/**
 * @typedef {Object} Db
 * @property {(db: string, schema: string) => Thenable<Db>} attach
 * @property {(schema: string) => Thenable<Db>} detach
 * @property {(sql: string, par?: any) => Thenable<Db>} exec
 * @property {(sql: string) => Thenable<Db>} read
 * @property {(src: string) => Thenable<Db>} load
 * @property {() => Thenable<Db>} save
 * @property {() => Thenable<Spl>} close
 * @property {Result} get
 */

/**
 * @typedef {Object} Result
 * @property {Promise<any>} first
 * @property {Promise<any[]>} flat
 * @property {Promise<any[][]>} rows
 * @property {Promise<string[]>} cols
 * @property {Promise<Object[]>} objs
 * @property {Promise<ResultData>} sync
 * @property {() => Promise<void>} free
 */

/**
 * Create SPL instance wrapping WebWorker communication
 * @param {Worker} wkr - WebWorker instance
 * @param {Extension[]} [exs=[]] - Extensions
 * @returns {Spl}
 */
const spl = function (wkr, exs = []) {
    // @ts-ignore - constructor pattern
    if (!new.target) return new spl(wkr, exs);

    /** @type {Object.<number, QueueItem>} */
    const queue = {};
    const stackSpl = [];

    wkr.onmessage = (evt) => {
        const { __id__, res, err } = evt.data;
        err ? queue[__id__].reject(err) : queue[__id__].resolve(res);
        delete queue[__id__];
    };

    wkr.onerror = (evt) => {
        evt.preventDefault();
        console.log(evt.message);
    };

    /**
     * Post message to worker and handle response
     * @param {{__id__?: number, fn: any, id?: number, args?: any[]}} msg
     * @param {((res: any) => void)|undefined} [resolve]
     * @param {((err: any) => void)|undefined} [reject]
     * @returns {Promise<any>}
     */
    const post = (msg, resolve, reject) => {
        return new Promise((_resolve, _reject) => {
            msg.__id__ =
                Math.max(-1, ...Object.keys(queue).map((id) => +id)) + 1;
            queue[msg.__id__] = {
                resolve: (res) => {
                    (resolve || _resolve)(res);
                },
                reject: (err) => {
                    (reject || _reject)(err);
                },
            };
            wkr.postMessage(msg);
        });
    };

    const thenSpl = () => {
        if (this.then === this) {
            this.then = (resolve, reject) => {
                if (stackSpl.length) {
                    return post(
                        {
                            fn: stackSpl.splice(0),
                        },
                        (res) => {
                            if (typeof res === 'object' && res.this === 'spl') {
                                this.then = this;
                                resolve(this);
                            } else {
                                resolve(res);
                            }
                        },
                        reject,
                    );
                } else {
                    this.then = this;
                    resolve(this);
                }
            };
        }
        return this;
    };

    /**
     * Open or create a database
     * @param {string|ArrayBuffer} [sqlite3] - Database path, ArrayBuffer, or undefined for in-memory
     * @returns {Db}
     */
    this.db = function (sqlite3) {
        // @ts-ignore - constructor pattern
        if (!new.target) return new this.db(sqlite3);

        /** @type {Db} */
        const _db = this;
        const id = Math.round(Number.MAX_SAFE_INTEGER * Math.random());
        const stackDB = [
            ...stackSpl.splice(0),
            {
                fn: 'db',
                id,
                args: [sqlite3 || ':memory:'],
            },
        ];
        const get = (fn) =>
            post({
                fn: [...stackDB.splice(0), { id, fn }],
            });
        const thenDB = () => {
            if (this.then === this) {
                this.then = (resolve, reject) => {
                    if (stackDB.length) {
                        return post(
                            {
                                fn: stackDB.splice(0),
                            },
                            (res) => {
                                if (
                                    typeof res === 'object' &&
                                    res.this === 'db'
                                ) {
                                    this.then = this;
                                    resolve(this);
                                    // } else if (res.__res && Number.isFinite(res.__res)) {
                                    //     resolve(result(res.__res));
                                } else {
                                    resolve(res);
                                }
                            },
                            reject,
                        );
                    } else {
                        this.then = this;
                        resolve(this);
                    }
                };
            }
            return this;
        };

        this.then = this;

        this.attach = (db, schema) => {
            stackDB.push({
                id,
                fn: 'db.attach',
                args: [db, schema],
            });

            return thenDB();
        };

        this.detach = (schema) => {
            stackDB.push({
                id,
                fn: 'db.detach',
                args: [schema],
            });

            return thenDB();
        };

        this.exec = (sql, par) => {
            stackDB.push({
                id,
                fn: 'db.exec',
                args: [sql, par],
            });

            return thenDB();
        };

        this.read = (sql) => {
            stackDB.push({
                id,
                fn: 'db.read',
                args: [sql],
            });
            return thenDB();
        };

        this.load = (src) => {
            stackDB.push({
                id,
                fn: 'db.load',
                args: [src],
            });
            return thenDB();
        };

        this.save = () => {
            stackDB.push({
                id,
                fn: 'db.save',
                args: [],
            });
            return thenDB();
        };

        this.close = () => {
            stackSpl.push(...stackDB.splice(0), {
                id,
                fn: 'db.close',
            });
            return thenSpl();
        };

        this.get = {
            get first() {
                return get('res.first');
            },
            get flat() {
                return get('res.flat');
            },
            get rows() {
                return get('res.rows');
            },
            get cols() {
                return get('res.cols');
            },
            get objs() {
                return get('res.objs');
            },
            get sync() {
                return get('res.sync').then((res) => result(...res));
            },
            free() {
                return get('res.free');
            },
        };

        exs.filter((ex) => ex.extends === 'db').forEach((ex) => {
            Object.keys(ex.fns).forEach((fn_) => {
                if (!(fn_ in this)) {
                    const fn = `db.${fn_}`;
                    this[fn_] = (...args) =>
                        ((fn) => {
                            stackDB.push({
                                id,
                                fn,
                                args,
                            });
                            return thenDB();
                        })(fn);
                }
            });
        });

        return thenDB();
    };

    this.then = this;

    this.version = () => {
        stackSpl.push({
            fn: 'version',
            args: [],
        });
        return thenSpl();
    };

    // Filesystem namespace
    this.fs = {
        /**
         * Mount files to virtual filesystem
         * @param {string} path - Mount path
         * @param {MountOption[]} [options] - Files to mount
         * @returns {Thenable<Spl>}
         */
        mount: (path, options) => {
            stackSpl.push({
                fn: 'fs.mount',
                args: [path, path, options],
            });
            return thenSpl();
        },

        /**
         * Unmount from virtual filesystem
         * @param {string} path - Mount path to unmount
         * @returns {Thenable<Spl>}
         */
        unmount: (path) => {
            stackSpl.push({
                fn: 'fs.unmount',
                args: [path],
            });
            return thenSpl();
        },

        /**
         * Read file from virtual filesystem
         * @param {string} path - Path to file
         * @returns {Promise<ArrayBuffer>}
         */
        file: (path) => {
            return post({
                fn: [...stackSpl.splice(0), { fn: 'fs.file', args: [path] }],
            });
        },

        /**
         * List directory contents
         * @param {string} path - Path to directory
         * @returns {Promise<string[]>}
         */
        dir: (path) => {
            return post({
                fn: [...stackSpl.splice(0), { fn: 'fs.dir', args: [path] }],
            });
        },

        /**
         * Delete file from virtual filesystem
         * @param {string} path - Path to file
         * @returns {Thenable<Spl>}
         */
        unlink: (path) => {
            stackSpl.push({
                fn: 'fs.unlink',
                args: [path],
            });
            return thenSpl();
        },

        /**
         * Create directory in virtual filesystem
         * @param {string} path - Path to create
         * @returns {Thenable<Spl>}
         */
        mkdir: (path) => {
            stackSpl.push({
                fn: 'fs.mkdir',
                args: [path],
            });
            return thenSpl();
        },
    };

    /**
     * Terminate the web worker
     * @param {boolean} [cleanup=true] - If true, also free shared Blob URL and WASM binary
     */
    this.terminate = (cleanup = true) => {
        wkr.terminate();
        if (cleanup) {
            cleanupResources();
        }
    };

    exs.filter((ex) => ex.extends === 'spl').forEach((ex) => {
        Object.keys(ex.fns).forEach((fn) => {
            if (!(fn in this)) {
                this[fn] = (...args) =>
                    ((fn) => {
                        stackSpl.push({
                            fn,
                            args,
                        });
                        return thenSpl();
                    })(fn);
            }
        });
    });
};

/**
 * Initialize spl.js for Browser (WebWorker-based)
 * @param {SplOptions} [options={}] - Configuration options
 * @param {Extension[]} [extensions=[]] - API extensions
 * @returns {Promise<Spl>}
 */
export default (options = {}, extensions = []) =>
    worker(options, extensions).then((wrk) => spl(wrk, extensions));
