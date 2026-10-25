import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, readdir } from 'node:fs/promises';
import ts from 'typescript';
const root = new URL('../', import.meta.url);
const dictionary = JSON.parse(await readFile(new URL('src/locales/en.json', root), 'utf8'));
async function walk(url) {
  const files = [];
  for (const entry of await readdir(url, { withFileTypes: true })) {
    const child = new URL(entry.name + (entry.isDirectory() ? '/' : ''), url);
    if (entry.isDirectory()) files.push(...await walk(child));
    else if (/\.tsx?$/.test(entry.name)) files.push(child);
  }
  return files;
}
test('mobile source-authored copy has English translations and safe interpolation slots', async () => {
  for (const url of [...await walk(new URL('src/', root)), ...await walk(new URL('app/', root))]) {
    const text = await readFile(url, 'utf8');
    const file = ts.createSourceFile(url.pathname, text, ts.ScriptTarget.Latest, true);
    function visit(node) {
      if (ts.isCallExpression(node) && node.expression.getText(file) === 'tr' && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
        const key = node.arguments[0].text.replace(/\s+/g, ' ').trim();
        assert.ok(Object.hasOwn(dictionary, key), `${url.pathname}: missing ${key}`);
      }
      ts.forEachChild(node, visit);
    }
    visit(file);
  }
  for (const [source, target] of Object.entries(dictionary)) {
    assert.deepEqual(source.match(/\{\d+\}/g)?.sort() || [], target.match(/\{\d+\}/g)?.sort() || [], source);
  }
});
