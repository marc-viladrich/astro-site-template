import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseIssueForm, slugify } from './lib/parse-issue-form.mjs';

test('parst Issue-Form-Body mit leerem Feld', () => {
  const body = '### Titel\n\nHallo: Welt\n\n### Beschreibung\n\n_No response_\n\n### Text\n\nZeile 1\n\nZeile 2\n';
  const r = parseIssueForm(body, { Titel: 'title', Beschreibung: 'description', Text: 'body' });
  assert.equal(r.title, 'Hallo: Welt');
  assert.equal(r.description, '');
  assert.equal(r.body, 'Zeile 1\n\nZeile 2');
});

test('slugify behandelt Umlaute und Sonderzeichen', () => {
  assert.equal(slugify('Drohnenshow für Hochzeiten: Größe & Preis'), 'drohnenshow-fuer-hochzeiten-groesse-preis');
});
