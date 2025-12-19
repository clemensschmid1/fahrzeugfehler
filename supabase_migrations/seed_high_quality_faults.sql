-- Seed hochwertige Fault-Einträge für Fahrzeugfehler.de
-- Diese Einträge entsprechen der Qualität der FaultBase-Seite mit detaillierten Problemlösungen

-- BMW 3er E46 (1998-2006) - Schleifgeräusch beim Lenken
INSERT INTO public.car_faults (
    model_generation_id,
    slug,
    title,
    description,
    solution,
    language_path,
    status,
    affected_component,
    severity,
    difficulty_level,
    estimated_repair_time,
    symptoms,
    diagnostic_steps,
    tools_required,
    parts_required,
    meta_description
)
SELECT 
    mg.id,
    'schleifgeraeusch-beim-lenken-e46',
    'BMW 3er E46 macht ein Schleifgeräusch beim Lenken - was ist das Problem?',
    'Der BMW 3er E46 zeigt ein Schleifgeräusch beim Lenken, was auf ein potenzielles Problem mit der Lenkung oder den Aufhängungskomponenten hinweist. Dieses Problem kann durch verschiedene Faktoren verursacht werden, einschließlich verschlissener Lenkungskomponenten, defekter Kugelgelenke oder Probleme mit der Servolenkung.',
    '## Problemlösung: Schleifgeräusch beim Lenken

### 1. Vorbereitung
- **Werkzeuge und Teile sammeln**: Stellen Sie sicher, dass alle benötigten Werkzeuge und Ersatzteile bereitstehen.
- **Fahrzeug sicher abstellen**: Parken Sie das Fahrzeug auf einer ebenen, festen Oberfläche und ziehen Sie die Handbremse an.
- **Batterie abklemmen**: Bei Arbeiten an elektrischen Komponenten die Batterie abklemmen.

### 2. Servolenkungsflüssigkeit prüfen und wechseln
- **Flüssigkeitsstand prüfen**: Öffnen Sie die Motorhaube und prüfen Sie den Stand der Servolenkungsflüssigkeit im Ausgleichsbehälter.
- **Flüssigkeit absaugen**: Verwenden Sie eine Absaugpumpe, um die alte Flüssigkeit zu entfernen.
- **Neue Flüssigkeit einfüllen**: Füllen Sie die empfohlene Servolenkungsflüssigkeit nach Herstellerspezifikation ein.
- **System spülen**: Lassen Sie den Motor laufen und bewegen Sie das Lenkrad langsam von Anschlag zu Anschlag, um Luftblasen zu entfernen.

**Benötigte Werkzeuge:**
- Absaugpumpe
- Servolenkungsflüssigkeit (ATF Dexron III oder spezifische BMW-Flüssigkeit)

### 3. Lenkungskomponenten prüfen und ersetzen
- **Lenkgetriebe prüfen**: Untersuchen Sie das Lenkgetriebe auf Verschleiß, Undichtigkeiten oder Beschädigungen.
- **Spurstangenköpfe prüfen**: Prüfen Sie die Spurstangenköpfe auf Spiel oder Verschleiß. Bei Bedarf ersetzen.
- **Querlenker prüfen**: Untersuchen Sie die Querlenker auf Risse, Verformungen oder verschlissene Gummilager.
- **Kugelgelenke prüfen**: Prüfen Sie die Kugelgelenke auf Spiel oder Verschleiß. Verwenden Sie einen Kugelgelenktrenner zum Ausbau.

**Benötigte Werkzeuge:**
- Steckschlüsselsatz
- Drehmomentschlüssel
- Kugelgelenktrenner
- Wagenheber und Stützböcke

**Benötigte Teile:**
- Servolenkungsflüssigkeit
- Spurstangenköpfe (falls erforderlich)
- Querlenker (falls erforderlich)
- Kugelgelenke (falls erforderlich)

### 4. Spurvermessung durchführen
- **Professionelle Vermessung**: Nach dem Austausch von Lenkungskomponenten sollte eine professionelle Spurvermessung durchgeführt werden.
- **Einstellung korrigieren**: Lassen Sie die Spurwerte von einem Fachbetrieb einstellen, um ungleichmäßigen Reifenverschleiß zu vermeiden.

**Benötigte Werkzeuge:**
- Spurvermessungsgerät (professioneller Betrieb)

### 5. Verifizierung
- **Komponententest**: Testen Sie die Lenkung bei verschiedenen Geschwindigkeiten und in verschiedenen Situationen.
- **Fehlercodes prüfen**: Prüfen Sie mit einem OBD-Scanner, ob Fehlercodes vorhanden sind.
- **Fahrzeug überwachen**: Beobachten Sie das Fahrzeug über mehrere Tage, um sicherzustellen, dass das Problem behoben ist.

### 6. Präventionsmaßnahmen
- **Wartungsplan einhalten**: Befolgen Sie den empfohlenen Wartungsplan des Herstellers.
- **Qualitätsteile verwenden**: Verwenden Sie nur Originalteile oder hochwertige Ersatzteile.
- **Regelmäßige Inspektion**: Lassen Sie die Lenkungskomponenten regelmäßig von einem Fachmann überprüfen.
- **Frühzeitige Reparatur**: Beheben Sie kleinere Probleme sofort, bevor sie sich verschlimmern.',
    'de',
    'live',
    'Lenkung',
    'medium',
    'medium',
    '2-4 Stunden',
    ARRAY[
        'Schleifgeräusch beim Drehen des Lenkrads',
        'Schwierigkeiten beim Lenken oder erhöhter Lenkwiderstand',
        'Vibration im Lenkrad während des Lenkens',
        'Ungleichmäßiger Reifenverschleiß',
        'Klackendes Geräusch beim Fahren über Unebenheiten'
    ],
    ARRAY[
        'Servolenkungsflüssigkeit prüfen: Öffnen Sie die Motorhaube und prüfen Sie den Flüssigkeitsstand im Ausgleichsbehälter',
        'Lenkrad von Anschlag zu Anschlag drehen: Hören Sie auf ungewöhnliche Geräusche',
        'Lenkgetriebe auf Undichtigkeiten prüfen: Untersuchen Sie den Bereich um das Lenkgetriebe',
        'Spurstangenköpfe auf Spiel prüfen: Heben Sie das Fahrzeug an und prüfen Sie die Spurstangenköpfe',
        'Kugelgelenke prüfen: Untersuchen Sie die Kugelgelenke auf Verschleiß oder Spiel',
        'Testfahrt durchführen: Fahren Sie das Fahrzeug und achten Sie auf Geräusche und Verhalten'
    ],
    ARRAY[
        'Absaugpumpe',
        'Servolenkungsflüssigkeit',
        'Steckschlüsselsatz',
        'Drehmomentschlüssel',
        'Kugelgelenktrenner',
        'Wagenheber',
        'Stützböcke'
    ],
    ARRAY[
        'Servolenkungsflüssigkeit',
        'Spurstangenköpfe (falls erforderlich)',
        'Querlenker (falls erforderlich)',
        'Kugelgelenke (falls erforderlich)'
    ],
    'BMW 3er E46 Schleifgeräusch beim Lenken: Detaillierte Anleitung zur Diagnose und Reparatur von Lenkungsproblemen. Schritt-für-Schritt-Anleitung mit Werkzeugen und Teilen.'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e46-1998-2006'
ON CONFLICT (model_generation_id, slug, language_path) DO NOTHING;

-- BMW 3er E90 (2005-2013) - Motor ruckelt beim Beschleunigen
INSERT INTO public.car_faults (
    model_generation_id,
    slug,
    title,
    description,
    solution,
    language_path,
    status,
    affected_component,
    severity,
    difficulty_level,
    estimated_repair_time,
    symptoms,
    diagnostic_steps,
    tools_required,
    parts_required,
    meta_description
)
SELECT 
    mg.id,
    'motor-ruckelt-beim-beschleunigen-e90',
    'BMW 3er E90 ruckelt beim Beschleunigen - was ist die Ursache?',
    'Der BMW 3er E90 zeigt ein Ruckeln oder Zucken beim Beschleunigen, was auf Probleme mit der Zündung, Kraftstoffversorgung oder Motorsteuerung hinweisen kann. Dieses Problem kann verschiedene Ursachen haben, einschließlich defekter Zündkerzen, verschmutzter Kraftstofffilter oder Probleme mit der Motorsteuerung.',
    '## Problemlösung: Motor ruckelt beim Beschleunigen

### 1. Vorbereitung
- **Werkzeuge sammeln**: Stellen Sie sicher, dass alle benötigten Werkzeuge bereitstehen.
- **Fahrzeug sicher abstellen**: Parken Sie das Fahrzeug auf einer ebenen, festen Oberfläche.
- **Motor abkühlen lassen**: Warten Sie, bis der Motor vollständig abgekühlt ist.

