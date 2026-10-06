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

## Neue Kundensite anlegen

1. Privates Repo aus diesem Template erzeugen (GitHub „Use this template“ oder `gh repo create <name> --template marc-viladrich/astro-site-template --private`).
2. `src/site.config.ts`, `src/styles/global.css` (Tokens, Fonts self-hosted nach `public/fonts/`), Beispielinhalte in `src/content/` ersetzen, `tests/routes.ts` anpassen.
3. Repository-Variablen setzen: `SITE_URL`, `PREVIEW_URL`, `MEDIA_HOST`, `PUBLIC_FORM_ENDPOINT`, `CF_PAGES_PROJECT`.
4. Secrets setzen, siehe unten.
5. Labels anlegen: `content:blogpost`, `content:projekt`, `content:faq`, `aenderungswunsch`, `agent-go`, `content`.
6. Branch-Schutz auf `main`: PR erforderlich, ein Review, Status-Checks `gates` und `upload`, keine Ausnahmen für Admins. Braucht GitHub Pro bei privaten Repos.
7. Kund*innen als Collaborators einladen (Rolle „Triage“ reicht zum Erstellen von Issues, nicht zum Setzen von `agent-go`).

## Secrets

| Secret | Wofür | Woher |
|---|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` | Spur B, Subscription-Auth | lokal `claude setup-token` (Pro/Max). Läuft auf das Kontingent des Erzeugers |
| `BOT_TOKEN` | Intake-PRs unter Bot-Identität, damit CI läuft und der Mensch approven kann | Fine-grained PAT eines separaten Bot-Accounts oder GitHub App; Rechte: Contents + Pull requests write |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | Deploy (nur bei Cloudflare Pages) | Cloudflare Dashboard, Token mit „Pages: Edit“ |

## Hosting wechseln

Nur `deploy.yml` kennt den Host. Der Job `build` erzeugt ein Artefakt `dist/`, der Job `upload` lädt es hoch. Wechsel = `upload` austauschen:

- **Cloudflare Pages (Start):** `wrangler pages deploy`, Preview pro Branch automatisch. Preview-Schutz über Cloudflare Access im Dashboard.
- **IONOS Deploy Now:** eigene GitHub-App, kein eigener `upload`-Job nötig; `deploy.yml` auf Build-only reduzieren. Preview-Schutz per `.htaccess`.
- **Dokploy/Coolify auf Hetzner:** Webhook-Trigger oder `rsync` des Artefakts; PR-Previews übernimmt Dokploy.
- **Beliebiger EU-Host per rsync:** `rsync -az --delete dist/ user@host:/srv/sites/<name>/<branch>/` plus Wildcard-Subdomain mit Basic Auth. Ca. ein Tag Eigenbau.

Alles andere (Build, Gates, Intake, Agent) bleibt unverändert, weil die Site keine Host-Features nutzt: keine Functions, keine Edge-Middleware, Formular geht an einen externen EU-Dienst.

## Medien

Bilder, Video, PDFs liegen in einem S3-kompatiblen Speicher unter einer eigenen Domain (`MEDIA_HOST`, z. B. `media.<kunde>.de`), damit der Speicheranbieter wechselbar bleibt, ohne URLs im Content zu ändern. Astro `<Image>` optimiert Remote-Bilder beim Build (`image.remotePatterns`). Content referenziert immer `src`, `alt`, `width`, `height`.

## Lokal

```sh
nvm use   # oder Node 22 im PATH
npm ci
npx astro dev
npx astro check && npx astro build && npx playwright test
```
