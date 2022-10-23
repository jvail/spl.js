import emspl from './build/js/spl.js';
import result from './result';
import { version as spl_version } from '../package.json';
import {
    ISPLSync,
    IDBSync,
    ISplOptions,
    IMountOption
} from './interfaces';

const SQLITE = Object.freeze({
    OK: 0,
    ROW: 100,
    DONE: 101,
    INTEGER: 1,
    FLOAT: 2,
    TEXT: 3,
    BLOB: 4,
    NULL: 5
});


const spl = function (wasmBinary=null, options: ISplOptions | {} ={}): ISPLSync {

    // @ts-ignore
    if (!new.target) return Object.freeze(new spl(wasmBinary, options));

    const _spl = this;
    const _emspl = emspl({ wasmBinary });
    const splOptions: ISplOptions = {
        autoJSON: true,
        autoGeoJSON: {
            precision: 6,
            options: 0
        },
        ...(options || {})
    };
    const {
        getValue,
        setValue,
        stackAlloc,
        HEAP8,
        stringToUTF8,
        UTF8ToString,
        lengthBytesUTF8,
        writeArrayToMemory,
        _free,
        _malloc,
        FS,
        NODEFS,
        WORKERFS,
        MEMFS,
        ENVIRONMENT_IS_NODE
    } = _emspl;

    const spatialite_alloc_connection = _emspl.cwrap('spatialite_alloc_connection', 'number', ['number']),
        spatialite_init_ex = _emspl.cwrap('spatialite_init_ex', 'number', ['number', 'number']),
        spatialite_cleanup_ex = _emspl.cwrap('spatialite_cleanup_ex', 'number', ['number']),
        spatialite_shutdown = _emspl.cwrap('spatialite_shutdown', 'void', ['void']);

    const sqlite3_stats_init = _emspl.cwrap('sqlite3_stats_init', 'number', ['number', 'number', 'number']);

    const sqlite3_open = _emspl.cwrap('sqlite3_open', 'number', ['string', 'number']),
        sqlite3_close_v2 = _emspl.cwrap('sqlite3_close_v2', 'number', ['number']),
        sqlite3_prepare_v2 = _emspl.cwrap('sqlite3_prepare_v2', 'number', ['number', 'string', 'number', 'number', 'number']),
        sqlite3_bind_text = _emspl.cwrap('sqlite3_bind_text', 'number', ['number', 'number', 'number', 'number', 'number']),
        sqlite3_bind_blob = _emspl.cwrap('sqlite3_bind_blob', 'number', ['number', 'number', 'number', 'number', 'number']),
        sqlite3_bind_double = _emspl.cwrap('sqlite3_bind_double', 'number', ['number', 'number', 'number']),
        sqlite3_bind_int = _emspl.cwrap('sqlite3_bind_int', 'number', ['number', 'number', 'number']),
        sqlite3_bind_null = _emspl.cwrap('sqlite3_bind_null', 'number', ['number', 'number']),
        sqlite3_bind_parameter_index = _emspl.cwrap('sqlite3_bind_parameter_index', 'number', ['number', 'string']),
        sqlite3_step = _emspl.cwrap('sqlite3_step', 'number', ['number']),
        sqlite3_errmsg = _emspl.cwrap('sqlite3_errmsg', 'string', ['number']),
        sqlite3_column_count = _emspl.cwrap('sqlite3_column_count', 'number', ['number']),
        sqlite3_column_double = _emspl.cwrap('sqlite3_column_double', 'number', ['number', 'number']),
        sqlite3_column_text = _emspl.cwrap('sqlite3_column_text', 'string', ['number', 'number']),
        sqlite3_column_blob = _emspl.cwrap('sqlite3_column_blob', 'number', ['number', 'number']),
        sqlite3_column_bytes = _emspl.cwrap('sqlite3_column_bytes', 'number', ['number', 'number']),
        sqlite3_column_type = _emspl.cwrap('sqlite3_column_type', 'number', ['number', 'number']),
        sqlite3_column_name = _emspl.cwrap('sqlite3_column_name', 'string', ['number', 'number']),
        sqlite3_reset = _emspl.cwrap('sqlite3_reset', 'number', ['number']),
        sqlite3_clear_bindings = _emspl.cwrap('sqlite3_clear_bindings', 'number', ['number']),
        sqlite3_finalize = _emspl.cwrap('sqlite3_finalize', 'number', ['number']),
        // sqlite3_stmt_readonly = _emspl.cwrap('sqlite3_stmt_readonly', 'void', ['number']),
        sqlite3_bind_parameter_count = _emspl.cwrap('sqlite3_bind_parameter_count', 'number', ['number']),
        sqlite3_exec = _emspl.cwrap('sqlite3_exec', 'number', ['number', 'number', 'number', 'number', 'number']),
        sqlite3_backup_init = _emspl.cwrap('sqlite3_backup_init', 'number', ['number', 'string', 'number', 'string']),
        sqlite3_backup_step = _emspl.cwrap('sqlite3_backup_step', 'number', ['number', 'number']),
        sqlite3_backup_finish = _emspl.cwrap('sqlite3_backup_finish', 'number', ['number']),
        sqlite3_errcode = _emspl.cwrap('sqlite3_errcode', 'number', ['number']),
        initGaiaOutBuffer = _emspl.cwrap('initGaiaOutBuffer', 'void', ['number']),
        gaiaToJSON = _emspl.cwrap('gaiaToJSON', 'number', ['number', 'number', 'number', 'number']),
        isGaia = _emspl.cwrap('isGaia', 'number', ['number', 'number']),
        gaiaOutBufferReset = _emspl.cwrap('gaiaOutBufferReset', 'void', ['number']);

        // TODO: save -> return buffer if no path given also in web; fix uncaught in promise; wal mode problem if opened from blob

    this.db = function(sqlite3?: string | ArrayBuffer) {

        // @ts-ignore
        if (!new.target) return Object.freeze(new _spl.db(sqlite3, options));

        const _db = this;
        let _result = result();
        let tmpPtr = 0;
        let dbHandle = 0;
        let cache = 0;
        let filename = '';
        const ptr_initGaiaOutBuffer = stackAlloc(4);
        initGaiaOutBuffer(ptr_initGaiaOutBuffer);
        const gaiaOutBuffer = getValue(ptr_initGaiaOutBuffer, 'i32');

        const memname = (): string => `mem-${(Math.round(Number.MAX_SAFE_INTEGER * Math.random()))}.db`;
        const toGeoJSON = (blob_ptr, size, precison, options)  => {
            let obj = null;
            let buf_ptr = gaiaToJSON(gaiaOutBuffer, blob_ptr, size, precison, options);
            if (buf_ptr) {
                obj = JSON.parse(UTF8ToString(buf_ptr));
            }
            gaiaOutBufferReset(gaiaOutBuffer);
            return obj;
        };
        const isParam = obj => {
            return !!obj &&
                typeof(obj) === 'object' &&
                Object.keys(obj).length &&
                Object.keys(obj).every(key => key.startsWith(':') || key.startsWith('$') || key.startsWith('@'));
        };
        const maybeJSON = (str: string) => {
            return (str.startsWith('"') && str.endsWith('"')) ||
                str === 'null' ||
                (str.startsWith('{') && str.endsWith('}')) ||
                (str.startsWith('[') && str.endsWith(']'));
        };
        const freeMemory = (ptrs: number[]) => {
            ptrs.forEach(ptr => _free(ptr));
            ptrs.length = 0;
        };

        Object.defineProperty(this, 'get', { get: () => _result });

        this.close = (): ISPLSync => {

            if (!dbHandle || !cache) {
                throw new Error('Database closed');
            }

            const ret = sqlite3_close_v2(dbHandle);

            if (cache) {
                spatialite_cleanup_ex(cache);
                spatialite_shutdown();
            }

            if (ret !== SQLITE.OK) {
                throw new Error(sqlite3_errmsg(dbHandle));
            }

            dbHandle = 0;
            cache = 0;

            return _spl;

        };

        this.attach = (db: string, schema: string) => this.exec('attach ? as ?', [db, schema]);

        this.detach = (schema: string) => this.exec('detach ?', [schema]);

        this.read = (sql): IDBSync => {

            if (!dbHandle || !cache) {
                throw new Error('Database closed');
            }

            const len = lengthBytesUTF8(sql) + 1;
            const ptr = _malloc(len);
            if (!ptr) {
                throw new Error("Unable to allocate memory");
            }
            stringToUTF8(sql, ptr, len);

            if (sqlite3_exec(dbHandle, ptr) !== SQLITE.OK) {
                _free(ptr)
                throw new Error(sqlite3_errmsg(dbHandle));
            }

            _free(ptr)

            return _db;

        };

        this.save = (dest?: string): IDBSync | ArrayBuffer => {

            if (!dbHandle || !cache) {
                throw new Error('Database closed');
            }

            const destfilename = dest || '/tmp/' + memname();

            const pFile = stackAlloc(4);
            let rc = sqlite3_open(destfilename, pFile);
            const sqlite3 = getValue(pFile, 'i32');

            if (rc == SQLITE.OK ) {
                const pBackup = sqlite3_backup_init(sqlite3, 'main', dbHandle, 'main');
                if (pBackup) {
                    sqlite3_backup_step(pBackup, -1);
                    sqlite3_backup_finish(pBackup);
                }
                rc = sqlite3_errcode(sqlite3);
            }

            if (rc != SQLITE.OK ) {
                throw new Error(sqlite3_errmsg(sqlite3));
            }

            sqlite3_close_v2(sqlite3);

            if (dest) {
                return _db;
            } else {
                const buffer = FS.readFile(destfilename, {
                    encoding: 'binary'
                }).buffer;
                FS.unlink(destfilename);
                return buffer;
            }

        };

        this.load = (src: string): IDBSync => {

            if (!dbHandle || !cache) {
                throw new Error('Database closed');
            }

            const pFile = stackAlloc(4);
            let rc = sqlite3_open(src, pFile);
            const sqlite3 = getValue(pFile, 'i32');

            if (rc == SQLITE.OK ) {
                const pBackup = sqlite3_backup_init(dbHandle, 'main', sqlite3, 'main');
                if (pBackup) {
                    sqlite3_backup_step(pBackup, -1);
                    sqlite3_backup_finish(pBackup);
                }
                rc = sqlite3_errcode(dbHandle);
            }

            if (rc != SQLITE.OK ) {
                throw new Error(sqlite3_errmsg(dbHandle));
            }

            sqlite3_close_v2(sqlite3);

            return _db;

        };

        this.exec = (sql, par) => {

            if (!dbHandle || !cache) {
                throw new Error('Database closed');
            }

            let ret, ptrs = [];
            const rows = [];
            setValue(tmpPtr, 0, 'i32');

            ret = sqlite3_prepare_v2(dbHandle, sql, -1, tmpPtr, 0);
            if (ret !== SQLITE.OK) {
                throw new Error(sqlite3_errmsg(dbHandle));
            }
            const stmt = getValue(tmpPtr, 'i32');
            if (!stmt) {
                throw new Error(sqlite3_errmsg(dbHandle));
            }

            const cols = sqlite3_column_count(stmt);
            const columns = [];

            for (let col = 0; col < cols; col++) {
                let name = sqlite3_column_name(stmt, col);
                let i = 1, the_name = name;
                while (columns.some(name => name === the_name)) {
                    the_name = name + i;
                    i++;
                };
                columns.push(the_name);
            }

            // TODO: figure out how to treat JSON/GeoJSON objects here
            /*
                case 1a: array of params [1,true,'a', ArrayBuffer]
                case 1b: array of params [1,2,3,4]
                case 2: array of arrays of params [[1,true,'a', ArrayBuffer], [2,true,'a', ArrayBuffer]]
                case 3: object of params {$a:1, $b:true, $c:'a', $d: ArrayBuffer}
                case 4: array of object of params [{$a:1, $b:true, $c:'a', $d: ArrayBuffer}]
                case 5: single value: 1
            */

            const parCount = sqlite3_bind_parameter_count(stmt);
            let pars = [];
            if (par != undefined && parCount > 0) {
                if (Array.isArray(par)) {
                    const objs = par.some(p => {
                        // return Array.isArray(p) || (typeof(p) === 'object' && !(p === null || p instanceof ArrayBuffer))
                        return Array.isArray(p) || isParam(p)
                    })
                    if (par.length === parCount && !objs) {
                        pars = [par]; // case 1a: single bind
                    } else if (objs) {
                        pars = par; // case 4 and 2
                    } else {
                        pars = par.map(p => [p]); // case 1b: multiple binds
                    }
                } else if (isParam(par)) {
                    pars = [par]; // case 3
                } else {
                    pars = [[par]]; // case 5
                }
            }
            // pars = Array.isArray(par) ? (
            //         typeof par[0] === 'object' && !(par[0] instanceof ArrayBuffer) ? par : [par]
            //     ) : [par];
            let i = 0;

            do {
                const par = pars[i];
                if (par != undefined) {
                    Object.keys(par).forEach(p => {
                        let idx = +p + 1; // will be NaN if par is an obj and index + 1 if par is an array
                        if (idx || (idx = sqlite3_bind_parameter_index(stmt, p))) {
                            let ret, ptr, len;
                            const val = par[p];
                            switch (typeof val) {
                                case 'string':
                                    len = lengthBytesUTF8(val) + 1;
                                    ptr = _malloc(len);
                                    if (!ptr) {
                                        freeMemory(ptrs);
                                        throw new Error("Unable to allocate memory");
                                    }
                                    stringToUTF8(val, ptr, len);
                                    ptrs.push(ptr);
                                    ret = sqlite3_bind_text(stmt, idx, ptr, len - 1, 0);
                                    break;
                                case 'boolean':
                                    ret = sqlite3_bind_int(stmt, idx, +val);
                                    break;
                                case 'number':
                                    ret = Number.isInteger(val) ? sqlite3_bind_int(stmt, idx, val) : sqlite3_bind_double(stmt, idx, val);
                                    break;
                                case 'object':
                                    if (val instanceof ArrayBuffer) {
                                        len = val.byteLength;
                                        ptr = _malloc(len);
                                        if (!ptr) {
                                            freeMemory(ptrs);
                                            throw new Error("Unable to allocate memory");
                                        }
                                        writeArrayToMemory(new Uint8Array(val), ptr);
                                        ptrs.push(ptr);
                                        ret = sqlite3_bind_blob(stmt, idx, ptr, len);
                                    } else if (!!val && splOptions.autoJSON) {
                                        const json = JSON.stringify(val);
                                        len = lengthBytesUTF8(json) + 1;
                                        ptr = _malloc(len);
                                        if (!ptr) {
                                            freeMemory(ptrs);
                                            throw new Error("Unable to allocate memory");
                                        }
                                        stringToUTF8(json, ptr, len);
                                        ptrs.push(ptr);
                                        ret = sqlite3_bind_text(stmt, idx, ptr, len, 0);
                                    } else {
                                        ret = sqlite3_bind_null(stmt, idx);
                                    }
                                    break;
                                default:
                                    ret = sqlite3_bind_null(stmt, idx);
                                    break;
                            };
                            if (ret !== SQLITE.OK) {
                                sqlite3_finalize(stmt);
                                freeMemory(ptrs);
                                throw new Error(sqlite3_errmsg(dbHandle));
                            }
                        };
                    });
                }

                while ((ret = sqlite3_step(stmt)) === SQLITE.ROW) {
                    const row = [];
                    for (let col = 0; col < cols; col++) {
                        let val;
                        const type = sqlite3_column_type(stmt, col)
                        switch (type) {
                            case SQLITE.INTEGER:
                            case SQLITE.FLOAT:
                                val = sqlite3_column_double(stmt, col);
                                break;
                            case SQLITE.TEXT:
                                let str = sqlite3_column_text(stmt, col);
                                if (splOptions.autoJSON && maybeJSON(str)) {
                                    try {
                                        val = JSON.parse(str);
                                    } catch (_) {
                                        val = str;
                                    }
                                } else {
                                    val = str;
                                }
                                break;
                            case SQLITE.BLOB:
                                const size = sqlite3_column_bytes(stmt, col);
                                const ptr = sqlite3_column_blob(stmt, col);
                                if (splOptions.autoGeoJSON && isGaia(ptr, size)) {
                                    val = toGeoJSON(ptr, size, splOptions.autoGeoJSON.precision, splOptions.autoGeoJSON.options);
                                } else {
                                    val = HEAP8.buffer.slice(ptr, ptr + size);
                                }
                                break;
                            default:
                                val = null;
                        }
                        row[col] = val;
                    }
                    rows.push(row);
                };
                freeMemory(ptrs);
                sqlite3_reset(stmt);
                sqlite3_clear_bindings(stmt);

                if (ret !== SQLITE.DONE) {
                    sqlite3_finalize(stmt);
                    throw new Error(sqlite3_errmsg(dbHandle));
                }

                i++;

            } while (i < pars.length);

            // const readonly = sqlite3_stmt_readonly(stmt);
            sqlite3_finalize(stmt);

            _result = result(columns, rows);

            // return readonly === 0 && rows.length === 0 ? _db : result(columns, rows);
            return _db;

        };

        let tempname;
        if (sqlite3 instanceof ArrayBuffer) {
            filename = ':memory:';
            tempname = memname();
            FS.createDataFile('/tmp', tempname, new Uint8Array(sqlite3), true, true);
        } else if (typeof(sqlite3) === 'string' || !sqlite3) {
            filename = sqlite3;
            // if (ENVIRONMENT_IS_NODE) {
            //     filename = sqlite3;
            // } else {
            //     filename = ':memory:';
            // }
        } else {
            throw new Error('Expected nothing, string or ArrayBuffer');
        }

        tmpPtr = stackAlloc(4);
        const ret = sqlite3_open(filename || ':memory:', tmpPtr);
        dbHandle = getValue(tmpPtr, 'i32');

        if (ret === SQLITE.OK) {
            cache = spatialite_alloc_connection();
            spatialite_init_ex(dbHandle, cache, false);
            sqlite3_stats_init(dbHandle, 0, 0);
        } else {
            throw new Error(sqlite3_errmsg(dbHandle));
        }

        if (tempname) {
            this.load('/tmp/' + tempname);
            FS.unlink('/tmp/' + tempname);
        }

        // set path to embeded minimal proj.db
        this.read('SELECT PROJ_SetDatabasePath(\'/proj_min.db\');');
    };

    this.version = () : {} => {

        const db_ = this.db();
        const ret = db_.exec(`select
        spatialite_version() spatialite,
        sqlite_version() sqlite,
        geos_version() geos,
        proj_version() proj,
        rttopo_version() rttopo,
        '${spl_version}' 'spl.js'`);
        db_.close();

        return ret[0];

    };

    // options
    // [
    //  { name: 'name', data: Blob | File | FileList | string  }],
    // ]
    //
    this.mount = (path: string, mountpoint: string ='root', options: IMountOption[] =[]): ISPLSync => {
        const toroot = mountpoint == 'root' || mountpoint == '.' || mountpoint === '/'  || !mountpoint;
        try {
            FS.mkdir(toroot ? 'root' : mountpoint);
            if (ENVIRONMENT_IS_NODE) {
                FS.mount(NODEFS, { root: path }, toroot ? 'root' : mountpoint);
            } else {
                const fs_options = options.reduce((options, option) => {
                    const { name, data } = option;
                    if (data instanceof Blob) {
                        options.blobs.push({ name, data });
                    } else if (data instanceof File) {
                        options.files.push(data);
                    } else if (data instanceof FileList) {
                        for (let i = 0; i < data.length; i++) {
                            options.files.push(data.item(i));
                        }
                    } else if (data instanceof ArrayBuffer) {
                        options.blobs.push({ name, data: new Blob([data]) });
                    } else if (typeof data === 'string') {
                        options.blobs.push({ name, data: new URL(data).toString() });
                    }
                    return options;
                }, { files: [], blobs: [] });
                if (fs_options.files.length || fs_options.blobs.length) {
                    FS.mount(WORKERFS, fs_options, toroot ? 'root' : mountpoint);
                }
            }
            if (toroot) {
                FS.chdir('root');
            }
        } catch (err) {
            throw new Error(err.message);
        }
        return this;
    };

    this.unmount = (mountpoint): ISPLSync  => {
        try {
            FS.unmount(mountpoint);
        } catch (err) {
            throw new Error(err.message);
        }
        return this;
    };

};

export default spl;
