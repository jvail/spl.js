import * as pako from 'pako';
import workerStr from './build/js/worker.str.js';
import wasmStr from './build/js/wasm.str.js';
import result from './result.js';

const workerURL= URL.createObjectURL(new Blob([pako.inflate(Uint8Array.from(atob(workerStr), c => c.charCodeAt(0)), { to: 'string' })], { type: 'text/javascript' }));
const wasmBinary = pako.inflate(Uint8Array.from(atob(wasmStr), c => c.charCodeAt(0))).buffer;

/**
 * @param {import('./index.js').SplOptions} options
 * @param {import('./index.js').Extension[]} extensions
 *
 * @return {Promise<Worker>}
 */
const worker = (options={}, extensions=[]) => {
    return new Promise((resolve, reject) => {
        const exs = extensions.reduce((exs, ex) => {
            if (ex.url) {
                return [...exs, ex];
            } else {
                return [...exs, ...Object.keys(ex.fns).map(fn => {
                    const ex_ = {
                        extends: ex.extends,
                        url: URL.createObjectURL(new Blob([`export default ${ex.fns[fn].toString()}`], { type: 'text/javascript' })),
                        fns: {}
                    };
                    ex_.fns[fn] = 'default';
                    return ex_;
                })];
            }
        }, []);
        const worker = new Worker(workerURL);
        worker.onmessage = () => {
            resolve(worker);
        };
        worker.onerror = (err) => {
            reject(err.message)
        };
        worker.postMessage({ wasmBinary, exs, options });
    });
};

/**
 * @param {Worker} wkr
 * @param {import('./index.js').Extension[]} exs
 *
 * @returns {import('./index.js').Spl}
 */
const spl = function (wkr, exs=[]) {

    if (!new.target) return new spl(wkr, exs);

    /**
     * @typedef {Object} QueueItem
     * @property {Function} resolve
     * @property {Function} reject
     */

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
     * @return {Promise<any>}
     */
    const post = (msg, resolve, reject) => {
        return new Promise((_resolve, _reject) => {
            msg.__id__ = Math.max(-1, ...Object.keys(queue).map(id => +id)) + 1;
            queue[msg.__id__] = {
                resolve: res => {
                    (resolve || _resolve)(res);
                },
                reject: err => {
                    (reject || _reject)(err);
                }
            };
            wkr.postMessage(msg);
        });
    };

    const thenSpl = () => {
        if (this.then === this) {
            this.then = (resolve, reject) => {
                if (stackSpl.length) {
                    return post({
                        fn: stackSpl.splice(0)
                    }, res => {
                        if (typeof(res) === 'object' && res.this === 'spl') {
                            this.then = this;
                            resolve(this);
                        } else {
                            resolve(res);
                        }
                    }, reject);
                } else {
                    this.then = this;
                    resolve(this);
                }
            }
        }
        return this;
    }

    this.db = function(sqlite3) {

        if (!new.target) return new this.db(sqlite3);

        /** @type {import('./index.js').Db} */
        const _db = this;
        const id = Math.round(Number.MAX_SAFE_INTEGER * Math.random());
        const stackDB = [...stackSpl.splice(0), {
            fn: 'db',
            id,
            args: [sqlite3 || ':memory:']
        }];
        const get = (fn) => post({
            fn: [
                ...stackDB.splice(0),
                { id, fn }
            ]
        });
        const thenDB = () => {
            if (this.then === this) {
                this.then = (resolve, reject) => {
                    if (stackDB.length) {
                        return post({
                            fn: stackDB.splice(0)
                        }, res => {
                            if (typeof(res) === 'object' && res.this === 'db') {
                                this.then = this;
                                resolve(this);
                            // } else if (res.__res && Number.isFinite(res.__res)) {
                            //     resolve(result(res.__res));
                            } else {
                                resolve(res);
                            }
                        }, reject);
                    } else {
                        this.then = this;
                        resolve(this);
                    }
                }
            }
            return this;
        }

        this.then = this

        this.attach = (db, schema) => {

            stackDB.push({
                id,
                fn: 'db.attach',
                args: [db, schema]
            });

            return thenDB();

        }

        this.detach = (schema) => {

            stackDB.push({
                id,
                fn: 'db.detach',
                args: [schema]
            });

            return thenDB();

        }

        this.exec = (sql, par) => {
            stackDB.push({
                id,
                fn: 'db.exec',
                args: [sql, par]
            });

            return thenDB();
        };

        this.read = (sql) => {
            stackDB.push({
                id,
                fn: 'db.read',
                args: [sql]
            });
            return thenDB();
        };


        this.load = (src) => {
            stackDB.push({
                id,
                fn: 'db.load',
                args: [src]
            });
            return thenDB();
        };

        this.save = () => {
            stackDB.push({
                id,
                fn: 'db.save',
                args: []
            });
            return thenDB();
        };

        this.close = () => {
            stackSpl.push(
                ...stackDB.splice(0),
                {
                    id,
                    fn: 'db.close'
                }
            );
            return thenSpl();
        };

        this.get = {
            get first()  {
                return get('res.first');
            },
            get flat()  {
                return get('res.flat');
            },
            get rows()  {
                return get('res.rows');
            },
            get cols()  {
                return get('res.cols');
            },
            get objs()  {
                return get('res.objs');
            },
            get sync()  {
                return get('res.sync')
                    .then(res => result(...res));
            },
            free()  {
                return get('res.free');
            }
        };

        exs.filter(ex => ex.extends === 'db').forEach(ex => {
            Object.keys(ex.fns).forEach(fn_ => {
                if (!(fn_ in this)) {
                    const fn = `db.${fn_}`;
                    this[fn_]  = (...args) => (fn => {
                        stackDB.push({
                            id,
                            fn,
                            args
                        });
                        return thenDB();
                    })(fn);
                }
            })
        })

        return thenDB();

    }

    this.then = this;

    this.version = () => {
        stackSpl.push({
            fn: 'version',
            args: []
        });
        return thenSpl();
    };

    this.mount = (path, options) => {
        stackSpl.push({
            fn: 'mount',
            args: [path, path, options]
        });
        return thenSpl();
    };

    this.unmount = (path) => {
        stackSpl.push({
            fn: 'unmount',
            args: [path]
        });
        return thenSpl();
    };

    this.terminate = () => wkr.terminate();

    exs.filter(ex => ex.extends === 'spl').forEach(ex => {
        Object.keys(ex.fns).forEach(fn => {
            if (!(fn in this)) {
                this[fn]  = (...args) => (fn => {
                    stackSpl.push({
                        fn,
                        args
                    });
                    return thenSpl();
                })(fn);
            }
        })
    })

};


export default (options={}, extensions=[]) => worker(options, extensions).then(wrk => spl(wrk, extensions));
