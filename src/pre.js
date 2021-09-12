Module.preRun = function () {
    if (typeof ENV !== 'undefined') {
        ENV.PROJ_LIB = './proj';
        ENV.SPATIALITE_SECURITY = 'relaxed';
    }
    Module.FS = FS;
    Module.NODEFS = NODEFS;
    Module.MEMFS = MEMFS;
    Module.WORKERFS = WORKERFS;
    Module.ENVIRONMENT_IS_NODE = ENVIRONMENT_IS_NODE;
};
