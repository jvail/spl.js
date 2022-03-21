PWD = $(shell pwd)
BUILD_DIR = $(PWD)/src/build
BC_DIR = $(BUILD_DIR)/bc
PREFIX = --prefix=$(BC_DIR)

SQLITE_VERSION = 3360000
GEOS_VERSION = 3.9.0
PROJ_VERSION = 8.1.0
RTTOPO_VERSION = 1.1.0

ZLIB_VERSION = 1.2.11
XML2_VERSION = 2.9.12
ICONV_VERSION = 1.16

SPATIALITE_SRC = src/spatialite
SQLITE_SRC = $(BUILD_DIR)/sqlite-autoconf-$(SQLITE_VERSION)
GEOS_SRC = $(BUILD_DIR)/geos-$(GEOS_VERSION)
PROJ_SRC = $(BUILD_DIR)/proj-$(PROJ_VERSION)
ZLIB_SRC = $(BUILD_DIR)/zlib-$(ZLIB_VERSION)
RTTOPO_SRC = $(BUILD_DIR)/librttopo
XML2_SRC = $(BUILD_DIR)/libxml2-$(XML2_VERSION)
ICONV_SRC = $(BUILD_DIR)/libiconv-$(ICONV_VERSION)
SQLEAN_EXT_SRC = src/sqlean/src

DIST_FLAGS :=
DIST_FLAGS += -s EXPORT_ES6=1
DIST_FLAGS += -s USE_ES6_IMPORT_META=0
DIST_FLAGS += -s MODULARIZE=1
DIST_FLAGS += -s EXPORT_NAME="spl"
DIST_FLAGS += -s ENVIRONMENT="node,worker"
DIST_FLAGS += -s WASM_ASYNC_COMPILATION=0

ELD_FLAGS += -s INITIAL_MEMORY=64MB
ELD_FLAGS += -s ALLOW_MEMORY_GROWTH=1
ELD_FLAGS += -s ALLOW_TABLE_GROWTH=1
ELD_FLAGS += -s RETAIN_COMPILER_SETTINGS=1
ELD_FLAGS += --minify 0
ELD_FLAGS += -lnodefs.js
ELD_FLAGS += -lworkerfs.js

EMX_FLAGS :=
EMX_FLAGS += -s DISABLE_EXCEPTION_CATCHING=0
EMX_FLAGS += --memory-init-file 0

EXPORTED_FUNCTIONS = -s EXPORTED_FUNCTIONS=@$(PWD)/src/exported_functions.json
EXPORTED_RUNTIME_METHODS = -s EXPORTED_RUNTIME_METHODS=@$(PWD)/src/exported_runtime_methods.json

ifdef DEBUG
	EMX_FLAGS += -g4
	EMX_FLAGS += -s ASSERTIONS=1
	EMX_FLAGS += -s DEMANGLE_SUPPORT=1
	EMX_FLAGS += --source-map-base /$(BUILD_DIR)/spatialite/
else
	EMX_FLAGS += -Os
endif

em: dir zlib iconv sqlite proj geos rttopo xml2 spatialite extensions

dir:
	mkdir -p $(BUILD_DIR);
	mkdir -p $(BUILD_DIR)/bc;
	mkdir -p $(BUILD_DIR)/js;

zlib-conf: zlib-src
	cd $(ZLIB_SRC); \
	emconfigure ./configure $(PREFIX) --static;

zlib: zlib-conf
	cd $(ZLIB_SRC); \
	emmake make -j4 \
	CFLAGS="$(EMX_FLAGS)"; \
	emmake make install; \
	cd $(ZLIB_SRC)/contrib/minizip; \
	emcc -Wno-implicit-function-declaration -c -I../.. \
	minizip.c mztools.c miniunz.c unzip.c zip.c ioapi.c; \
	emar -rcs libminizip.a miniunz.o unzip.o minizip.o zip.o ioapi.o; \
	cp libminizip.a $(BC_DIR)/lib;