### 2. Zündkerzen prüfen und wechseln
- **Zündkerzen entfernen**: Entfernen Sie die Zündkerzen mit einem Zündkerzenschlüssel.
- **Zündkerzen prüfen**: Untersuchen Sie die Zündkerzen auf Verschleiß, Ablagerungen oder Beschädigungen.
- **Elektrodenabstand prüfen**: Prüfen Sie den Elektrodenabstand mit einer Fühlerlehre.
- **Neue Zündkerzen einsetzen**: Setzen Sie neue Zündkerzen mit dem korrekten Drehmoment ein.

**Benötigte Werkzeuge:**
- Zündkerzenschlüssel
- Fühlerlehre
- Drehmomentschlüssel

**Benötigte Teile:**
- Zündkerzen (4-6 Stück, je nach Motor)

### 3. Kraftstofffilter prüfen und wechseln
- **Kraftstofffilter lokalisieren**: Finden Sie den Kraftstofffilter (meist unter dem Fahrzeug oder im Motorraum).
- **Druck ablassen**: Lassen Sie den Kraftstoffdruck vor dem Ausbau ab.
- **Filter wechseln**: Entfernen Sie den alten Filter und setzen Sie einen neuen ein.
- **Dichtungen prüfen**: Stellen Sie sicher, dass alle Dichtungen korrekt sitzen.

**Benötigte Werkzeuge:**
- Steckschlüsselsatz
- Auffangbehälter für Kraftstoff

**Benötigte Teile:**
- Kraftstofffilter

### 4. Luftfilter prüfen und wechseln
- **Luftfiltergehäuse öffnen**: Öffnen Sie das Luftfiltergehäuse.
- **Filter prüfen**: Untersuchen Sie den Luftfilter auf Verschmutzung oder Beschädigungen.
- **Filter wechseln**: Ersetzen Sie den Filter bei Bedarf.

**Benötigte Teile:**
- Luftfilter

### 5. Motorsteuerung prüfen
- **Fehlercodes auslesen**: Verwenden Sie einen OBD-Scanner, um Fehlercodes auszulesen.
- **Sensoren prüfen**: Prüfen Sie die relevanten Sensoren (MAF, Lambda-Sonde, etc.).
- **Software-Update**: Prüfen Sie, ob ein Software-Update für die Motorsteuerung verfügbar ist.

**Benötigte Werkzeuge:**
- OBD-Scanner

### 6. Verifizierung
- **Testfahrt durchführen**: Fahren Sie das Fahrzeug und testen Sie das Beschleunigungsverhalten.
- **Fehlercodes prüfen**: Prüfen Sie erneut auf Fehlercodes.
- **Langzeitüberwachung**: Beobachten Sie das Fahrzeug über mehrere Tage.

### 7. Präventionsmaßnahmen
- **Regelmäßiger Service**: Befolgen Sie den empfohlenen Wartungsplan.
- **Qualitätskraftstoff**: Verwenden Sie hochwertigen Kraftstoff.
- **Frühzeitige Reparatur**: Beheben Sie Probleme sofort.',
    'de',
    'live',
    'Motor',
    'medium',
    'medium',
    '1-3 Stunden',
    ARRAY[
        'Motor ruckelt beim Beschleunigen',
        'Verlust von Motorleistung',
        'Unregelmäßiger Leerlauf',
        'Erhöhter Kraftstoffverbrauch',
        'Fehlercodes im Motorsteuergerät'
    ],
    ARRAY[
        'Fehlercodes auslesen: Verwenden Sie einen OBD-Scanner',
        'Zündkerzen prüfen: Entfernen und visuell prüfen',
        'Kraftstofffilter prüfen: Untersuchen Sie den Filter auf Verschmutzung',
        'Luftfilter prüfen: Öffnen Sie das Gehäuse und prüfen Sie den Filter',
        'Kraftstoffdruck prüfen: Messen Sie den Kraftstoffdruck',
        'Motorsteuerung prüfen: Lesen Sie die Sensordaten aus'
    ],
    ARRAY[
        'Zündkerzenschlüssel',
        'Fühlerlehre',
        'Drehmomentschlüssel',
        'Steckschlüsselsatz',
        'OBD-Scanner',
        'Auffangbehälter für Kraftstoff'
    ],
    ARRAY[
        'Zündkerzen',
        'Kraftstofffilter',
        'Luftfilter'
    ],
    'BMW 3er E90 Motor ruckelt beim Beschleunigen: Ursachen, Diagnose und Reparatur. Schritt-für-Schritt-Anleitung zur Behebung von Zündungs- und Kraftstoffproblemen.'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '3er' AND mg.slug = 'e90-2005-2013'
ON CONFLICT (model_generation_id, slug, language_path) DO NOTHING;

-- Mercedes E-Klasse W211 (2002-2009) - Ölverlust am Motor
INSERT INTO public.car_faults (
    model_generation_id,
    slug,
    title,
    description,
    solution,
    language_path,
    status,
    affected_component,
    severity,
    difficulty_level,
    estimated_repair_time,
    symptoms,
    diagnostic_steps,
    tools_required,
    parts_required,
    meta_description
)
SELECT 
    mg.id,
    'oelverlust-am-motor-w211',
    'Mercedes E-Klasse W211 verliert Motoröl - wo kommt das Leck her?',
    'Die Mercedes E-Klasse W211 zeigt einen Ölverlust am Motor, was auf undichte Dichtungen, defekte Ölfilter oder beschädigte Komponenten hinweisen kann. Ein Ölverlust kann zu schweren Motorschäden führen, wenn er nicht rechtzeitig behoben wird.',
    '## Problemlösung: Ölverlust am Motor

### 1. Vorbereitung
- **Werkzeuge sammeln**: Stellen Sie sicher, dass alle benötigten Werkzeuge bereitstehen.
- **Fahrzeug sicher abstellen**: Parken Sie das Fahrzeug auf einer ebenen, festen Oberfläche.
- **Motor abkühlen lassen**: Warten Sie, bis der Motor vollständig abgekühlt ist.

### 2. Ölstand prüfen
- **Ölmessstab prüfen**: Ziehen Sie den Ölmessstab heraus und prüfen Sie den Ölstand.
- **Ölqualität prüfen**: Untersuchen Sie das Öl auf Verunreinigungen oder Verbrennungsrückstände.
- **Ölstand dokumentieren**: Notieren Sie den aktuellen Ölstand für spätere Vergleiche.

### 3. Ölleck lokalisieren
- **Motorraum inspizieren**: Untersuchen Sie den Motorraum gründlich auf Ölspuren.
- **Unterboden prüfen**: Heben Sie das Fahrzeug an und prüfen Sie den Unterboden auf Ölspuren.
- **Ölspur verfolgen**: Folgen Sie der Ölspur zurück zur Quelle des Lecks.

### 4. Häufige Leckstellen prüfen
- **Ölfilter prüfen**: Untersuchen Sie den Ölfilter auf Undichtigkeiten.
- **Ölwannendichtung prüfen**: Prüfen Sie die Ölwannendichtung auf Beschädigungen.
- **Ventildeckel-Dichtung prüfen**: Untersuchen Sie die Ventildeckel-Dichtung.
- **Kurbelwellen-Dichtringe prüfen**: Prüfen Sie die vorderen und hinteren Kurbelwellen-Dichtringe.

### 5. Dichtungen ersetzen
- **Alte Dichtung entfernen**: Entfernen Sie die beschädigte Dichtung sorgfältig.
- **Dichtflächen reinigen**: Reinigen Sie alle Dichtflächen gründlich.
- **Neue Dichtung einsetzen**: Setzen Sie die neue Dichtung mit Dichtmittel ein.
- **Drehmoment beachten**: Ziehen Sie alle Schrauben mit dem korrekten Drehmoment an.

**Benötigte Werkzeuge:**
- Steckschlüsselsatz
- Drehmomentschlüssel
- Wagenheber
- Stützböcke
- Dichtungsentferner
- Bremsenreiniger

**Benötigte Teile:**
- Ölwannendichtung
- Ventildeckel-Dichtung
- Kurbelwellen-Dichtringe (falls erforderlich)
- Motoröl
- Ölfilter

### 6. Ölwechsel durchführen
- **Altöl ablassen**: Lassen Sie das Altöl vollständig ab.
- **Ölfilter wechseln**: Ersetzen Sie den Ölfilter.
- **Neues Öl einfüllen**: Füllen Sie das empfohlene Motoröl ein.
- **Ölstand prüfen**: Prüfen Sie den Ölstand nach dem Start.

### 7. Verifizierung
- **Lecktest durchführen**: Starten Sie den Motor und prüfen Sie auf neue Lecks.
- **Ölstand überwachen**: Prüfen Sie den Ölstand regelmäßig über mehrere Tage.
- **Unterboden prüfen**: Untersuchen Sie den Unterboden erneut auf Ölspuren.

