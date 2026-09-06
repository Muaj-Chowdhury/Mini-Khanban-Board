import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const outputDirectory = process.argv[2];

if (!outputDirectory) {
  throw new Error("A generated output directory is required");
}

async function patchJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await patchJavaScriptFiles(entryPath);
      continue;
    }

    if (!entry.name.endsWith(".js")) {
      continue;
    }

    const source = await readFile(entryPath, "utf8");
    const patched = source.replace(
      /(from\s+["']|import\s*\(["']|export\s+[^\n]*?from\s+["'])(\.\.?\/[^"']+)(["'])/g,
      (_match, prefix, specifier, quote) =>
        /\.(?:js|json|node)$/.test(specifier)
          ? `${prefix}${specifier}${quote}`
          : `${prefix}${specifier}.js${quote}`,
    );

    if (patched !== source) {
      await writeFile(entryPath, patched);
    }
  }
}

await patchJavaScriptFiles(path.resolve(outputDirectory));
