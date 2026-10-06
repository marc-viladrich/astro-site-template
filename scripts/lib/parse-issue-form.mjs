// Parst den Markdown-Body eines GitHub Issue Forms in ein Objekt { feldId: wert }.
// GitHub rendert jedes Formularfeld als "### <Label>" gefolgt vom Wert; leere
// Felder erscheinen als "_No response_". Checkbox-Felder als "- [x] Text".
export function parseIssueForm(body, labelToKey) {
  const out = {};
  const parts = body.replace(/\r\n/g, '\n').split(/^### /m).slice(1);
  for (const part of parts) {
    const nl = part.indexOf('\n');
    const label = part.slice(0, nl).trim();
    let value = part.slice(nl + 1).trim();
    if (value === '_No response_') value = '';
    const key = labelToKey[label] ?? slugify(label);
    out[key] = value;
  }
  return out;
}

export function slugify(s) {
  return s
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function yamlString(s) {
  // Immer quoten, damit Doppelpunkte, Anführungszeichen und führende Sonderzeichen sicher sind.
  return JSON.stringify(String(s));
}

export function listFromCsv(s) {
  return s.split(/[,\n]/).map((t) => t.trim()).filter(Boolean);
}