### 8. Präventionsmaßnahmen
- **Regelmäßiger Ölwechsel**: Befolgen Sie den empfohlenen Ölwechselintervall.
- **Qualitätsöl verwenden**: Verwenden Sie nur hochwertiges Motoröl.
- **Frühzeitige Reparatur**: Beheben Sie Lecks sofort, bevor sie sich verschlimmern.',
    'de',
    'live',
    'Motor',
    'high',
    'medium',
    '2-4 Stunden',
    ARRAY[
        'Ölflecken unter dem Fahrzeug',
        'Niedriger Ölstand',
        'Ölwarnleuchte leuchtet',
        'Ölgeruch im Motorraum',
        'Ölspuren am Motor'
    ],
    ARRAY[
        'Ölstand prüfen: Ziehen Sie den Ölmessstab heraus',
        'Motorraum inspizieren: Suchen Sie nach Ölspuren',
        'Unterboden prüfen: Heben Sie das Fahrzeug an',
        'Ölfilter prüfen: Untersuchen Sie den Filter auf Undichtigkeiten',
        'Dichtungen prüfen: Untersuchen Sie alle Dichtungen',
        'Ölspur verfolgen: Folgen Sie der Ölspur zur Quelle'
    ],
    ARRAY[
        'Steckschlüsselsatz',
        'Drehmomentschlüssel',
        'Wagenheber',
        'Stützböcke',
        'Dichtungsentferner',
        'Bremsenreiniger',
        'Auffangbehälter für Altöl'
    ],
    ARRAY[
        'Ölwannendichtung',
        'Ventildeckel-Dichtung',
        'Kurbelwellen-Dichtringe (falls erforderlich)',
        'Motoröl',
        'Ölfilter'
    ],
    'Mercedes E-Klasse W211 Ölverlust am Motor: Ursachen finden und beheben. Detaillierte Anleitung zur Reparatur von Öllecks mit Werkzeugen und Teilen.'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'mercedes-benz' AND cm.slug = 'e-klasse' AND mg.slug = 'w211-2002-2009'
ON CONFLICT (model_generation_id, slug, language_path) DO NOTHING;

-- Audi A6 C6 (2004-2011) - Kupplung rutscht
INSERT INTO public.car_faults (
    model_generation_id,
    slug,
    title,
    description,
    solution,
    language_path,
    status,
    affected_component,
    severity,
    difficulty_level,
    estimated_repair_time,
    symptoms,
    diagnostic_steps,
    tools_required,
    parts_required,
    meta_description
)
SELECT 
    mg.id,
    'kupplung-rutscht-a6-c6',
    'Audi A6 C6 Kupplung rutscht - wann muss sie gewechselt werden?',
    'Der Audi A6 C6 zeigt ein Rutschen der Kupplung, was auf Verschleiß der Kupplungsscheibe, des Ausrücklagers oder der Druckplatte hinweist. Ein rutschiges Kupplungsverhalten kann zu einem vollständigen Ausfall der Kupplung führen und sollte sofort behoben werden.',
    '## Problemlösung: Kupplung rutscht

### 1. Vorbereitung
- **Werkzeuge sammeln**: Stellen Sie sicher, dass alle benötigten Werkzeuge bereitstehen.
- **Fahrzeug sicher abstellen**: Parken Sie das Fahrzeug auf einer ebenen, festen Oberfläche.
- **Batterie abklemmen**: Klemmen Sie die Batterie ab, bevor Sie arbeiten.

### 2. Kupplungsverhalten testen
- **Kupplungspedal prüfen**: Prüfen Sie den Pedalweg und den Widerstand.
- **Rutschtest durchführen**: Fahren Sie das Fahrzeug und testen Sie das Kupplungsverhalten.
- **Geräusche prüfen**: Hören Sie auf ungewöhnliche Geräusche beim Betätigen der Kupplung.

### 3. Kupplung ausbauen
- **Getriebe demontieren**: Entfernen Sie das Getriebe vom Motor.
- **Kupplungsscheibe prüfen**: Untersuchen Sie die Kupplungsscheibe auf Verschleiß.
- **Druckplatte prüfen**: Prüfen Sie die Druckplatte auf Beschädigungen.
- **Ausrücklager prüfen**: Untersuchen Sie das Ausrücklager auf Verschleiß.

**Benötigte Werkzeuge:**
- Getriebeheber
- Steckschlüsselsatz
- Drehmomentschlüssel
- Wagenheber
- Stützböcke
- Kupplungsausrichtwerkzeug

**Benötigte Teile:**
- Kupplungsscheibe
- Druckplatte
- Ausrücklager
- Kupplungsführungslager (falls erforderlich)

### 4. Neue Kupplung einbauen
- **Dichtflächen reinigen**: Reinigen Sie alle Dichtflächen gründlich.
- **Kupplung ausrichten**: Verwenden Sie ein Ausrichtwerkzeug, um die Kupplung korrekt auszurichten.
- **Druckplatte montieren**: Setzen Sie die Druckplatte mit dem korrekten Drehmoment ein.
- **Ausrücklager montieren**: Setzen Sie das neue Ausrücklager ein.

### 5. Getriebe montieren
- **Getriebe einbauen**: Setzen Sie das Getriebe wieder ein.
- **Schrauben anziehen**: Ziehen Sie alle Schrauben mit dem korrekten Drehmoment an.
- **Verbindungen prüfen**: Prüfen Sie alle Verbindungen auf korrekten Sitz.

### 6. Kupplung einfahren
- **Einlaufphase beachten**: Fahren Sie die Kupplung vorsichtig ein (ca. 500-1000 km).
- **Vermeiden Sie**: Vermeiden Sie starke Beschleunigung und hohe Lasten während der Einlaufphase.

### 7. Verifizierung
- **Kupplungsverhalten testen**: Testen Sie das Kupplungsverhalten bei verschiedenen Geschwindigkeiten.
- **Geräusche prüfen**: Hören Sie auf ungewöhnliche Geräusche.
- **Langzeitüberwachung**: Beobachten Sie das Fahrzeug über mehrere Wochen.

### 8. Präventionsmaßnahmen
- **Sanftes Fahren**: Vermeiden Sie ruckartiges Anfahren.
- **Kupplung nicht schleifen lassen**: Lassen Sie die Kupplung nicht unnötig schleifen.
- **Regelmäßige Wartung**: Lassen Sie die Kupplung regelmäßig überprüfen.',
    'de',
    'live',
    'Getriebe',
    'high',
    'hard',
    '4-6 Stunden',
    ARRAY[
        'Kupplung rutscht beim Beschleunigen',
        'Erhöhte Motordrehzahl ohne entsprechende Beschleunigung',
        'Geruch nach verbranntem Material',
        'Schwierigkeiten beim Schalten',
        'Kupplungspedal fühlt sich weich an'
    ],
    ARRAY[
        'Kupplungspedal prüfen: Prüfen Sie den Pedalweg und Widerstand',
        'Rutschtest durchführen: Fahren Sie und testen Sie das Kupplungsverhalten',
        'Geräusche prüfen: Hören Sie auf ungewöhnliche Geräusche',
        'Kupplungsscheibe prüfen: Untersuchen Sie die Scheibe auf Verschleiß',
        'Druckplatte prüfen: Prüfen Sie die Druckplatte auf Beschädigungen',
        'Ausrücklager prüfen: Untersuchen Sie das Lager auf Verschleiß'
    ],
    ARRAY[
        'Getriebeheber',
        'Steckschlüsselsatz',
        'Drehmomentschlüssel',
        'Wagenheber',
        'Stützböcke',
        'Kupplungsausrichtwerkzeug'
    ],
    ARRAY[
        'Kupplungsscheibe',
        'Druckplatte',
        'Ausrücklager',
        'Kupplungsführungslager (falls erforderlich)'
    ],
    'Audi A6 C6 Kupplung rutscht: Ursachen, Diagnose und Reparatur. Detaillierte Anleitung zum Kupplungswechsel mit Werkzeugen und Teilen.'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'audi' AND cm.slug = 'a6' AND mg.slug = 'a6-c6-2004-2011'
ON CONFLICT (model_generation_id, slug, language_path) DO NOTHING;

-- VW Passat B6 (2005-2010) - Klimaanlage bläst keine kalte Luft
INSERT INTO public.car_faults (
    model_generation_id,
    slug,
    title,
    description,
    solution,
    language_path,
    status,
    affected_component,
    severity,
    difficulty_level,
    estimated_repair_time,
    symptoms,
    diagnostic_steps,
    tools_required,
    parts_required,
    meta_description
)
SELECT 
    mg.id,
    'klimaanlage-keine-kalte-luft-passat-b6',
    'VW Passat B6 Klimaanlage bläst keine kalte Luft - was ist das Problem?',
    'Der VW Passat B6 zeigt ein Problem mit der Klimaanlage, bei dem keine kalte Luft mehr ausgeblasen wird. Dies kann durch verschiedene Faktoren verursacht werden, einschließlich niedrigem Kältemittelstand, defektem Kompressor oder Problemen mit dem Klimaanlagenregelventil.',
    '## Problemlösung: Klimaanlage bläst keine kalte Luft

### 1. Vorbereitung
- **Werkzeuge sammeln**: Stellen Sie sicher, dass alle benötigten Werkzeuge bereitstehen.
- **Fahrzeug sicher abstellen**: Parken Sie das Fahrzeug auf einer ebenen, festen Oberfläche.
- **Motor abkühlen lassen**: Warten Sie, bis der Motor abgekühlt ist.

