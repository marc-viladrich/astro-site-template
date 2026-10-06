// Zentrale Site-Konfiguration. Pro Kundensite anpassen, nicht in Komponenten hartkodieren.
export const site = {
  name: 'Beispiel GmbH',
  locale: 'de',
  description: 'Platzhalter-Beschreibung der Site.',
  nav: [
    { label: 'Leistungen', href: '/leistungen/' },
    { label: 'Projekte', href: '/projekte/' },
    { label: 'Blog', href: '/blog/' },
    { label: 'FAQ', href: '/faq/' },
  ],
  cta: { label: 'Anfragen', href: '/kontakt/' },
  footer: {
    legal: [
      { label: 'Impressum', href: '/impressum/' },
      { label: 'Datenschutz', href: '/datenschutz/' },
    ],
  },
  // Externer Formular-Endpoint (EU-Dienst). Leer = Formular zeigt Hinweis statt zu senden.
  formEndpoint: import.meta.env.PUBLIC_FORM_ENDPOINT ?? '',
} as const;
