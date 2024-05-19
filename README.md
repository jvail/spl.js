# spl.js

SpatiaLite and friends - sqlite, geos, proj, rttopo - for node (sync API) and browser (async API).

[Here is a list](doc/spatialite_functions.md) of supported SpatiaLite SQL functions and [a list](doc/extensions_functions.md) of available SQLite extension functions/modules.

## Install

```bash
npm install spl.js
```

The library for browsers bundles both the WebWorker script and the wasm file (~ 5MB).

A minimal proj.db including EPSG codes for lon/lat to "Web Mercator" and UTM is embeded. Other PROJ files and the complete proj.db are available from the `dist/proj` folder.
If you like to use the full proj.db instead you need to mount it to `/proj/proj.db` and set the path with spatialite's `PROJ_SetDatabasePath`.


## Code Examples

Hello SpatiaLite

```js
import SPL from 'spl.js';
const db = await SPL().then(spl => spl.db());

console.assert(
    await db.exec('SELECT spatialite_version()').get.first === '5.1.0'
);

db.exec('SELECT ? AS hello', ['spatialite']).get.objs
    .then(results => console.assert(results[0].hello === 'spatialite'))
    .catch(err => console.log(err));
```

Import a GeoPackage

```js
import SPL from 'spl.js';

const spl = await SPL();
const url = 'https://data.london.gov.uk/download/london_boroughs/9502cdec-5df0-46e3-8aa1-2b5c5233a31f/london_boroughs.gpkg'

const london = await fetch(url)
    .then(response => response.arrayBuffer());

const db = await spl.db(london)
    .exec('SELECT EnableGpkgAmphibiousMode()');

const srid = await db.exec('SELECT SRID(geom) FROM london_boroughs').get.first;

console.assert(srid === 27700)
```

Handle JSON & GeoJSON automatically (parse, stringify, geometry blob to GeoJSON)

```js
import SPL from 'spl.js';
const db = await SPL({
    autoGeoJSON: {
        precision: 0,
        options: 0
    }
}).then(spl => spl.db());

console.assert(
    (await db.exec('SELECT json(@js)', { '@js': { hello: 'json' }}).get.first).hello === 'json'
);

console.assert(
    (await db.exec('SELECT GeomFromText(?)', [ 'POINT(11.1 11.1)' ]).get.first).coordinates[0] === 11
);
```

Import a zipped Shapefile

```js
import SPL from 'spl.js';
const spl = await SPL();

const lights = await fetch('examples/lights.zip')
    .then(response => response.blob());

const db = await spl
    .mount('data', [
        { name: 'lights.zip', data: lights }
    ])
    .db()
        .exec('SELECT ImportZipSHP(?, ?, ?, ?, ?)', [
            '/data/lights.zip', 'lights', 'lights', 'UTF-8', 4326
        ]);

console.assert(
    await db.exec('SELECT count(*) FROM lights').get.first === 17976
);
```

## Live Examples

Be patient - spl.js, data and other packages need to be fetched.

Create a topology from a GeoPackage layer and simplify polygon boundaries:

https://jvail.github.io/spl.js/examples/topology.html

Load proj.db remotely, transform and display GeoPackage geometries in OpenLayers:

https://jvail.github.io/spl.js/examples/openlayers.html

Buffers & Intersections: A little test for GeoJSON vs WKB serialization and WebWorker transfer:

https://jvail.github.io/spl.js/examples/lights-performance.html

Sources: https://github.com/jvail/spl.js/tree/main/examples


