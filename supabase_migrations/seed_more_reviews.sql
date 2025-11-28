-- Add more realistic reviews with 4-star ratings and no company names
-- This complements the existing reviews

-- English Reviews (including 4-star)
INSERT INTO reviews (username, rating, review_text, language_path, status, job_title, created_at, updated_at)
VALUES
  (
    'Alex Thompson',
    4,
    'Good tool overall. The solutions are helpful, though sometimes I wish there was more detail on specific PLC models. Still, it''s saved me time on multiple occasions.',
    'en',
    'approved',
    'PLC Programmer',
    NOW() - INTERVAL '28 days',
    NOW() - INTERVAL '28 days'
  ),
  (
    'Robert Kim',
    5,
    'Excellent resource for troubleshooting. The AI understands context really well and provides actionable solutions. Highly recommend for anyone in industrial automation.',
    'en',
    'approved',
    'Automation Specialist',
    NOW() - INTERVAL '22 days',
    NOW() - INTERVAL '22 days'
  ),
  (
    'Jennifer Martinez',
    4,
    'Very useful platform. The knowledge base is comprehensive and the search works well. Only minor issue is that some older equipment isn''t covered yet, but I understand that takes time.',
    'en',
    'approved',
    'Maintenance Engineer',
    NOW() - INTERVAL '18 days',
    NOW() - INTERVAL '18 days'
  ),
  (
    'Michael Brown',
    5,
    'This has become my go-to resource for fault diagnosis. The speed and accuracy of responses is impressive. Worth every minute spent using it.',
    'en',
    'approved',
    'Controls Technician',
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '14 days'
  ),
  (
    'Amanda White',
    4,
    'Solid platform with good coverage of common issues. The interface is clean and easy to use. Would love to see more examples with diagrams in the future.',
    'en',
    'approved',
    'Systems Integrator',
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '12 days'
  ),
  (
    'Christopher Lee',
    5,
    'As someone who works with multiple automation platforms, I appreciate how Faultbase covers different manufacturers. The solutions are practical and well-explained.',
    'en',
    'approved',
    'Senior Automation Engineer',
    NOW() - INTERVAL '9 days',
    NOW() - INTERVAL '9 days'
  ),
  (
    'Patricia Davis',
    4,
    'Good tool for quick reference. The search functionality is fast and the results are relevant. Sometimes the technical depth could be greater, but overall very helpful.',
    'en',
    'approved',
    'Electrical Engineer',
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '6 days'
  ),
  (
    'Daniel Garcia',
    5,
    'Faultbase has significantly improved my troubleshooting workflow. The AI suggestions are spot-on most of the time, and when they''re not, the knowledge base usually has the answer.',
    'en',
    'approved',
    'Field Service Engineer',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '4 days'
  ),
  (
    'Michelle Taylor',
    4,
    'Useful platform with a growing database. The community aspect is nice, though I''d like to see more active discussion. The core functionality is solid though.',
    'en',
    'approved',
    'Automation Consultant',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    'Kevin Anderson',
    5,
    'Best automation troubleshooting tool I''ve used. The combination of AI and curated knowledge base is powerful. It''s become essential to my daily work.',
    'en',
    'approved',
    'Project Engineer',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT DO NOTHING;

-- German Reviews (including 4-star)
INSERT INTO reviews (username, rating, review_text, language_path, status, job_title, created_at, updated_at)
VALUES
  (
    'Alex Thompson',
    4,
    'Gutes Tool insgesamt. Die Lösungen sind hilfreich, auch wenn ich mir manchmal mehr Details zu spezifischen SPS-Modellen wünsche. Trotzdem hat es mir mehrfach Zeit gespart.',
    'de',
    'approved',
    'SPS-Programmierer',
    NOW() - INTERVAL '28 days',
    NOW() - INTERVAL '28 days'
  ),
  (
    'Robert Kim',
    5,
    'Ausgezeichnete Ressource für die Fehlersuche. Die KI versteht den Kontext wirklich gut und liefert umsetzbare Lösungen. Sehr empfehlenswert für jeden in der industriellen Automatisierung.',
    'de',
    'approved',
    'Automatisierungsspezialist',
    NOW() - INTERVAL '22 days',
    NOW() - INTERVAL '22 days'
  ),
  (
    'Jennifer Martinez',
    4,
    'Sehr nützliche Plattform. Die Wissensdatenbank ist umfassend und die Suche funktioniert gut. Einziges kleines Problem ist, dass einige ältere Geräte noch nicht abgedeckt sind, aber ich verstehe, dass das Zeit braucht.',
    'de',
    'approved',
    'Instandhaltungsingenieurin',
    NOW() - INTERVAL '18 days',
    NOW() - INTERVAL '18 days'
  ),
  (
    'Michael Brown',
    5,
    'Dies ist meine bevorzugte Ressource für die Fehlerdiagnose geworden. Die Geschwindigkeit und Genauigkeit der Antworten ist beeindruckend. Jede Minute, die ich damit verbringe, ist es wert.',
    'de',
    'approved',
    'Steuerungstechniker',
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '14 days'
  ),
  (
    'Amanda White',
    4,
    'Solide Plattform mit guter Abdeckung häufiger Probleme. Die Benutzeroberfläche ist sauber und einfach zu bedienen. Würde gerne in Zukunft mehr Beispiele mit Diagrammen sehen.',
    'de',
    'approved',
    'Systemintegratorin',
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '12 days'
  ),
  (
    'Christopher Lee',
    5,
    'Als jemand, der mit mehreren Automatisierungsplattformen arbeitet, schätze ich, wie Faultbase verschiedene Hersteller abdeckt. Die Lösungen sind praktisch und gut erklärt.',
    'de',
    'approved',
    'Senior Automatisierungsingenieur',
    NOW() - INTERVAL '9 days',
    NOW() - INTERVAL '9 days'
  ),
  (
    'Patricia Davis',
    4,
    'Gutes Tool für schnelle Referenz. Die Suchfunktion ist schnell und die Ergebnisse sind relevant. Manchmal könnte die technische Tiefe größer sein, aber insgesamt sehr hilfreich.',
    'de',
    'approved',
    'Elektroingenieurin',
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '6 days'
  ),
  (
    'Daniel Garcia',
    5,
    'Faultbase hat meinen Fehlerbehebungs-Workflow erheblich verbessert. Die KI-Vorschläge sind meistens genau richtig, und wenn nicht, hat die Wissensdatenbank normalerweise die Antwort.',
    'de',
    'approved',
    'Servicetechniker',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '4 days'
  ),
  (
    'Michelle Taylor',
    4,
    'Nützliche Plattform mit wachsender Datenbank. Der Community-Aspekt ist schön, obwohl ich gerne mehr aktive Diskussionen sehen würde. Die Kernfunktionalität ist jedoch solide.',
    'de',
    'approved',
    'Automatisierungsberaterin',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    'Kevin Anderson',
    5,
    'Bestes Automatisierungs-Fehlerbehebungs-Tool, das ich verwendet habe. Die Kombination aus KI und kuratierter Wissensdatenbank ist mächtig. Es ist zu einem wesentlichen Bestandteil meiner täglichen Arbeit geworden.',
    'de',
    'approved',
    'Projektingenieur',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT DO NOTHING;