### 2. Kältemittelstand prüfen
- **Druck prüfen**: Verwenden Sie ein Kältemitteldruckmessgerät, um den Druck zu prüfen.
- **Niedrigen Druck erkennen**: Ein zu niedriger Druck kann auf ein Leck hinweisen.
- **Kältemittel nachfüllen**: Füllen Sie bei Bedarf Kältemittel nach (nur von Fachpersonal).

**WICHTIG**: Kältemittel sollte nur von geschultem Personal nachgefüllt werden, da es umweltschädlich ist.

**Benötigte Werkzeuge:**
- Kältemitteldruckmessgerät
- Kältemittelauffüllstation (professionell)

**Benötigte Teile:**
- Kältemittel (R134a oder R1234yf, je nach Modell)

### 3. Kompressor prüfen
- **Kompressor aktivieren**: Schalten Sie die Klimaanlage ein und prüfen Sie, ob der Kompressor läuft.
- **Kompressorkupplung prüfen**: Prüfen Sie die Kompressorkupplung auf Funktion.
- **Kompressor ersetzen**: Bei Defekt muss der Kompressor ausgetauscht werden.

**Benötigte Werkzeuge:**
- Steckschlüsselsatz
- Drehmomentschlüssel
- Vakuumpumpe (für Entlüftung)

**Benötigte Teile:**
- Kompressor (falls erforderlich)
- Kompressoröl
- Dichtungen

### 4. Klimaanlagenregelventil prüfen
- **Ventil lokalisieren**: Finden Sie das Klimaanlagenregelventil.
- **Ventil prüfen**: Prüfen Sie das Ventil auf Funktion.
- **Ventil ersetzen**: Ersetzen Sie das Ventil bei Bedarf.

**Benötigte Teile:**
- Klimaanlagenregelventil (falls erforderlich)

### 5. Kondensator prüfen
- **Kondensator inspizieren**: Untersuchen Sie den Kondensator auf Beschädigungen oder Verschmutzung.
- **Kondensator reinigen**: Reinigen Sie den Kondensator bei Verschmutzung.
- **Kondensator ersetzen**: Ersetzen Sie den Kondensator bei Beschädigung.

**Benötigte Werkzeuge:**
- Druckluftkompressor
- Reinigungsmittel

**Benötigte Teile:**
- Kondensator (falls erforderlich)

### 6. System entlüften und befüllen
- **System evakuieren**: Evakuieren Sie das System mit einer Vakuumpumpe.
- **Kältemittel einfüllen**: Füllen Sie das korrekte Kältemittel ein.
- **Ölstand prüfen**: Prüfen Sie den Kompressorölstand.

**WICHTIG**: Diese Arbeiten sollten nur von geschultem Personal durchgeführt werden.

### 7. Verifizierung
- **Klimaanlage testen**: Testen Sie die Klimaanlage bei verschiedenen Temperaturen.
- **Temperatur prüfen**: Prüfen Sie die Ausblaslufttemperatur.
- **Langzeitüberwachung**: Beobachten Sie die Funktion über mehrere Tage.

### 8. Präventionsmaßnahmen
- **Regelmäßige Wartung**: Lassen Sie die Klimaanlage regelmäßig warten.
- **Kondensator reinigen**: Reinigen Sie den Kondensator regelmäßig.
- **Frühzeitige Reparatur**: Beheben Sie Probleme sofort.',
    'de',
    'live',
    'Klimaanlage',
    'medium',
    'hard',
    '2-4 Stunden',
    ARRAY[
        'Klimaanlage bläst keine kalte Luft',
        'Nur warme oder lauwarme Luft',
        'Klimaanlage läuft, aber kühlt nicht',
        'Ungewöhnliche Geräusche von der Klimaanlage',
        'Klimaanlage schaltet sich nicht ein'
    ],
    ARRAY[
        'Kältemitteldruck prüfen: Verwenden Sie ein Druckmessgerät',
        'Kompressor prüfen: Schalten Sie die Klimaanlage ein und prüfen Sie den Kompressor',
        'Kondensator prüfen: Untersuchen Sie den Kondensator auf Verschmutzung',
        'Klimaanlagenregelventil prüfen: Prüfen Sie das Ventil auf Funktion',
        'Temperatur prüfen: Messen Sie die Ausblaslufttemperatur',
        'Fehlercodes prüfen: Lesen Sie Fehlercodes mit einem OBD-Scanner aus'
    ],
    ARRAY[
        'Kältemitteldruckmessgerät',
        'Kältemittelauffüllstation',
        'Steckschlüsselsatz',
        'Drehmomentschlüssel',
        'Vakuumpumpe',
        'Druckluftkompressor',
        'OBD-Scanner'
    ],
    ARRAY[
        'Kältemittel (R134a oder R1234yf)',
        'Kompressor (falls erforderlich)',
        'Kompressoröl',
        'Klimaanlagenregelventil (falls erforderlich)',
        'Kondensator (falls erforderlich)',
        'Dichtungen'
    ],
    'VW Passat B6 Klimaanlage bläst keine kalte Luft: Ursachen finden und beheben. Detaillierte Anleitung zur Reparatur der Klimaanlage.'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'volkswagen' AND cm.slug = 'passat' AND mg.slug = 'passat-b6-2005-2010'
ON CONFLICT (model_generation_id, slug, language_path) DO NOTHING;

-- BMW 5er E39 (1995-2003) - Bremsen quietschen
INSERT INTO public.car_faults (
    model_generation_id,
    slug,
    title,
    description,
    solution,
    language_path,
    status,
    affected_component,
    severity,
    difficulty_level,
    estimated_repair_time,
    symptoms,
    diagnostic_steps,
    tools_required,
    parts_required,
    meta_description
)
SELECT 
    mg.id,
    'bremsen-quietschen-e39',
    'BMW 5er E39 Bremsen quietschen - was ist die Ursache?',
    'Der BMW 5er E39 zeigt ein Quietschen der Bremsen, was auf verschlissene Bremsbeläge, beschädigte Bremsscheiben oder Probleme mit den Bremskomponenten hinweisen kann. Ein Quietschen der Bremsen kann ein Sicherheitsrisiko darstellen und sollte sofort überprüft werden.',
    '## Problemlösung: Bremsen quietschen

### 1. Vorbereitung
- **Werkzeuge sammeln**: Stellen Sie sicher, dass alle benötigten Werkzeuge bereitstehen.
- **Fahrzeug sicher abstellen**: Parken Sie das Fahrzeug auf einer ebenen, festen Oberfläche.
- **Handbremse anziehen**: Ziehen Sie die Handbremse an und verwenden Sie Radkeile.
- **Räder demontieren**: Lösen Sie die Radmuttern und demontieren Sie die Räder.

### 2. Bremsbeläge prüfen
- **Belagstärke messen**: Messen Sie die Dicke der Bremsbeläge.
- **Mindeststärke prüfen**: Die Mindeststärke beträgt 3 mm. Unter diesem Wert müssen die Beläge gewechselt werden.
- **Verschleißanzeiger prüfen**: Prüfen Sie, ob der Verschleißanzeiger aktiviert ist.
- **Beläge auf Beschädigungen prüfen**: Untersuchen Sie die Beläge auf Risse, Ablagerungen oder ungleichmäßigen Verschleiß.

**Benötigte Werkzeuge:**
- Wagenheber
- Stützböcke
- Radmutternschlüssel
- Bremsenreiniger
- Fühlerlehre

**Benötigte Teile:**
- Bremsbeläge (Vorderachse und/oder Hinterachse)
- Bremsbelaghalter (falls beschädigt)

### 3. Bremsscheiben prüfen
- **Scheibendicke messen**: Messen Sie die Dicke der Bremsscheiben.
- **Mindestdicke prüfen**: Die Mindestdicke ist in der Scheibe eingraviert oder in der Werkstattdokumentation angegeben.
- **Riefen prüfen**: Untersuchen Sie die Bremsscheiben auf tiefe Riefen oder Beschädigungen.
- **Rundlauf prüfen**: Prüfen Sie den Rundlauf der Scheiben.

**Benötigte Werkzeuge:**
- Messschieber
- Fühlerlehre

**Benötigte Teile:**
- Bremsscheiben (falls unter Mindestdicke oder stark beschädigt)

### 4. Bremsbeläge wechseln
- **Bremskolben zurückschieben**: Drücken Sie die Bremskolben mit einem Bremskolben-Rückschiebwerkzeug zurück.
- **Alte Beläge entfernen**: Entfernen Sie die alten Bremsbeläge.
- **Bremsen reinigen**: Reinigen Sie die Bremssättel und Bremskomponenten gründlich.
- **Neue Beläge einsetzen**: Setzen Sie die neuen Bremsbeläge ein.
- **Bremsbelaghalter prüfen**: Prüfen Sie die Halter auf korrekten Sitz und Verschleiß.

**Benötigte Werkzeuge:**
- Bremskolben-Rückschiebwerkzeug
- Bremsenreiniger
- Drahtbürste
- Fett für Bremsbelagrückseiten

**Benötigte Teile:**
- Bremsbeläge
- Bremsbelaghalter (falls erforderlich)

