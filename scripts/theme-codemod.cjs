/**
 * One-off codemod used to make the UI theme-aware and more readable.
 *  1. Hard-coded dark hex classes -> theme surface tokens (canvas/deep/panel).
 *  2. Text on solid accent backgrounds -> fixed `text-ink` / `text-paper`
 *     so button labels keep their contrast in both themes.
 *  3. Minimum font sizes: 9–10px -> 11px, 11px -> 12px (text-xs).
 *  4. Recharts hex colours -> CSS variables.
 *
 *   node scripts/theme-codemod.cjs            (writes files)
 *   node scripts/theme-codemod.cjs --dry      (report only)
 */
const fs = require('fs');
const path = require('path');

const DRY = process.argv.includes('--dry');
const ROOT = path.join(__dirname, '..', 'resources', 'js');
const ACCENT = '(?:emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|red|orange|amber|yellow|lime|green)';

const HEX_TOKENS = {
    '#070b13': 'deep', '#080d17': 'deep', '#090e1a': 'deep', '#0a0f1d': 'deep',
    '#0d1322': 'panel', '#0c1626': 'panel', '#0e1628': 'panel',
    '#0b0f19': 'canvas',
    '#0f172a': 'slate-900',
    '#1a0f14': 'rose-950/30',
};

const CHART_COLORS = [
    [/stroke="#1e293b"/g, 'stroke="rgb(var(--slate-800))"'],
    [/stroke="#64748b"/g, 'stroke="rgb(var(--slate-500))"'],
    [/backgroundColor: '#0f172a'/g, "backgroundColor: 'rgb(var(--slate-900))'"],
    [/borderColor: '#334155'/g, "borderColor: 'rgb(var(--slate-700))'"],
    [/color: '#f8fafc'/g, "color: 'rgb(var(--slate-50))'"],
];

const stats = { hex: 0, ink: 0, paper: 0, font: 0, chart: 0 };

function fixAccentText(str) {
    // Work on whitespace-separated class tokens inside a single string literal.
    const tokens = str.split(/(\s+)/);
    const prefixOf = (t) => t.slice(0, t.lastIndexOf(':') + 1);
    const solidPrefixes = new Set(
        tokens
            .filter((t) => new RegExp(`^(?:[a-z-]+:)*(?:bg|from)-${ACCENT}-(?:400|500|600|700)$`).test(t))
            .map(prefixOf),
    );
    if (!solidPrefixes.size) return str;

    return tokens
        .map((t) => {
            const m = t.match(/^((?:[a-z-]+:)*)text-(white|slate-950|slate-900)$/);
            if (!m || !solidPrefixes.has(m[1])) return t;
            if (m[2] === 'white') {
                stats.paper++;
                return `${m[1]}text-paper`;
            }
            stats.ink++;
            return `${m[1]}text-ink`;
        })
        .join('');
}

function transform(src) {
    let out = src;

    // 1. arbitrary hex surface classes
    out = out.replace(/\b(bg|from|to|via|border)-\[(#[0-9a-fA-F]{6})\]/g, (all, kind, hex) => {
        const token = HEX_TOKENS[hex.toLowerCase()];
        if (!token) return all;
        stats.hex++;
        return `${kind}-${token}`;
    });

    // 2. text on solid accent backgrounds (every string / template chunk)
    out = out.replace(/(["'`])((?:(?!\1)[^\\\n]|\\.)*)\1/g, (all, q, body) => {
        if (!/\b(?:bg|from)-/.test(body)) return all;
        return q + fixAccentText(body) + q;
    });

    // 3. readable minimum font sizes (order matters)
    out = out.replace(/text-\[11px\]/g, () => (stats.font++, 'text-xs'));
    out = out.replace(/text-\[(9|10)px\]/g, () => (stats.font++, 'text-[11px]'));
    out = out.replace(/fontSize: 11\b/g, () => (stats.font++, 'fontSize: 12'));

    // 4. chart colours
    for (const [re, rep] of CHART_COLORS) out = out.replace(re, () => (stats.chart++, rep));

    return out;
}

function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
        const file = path.join(dir, name);
        if (fs.statSync(file).isDirectory()) walk(file);
        else if (/\.(tsx|ts)$/.test(name)) {
            const src = fs.readFileSync(file, 'utf8');
            const out = transform(src);
            if (out !== src && !DRY) fs.writeFileSync(file, out);
        }
    }
}

walk(ROOT);
console.log(DRY ? '[dry run]' : '[written]', stats);
