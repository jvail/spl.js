Module.preRun = function () {
    if (typeof ENV !== 'undefined') {
        ENV.PROJ_LIB = './proj';
        ENV.SPATIALITE_SECURITY = 'relaxed';
    }
    if (!ENVIRONMENT_IS_NODE) {
        WORKERFS.stream_ops.read = stream_ops_read;
        WORKERFS.createNode = createNode;
    }

    Module.FS = FS;
    Module.NODEFS = NODEFS;
    Module.MEMFS = MEMFS;
    Module.WORKERFS = WORKERFS;
    Module.ENVIRONMENT_IS_NODE = ENVIRONMENT_IS_NODE;
};


const stream_ops_read = (stream, buffer, offset, length, position) => {

    if (position >= stream.node.size || length == 0) return 0;
    if (stream.node.contents instanceof Blob || stream.node.contents instanceof File) {
        var chunk = stream.node.contents.slice(position, position + length);
        var ab = WORKERFS.reader.readAsArrayBuffer(chunk);
        buffer.set(new Uint8Array(ab), offset);
        return chunk.size;
    } else {
        const data = new Uint8Array(stream.node.xhr.read(position, length));
        if (!data) {
            throw new Error(`Fetching range from ${stream.node.contents} failed.`);
        }
        buffer.set(data, offset);
        return data.length;
    }

};

const createNode = (parent, name, mode, dev, contents, mtime) => {

    const node = FS.createNode(parent, name, mode);
    node.mode = mode;
    node.node_ops = WORKERFS.node_ops;
    node.stream_ops = WORKERFS.stream_ops;
    node.timestamp = (mtime || new Date).getTime();
    assert(WORKERFS.FILE_MODE !== WORKERFS.DIR_MODE);

    if (mode === WORKERFS.FILE_MODE) {
        if (contents instanceof Blob || contents instanceof File) {
            node.size = contents.size;
            node.contents = contents;
        } else {
            node.xhr = new XHR(contents);
            node.size = node.xhr.size();
            if (node.size < 0) {
                throw new Error(`Fetching size from ${stream.node.contents} failed.`);
            }
        }
    } else {
        node.size = 4096;
        node.contents = {};
    }
    if (parent) {
        parent.contents[name] = node;
    }
    return node;
};


class XHR {

    constructor(url) {
        this.url = url;
        this.xhr = new XMLHttpRequest();
        this.xhr.responseType = 'arraybuffer';
    }

    size() {
        let retry = 0;
        let size = -1;
        this.xhr.onload = () => {
            size = +this.xhr.getResponseHeader('Content-Length');
        };
        do {
            retry += 1;
            this.xhr.open('HEAD', this.url, false);
            this.xhr.send(null);
        } while (retry < 3 && this.xhr.status != 200)
        return size;
    }

    read(pos, len) {
        let retry = 0;
        let buffer = null;
        this.xhr.onload = () => {
            buffer = this.xhr.response;
        };
        do {
            retry += 1;
            this.xhr.open('GET', this.url, false);
            this.xhr.setRequestHeader('Range', `bytes=${pos}-${pos + len - 1}`);
            this.xhr.send(null);
        } while (retry < 3 && this.xhr.status != 206)
        return buffer;
    }

}
