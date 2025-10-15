Module.preRun = function () {
    if (typeof ENV !== 'undefined') {
        ENV.PROJ_LIB = '/proj';
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
        } else { // must be a string/url
            assert(typeof(contents) === 'string');
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
        this._size = 0;
        this.expected_pos = 0;
        this.prefetch_len = 0;
        this.buffer = new ArrayBuffer();
        this.header = new ArrayBuffer();
        this.pos = 0;
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
            this.xhr.setRequestHeader('Accept-Encoding', 'identity')
            this.xhr.send(null);
        } while (retry < 3 && this.xhr.status != 200)
        this._size = size;
        return size;
    }

    fromHeader(pos, len) {
        if (this.header.byteLength) {
            return this.header.slice(pos, pos + len);
        }
        return null
    }

    fromBuffer(pos, len) {
        const start = pos - this.pos;
        if (start >= 0 && pos + len <= this.pos + this.buffer.byteLength) {
            return this.buffer.slice(start, start + len);
        }
        return null
    }

    fetch(pos, len) {
        let buffer = null;
        let retry = 0;
        this.xhr.onload = () => {
            buffer = this.xhr.response;
        };
        do {
            retry += 1;
            this.xhr.open('GET', this.url, false);
            this.xhr.setRequestHeader('Accept-Encoding', 'identity')
            this.xhr.setRequestHeader('Range', `bytes=${pos}-${Math.min(this._size - 1, pos + len - 1)}`);
            this.xhr.send(null);
        } while (retry < 3 && this.xhr.status != 206);
        return buffer;
    }

    read(pos, len) {
        if (pos + len <= 100) {
            let buffer = this.fromHeader(pos, len);
            if (buffer) {
                return buffer;
            }
            this.header = this.fetch(0, 100);
            return this.fromHeader(pos, len);
        }
        let buffer = this.fromBuffer(pos, len);
        if (buffer) {
            return buffer;
        }
        // https://github.com/jvail/spl.js/issues/13
        // The idea is that the more consecutive pages are read by sqlite
        // the higher the likelihood it will continue to read consecutive pages:
        // Then increase no. pages pre-fetched.
        if (pos === this.expected_pos) {
            this.prefetch_len = Math.min(len * 256, 2 * (this.prefetch_len ? this.prefetch_len : len));
        } else {
            this.prefetch_len = len;
        }
        this.expected_pos = pos + this.prefetch_len;

        this.buffer = this.fetch(pos, this.prefetch_len);
        this.pos = pos;
        return this.fromBuffer(pos, len);
    }

}
