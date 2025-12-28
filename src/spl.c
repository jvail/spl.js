#include <stdlib.h>
#include <emscripten.h>
#include <sqlite3.h>
#include <spatialite.h>
#include <geopackage.h>

#ifdef __cplusplus
extern "C" {
#endif

/*
 * Stub for sqlite3_enable_load_extension.
 * SQLite is built with --disable-load-extension for WASM (no dynamic loading),
 * but SpatiaLite's stored_procedures.c calls this function when LOADABLE_EXTENSION
 * is not defined. This stub satisfies the linker and returns success.
 */
int sqlite3_enable_load_extension(sqlite3 *db, int onoff) {
    (void)db;
    (void)onoff;
    return SQLITE_OK;
}

void EMSCRIPTEN_KEEPALIVE initGaiaOutBuffer(gaiaOutBufferPtr *out_buf) {
    gaiaOutBuffer *_out_buf = (gaiaOutBuffer *)malloc(sizeof(gaiaOutBuffer));
    if (_out_buf) {
        gaiaOutBufferInitialize(_out_buf);
    }
    *out_buf = _out_buf;
}

void EMSCRIPTEN_KEEPALIVE freeGaiaOutBuffer(gaiaOutBufferPtr out_buf) {
    if (out_buf) {
        gaiaOutBufferReset(out_buf);
        free(out_buf);
    }
}

char* EMSCRIPTEN_KEEPALIVE gaiaToJSON(gaiaOutBufferPtr out_buf, unsigned char *blob, int n_bytes, int precision, int options) {;
    gaiaGeomCollPtr geo = NULL;
    geo = gaiaFromSpatiaLiteBlobWkbEx(blob, n_bytes, 0, 1);
    gaiaOutGeoJSON(out_buf, geo, precision, options);
    gaiaFreeGeomColl(geo);
    if (out_buf->Error || out_buf->Buffer == NULL) {
        return NULL;
    }
    return out_buf->Buffer;
}

/* copied from gaiaFromSpatiaLiteBlobWkbEx */
int EMSCRIPTEN_KEEPALIVE isGaia(unsigned char *blob, int size) {

    if (gaiaIsValidGPB(blob, size))
        return 1;

    if (size < 45)
        return 0;   /* cannot be an internal BLOB WKB geometry */
    if (*(blob + 0) != GAIA_MARK_START)
        return 0;   /* failed to recognize START signature */
    if (*(blob + (size - 1)) != GAIA_MARK_END)
        return 0;   /* failed to recognize END signature */
    if (*(blob + 38) != GAIA_MARK_MBR)
        return 0;   /* failed to recognize MBR signature */
    if (*(blob + 1) != GAIA_LITTLE_ENDIAN && *(blob + 1) != GAIA_BIG_ENDIAN)
        return 0;

    return 1;

}

#ifdef __cplusplus
}
#endif
