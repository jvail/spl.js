interface ISPL  {
    db(path: undefined | string | ArrayBuffer): IDB;
    mount(path: string, options: IMountOptions): ISPL;
    unmount(path: string): ISPL;
    version(): any;
    terminate(): void;
}

// this a 'thenable', but delcaring it as a PromiseLike gives errors in typescript:
// Type is referenced directly or indirectly in the fulfillment callback of its own 'then' method.
interface IDB {
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

interface IMountOptions {
    buffers?: { name: string, data: ArrayBuffer }[];
    files?: { name: string, data: File | FileList }[];
    blobs?: { name: string, data: Blob }[];
}

interface ISplOptions {
    autoJSON?: boolean;
    autoGeoJSON?: false | {
        precision: number,
        options: number
    }
}

declare const _default: (exs?: any[], options?: ISplOptions) => Promise<ISPL>;
export default _default;