zlib-src:
	cd $(BUILD_DIR); \
	wget -nc http://zlib.net/zlib-$(ZLIB_VERSION).tar.gz; \
	tar -xf zlib-$(ZLIB_VERSION).tar.gz;

iconv-conf: iconv-src
	cd $(ICONV_SRC); \
	emconfigure ./configure $(PREFIX) --disable-shared;

iconv: iconv-conf
	cd $(ICONV_SRC); \
	emmake make -j4 CFLAGS="$(EMX_FLAGS)"; \
	emmake make install;

iconv-src:
	cd $(BUILD_DIR); \
	wget -nc https://ftp.gnu.org/gnu/libiconv/libiconv-$(ICONV_VERSION).tar.gz; \
	tar -xf libiconv-$(ICONV_VERSION).tar.gz;

sqlite-src:
	cd $(BUILD_DIR); \
	wget -nc https://www.sqlite.org/2021/sqlite-autoconf-$(SQLITE_VERSION).tar.gz; \
	tar -xf sqlite-autoconf-$(SQLITE_VERSION).tar.gz;

sqlite-conf: sqlite-src
	cd $(SQLITE_SRC); \
	emconfigure ./configure $(PREFIX) \
	--disable-tcl --disable-shared --disable-editline --disable-readline --disable-load-extension;

sqlite: sqlite-conf
	cd $(SQLITE_SRC); \
	emmake make -j4 \
	CFLAGS="$(EMX_FLAGS) -DSQLITE_CORE -DSQLITE_ENABLE_FTS5 -DSQLITE_USE_URI=1 -DSQLITE_DQS=0 -DSQLITE_THREADSAFE=0 -DSQLITE_ENABLE_JSON1 -DSQLITE_DEFAULT_MEMSTATUS=0 -DSQLITE_OMIT_DEPRECATED -DSQLITE_OMIT_TCL_VARIABLE -DSQLITE_OMIT_SHARED_CACHE -DSQLITE_DEFAULT_FOREIGN_KEYS=1" \
	LDFLAGS="-s ERROR_ON_UNDEFINED_SYMBOLS=0"; \
	emmake make install;

sqlite-clean:
	$(SQLITE_SRC); \
	emmake make clean;

# required for running spatialite tests
xml2-src:
	cd $(BUILD_DIR); \
	wget -nc https://gitlab.gnome.org/GNOME/libxml2/-/archive/v$(XML2_VERSION)/libxml2-$(XML2_VERSION).tar.gz; \
	tar -xf  libxml2-$(XML2_VERSION).tar.gz; \
	rm -fr libxml2-$(XML2_VERSION); \
	mv libxml2-v$(XML2_VERSION)-* libxml2-$(XML2_VERSION);

xml2-conf: xml2-src
	cd $(XML2_SRC); \
	./autogen.sh $(PREFIX) --without-python; \
	emconfigure ./configure $(PREFIX) --without-python --disable-shared --with-zlib CPPFLAGS="-DDEBUG_HTTP" Z_LIBS="-L$(BC_DIR)/lib -lz" Z_CFLAGS="-I$(BC_DIR)/include";

xml2: xml2-conf
	cd $(XML2_SRC); \
	emmake make -j4 \
	LDFLAGS="-L$(BC_DIR)/lib -liconv" \
	CPPFLAGS="$(EMX_FLAGS)"; \
	emmake make install;

# sqlite3 executable needed for building proj.db

proj-src:
	cd $(BUILD_DIR); \
	wget -nc http://download.osgeo.org/proj/proj-$(PROJ_VERSION).tar.gz; \
	tar -xf proj-$(PROJ_VERSION).tar.gz;