### 5. Bremsscheiben wechseln (falls erforderlich)
- **Bremsscheiben demontieren**: Entfernen Sie die Bremsscheiben.
- **Dichtflächen reinigen**: Reinigen Sie alle Dichtflächen gründlich.
- **Neue Scheiben montieren**: Setzen Sie die neuen Bremsscheiben ein.
- **Drehmoment beachten**: Ziehen Sie alle Schrauben mit dem korrekten Drehmoment an.

**Benötigte Werkzeuge:**
- Steckschlüsselsatz
- Drehmomentschlüssel

**Benötigte Teile:**
- Bremsscheiben
- Bremsbeläge (immer zusammen mit neuen Scheiben wechseln)

### 6. Bremsflüssigkeit prüfen
- **Flüssigkeitsstand prüfen**: Prüfen Sie den Stand der Bremsflüssigkeit.
- **Flüssigkeit prüfen**: Untersuchen Sie die Flüssigkeit auf Verunreinigungen oder Verfärbungen.
- **Flüssigkeit wechseln**: Wechseln Sie die Bremsflüssigkeit bei Bedarf (alle 2 Jahre empfohlen).

**Benötigte Teile:**
- Bremsflüssigkeit (DOT 4 oder spezifische BMW-Flüssigkeit)

### 7. Bremsen einfahren
- **Einlaufphase beachten**: Fahren Sie die neuen Bremsen vorsichtig ein (ca. 200-300 km).
- **Vermeiden Sie**: Vermeiden Sie starkes Bremsen und hohe Temperaturen während der Einlaufphase.

### 8. Verifizierung
- **Bremsen testen**: Testen Sie die Bremsen bei verschiedenen Geschwindigkeiten.
- **Geräusche prüfen**: Hören Sie auf ungewöhnliche Geräusche.
- **Bremsverhalten prüfen**: Prüfen Sie das Bremsverhalten und die Bremskraft.
- **Langzeitüberwachung**: Beobachten Sie die Bremsen über mehrere Wochen.

### 9. Präventionsmaßnahmen
- **Regelmäßige Inspektion**: Lassen Sie die Bremsen regelmäßig überprüfen.
- **Qualitätsteile verwenden**: Verwenden Sie nur hochwertige Bremskomponenten.
- **Frühzeitiger Wechsel**: Wechseln Sie die Bremsbeläge rechtzeitig, bevor sie die Scheiben beschädigen.',
    'de',
    'live',
    'Bremsen',
    'high',
    'easy',
    '1-2 Stunden',
    ARRAY[
        'Quietschendes Geräusch beim Bremsen',
        'Metallisches Schleifgeräusch',
        'Vibration im Bremspedal',
        'Längere Bremswege',
        'Verschleißanzeiger leuchtet auf'
    ],
    ARRAY[
        'Bremsbelagstärke prüfen: Messen Sie die Dicke der Beläge',
        'Bremsscheiben prüfen: Untersuchen Sie die Scheiben auf Riefen',
        'Verschleißanzeiger prüfen: Prüfen Sie, ob der Anzeiger aktiviert ist',
        'Bremsflüssigkeit prüfen: Prüfen Sie den Stand und die Qualität',
        'Bremsverhalten testen: Fahren Sie das Fahrzeug und testen Sie die Bremsen',
        'Geräusche lokalisieren: Identifizieren Sie, welche Achse das Geräusch verursacht'
    ],
    ARRAY[
        'Wagenheber',
        'Stützböcke',
        'Radmutternschlüssel',
        'Bremskolben-Rückschiebwerkzeug',
        'Bremsenreiniger',
        'Fühlerlehre',
        'Messschieber',
        'Drahtbürste',
        'Steckschlüsselsatz',
        'Drehmomentschlüssel'
    ],
    ARRAY[
        'Bremsbeläge (Vorderachse)',
        'Bremsbeläge (Hinterachse)',
        'Bremsscheiben (falls erforderlich)',
        'Bremsbelaghalter (falls erforderlich)',
        'Bremsflüssigkeit',
        'Fett für Bremsbelagrückseiten'
    ],
    'BMW 5er E39 Bremsen quietschen: Ursachen, Diagnose und Reparatur. Detaillierte Anleitung zum Bremsenwechsel mit Werkzeugen und Teilen.'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'bmw' AND cm.slug = '5er' AND mg.slug = 'e39-1995-2003'
ON CONFLICT (model_generation_id, slug, language_path) DO NOTHING;

-- Mercedes C-Klasse W204 (2007-2014) - Motor springt nicht an
INSERT INTO public.car_faults (
    model_generation_id,
    slug,
    title,
    description,
    solution,
    language_path,
    status,
    affected_component,
    severity,
    difficulty_level,
    estimated_repair_time,
    symptoms,
    diagnostic_steps,
    tools_required,
    parts_required,
    meta_description
)
SELECT 
    mg.id,
    'motor-springt-nicht-an-w204',
    'Mercedes C-Klasse W204 springt nicht an - was ist das Problem?',
    'Die Mercedes C-Klasse W204 springt nicht an, was auf Probleme mit der Batterie, dem Anlasser, der Zündung oder der Kraftstoffversorgung hinweisen kann. Ein Startproblem kann verschiedene Ursachen haben und erfordert eine systematische Diagnose.',
    '## Problemlösung: Motor springt nicht an

### 1. Vorbereitung
- **Werkzeuge sammeln**: Stellen Sie sicher, dass alle benötigten Werkzeuge bereitstehen.
- **Fahrzeug sicher abstellen**: Parken Sie das Fahrzeug auf einer ebenen, festen Oberfläche.
- **Sicherheit beachten**: Arbeiten Sie in einem gut belüfteten Bereich.

### 2. Batterie prüfen
- **Batteriespannung messen**: Messen Sie die Spannung der Batterie mit einem Multimeter.
- **Mindestspannung**: Die Spannung sollte mindestens 12,6 V betragen (bei 20°C).
- **Batterie laden**: Laden Sie die Batterie bei niedriger Spannung auf.
- **Batteriepole prüfen**: Prüfen Sie die Batteriepole auf Korrosion oder lose Verbindungen.

**Benötigte Werkzeuge:**
- Multimeter
- Batterieladegerät
- Drahtbürste

**Benötigte Teile:**
- Batterie (falls defekt)
- Batteriepole (falls korrodiert)

### 3. Anlasser prüfen
- **Anlasser aktivieren**: Versuchen Sie, den Motor zu starten und hören Sie auf Geräusche.
- **Anlasser dreht nicht**: Wenn der Anlasser nicht dreht, prüfen Sie die Anlasserrelais und Sicherungen.
- **Anlasser dreht langsam**: Wenn der Anlasser langsam dreht, kann die Batterie schwach sein oder der Anlasser defekt.
- **Anlasser prüfen**: Prüfen Sie den Anlasser auf Funktion (Spannung, Stromaufnahme).

**Benötigte Werkzeuge:**
- Multimeter
- Oszilloskop (optional, für detaillierte Diagnose)

**Benötigte Teile:**
- Anlasser (falls defekt)
- Anlasserrelais (falls defekt)

### 4. Zündung prüfen
- **Zündkerzen prüfen**: Entfernen Sie die Zündkerzen und prüfen Sie sie auf Verschleiß.
- **Zündspulen prüfen**: Prüfen Sie die Zündspulen auf Funktion.
- **Zündkerzenstecker prüfen**: Prüfen Sie die Stecker auf korrekten Sitz und Beschädigungen.

**Benötigte Werkzeuge:**
- Zündkerzenschlüssel
- Multimeter

**Benötigte Teile:**
- Zündkerzen (falls erforderlich)
- Zündspulen (falls defekt)

### 5. Kraftstoffversorgung prüfen
- **Kraftstoffdruck prüfen**: Messen Sie den Kraftstoffdruck mit einem Druckmessgerät.
- **Kraftstoffpumpe prüfen**: Prüfen Sie, ob die Kraftstoffpumpe läuft (hören Sie auf ein Summen).
- **Kraftstofffilter prüfen**: Prüfen Sie den Kraftstofffilter auf Verstopfung.
- **Kraftstoffqualität prüfen**: Prüfen Sie die Kraftstoffqualität (Wasser, Verunreinigungen).

**Benötigte Werkzeuge:**
- Kraftstoffdruckmessgerät
- Multimeter

**Benötigte Teile:**
- Kraftstoffpumpe (falls defekt)
- Kraftstofffilter (falls verstopft)

### 6. Motorsteuerung prüfen
- **Fehlercodes auslesen**: Verwenden Sie einen OBD-Scanner, um Fehlercodes auszulesen.
- **Sensoren prüfen**: Prüfen Sie die relevanten Sensoren (Kurbelwellensensor, Nockenwellensensor).
- **Steuergerät prüfen**: Prüfen Sie das Motorsteuergerät auf Funktion.

**Benötigte Werkzeuge:**
- OBD-Scanner
- Multimeter

**Benötigte Teile:**
- Kurbelwellensensor (falls defekt)
- Nockenwellensensor (falls defekt)

