# astro-site-template

Vorlage für statische Marketing-Sites mit agent-gestützter Pflege. Jede Kundensite ist eine Instanz dieses Templates in einem eigenen privaten Repo. Hintergrund und Entscheidungen: `notes/agentic-website-editing/00-design-space.md` im Hub-Repo.

## Das Modell

```
Issue Form (Inhalt)      ──► content-intake.yml ──► Datei + PR ─┐
Issue Form (Änderung) ──► Label agent-go (Mensch) ──► agent.yml ──► PR ─┤
                                                                       ├─► CI-Gates + Preview ──► Mensch merged ──► Deploy main
```

- **Spur A, deterministisch:** Blogpost, Projekt, FAQ kommen als Issue Form rein, ein Skript macht daraus eine Content-Datei und einen PR. Kein LLM.
- **Spur B, Agent:** Änderungswünsche werden erst durch das Label `agent-go` freigegeben (Klick 1). Dann baut Claude Code mit dem Subscription-Token einen PR. Niemand außer dem Label-Setzer verbraucht Kontingent.
- **Gate:** CI (axe, Request-Allowlist, HTML-Hygiene, Lighthouse-Budgets, Link-Check) und Preview-URL am PR. Merge = Freigabe (Klick 2). `main` deployt in Produktion.

Neue Blogposts, Projekte und FAQ werden im PR mit `draft: false` erzeugt. Der offene PR ist der redaktionelle Entwurf, die Branch-Preview zeigt den Inhalt. Nach dem menschlichen Merge veröffentlicht der Produktions-Deploy ihn ohne zweiten Freigabeschritt. Absichtlich mit `draft: true` markierte Inhalte bleiben verborgen. Der Intake-Integrationstest schützt alle drei Inhaltstypen.

Im Template ist der Upload ohne `CF_PAGES_PROJECT` deaktiviert. Bei einer eingerichteten Kundensite den Upload verpflichtend machen und `gates` sowie `upload` auf `main` verlangen. Fehlende Cloudflare-Secrets werden vor dem Upload mit einem Fehler gemeldet. Ein erfolgreicher Build ohne Upload ist keine Veröffentlichung.

## Struktur

| Pfad | Zweck |
|---|---|
| `src/content.config.ts` | Schemas: Sections (Discriminated Union) und Collections `pages`, `posts`, `projects`, `faq` |
| `src/content/` | Inhalte. `pages/*.yaml` = Section-Listen, Rest Markdown |
| `src/components/sections/` | Eine Komponente pro Section-Typ, typisierte Props |
| `src/components/SectionRenderer.astro` | Einzige Zuordnung Typ → Komponente |
| `src/layouts/Base.astro`, `src/site.config.ts`, `src/styles/global.css` | Rahmen, Navigation, Tokens |
| `scripts/issue-to-content.mjs` | Intake-Skript (Spur A) mit Tests |
| `tests/` | Playwright-Gates. `routes.ts` ist die gemeinsame Routenliste |
| `.github/ISSUE_TEMPLATE/` | Vier Issue Forms: Blogpost, Projekt, FAQ, Änderungswunsch |
| `.github/workflows/` | `ci.yml` (Gates), `content-intake.yml` (Spur A), `agent.yml` (Spur B), `deploy.yml` (host-spezifisch) |
| `AGENTS.md` | Agent-Vertrag, gilt für Claude Code und Codex |

## Section-Typen

Seiten sind Listen dieser Typen. Felder und Pflichtangaben stehen in `src/content.config.ts`, ein Beispiel für jeden neuen Typ in `src/content/pages/leistungen.yaml`.

