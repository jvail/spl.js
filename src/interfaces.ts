interface ISPLSync {
    db(path: undefined | string | ArrayBuffer): IDBSync;
    mount(path: string, mountpoint: string): ISPLSync;
    unmount(mountpoint: string): ISPLSync;
    version(): any;
}

interface IDBSync {
    attach(db: string, schema: string): IDB;
    detach(schema: string): IDB;
    exec(sql: string, par?: any): IDB;
    read(sql: string): IDB;
    load(src: string): IDB;
    save(dest?: string): IDB | ArrayBuffer;
    close(): ISPLSync;
    get: {
        first: any,
        flat: any[],
        rows: any[],
        cols: string[],
        objs: any[],
        sync: IResult,
        free(): undefined
    }
}

interface ISPL extends PromiseLike<ISPL>  {
    db(path: undefined | string | ArrayBuffer): IDB;
    mount(path: string, options: IMountOption[]): ISPL;
    unmount(path: string): ISPL;
    version(): any;
    terminate(): void;
}

interface IDB extends PromiseLike<IDB> {
    attach(db: string, schema: string): IDB;
    detach(schema: string): IDB;
    exec(sql: string, par?: any): IDB;
    read(sql: string): IDB;
    load(src: string): IDB;
    save(dest?: string): IDB | ArrayBuffer;
    close(): ISPL;
    get: {
        first: Promise<any>,
        flat: Promise<any[]>,
        rows: Promise<any[]>,
        cols: Promise<string[]>,
        objs: Promise<any[]>,
        sync: IResult,
        free: Promise<undefined>
    }
}

interface IResult {
    first: any,
    flat: any[],
    rows: any[],
    cols: string[],
    objs: any[],
    sync: IResult,
    free: undefined
}

interface IMountOption {
    name: string;
    data: ArrayBuffer | Blob | File | FileList | string;
}

interface ISplOptions {
    autoJSON?: boolean;
    autoGeoJSON?: false | {
        precision: number,
        options: number
    }
}

export {
    ISPL,
    ISPLSync,
    ISplOptions,
    IDB,
    IDBSync,
    IResult,
    IMountOption
}