proj: proj-src
	cd $(PROJ_SRC) && mkdir -p build && cd build; \
	emcmake cmake -DCMAKE_CXX_FLAGS="$(EMX_FLAGS) -UHAVE_LIBDL" \
	-DHAVE_LIBDL=OFF -DUSE_THREAD=OFF -DBUILD_CCT=OFF -DBUILD_PROJ=OFF -DBUILD_CS2CS=OFF -DBUILD_GEOD=OFF -DBUILD_GIE=OFF \
	-DBUILD_PROJINFO=OFF -DBUILD_PROJSYNC=OFF -DBUILD_SHARED_LIBS=OFF -DBUILD_TESTING=OFF -DPROJ_NETWORK=OFF \
	-DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=$(BC_DIR) -DENABLE_CURL=OFF -DENABLE_TIFF=OFF \
	-DSQLITE3_LIBRARY=$(BC_DIR)/lib/libsqlite3 -DSQLITE3_INCLUDE_DIR=$(BC_DIR)/include -DPROJ_LIB="./proj" ..; \
	emmake make -j4; \
	emmake make install;

proj-clean:
	rm -fr $(PROJ_SRC)/build;


geos-src:
	cd $(BUILD_DIR); \
	wget -nc http://download.osgeo.org/geos/geos-$(GEOS_VERSION).tar.bz2; \
	tar -xf geos-$(GEOS_VERSION).tar.bz2; \

# sed -i '/add_subdirectory(doc)/d' $(GEOS_SRC)/CMakeLists.txt;

# geos: geos-src
# 	cd $(GEOS_SRC) && mkdir -p build && cd build; \
# 	emcmake cmake -DCMAKE_CXX_FLAGS="$(EMX_FLAGS)" \
# 	-DDISABLE_GEOS_INLINE=ON -DBUILD_TESTING=OFF -DBUILD_BENCHMARKS=OFF -DBUILD_SHARED_LIBS=OFF \
# 	-DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=$(BC_DIR) ..; \
# 	emmake make -j4; \
# 	emmake make install;

geos-conf: geos-src
	cd $(GEOS_SRC); \
	emconfigure ./configure $(PREFIX) --disable-inline --disable-shared;

# sed -i '/doc/d' $(GEOS_SRC)/Makefile;
# sed -i '/tests/d' $(GEOS_SRC)/Makefile;
# sed -i '/benchmarks/d' $(GEOS_SRC)/Makefile;
# sed -i '/tools/d' $(GEOS_SRC)/Makefile;

geos: geos-conf
	cd $(GEOS_SRC); \
	emmake make -j4 \
	CPPFLAGS="$(EMX_FLAGS)"; \
	emmake make install;

# cd $(GEOS_SRC)/tools && emmake make install geos-config;

geos-clean:
	cd $(GEOS_SRC) && make clean;

rttopo-src:
	cd $(BUILD_DIR); \
	wget -nc https://git.osgeo.org/gitea/rttopo/librttopo/archive/librttopo-$(RTTOPO_VERSION).tar.gz; \
	tar -xf librttopo-$(RTTOPO_VERSION).tar.gz;

rttopo-conf: rttopo-src
	cd $(RTTOPO_SRC); \
	./autogen.sh; \
	emconfigure ./configure $(PREFIX) --disable-shared --with-geosconfig="$(BC_DIR)/bin/geos-config";

rttopo: rttopo-conf
	cd $(RTTOPO_SRC); \
	emmake make -j4 CFLAGS="$(EMX_FLAGS) -I$(BC_DIR)/include"; \
	emmake make install;

rttopo-clean:
	cd $(RTTOPO_SRC) && make clean;

	# LIBXML2_LIBS="-L$(BC_DIR)/lib"
	# LIBXML2_CFLAGS="-I$(BC_DIR)/include/libxml2"