| Typ | Zweck |
|---|---|
| `hero` | Einstieg der Seite mit Headline, Text, Bild und bis zu zwei Links. |
| `textMedia` | Fließtext (Markdown) mit optionalem Bild links oder rechts. |
| `faq` | Akkordeon aus der Collection `faq`, optional nach Tags gefiltert. |
| `cta` | Handlungsaufforderung mit Headline, Text und einem Button. |
| `postList` | Die neuesten Beiträge aus der Collection `posts`. |
| `projectGrid` | Kartenraster aus der Collection `projects`. |
| `contactForm` | Kontaktformular, das an `PUBLIC_FORM_ENDPOINT` postet. |
| `pricing` | Preiskarten mit Merkmalen, Preis, Bezugsgröße und Link; eine Karte lässt sich als Empfehlung hervorheben. |
| `steps` | Nummerierte Ablaufschritte mit Titel, Text und optionalem Zeitrahmen; mobil untereinander, ab 48rem als Raster. |
| `comparison` | Vergleichstabelle (echte `<table>` mit Caption, mobil horizontal scrollbar); jede Zeile braucht genau einen Wert je Spalte, sonst bricht der Build. |
| `team` | Karten mit Name, Rolle und Kurztext; ohne Bild erscheint ein Platzhalterkreis mit Initialen. |
| `logoBar` | Gedämpfte Reihe von Referenzlogos (ohne Animation); ohne Bild wird der Name als Text gesetzt, mit `href` ist er verlinkt. |

## Neue Kundensite anlegen

1. Privates Repo anlegen und die Template-Historie übernehmen, damit spätere Template-Updates per Merge ankommen:
   ```sh
   gh repo create marc-viladrich/<name>-site --private
   git clone git@github.com:marc-viladrich/<name>-site.git && cd <name>-site
   git remote add template git@github.com:marc-viladrich/astro-site-template.git
   git fetch template && git reset --hard template/main && git push -u origin main
   ```
   Template-Updates später: `git fetch template && git merge template/main`.
2. `src/site.config.ts`, `src/styles/global.css` (Tokens, Fonts self-hosted nach `public/fonts/`), Beispielinhalte in `src/content/` ersetzen. Die Tests erfassen alle gebauten HTML-Routen automatisch.
3. Repository-Variablen setzen: `SITE_URL`, `PREVIEW_URL`, `MEDIA_HOST`, `PUBLIC_FORM_ENDPOINT`, `CF_PAGES_PROJECT`.
4. Secrets setzen, siehe unten.
5. Labels anlegen: `content:blogpost`, `content:projekt`, `content:faq`, `aenderungswunsch`, `agent-go`, `content`.
6. Branch-Schutz auf `main`: PR erforderlich, Status-Checks `gates` und `upload`, keine Ausnahmen für Admins. Ein Pflichtreview erst mit eigener Bot-Identität; bei PRs aus dem eigenen Account vorerst 0 erforderliche Reviews. Braucht GitHub Pro bei privaten Repos.
7. Kund*innen als Collaborators einladen (Rolle „Triage“ reicht zum Erstellen von Issues, nicht zum Setzen von `agent-go`).

## Secrets

