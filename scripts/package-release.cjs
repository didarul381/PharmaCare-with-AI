/**
 * Builds a clean, buyer-ready copy of PharmaCare in ./release/pharmacare-<version>/
 *
 *   node scripts/package-release.cjs
 *
 * What it does
 *  1. npm run build              (fresh production assets in public/build)
 *  2. copies the project, skipping secrets & dev-only files (.env, .git,
 *     node_modules, logs, caches, local databases, AI-agent notes …)
 *  3. composer install --no-dev  inside the copy (so shared-hosting buyers
 *     don't need Composer or Node)
 *
 * Then zip the folder (right-click → Compress, or `zip -r`) and upload it.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const version = (fs.readFileSync(path.join(ROOT, 'config', 'pharmacare.php'), 'utf8').match(/'version'\s*=>\s*'([^']+)'/) || [])[1] || 'dev';
const OUT = path.join(ROOT, 'release', `pharmacare-${version}`);

// Paths relative to the project root (forward slashes). A trailing /* keeps the folder but drops its contents.
const EXCLUDE = [
    '.git', '.github', '.idea', '.vscode', '.claude', '.cursor', '.codex', 'node_modules', 'release',
    '.env', '.env.backup', '.env.production', '.phpunit.result.cache', '.phpunit.cache',
    'CLAUDE.md', 'AGENTS.md', 'public/hot', 'public/storage', 'vendor',
    'scripts/theme-codemod.cjs',
];
const EMPTY_DIRS = ['storage/logs', 'storage/framework/cache/data', 'storage/framework/sessions', 'storage/framework/views', 'storage/app/public', 'storage/app/private', 'bootstrap/cache'];
const KEEP_IN_EMPTY = ['.gitignore'];

const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

function run(cmd, cwd = ROOT) {
    console.log(`$ ${cmd}`);
    execSync(cmd, { cwd, stdio: 'inherit', shell: true });
}

if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true, force: true });

run('npm run build');

const include = (src) => {
    const r = rel(src);
    if (EXCLUDE.some((e) => r === e || r.startsWith(e + '/'))) return false;
    if (/\.(sqlite|sqlite3|log|sql|gz|zip)$/i.test(r)) return false; // never ship DB dumps or archives
    for (const dir of EMPTY_DIRS) {
        if (r.startsWith(dir + '/') && !KEEP_IN_EMPTY.includes(path.basename(r))) return false;
    }
    return true;
};

// Copy entry by entry (Node refuses to copy a folder into its own subfolder).
fs.mkdirSync(OUT, { recursive: true });
for (const entry of fs.readdirSync(ROOT)) {
    const src = path.join(ROOT, entry);
    if (!include(src)) continue;
    fs.cpSync(src, path.join(OUT, entry), { recursive: true, filter: include });
}

run('composer install --no-dev --optimize-autoloader --no-interaction --no-progress', OUT);

// Sanity checks — never ship secrets.
const leaked = ['.env', 'storage/oauth-private.key'].filter((f) => fs.existsSync(path.join(OUT, f)));
if (leaked.length) {
    console.error('Refusing to finish: secret files present in release:', leaked);
    process.exit(1);
}

console.log(`\nRelease ready: ${OUT}\nZip this folder and upload it. Buyers start with docs/INSTALLATION.md.`);
