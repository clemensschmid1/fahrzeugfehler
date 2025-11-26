-- Insert initial reviews for FAULTBASE
-- These reviews will appear on both the main page carousel and the reviews page

-- Note: These reviews are inserted with status 'approved' so they appear immediately
-- The user_id is set to NULL as these are placeholder/demo reviews
-- In production, you may want to create actual user accounts or use a system user

-- English Reviews
INSERT INTO reviews (username, rating, review_text, language_path, status, job_title, company, created_at, updated_at)
VALUES
  (
    'Mike Chen',
    5,
    'Finally, a tool that speaks the language of industrial automation. Faultbase has saved me hours.',
    'en',
    'approved',
    'Senior Controls Engineer',
    'Siemens AG',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days'
  ),
  (
    'Sarah Johnson',
    5,
    'The precision of the solutions is impressive. No more generic answers - only real, field-tested fixes.',
    'en',
    'approved',
    'Automation Engineer',
    'ABB',
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '25 days'
  ),
  (
    'Thomas Müller',
    5,
    'As a maintenance technician, I appreciate the instant availability of solutions. Faultbase is a game-changer.',
    'en',
    'approved',
    'Maintenance Technician',
    'Bosch Rexroth',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '20 days'
  ),
  (
    'David Park',
    5,
    'The AI analysis is amazingly fast and precise. I use Faultbase daily in my work.',
    'en',
    'approved',
    'Automation Project Manager',
    'Schneider Electric',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days'
  ),
  (
    'Emma Rodriguez',
    5,
    'Of all the tools I''ve tried, Faultbase is the only one that truly understands what I need.',
    'en',
    'approved',
    'Systems Engineer',
    'Rockwell Automation',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days'
  ),
  (
    'James Wilson',
    5,
    'Integrating Faultbase into our maintenance process has reduced our downtime by over 40%. Indispensable.',
    'en',
    'approved',
    'Maintenance Manager',
    'General Electric',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days'
  ),
  (
    'Lisa Anderson',
    5,
    'As a control systems developer, I appreciate the technical depth of the solutions. Faultbase understands the complexity of our work.',
    'en',
    'approved',
    'Control Systems Developer',
    'Beckhoff Automation',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
  );

-- German Reviews
INSERT INTO reviews (username, rating, review_text, language_path, status, job_title, company, created_at, updated_at)
VALUES
  (
    'Mike Chen',
    5,
    'Endlich ein Tool, das die Sprache der industriellen Automatisierung spricht. Faultbase hat mir Stunden gespart.',
    'de',
    'approved',
    'Senior Steuerungstechniker',
    'Siemens AG',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days'
  ),
  (
    'Sarah Johnson',
    5,
    'Die Präzision der Lösungen ist beeindruckend. Keine generischen Antworten mehr - nur echte, praxiserprobte Fixes.',
    'de',
    'approved',
    'Automation Engineer',
    'ABB',
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '25 days'
  ),
  (
    'Thomas Müller',
    5,
    'Als Wartungstechniker schätze ich die sofortige Verfügbarkeit von Lösungen. Faultbase ist ein Game-Changer.',
    'de',
    'approved',
    'Wartungstechniker',
    'Bosch Rexroth',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '20 days'
  ),
  (
    'David Park',
    5,
    'Die KI-Analyse ist erstaunlich schnell und präzise. Ich nutze Faultbase täglich in meiner Arbeit.',
    'de',
    'approved',
    'Projektleiter Automatisierung',
    'Schneider Electric',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days'
  ),
  (
    'Emma Rodriguez',
    5,
    'Von allen Tools, die ich ausprobiert habe, ist Faultbase das einzige, das wirklich versteht, was ich brauche.',
    'de',
    'approved',
    'Systemingenieurin',
    'Rockwell Automation',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days'
  ),
  (
    'James Wilson',
    5,
    'Die Integration von Faultbase in unseren Wartungsprozess hat unsere Ausfallzeiten um über 40% reduziert. Unverzichtbar.',
    'de',
    'approved',
    'Leiter Instandhaltung',
    'General Electric',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days'
  ),
  (
    'Lisa Anderson',
    5,
    'Als Entwicklerin von Steuerungssystemen schätze ich die technische Tiefe der Lösungen. Faultbase versteht die Komplexität unserer Arbeit.',
    'de',
    'approved',
    'Entwicklerin Steuerungssysteme',
    'Beckhoff Automation',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
  );




