-- Seed 9 German reviews for Fahrzeugfehler.de
-- No company mentions, realistic user reviews

INSERT INTO reviews (username, rating, review_text, language_path, status, job_title, created_at, updated_at)
VALUES
  (
    'Michael K.',
    5,
    'Sehr hilfreiche Plattform! Habe hier schnell eine Lösung für meinen Fehlercode P0301 gefunden. Die Erklärungen sind verständlich und die Schritt-für-Schritt-Anleitung hat mir geholfen, das Problem selbst zu beheben. Genau das, was ich gesucht habe.',
    'de',
    'approved',
    'Autobesitzer',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days'
  ),
  (
    'Thomas M.',
    5,
    'Als Kfz-Mechaniker nutze ich diese Seite regelmäßig. Die Fehlercode-Datenbank ist umfangreich und die Diagnosehinweise sind präzise. Besonders die Trennung nach Modellgenerationen ist sehr praktisch. Spart mir viel Zeit bei der Fehlersuche.',
    'de',
    'approved',
    'Kfz-Mechaniker',
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '12 days'
  ),
  (
    'Sarah L.',
    4,
    'Gute Übersicht über häufige Probleme bei meinem Fahrzeug. Die Seite ist übersichtlich gestaltet und die Informationen sind gut strukturiert. Manchmal fehlen noch Details zu spezifischen Modellen, aber insgesamt sehr nützlich.',
    'de',
    'approved',
    'Autobesitzerin',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days'
  ),
  (
    'Andreas R.',
    5,
    'Endlich eine deutsche Seite, die wirklich hilfreich ist! Die Fehlercode-Erklärungen sind detailliert und verständlich. Habe bereits mehrere Probleme mit Hilfe dieser Seite gelöst. Kann ich nur weiterempfehlen.',
    'de',
    'approved',
    'Hobby-Schrauber',
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '8 days'
  ),
  (
    'Julia W.',
    4,
    'Sehr informativ und gut aufgebaut. Die Suche funktioniert zuverlässig und ich finde schnell, was ich brauche. Die Tipps zur Fehlerbehebung sind praktisch umsetzbar. Einziger kleiner Kritikpunkt: Manchmal könnte die Navigation noch intuitiver sein.',
    'de',
    'approved',
    'Autobesitzerin',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days'
  ),
  (
    'Markus H.',
    5,
    'Als Werkstattbesitzer schätze ich die professionelle Aufbereitung der Informationen. Die Fehlercode-Listen sind vollständig und die Lösungsvorschläge sind technisch fundiert. Eine wertvolle Ressource für die tägliche Arbeit.',
    'de',
    'approved',
    'Werkstattbesitzer',
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '6 days'
  ),
  (
    'Lisa B.',
    4,
    'Gute Seite für alle, die sich selbst mit ihrem Auto beschäftigen wollen. Die Erklärungen sind auch für Laien verständlich. Besonders hilfreich sind die Hinweise zu Risiken bei Weiterfahrt. So kann ich besser einschätzen, ob ich sofort handeln muss.',
    'de',
    'approved',
    'Autobesitzerin',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
  ),
  (
    'Stefan F.',
    5,
    'Perfekt für meine Bedürfnisse! Habe hier Lösungen für Probleme gefunden, die ich woanders nicht gefunden habe. Die Seite ist schnell, übersichtlich und die Informationen sind aktuell. Nutze sie regelmäßig bei der Fehlersuche.',
    'de',
    'approved',
    'Kfz-Techniker',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '4 days'
  ),
  (
    'Nicole S.',
    4,
    'Sehr nützliche Plattform. Die Struktur nach Marken, Modellen und Generationen macht es einfach, genau die richtigen Informationen zu finden. Die Fehlercode-Erklärungen sind klar formuliert und helfen mir, Probleme besser zu verstehen.',
    'de',
    'approved',
    'Autobesitzerin',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  )
ON CONFLICT DO NOTHING;


