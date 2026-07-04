const fs = require('fs');
const path = require('path');

function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(e.name)) {
      let s = fs.readFileSync(p, 'utf8');
      if (!s.includes("from 'next/headers'") && !s.includes('from "next/headers"')) continue;
      if (/cookies\s*\(/.test(s)) continue;
      let n = s;
      n = n.replace(/import\s*\{\s*cookies\s*\}\s*from\s*['"]next\/headers['"];\r?\n/, '');
      n = n.replace(
        /import\s*\{\s*cookies\s*,\s*([^}]+)\}\s*from\s*['"]next\/headers['"];/,
        "import { $1} from 'next/headers';",
      );
      n = n.replace(
        /import\s*\{\s*([^}]+),\s*cookies\s*\}\s*from\s*['"]next\/headers['"];/,
        "import { $1} from 'next/headers';",
      );
      if (n !== s) {
        fs.writeFileSync(p, n);
        console.log('cleaned', p);
      }
    }
  }
}

walk('src');
