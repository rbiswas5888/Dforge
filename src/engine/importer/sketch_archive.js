import { readZipTextEntries } from './zip_archive.js';

function parseJsonEntry(entries, fileName) {
  const content = entries.get(fileName);
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    throw new Error(`The Sketch archive contains invalid JSON in ${fileName}.`);
  }
}

export async function readSketchArchive(input) {
  const entries = await readZipTextEntries(input);
  const documentEntry = [...entries.keys()].find(name => /^document\.json$/i.test(name));
  if (!documentEntry) {
    throw new Error('This .sketch file is not a recognized Sketch archive. Export a Sketch document or import a Sketch JSON interchange file.');
  }
  const document = parseJsonEntry(entries, documentEntry);
  if (!Array.isArray(document.pages)) {
    throw new Error('The Sketch archive is missing its document page list.');
  }

  const pageEntries = new Map(
    [...entries.keys()]
      .filter(name => /^pages\/.+\.json$/i.test(name))
      .map(name => [name.toLowerCase(), name])
  );
  const pages = [];
  for (const pageRef of document.pages) {
    if (Array.isArray(pageRef.layers)) {
      pages.push(pageRef);
      continue;
    }

    const ref = pageRef._ref || pageRef.ref || pageRef.do_objectID || pageRef.id;
    const candidates = [
      typeof ref === 'string' ? ref : '',
      typeof ref === 'string' ? `pages/${ref}.json` : '',
      typeof ref === 'string' ? `pages/${ref.replace(/^pages\//i, '')}` : ''
    ].filter(Boolean);
    const pageEntry = candidates
      .map(candidate => pageEntries.get(candidate.toLowerCase()) ||
        pageEntries.get(`${candidate.replace(/\.json$/i, '')}.json`.toLowerCase()))
      .find(Boolean);
    if (!pageEntry) {
      throw new Error(`Sketch page data is missing from the archive${ref ? ` (${ref})` : ''}.`);
    }
    pages.push(parseJsonEntry(entries, pageEntry));
  }

  return { ...document, pages };
}