### 7. Verifizierung
- **Motor starten**: Versuchen Sie, den Motor zu starten.
- **Startverhalten prüfen**: Prüfen Sie das Startverhalten und die Motordrehzahl.
- **Fehlercodes prüfen**: Prüfen Sie erneut auf Fehlercodes.
- **Langzeitüberwachung**: Beobachten Sie das Fahrzeug über mehrere Tage.

### 8. Präventionsmaßnahmen
- **Regelmäßige Wartung**: Befolgen Sie den empfohlenen Wartungsplan.
- **Batterie warten**: Lassen Sie die Batterie regelmäßig überprüfen.
- **Qualitätskraftstoff**: Verwenden Sie hochwertigen Kraftstoff.
- **Frühzeitige Reparatur**: Beheben Sie Probleme sofort.',
    'de',
    'live',
    'Motor',
    'critical',
    'medium',
    '2-4 Stunden',
    ARRAY[
        'Motor springt nicht an',
        'Anlasser dreht nicht',
        'Anlasser dreht langsam',
        'Motor startet, läuft aber sofort wieder aus',
        'Keine Reaktion beim Startversuch'
    ],
    ARRAY[
        'Batteriespannung prüfen: Messen Sie die Spannung mit einem Multimeter',
        'Anlasser prüfen: Versuchen Sie zu starten und hören Sie auf Geräusche',
        'Zündkerzen prüfen: Entfernen Sie die Kerzen und prüfen Sie sie',
        'Kraftstoffdruck prüfen: Messen Sie den Druck mit einem Messgerät',
        'Kraftstoffpumpe prüfen: Hören Sie auf ein Summen beim Einschalten',
        'Fehlercodes auslesen: Verwenden Sie einen OBD-Scanner'
    ],
    ARRAY[
        'Multimeter',
        'Batterieladegerät',
        'OBD-Scanner',
        'Kraftstoffdruckmessgerät',
        'Zündkerzenschlüssel',
        'Drahtbürste'
    ],
    ARRAY[
        'Batterie (falls defekt)',
        'Anlasser (falls defekt)',
        'Anlasserrelais (falls defekt)',
        'Zündkerzen (falls erforderlich)',
        'Zündspulen (falls defekt)',
        'Kraftstoffpumpe (falls defekt)',
        'Kraftstofffilter (falls verstopft)',
        'Kurbelwellensensor (falls defekt)',
        'Nockenwellensensor (falls defekt)'
    ],
    'Mercedes C-Klasse W204 springt nicht an: Systematische Diagnose und Reparatur. Detaillierte Anleitung zur Fehlersuche bei Startproblemen.'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'mercedes-benz' AND cm.slug = 'c-klasse' AND mg.slug = 'w204-2007-2014'
ON CONFLICT (model_generation_id, slug, language_path) DO NOTHING;

-- Audi A4 B8 (2007-2015) - Getriebe schaltet nicht richtig
INSERT INTO public.car_faults (
    model_generation_id,
    slug,
    title,
    description,
    solution,
    language_path,
    status,
    affected_component,
    severity,
    difficulty_level,
    estimated_repair_time,
    symptoms,
    diagnostic_steps,
    tools_required,
    parts_required,
    meta_description
)
SELECT 
    mg.id,
    'getriebe-schaltet-nicht-richtig-a4-b8',
    'Audi A4 B8 Getriebe schaltet nicht richtig - was ist die Ursache?',
    'Der Audi A4 B8 zeigt Probleme beim Schalten des Getriebes, was auf niedrigen Getriebeölstand, verschlissene Kupplung, defekte Getriebesteuerung oder Probleme mit den Synchronisierungen hinweisen kann. Schaltprobleme können die Fahrsicherheit beeinträchtigen.',
    '## Problemlösung: Getriebe schaltet nicht richtig

### 1. Vorbereitung
- **Werkzeuge sammeln**: Stellen Sie sicher, dass alle benötigten Werkzeuge bereitstehen.
- **Fahrzeug sicher abstellen**: Parken Sie das Fahrzeug auf einer ebenen, festen Oberfläche.
- **Motor abkühlen lassen**: Warten Sie, bis der Motor abgekühlt ist.

### 2. Getriebeölstand prüfen
- **Ölstand prüfen**: Prüfen Sie den Getriebeölstand mit dem Messstab oder über die Füllöffnung.
- **Ölqualität prüfen**: Untersuchen Sie das Getriebeöl auf Verunreinigungen, Verbrennungsrückstände oder Metallpartikel.
- **Ölstand dokumentieren**: Notieren Sie den aktuellen Ölstand.

**Benötigte Werkzeuge:**
- Fülltrichter
- Auffangbehälter

**Benötigte Teile:**
- Getriebeöl (spezifisch für das Modell)

### 3. Getriebeöl wechseln
- **Altöl ablassen**: Lassen Sie das Altöl vollständig ab.
- **Ölfilter prüfen**: Prüfen Sie, ob ein Ölfilter vorhanden ist und wechseln Sie ihn bei Bedarf.
- **Neues Öl einfüllen**: Füllen Sie das empfohlene Getriebeöl ein.
- **Ölstand prüfen**: Prüfen Sie den Ölstand nach dem Einfüllen.

**Benötigte Werkzeuge:**
- Steckschlüsselsatz
- Auffangbehälter
- Fülltrichter

**Benötigte Teile:**
- Getriebeöl
- Getriebeölfilter (falls vorhanden)

### 4. Kupplung prüfen (bei Schaltgetriebe)
- **Kupplungspedal prüfen**: Prüfen Sie den Pedalweg und den Widerstand.
- **Kupplungsspiel prüfen**: Prüfen Sie das Kupplungsspiel.
- **Kupplungsscheibe prüfen**: Untersuchen Sie die Kupplungsscheibe auf Verschleiß.

**Benötigte Werkzeuge:**
- Fühlerlehre

**Benötigte Teile:**
- Kupplungsscheibe (falls verschlissen)
- Druckplatte (falls erforderlich)
- Ausrücklager (falls erforderlich)

### 5. Getriebesteuerung prüfen (bei Automatikgetriebe)
- **Fehlercodes auslesen**: Verwenden Sie einen OBD-Scanner, um Fehlercodes auszulesen.
- **Getriebesteuergerät prüfen**: Prüfen Sie das Getriebesteuergerät auf Funktion.
- **Sensoren prüfen**: Prüfen Sie die relevanten Sensoren (Drehzahlsensor, Temperatursensor).

**Benötigte Werkzeuge:**
- OBD-Scanner
- Multimeter

**Benötigte Teile:**
- Getriebesteuergerät (falls defekt)
- Sensoren (falls defekt)

### 6. Synchronisierungen prüfen (bei Schaltgetriebe)
- **Schaltverhalten testen**: Testen Sie das Schaltverhalten bei verschiedenen Geschwindigkeiten.
- **Synchronisierungen prüfen**: Prüfen Sie die Synchronisierungen auf Verschleiß.
- **Schaltstangen prüfen**: Prüfen Sie die Schaltstangen auf korrekten Sitz.

**Benötigte Werkzeuge:**
- Steckschlüsselsatz

**Benötigte Teile:**
- Synchronisierungen (falls verschlissen)
- Schaltstangen (falls beschädigt)

### 7. Getriebe ausbauen und reparieren (bei schweren Schäden)
- **Getriebe demontieren**: Entfernen Sie das Getriebe vom Motor.
- **Getriebe öffnen**: Öffnen Sie das Getriebe und untersuchen Sie die Komponenten.
- **Verschlissene Teile ersetzen**: Ersetzen Sie verschlissene oder beschädigte Teile.
- **Getriebe montieren**: Setzen Sie das Getriebe wieder ein.

**WICHTIG**: Diese Arbeiten sollten nur von erfahrenen Mechanikern durchgeführt werden.

**Benötigte Werkzeuge:**
- Getriebeheber
- Steckschlüsselsatz
- Drehmomentschlüssel
- Spezialwerkzeuge für Getriebe

**Benötigte Teile:**
- Getriebeöl
- Synchronisierungen
- Kupplungsscheibe
- Druckplatte
- Ausrücklager
- Verschiedene Getriebekomponenten (je nach Schaden)

### 8. Verifizierung
- **Schaltverhalten testen**: Testen Sie das Schaltverhalten bei verschiedenen Geschwindigkeiten.
- **Geräusche prüfen**: Hören Sie auf ungewöhnliche Geräusche.
- **Getriebeölstand prüfen**: Prüfen Sie den Ölstand regelmäßig.
- **Langzeitüberwachung**: Beobachten Sie das Fahrzeug über mehrere Wochen.