| Secret | Wofür | Woher |
|---|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` | Spur B, Subscription-Auth | lokal `claude setup-token` (Pro/Max). Läuft auf das Kontingent des Erzeugers |
| `BOT_TOKEN` | Intake-PRs unter Bot-Identität, damit CI läuft und der Mensch approven kann | Prototyp: eigener PAT; für Pflichtreviews GitHub-App-Installationstoken oder separater Account. Rechte: Contents, Pull requests und Issues write |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | Deploy (nur bei Cloudflare Pages) | Dashboard → Profil → API-Tokens → Custom Token mit Account-Permission „Cloudflare Pages: Edit“; Account-ID aus `wrangler whoami` |
| `BREVO_API_KEY`, `CONTACT_TO`, `CONTACT_FROM` | Mailversand des Kontaktformulars (Pages-Function-Secrets, nicht GitHub) | `wrangler pages secret put BREVO_API_KEY --project-name <name>`; ohne diese Werte antwortet das Formular ehrlich mit „nicht konfiguriert“ und speichert nichts |

**Warum `BOT_TOKEN`?** Mit einem eigenen Token starten die PR-Workflows automatisch. Der eingebaute `GITHUB_TOKEN` kann bei bestimmten PR-Ereignissen ebenfalls Workflows erzeugen, verlangt aber eine zusätzliche Freigabe. Ein Token aus Marcs Account genügt für den Prototyp. Ein weiterer Token desselben Accounts ändert die Identität nicht. Eine eigenständige GitHub-App kann PRs als Bot öffnen, die Marc dann offiziell genehmigen kann. [GitHub-Workflow-Regeln](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow#triggering-a-workflow-from-a-workflow).

Vor dem Claude-Start prüft der Workflow Schreibrechte des ursprünglichen und gegebenenfalls erneuten Auslösers. Die Claude-Action ist auf einen Commit festgelegt. Vor dem PR wird der Diff mit einem Prüfer aus dem Start-Commit auf erlaubte Dateipfade kontrolliert. Diese Prüfungen begrenzen Fehler und unerlaubte Änderungen; der ausführende Agent-Prozess braucht weiterhin seine Credentials und ist dadurch kein vom Secret isolierter Sandbox-Prozess. Ein kompromittierter Agent-Prozess kann die ihm zur Laufzeit bereitgestellten Secrets weiterhin lesen.

## Kontaktformular

`src/components/sections/ContactForm.astro` postet ohne JavaScript an `site.formEndpoint`, standardmäßig `/api/contact`. Dahinter liegt `functions/api/contact.ts`, eine Cloudflare Pages Function nur aus Web-Standard-APIs (Request, FormData, fetch): validiert, prüft Honeypot und optional Turnstile, sendet per Brevo, speichert nichts, leitet auf `/danke/` weiter. Lokal testen mit `npx wrangler pages dev dist`.

Hot-Swap: Entweder die Function auf eine andere Runtime kopieren (Deno, Node, EU-Worker) und `PUBLIC_FORM_ENDPOINT` auf deren URL setzen, oder einen externen Dienst eintragen (EU-Kandidat laut Recherche: Form.taxi). Das Formular-HTML bleibt gleich.

## Hosting wechseln

Nur `deploy.yml` kennt den Host. Der Job `build` erzeugt ein Artefakt `dist/`, der Job `upload` lädt es hoch. Wechsel = `upload` austauschen:

- **Cloudflare Pages (Start):** `wrangler pages deploy`, Preview pro Branch automatisch. Preview-Schutz über Cloudflare Access im Dashboard.
- **IONOS Deploy Now:** eigene GitHub-App, kein eigener `upload`-Job nötig; `deploy.yml` auf Build-only reduzieren. Preview-Schutz per `.htaccess`.
- **Dokploy/Coolify auf Hetzner:** Webhook-Trigger oder `rsync` des Artefakts; PR-Previews übernimmt Dokploy.
- **Beliebiger EU-Host per rsync:** `rsync -az --delete dist/ user@host:/srv/sites/<name>/<branch>/` plus Wildcard-Subdomain mit Basic Auth. Ca. ein Tag Eigenbau.

Build, Gates, Intake und Agent bleiben erhalten. Das Formular nutzt aktuell eine Pages Function; beim Hostwechsel muss diese mit umziehen oder `PUBLIC_FORM_ENDPOINT` auf einen externen Endpunkt zeigen.

## Medien

Bilder, Video, PDFs liegen in einem S3-kompatiblen Speicher unter einer eigenen Domain (`MEDIA_HOST`, z. B. `media.<kunde>.de`), damit der Speicheranbieter wechselbar bleibt, ohne URLs im Content zu ändern. Astro `<Image>` optimiert Remote-Bilder beim Build (`image.remotePatterns`). Content referenziert immer `src`, `alt`, `width`, `height`.

## Lokal

```sh
nvm use   # oder Node 22 im PATH
npm ci
npx astro dev
npx astro check && npx astro build && npx playwright test
```
