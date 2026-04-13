const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            results.push(file);
        }
    });
    return results;
}

const srcDir = __dirname;
const contextDir = path.join(srcDir, 'context');
const files = walk(srcDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    let relPath = path.relative(path.dirname(file), contextDir).replace(/\\/g, '/');
    if (!relPath.startsWith('.')) relPath = './' + relPath;
    const importPath = `${relPath}/ToastContext`;

    content = content.replace(/import\s+toast\s+from\s+['"]react-hot-toast['"];?/g, `import { toast } from '${importPath}';`);
    content = content.replace(/import\s+\{\s*toast\s*\}\s+from\s+['"]react-hot-toast['"];?/g, `import { toast } from '${importPath}';`);

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('Updated', file);
    }
});
