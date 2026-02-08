import tape from 'tape';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import SPL from '../dist/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseFunctionNames() {
    const md = fs.readFileSync(
        path.join(__dirname, '..', 'doc', 'spatialite_functions.md'),
        'utf8',
    );
    const names = new Set();
    for (const line of md.split('\n')) {
        if (!line.startsWith('|')) continue;
        const cols = line.split('|');
        // cols[0] is empty (before first |), cols[1] is the Function column
        const funcCol = (cols[1] || '').trim();
        if (
            !funcCol ||
            funcCol === 'Function' ||
            funcCol.startsWith('---')
        ) continue;
        for (const part of funcCol.split('/')) {
            const name = part.trim();
            if (name && /^[\w]+$/.test(name)) {
                names.add(name);
            }
        }
    }
    return [...names].sort();
}

tape('all documented spatialite functions exist in pragma_function_list', async (t) => {
    const documented = parseFunctionNames();
    t.ok(documented.length > 0, `parsed ${documented.length} function names from markdown`);

    const db = (await SPL()).db();
    const available = new Set(
        db.exec('SELECT lower(name) FROM pragma_function_list').get.flat
    );

    const missing = [];
    for (const name of documented) {
        if (!available.has(name.toLowerCase())) {
            missing.push(name);
        }
    }

    t.deepEqual(missing, [], `all ${documented.length} documented functions should be available`);

    if (missing.length > 0) {
        console.log('Missing functions:');
        for (const name of missing) {
            console.log(`  - ${name}`);
        }
    }

    db.close();
    t.end();
});