A few notebook / observablehq [examples](https://observablehq.com/search?query=%22spl.js%22&sort=relevance&direction=desc&useES=true).

## API

The API for node and browser is identical (almost - file handling is obviously different. See e.g. `mount` function).

If you are looking for more examples there are many snippets in the `test/node.js` and `test/browser.js` files.

## SPL

### `SPL`([`options`: {}, `extensions`: []]) -> `SPL`

extensions: Browser only - see "Extensions API" section below.

options:
- `autoJSON`: If 'true' applies stringify/parse to/from JSON in results and query parameters automatically (default: true)
- `autoGeoJSON`: Automatically converts SpatiaLite/GPKG geometry blobs into GeoJSON if not set to 'false' (default { precision: 6, options: 0 }):
    - `precision`: precision used in Geometry to GeoJSON conversion,
    - `options`: options as described in "AsGeoJSON" in SpatiaLite:
        - 0 no options
        - 1 GeoJSON BoundingBox
        - 2 GeoJSON CRS [short version]
        - 3 BoundingBox + short CRS
        - 4 GeoJSON CRS [long version]
        - 5 BoundingBox + long CRS

### `.db`([`path`: string | ArrayBuffer]) -> `DB`

**Browser**

### `.mount`(`path`: string, options) -> `SPL`

All mounted paths are read only.

options is an array of objects:

{ `name`: string, `data`: ArrayBuffer | Blob | File | FileList | string };

If a db is opened from a mounted path it is read only. Use db.load('path/name') to load it as read/write db.
If `data` is a string it must be a valid URL where HEAD and Range requests are available. `name` is not required for File or FileList.

You can use SQLite URIs (https://sqlite.org/c3ref/open.html#urifilenameexamples). For mounted URLs you should use `file:sqlite.db?immutable=1`.

**Node**

### `.mount`(`path`: string [, `mountpoint`: string]) -> `SPL`

If no mountpoint is provided the local `path` will be mouted as root e.g. `a_dir/some_dir/some_file` is available as `some_dir/some_file` if mounted as `spl.mount(path: 'a_dir')`.

### `.unmount`(`path`: string) -> `SPL`

### `.export`(`paths`: ...string [, options]) -> Promise<ArrayBuffer | ArrayBuffer[] | string | string[]>

Returns files previously saved in the root path of the worker filesystem if awaited(**browser only**).

options:
- `encoding`: 'utf8' or 'binary' (default)
- `unlink`: boolean, keep or remove (default) the file afterwards

Example:

```js
await db.read(`
    SELECT ExportGeoJSON2('my_table', 'geometry', 'my.geojson');
    SELECT ExportSHP('my_table', 'geometry', 'shapefile', 'UTF-8');
`);
const geojson = await spl.export('my.geojson', { encoding: 'utf8' });
const shp = await spl.export(
    'shapefile.shp',
    'shapefile.shx',
    'shapefile.dbf',
    'shapefile.prj'
);
```

### `.terminate`()

Terminates the WebWorker (**browser only**).

## DB

### `.attach`(`db`: string, `schema`: string) -> `DB`
### `.detach`(`schema`: string) -> `DB`
### `.exec`(`sql`: string [, `parameters`: any]) -> `DB`

`parameters` is either an array (or array of arrays) with positional bindings or an object (or array of objects) with named bindings with the following (SQLite) templates:

- ?
- ?NNN
- :VVV
- @VVV
- $VVV

If `autoJSON` is enabled (by default) there is some ambiguity when `parameters` is an array.
Here I can not infer if you want to select 2 rows with values 1 and 2 or a JSON array of [1,2].

```js
db.exec('select json(?)', [1,2]);
```
In such cases it is better to use named parameters for JSON types.
```js
db.exec('select json($js)', { $js: [1,2] });
```

### `.read`(`sql`: string) -> `DB`

Read a SQL script with multiple statements.

### `.load`(`src`: string) -> `DB`

Import a database into the current database. This is using SQLite's backup API.

### `.save`([`dest`: string]) -> `DB` | ArrayBuffer

Export the current database. This is using SQLite's backup API.
If `dest` (**node only**) is undefined or empty an ArrayBuffer is returned.

### `.close`() -> `SPL`

### `.get`

A result object with the following properties (*thenables* in a browser):

### `.first` -> any
### `.flat` -> any[]
### `.rows` -> any[][]
### `.cols` -> string[]
### `.objs` -> {}[]
### `.sync` -> a synchronous result object

With `sync` (browser only) all ArrayBuffers will be transfered without copying (transferables) from the WebWorker.

## Extensions API (Browser only)

Sometimes you want to run code inside the WebWorker. With this API you can supply additional functions to extend the `SPL` and `DB` APIs executed inside the WebWorker.

Example: https://jvail.github.io/spl.js/examples/extensions.html

### Example Code

```js
const extensions = [
    {
        extends: 'db',
        fns: {
            'tables': db => db.exec('SELECT name FROM sqlite_master WHERE type=\'table\''),
            'master': (db, type) => db.exec('SELECT name FROM sqlite_master WHERE type=?', [type])
        }
    },
    {
        extends: 'spl',
        fns: {
            'spatialite_version': spl => {
                const db = spl.db();
                const version = db.exec('SELECT spatialite_version()').get.first;
                db.close();
                return version;
            }
        }
    }
];

const spl = await SPL({}, extensions);
const db = await spl.db()
    .read(`
        CREATE TABLE hello (world);
        CREATE VIEW hello_view AS SELECT * FROM hello;
    `);

console.assert(await db.tables().get.first === 'hello');
console.assert(await db.master('view').get.first === 'hello_view');
console.assert(await spl.spatialite_version() === '5.1.0');
```

## Building and Testing

An activated, working emsdk environment (3.1.50) is required (https://emscripten.org/docs/tools_reference/emsdk.html). All dependencies except SpatiaLite & sqlean (git submodules) are fetched from the web. The git submodules needs to be initialized before running the build script.

```bash
npm install && npm run build:all
```

Running Node & Browser tests

```bash
npm run test:node && npm run test:firefox && npm run test:chrome
```

Running (the relevant) SpatiaLite test cases - this will take quite some time ... ~ 45 minutes or more.
Requires node >= v21 to run test cases without .mjs extension.

```bash
npm run test:em
```

## Performance

I did not create any fancy benchmark scripts. This is just a rough figure obtained from running a few tests with rttopo:

- In node the performance is ~ 75% of the native SpatiaLite
- In the browser perfomance is ~ 50% (including some overhead from the WebWorker communication)


## License

Copyright (C) 2021 Jan Vaillant

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