### 9. Präventionsmaßnahmen
- **Regelmäßiger Ölwechsel**: Befolgen Sie den empfohlenen Getriebeölwechselintervall.
- **Qualitätsöl verwenden**: Verwenden Sie nur hochwertiges Getriebeöl.
- **Sanftes Schalten**: Vermeiden Sie ruckartiges Schalten.
- **Frühzeitige Reparatur**: Beheben Sie Probleme sofort.',
    'de',
    'live',
    'Getriebe',
    'high',
    'hard',
    '3-6 Stunden',
    ARRAY[
        'Getriebe schaltet schwer oder gar nicht',
        'Ruckeln beim Schalten',
        'Geräusche beim Schalten',
        'Getriebe springt aus dem Gang',
        'Erhöhter Kraftstoffverbrauch'
    ],
    ARRAY[
        'Getriebeölstand prüfen: Prüfen Sie den Ölstand mit dem Messstab',
        'Ölqualität prüfen: Untersuchen Sie das Öl auf Verunreinigungen',
        'Schaltverhalten testen: Testen Sie das Schalten bei verschiedenen Geschwindigkeiten',
        'Fehlercodes auslesen: Verwenden Sie einen OBD-Scanner',
        'Kupplung prüfen: Prüfen Sie das Kupplungspedal und -spiel',
        'Getriebeöl wechseln: Wechseln Sie das Öl und prüfen Sie das Verhalten'
    ],
    ARRAY[
        'Steckschlüsselsatz',
        'Drehmomentschlüssel',
        'Fülltrichter',
        'Auffangbehälter',
        'OBD-Scanner',
        'Multimeter',
        'Fühlerlehre',
        'Getriebeheber (bei schweren Reparaturen)'
    ],
    ARRAY[
        'Getriebeöl',
        'Getriebeölfilter (falls vorhanden)',
        'Kupplungsscheibe (bei Schaltgetriebe, falls erforderlich)',
        'Druckplatte (bei Schaltgetriebe, falls erforderlich)',
        'Ausrücklager (bei Schaltgetriebe, falls erforderlich)',
        'Synchronisierungen (bei Schaltgetriebe, falls erforderlich)',
        'Getriebesteuergerät (bei Automatikgetriebe, falls defekt)'
    ],
    'Audi A4 B8 Getriebe schaltet nicht richtig: Ursachen, Diagnose und Reparatur. Detaillierte Anleitung zur Behebung von Schaltproblemen.'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'audi' AND cm.slug = 'a4' AND mg.slug = 'b8-2008-2015'
ON CONFLICT (model_generation_id, slug, language_path) DO NOTHING;

-- VW Golf 7 (2012-2019) - Abgaswarnleuchte leuchtet
INSERT INTO public.car_faults (
    model_generation_id,
    slug,
    title,
    description,
    solution,
    language_path,
    status,
    affected_component,
    severity,
    difficulty_level,
    estimated_repair_time,
    symptoms,
    diagnostic_steps,
    tools_required,
    parts_required,
    meta_description
)
SELECT 
    mg.id,
    'abgaswarnleuchte-leuchtet-golf-7',
    'VW Golf 7 Abgaswarnleuchte leuchtet - was bedeutet das?',
    'Der VW Golf 7 zeigt eine leuchtende Abgaswarnleuchte, was auf Probleme mit der Abgasreinigung, defekte Sensoren oder Probleme mit der Motorsteuerung hinweisen kann. Eine leuchtende Abgaswarnleuchte erfordert eine sofortige Diagnose.',
    '## Problemlösung: Abgaswarnleuchte leuchtet

### 1. Vorbereitung
- **Werkzeuge sammeln**: Stellen Sie sicher, dass alle benötigten Werkzeuge bereitstehen.
- **Fahrzeug sicher abstellen**: Parken Sie das Fahrzeug auf einer ebenen, festen Oberfläche.
- **Motor abkühlen lassen**: Warten Sie, bis der Motor abgekühlt ist.

### 2. Fehlercodes auslesen
- **OBD-Scanner anschließen**: Schließen Sie einen OBD-Scanner an die Diagnosebuchse an.
- **Fehlercodes auslesen**: Lesen Sie alle vorhandenen Fehlercodes aus.
- **Codes dokumentieren**: Notieren Sie alle Fehlercodes für die weitere Diagnose.
- **Codes löschen**: Löschen Sie die Codes nach der Dokumentation (optional, für Testzwecke).

**Benötigte Werkzeuge:**
- OBD-Scanner (kompatibel mit VW/Audi)

### 3. Lambda-Sonden prüfen
- **Lambda-Sonden lokalisieren**: Finden Sie die Lambda-Sonden (vor und nach dem Katalysator).
- **Sonden prüfen**: Prüfen Sie die Sonden auf Funktion mit einem Multimeter.
- **Sonden ersetzen**: Ersetzen Sie defekte Sonden.

**Benötigte Werkzeuge:**
- Multimeter
- Steckschlüsselsatz
- Abgasschlüssel

**Benötigte Teile:**
- Lambda-Sonde (Vorkatalysator, falls defekt)
- Lambda-Sonde (Nachkatalysator, falls defekt)

### 4. Katalysator prüfen
- **Katalysator inspizieren**: Untersuchen Sie den Katalysator auf Beschädigungen oder Verstopfung.
- **Temperatur prüfen**: Prüfen Sie die Temperatur vor und nach dem Katalysator.
- **Wirkungsgrad prüfen**: Prüfen Sie den Wirkungsgrad des Katalysators (über Fehlercode P0420).

**Benötigte Werkzeuge:**
- Infrarot-Thermometer
- OBD-Scanner

**Benötigte Teile:**
- Katalysator (falls defekt)

### 5. Abgasrückführung (EGR) prüfen
- **EGR-Ventil lokalisieren**: Finden Sie das EGR-Ventil.
- **Ventil prüfen**: Prüfen Sie das Ventil auf Funktion und Verschmutzung.
- **Ventil reinigen**: Reinigen Sie das Ventil bei Verschmutzung.
- **Ventil ersetzen**: Ersetzen Sie das Ventil bei Defekt.

**Benötigte Werkzeuge:**
- Steckschlüsselsatz
- Bremsenreiniger
- Drahtbürste

**Benötigte Teile:**
- EGR-Ventil (falls defekt)
- EGR-Ventil-Dichtung

### 6. Partikelfilter prüfen (bei Dieselmotoren)
- **Filter prüfen**: Prüfen Sie den Partikelfilter auf Verstopfung.
- **Regeneration prüfen**: Prüfen Sie, ob die Regeneration funktioniert.
- **Filter ersetzen**: Ersetzen Sie den Filter bei starker Verstopfung.

**Benötigte Werkzeuge:**
- OBD-Scanner

**Benötigte Teile:**
- Partikelfilter (falls defekt)

### 7. Motorsteuerung prüfen
- **Steuergerät prüfen**: Prüfen Sie das Motorsteuergerät auf Funktion.
- **Sensoren prüfen**: Prüfen Sie alle relevanten Sensoren (MAF, Temperatursensoren).
- **Software-Update**: Prüfen Sie, ob ein Software-Update verfügbar ist.

**Benötigte Werkzeuge:**
- OBD-Scanner
- Multimeter

**Benötigte Teile:**
- MAF-Sensor (falls defekt)
- Temperatursensoren (falls defekt)

### 8. Verifizierung
- **Fehlercodes prüfen**: Prüfen Sie erneut auf Fehlercodes nach der Reparatur.
- **Abgaswarnleuchte prüfen**: Prüfen Sie, ob die Warnleuchte erlischt.
- **Abgaswerte prüfen**: Lassen Sie die Abgaswerte bei einer Werkstatt prüfen.
- **Langzeitüberwachung**: Beobachten Sie das Fahrzeug über mehrere Wochen.

### 9. Präventionsmaßnahmen
- **Regelmäßige Wartung**: Befolgen Sie den empfohlenen Wartungsplan.
- **Qualitätskraftstoff**: Verwenden Sie hochwertigen Kraftstoff.
- **Motor warmfahren**: Lassen Sie den Motor warm werden, bevor Sie stark beschleunigen.
- **Frühzeitige Reparatur**: Beheben Sie Probleme sofort.',
    'de',
    'live',
    'Abgasanlage',
    'medium',
    'medium',
    '2-4 Stunden',
    ARRAY[
        'Abgaswarnleuchte leuchtet',
        'Erhöhter Kraftstoffverbrauch',
        'Verlust von Motorleistung',
        'Ungewöhnliche Abgasgerüche',
        'Fehlercodes im Motorsteuergerät'
    ],
    ARRAY[
        'Fehlercodes auslesen: Verwenden Sie einen OBD-Scanner',
        'Lambda-Sonden prüfen: Prüfen Sie die Sonden auf Funktion',
        'Katalysator prüfen: Untersuchen Sie den Katalysator',
        'EGR-Ventil prüfen: Prüfen Sie das Ventil auf Funktion',
        'Partikelfilter prüfen: Prüfen Sie den Filter (bei Dieselmotoren)',
        'Motorsteuerung prüfen: Lesen Sie die Sensordaten aus'
    ],
    ARRAY[
        'OBD-Scanner',
        'Multimeter',
        'Steckschlüsselsatz',
        'Abgasschlüssel',
        'Infrarot-Thermometer',
        'Bremsenreiniger',
        'Drahtbürste'
    ],
    ARRAY[
        'Lambda-Sonde (Vorkatalysator, falls defekt)',
        'Lambda-Sonde (Nachkatalysator, falls defekt)',
        'Katalysator (falls defekt)',
        'EGR-Ventil (falls defekt)',
        'EGR-Ventil-Dichtung',
        'Partikelfilter (bei Dieselmotoren, falls defekt)',
        'MAF-Sensor (falls defekt)',
        'Temperatursensoren (falls defekt)'
    ],
    'VW Golf 7 Abgaswarnleuchte leuchtet: Ursachen, Diagnose und Reparatur. Detaillierte Anleitung zur Behebung von Abgasproblemen.'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'volkswagen' AND cm.slug = 'golf' AND mg.slug = 'golf-7-2012-2019'