# remove some irrelevant tests that will fail (still some xls tests failing)
spatialite-conf:
	sed -i '/check_extension/d' $(SPATIALITE_SRC)/test/Makefile.am;
	sed -i '/check_sql_stmt_legacy/d' $(SPATIALITE_SRC)/test/Makefile.am;
	sed -i '/check_sql_stmt_extension/d' $(SPATIALITE_SRC)/test/Makefile.am;
	sed -i '/check_get_normal_zoom_extension_load/d' $(SPATIALITE_SRC)/test/Makefile.am;
	sed -i '/importxls/d' $(SPATIALITE_SRC)/test/sql_stmt_security_tests/Makefile.am;
	-rm $(SPATIALITE_SRC)/test/sql_stmt_security_tests/importxls*;
	cd $(SPATIALITE_SRC); \
	aclocal && automake; \
	emconfigure ./configure $(PREFIX) \
	CFLAGS="$(EMX_FLAGS) -DENABLE_MINIZIP -UOMIT_PROJ -DPROJ_NEW -ULOADABLE_EXTENSION -I$(ZLIB_SRC)/contrib" \
	CPPFLAGS="-I$(BC_DIR)/include" \
	LDFLAGS="-L$(BC_DIR)/lib" \
	--with-geosconfig="$(BC_DIR)/bin/geos-config" \
	--with-geosonlyreentrant \
	--enable-rttopo \
	--enable-geocallbacks \
	--enable-geosadvanced \
	--enable-geopackage \
	--enable-gcp \
	--enable-static \
	--disable-shared \
	--disable-libxml2 \
	--disable-freexl \
	--disable-gcov \
	--disable-examples;

spatialite: spatialite-conf
	cd $(SPATIALITE_SRC); \
	emmake make -j4; \
	emmake make install;


spatialite-clean:
	cd $(SPATIALITE_SRC) && make clean;


extensions:
	emcc -v -I$(SQLITE_SRC) -DSQLITE_CORE $(EMX_FLAGS) $(ELD_FLAGS) -c $(SQLEAN_EXT_SRC)/sqlite3-stats.c -o $(BC_DIR)/ex.o;


tests:
	cd $(SPATIALITE_SRC)/test; \
	echo " \
	Module.preRun = function () { \
		if (typeof ENV !== 'undefined') { \
			ENV.PROJ_LIB = './proj'; \
			ENV.SPATIALITE_SECURITY = 'relaxed'; \
		} \
		FS.mkdir('root'); \
		FS.mount(NODEFS, { root: '.' }, 'root'); \
		FS.chdir('root'); \
	};" > pre.js; \
	mkdir -p proj && cp -f $(BC_DIR)/share/proj/* proj; \
	emmake make check -j4 LOG_COMPILE="node" \
	LDFLAGS="$(ELD_FLAGS) -s ENVIRONMENT=node -s FORCE_FILESYSTEM=1 -s ERROR_ON_UNDEFINED_SYMBOLS=0 -s EXPORTED_FUNCTIONS="[_main]" -liconv -lminizip" \
	CFLAGS="$(EMX_FLAGS) -D_GNU_SOURCE --pre-js pre.js";


.PHONY: spl
spl: src/pre.js
	emcc -v $(EMX_FLAGS) $(ELD_FLAGS) $(DIST_FLAGS) $(EXPORTED_FUNCTIONS) $(EXPORTED_RUNTIME_METHODS) \
	-lz -lminizip -liconv -lsqlite3 -lgeos_c -lgeos -lrttopo -lproj -L$(BC_DIR)/lib \
	-s ERROR_ON_UNDEFINED_SYMBOLS=0 $(BC_DIR)/lib/libspatialite.a $(BC_DIR)/ex.o \
	-I$(SQLITE_SRC) \
	-I$(SPATIALITE_SRC)/src/headers \
	-I$(SPATIALITE_SRC)/src/headers/spatialite \
	src/spl.c --pre-js src/pre.js -o $(BUILD_DIR)/js/spl.js;

clean:
	rm -rf $(PWD)/dist/*;
	rm -rf $(PWD)/src/build/*;