ON CONFLICT (model_generation_id, slug, language_path) DO NOTHING;

-- Opel Astra K (2015-2021) - Wasserpumpe defekt
INSERT INTO public.car_faults (
    model_generation_id,
    slug,
    title,
    description,
    solution,
    language_path,
    status,
    affected_component,
    severity,
    difficulty_level,
    estimated_repair_time,
    symptoms,
    diagnostic_steps,
    tools_required,
    parts_required,
    meta_description
)
SELECT 
    mg.id,
    'wasserpumpe-defekt-astra-k',
    'Opel Astra K Wasserpumpe defekt - wie wechsle ich sie?',
    'Der Opel Astra K zeigt ein Problem mit der Wasserpumpe, was auf Verschleiß, Undichtigkeiten oder einen defekten Pumpenlager hinweisen kann. Eine defekte Wasserpumpe kann zu Überhitzung des Motors führen und sollte sofort behoben werden.',
    '## Problemlösung: Wasserpumpe defekt

### 1. Vorbereitung
- **Werkzeuge sammeln**: Stellen Sie sicher, dass alle benötigten Werkzeuge bereitstehen.
- **Fahrzeug sicher abstellen**: Parken Sie das Fahrzeug auf einer ebenen, festen Oberfläche.
- **Motor abkühlen lassen**: Warten Sie, bis der Motor vollständig abgekühlt ist.
- **Kühlmittel ablassen**: Lassen Sie das Kühlmittel vollständig ab.

### 2. Wasserpumpe lokalisieren
- **Pumpe finden**: Die Wasserpumpe befindet sich meist am Motorblock, angetrieben vom Zahnriemen oder Keilriemen.
- **Pumpe inspizieren**: Untersuchen Sie die Pumpe auf Undichtigkeiten, Beschädigungen oder Verschleiß.
- **Pumpenlager prüfen**: Prüfen Sie das Pumpenlager auf Spiel oder Geräusche.

**Benötigte Werkzeuge:**
- Taschenlampe
- Auffangbehälter für Kühlmittel

### 3. Zubehör demontieren
- **Keilriemen entfernen**: Entfernen Sie den Keilriemen (falls vorhanden).
- **Zahnriemen entfernen**: Entfernen Sie den Zahnriemen (falls die Pumpe vom Zahnriemen angetrieben wird).
- **Kühlmittelschläuche entfernen**: Entfernen Sie die Kühlmittelschläuche von der Pumpe.
- **Elektrische Verbindungen trennen**: Trennen Sie alle elektrischen Verbindungen (bei elektrischen Pumpen).

**Benötigte Werkzeuge:**
- Steckschlüsselsatz
- Zahnriemenspanner (falls erforderlich)
- Keilriemenspanner (falls erforderlich)

**Benötigte Teile:**
- Zahnriemen (falls die Pumpe vom Zahnriemen angetrieben wird - immer zusammen wechseln)
- Zahnriemenspannrolle (falls erforderlich)
- Zahnriemenumlenkrolle (falls erforderlich)

### 4. Wasserpumpe demontieren
- **Schrauben lösen**: Lösen Sie alle Schrauben, die die Pumpe halten.
- **Pumpe entfernen**: Entfernen Sie die Pumpe vorsichtig.
- **Dichtflächen reinigen**: Reinigen Sie alle Dichtflächen gründlich von altem Dichtmittel.

**Benötigte Werkzeuge:**
- Steckschlüsselsatz
- Drehmomentschlüssel
- Dichtungsentferner
- Bremsenreiniger

### 5. Neue Wasserpumpe montieren
- **Dichtung prüfen**: Prüfen Sie, ob eine Dichtung vorhanden ist oder Dichtmittel verwendet wird.
- **Dichtmittel auftragen**: Tragen Sie Dichtmittel auf die Dichtflächen auf (falls erforderlich).
- **Pumpe montieren**: Setzen Sie die neue Pumpe ein.
- **Schrauben anziehen**: Ziehen Sie alle Schrauben mit dem korrekten Drehmoment an.

**Benötigte Werkzeuge:**
- Drehmomentschlüssel
- Dichtmittel

**Benötigte Teile:**
- Wasserpumpe
- Dichtung (falls vorhanden)
- Dichtmittel (falls erforderlich)

### 6. Zubehör montieren
- **Kühlmittelschläuche anschließen**: Schließen Sie die Kühlmittelschläuche an.
- **Zahnriemen montieren**: Montieren Sie den Zahnriemen (falls entfernt).
- **Keilriemen montieren**: Montieren Sie den Keilriemen (falls entfernt).
- **Elektrische Verbindungen anschließen**: Schließen Sie alle elektrischen Verbindungen an.

**Benötigte Werkzeuge:**
- Zahnriemenspanner
- Keilriemenspanner

### 7. Kühlmittel einfüllen und entlüften
- **Kühlmittel einfüllen**: Füllen Sie das empfohlene Kühlmittel ein.
- **System entlüften**: Entlüften Sie das Kühlsystem, indem Sie den Motor laufen lassen und die Entlüftungsschrauben öffnen.
- **Kühlmittelstand prüfen**: Prüfen Sie den Kühlmittelstand nach dem Entlüften.

**Benötigte Teile:**
- Kühlmittel (spezifisch für das Modell)

### 8. Verifizierung
- **Lecktest durchführen**: Starten Sie den Motor und prüfen Sie auf Undichtigkeiten.
- **Temperatur prüfen**: Prüfen Sie die Motortemperatur und stellen Sie sicher, dass sie im Normalbereich bleibt.
- **Kühlmittelstand überwachen**: Prüfen Sie den Kühlmittelstand regelmäßig über mehrere Tage.
- **Geräusche prüfen**: Hören Sie auf ungewöhnliche Geräusche von der Pumpe.

### 9. Präventionsmaßnahmen
- **Regelmäßiger Kühlmittelwechsel**: Befolgen Sie den empfohlenen Kühlmittelwechselintervall.
- **Qualitätskühlmittel verwenden**: Verwenden Sie nur hochwertiges Kühlmittel.
- **Frühzeitige Reparatur**: Beheben Sie Probleme sofort, bevor sie zu Überhitzung führen.
- **Regelmäßige Inspektion**: Lassen Sie die Wasserpumpe regelmäßig überprüfen.',
    'de',
    'live',
    'Kühlsystem',
    'high',
    'hard',
    '3-5 Stunden',
    ARRAY[
        'Kühlmittelverlust',
        'Überhitzung des Motors',
        'Geräusche von der Wasserpumpe',
        'Undichtigkeit an der Pumpe',
        'Kühlmittelwarnleuchte leuchtet'
    ],
    ARRAY[
        'Kühlmittelstand prüfen: Prüfen Sie den Stand im Ausgleichsbehälter',
        'Pumpe inspizieren: Untersuchen Sie die Pumpe auf Undichtigkeiten',
        'Pumpenlager prüfen: Prüfen Sie das Lager auf Spiel oder Geräusche',
        'Kühlmitteltemperatur prüfen: Prüfen Sie die Temperatur im System',
        'Geräusche prüfen: Hören Sie auf ungewöhnliche Geräusche',
        'Kühlmittelverlust prüfen: Suchen Sie nach Lecks im System'
    ],
    ARRAY[
        'Steckschlüsselsatz',
        'Drehmomentschlüssel',
        'Zahnriemenspanner',
        'Keilriemenspanner',
        'Dichtungsentferner',
        'Bremsenreiniger',
        'Auffangbehälter für Kühlmittel',
        'Taschenlampe'
    ],
    ARRAY[
        'Wasserpumpe',
        'Dichtung (falls vorhanden)',
        'Dichtmittel (falls erforderlich)',
        'Zahnriemen (falls die Pumpe vom Zahnriemen angetrieben wird)',
        'Zahnriemenspannrolle (falls erforderlich)',
        'Zahnriemenumlenkrolle (falls erforderlich)',
        'Kühlmittel'
    ],
    'Opel Astra K Wasserpumpe defekt: Ursachen, Diagnose und Reparatur. Detaillierte Anleitung zum Wechsel der Wasserpumpe mit Werkzeugen und Teilen.'
FROM public.model_generations mg
JOIN public.car_models cm ON mg.car_model_id = cm.id
JOIN public.car_brands cb ON cm.brand_id = cb.id
WHERE cb.slug = 'opel' AND cm.slug = 'astra' AND mg.slug = 'astra-k-2015'
ON CONFLICT (model_generation_id, slug, language_path) DO NOTHING;

