---
title: Organisations- und Governance-Reglement
description: Organisation, Verantwortlichkeiten und Entscheidungsprozesse von TextRefs.
sidebar:
  order: 4
---

## 1. Zweck des Reglements

Dieses Reglement konkretisiert die Organisation, Verantwortlichkeiten und Entscheidungsprozesse von TextRefs. Es soll sicherstellen, dass der Verein gemeinnützig, transparent, offen, wissenschaftlich nachvollziehbar und rechtssicher geführt wird.

## 2. Governance-Grundsätze

Die Governance des Vereins beruht auf folgenden Grundsätzen:

1. **Gemeinnützigkeit:** Alle Tätigkeiten dienen Wissenschaft, Bildung, Kultur und offener digitaler Infrastruktur.
2. **Offenheit:** Öffentliche Registerdaten und Dokumentationen sind grundsätzlich frei zugänglich.
3. **Persistenz:** Publizierte Identifikatoren sollen dauerhaft erreichbar bleiben.
4. **Transparenz:** Änderungen, Entscheidungen, Releases und Statusänderungen werden dokumentiert.
5. **Community-Curation:** Beiträge aus der Fachgemeinschaft sind willkommen und werden nach transparenten Verfahren geprüft.
6. **Review nach Risiko:** Einfache technische Änderungen benötigen technische Prüfung; fachlich strittige oder strukturprägende Änderungen benötigen fachliche Begutachtung.
7. **Rechte-Sicherheit:** Der Verein vermeidet das Hosting geschützter Inhalte und dokumentiert Rechte- und Zugriffsinformationen für externe Ziele.
8. **Neutralität:** Kein externer Resolver, keine Plattform und kein Identifikatorsystem erhält privilegierten Status als primäre interne Identität.
9. **Nichtdiskriminierung der Nutzung:** Die Nutzung öffentlicher Daten hängt nicht von einer Mitgliedschaft ab.
10. **Vermeidung von Selbstbegünstigung:** Finanzielle oder reputationsbezogene Interessenkonflikte werden offengelegt und geregelt.

## 3. Rollen

### 3.1 Vorstand

Der Vorstand trägt die Gesamtverantwortung für Verein, Finanzen, Steuerbefreiung, rechtliche Compliance, institutionelle Strategie und Zweckverfolgung.

Er entscheidet insbesondere über:

- Budget und Finanzplanung;
- Fördergesuche und grössere Kooperationen;
- Spesen- und Vergütungsfragen;
- Einsetzung von Maintainerinnen, Maintainern und Fachbeiräten;
- Richtlinien zu Daten, Rechten, Takedown und Releases;
- Eskalationen aus dem Curation-Prozess;
- rechtlich oder reputationsmässig sensible Veröffentlichungen.

### 3.2 Technical Maintainers

Technical Maintainers betreuen die technische Infrastruktur, Schemata, Validierung, Build-Prozesse, Releases und technische Pull-Request-Prüfung.

Ihre Aufgaben umfassen insbesondere:

- Prüfung von Datenformaten und Schemakonformität;
- Pflege von JSON-LD-Kontexten, Zod-Schemas und JSON-Schema-kompatiblen Exporten;
- Prüfung der referenziellen Integrität;
- Prüfung auf unerlaubte Volltextinhalte;
- Pflege von CI/CD und Release-Automatisierung;
- Erstellung von Changelogs und Datenexporten;
- technische Dokumentation.

### 3.3 Domain Reviewers

Domain Reviewers sind fachlich qualifizierte Personen für bestimmte Textkorpora, Sprachen, Epochen, Disziplinen oder Zitiertraditionen.

Sie prüfen insbesondere:

- neue Werke;
- neue Zitier- und Referenzsysteme;
- neue Korpora;
- strittige Referenzpunkte;
- komplexe Mapping-Aussagen;
- Normalisierungsentscheidungen;
- Änderungen, welche persistente IDs oder etablierte Zitierlogiken betreffen.

### 3.4 Advisory Board

Der Vorstand kann einen wissenschaftlichen oder institutionellen Beirat einsetzen.

Der Beirat hat beratende Funktion. Er kann Empfehlungen zu Strategie, wissenschaftlicher Qualität, Partnerschaften, Prioritäten, Nachhaltigkeit und internationaler Anschlussfähigkeit abgeben.

### 3.5 Contributors

Contributors sind Personen oder Institutionen, die Issues, Pull Requests, Mapping-Vorschläge, Dokumentationsverbesserungen, Datenkorrekturen oder andere Beiträge einreichen.

Ein Beitrag begründet keinen Anspruch auf Annahme, Priorisierung, Veröffentlichung, Vergütung oder Mitgliedschaft.

## 4. Review-Tracks

### 4.1 Technischer Review

Ein technischer Review genügt in der Regel für:

- Tippfehler;
- Formatkorrekturen;
- defekte Links;
- kleinere Metadatenkorrekturen;
- Aktualisierung von `last_checked`-Feldern;
- Ergänzung unstrittiger Aliase;
- Dokumentationskorrekturen ohne fachliche Tragweite;
- Aufnahme neuer Datensätze als `draft` (Merge validierter Daten in das Register).

Voraussetzungen:

- automatisierte Validierung erfolgreich;
- keine unerlaubten Volltextinhalte;
- keine Rechte- oder Takedown-Bedenken;
- keine Änderung an persistenten IDs mit fachlicher Wirkung;
- mindestens eine technische Prüfung durch eine berechtigte Person.

### 4.2 Fachlicher Review

Ein fachlicher Review ist erforderlich für:

- neue Korpora;
- neue Werke;
- neue Zitier- oder Referenzsysteme;
- neue Normalisierungsregeln;
- Änderungen an deterministischen ID-Inputs;
- strittige Mapping-Aussagen;
- widersprüchliche externe Identifikatoren;
- Änderungen mit erheblicher fachlicher oder reputationsbezogener Wirkung;
- Promotion von Datensätzen von `draft` zu `active` (der Zeitpunkt, an dem die Persistenzzusage beginnt);
- Statusänderungen zu `deprecated`, `withdrawn` oder `blocked`, soweit fachlich begründet.

Voraussetzungen:

- technische Validierung erfolgreich;
- dokumentierte Begründung;
- Quellen- oder Evidenzangaben;
- mindestens eine fachliche Prüfung;
- bei strittigen Entscheidungen dokumentierte Entscheidung mit Begründung.

### 4.3 Vorstandsvorbehalt

Der Vorstand entscheidet oder bestätigt:

- rechtlich sensible Veröffentlichungen;
- Takedown-Entscheide;
- Blockierung von Mapping-Aussagen aus rechtlichen oder policybezogenen Gründen;
- Kooperationen mit finanzieller, rechtlicher oder strategischer Bindungswirkung;
- Änderungen an Lizenzpolitik, Persistenzpolitik oder Steuerbefreiungsrelevanz;
- bezahlte Aufträge an Vorstandsmitglieder oder nahestehende Personen.

## 5. Statusmodell

### 5.1 Allgemeine Datensatzstatus

- **draft:** Datensatz in Arbeit; ohne Tombstone korrigierbar oder zurückziehbar; von der Persistenzzusage ausgenommen;
- **active:** gültig und empfohlen; ab diesem Zeitpunkt dauerhaft identifiziert;
- **deprecated:** nicht mehr empfohlen, aber aus historischen Gründen erhalten;
- **withdrawn:** zurückgezogen, Landing Page bleibt erhalten;
- **blocked:** aus rechtlichen, policybezogenen oder schwerwiegenden Qualitätsgründen gesperrt.

### 5.2 Mapping-Status

- **draft:** Zuordnung in Arbeit; ohne Tombstone korrigierbar oder zurückziehbar;
- **active:** geprüfte und empfohlene Zuordnung; ab diesem Zeitpunkt dauerhaft identifiziert;
- **deprecated:** nicht mehr empfohlene Zuordnung;
- **withdrawn:** zurückgezogene Zuordnung;
- **blocked:** gesperrte Zuordnung.

Strittige Mappings behalten den passenden Schema-Status und führen Begründung, Review-Historie oder Ersatzbeziehung in begleitenden Metadaten oder Entscheidungsdokumenten.

### 5.3 Tombstone-Prinzip

Aktive IDs (Status `active` oder ein Tombstone-Status) werden grundsätzlich nicht hart gelöscht. Datensätze im Status `draft` können ohne Landing Page zurückgezogen werden.

Bei Rückzug, Sperrung oder Deprecation bleibt eine Landing Page erhalten mit:

- Status;
- Datum der Statusänderung;
- Begründung;
- verantwortlicher Entscheidungsebene;
- Ersatz-ID, falls vorhanden;
- Hinweis auf Takedown oder Rechtegrund, falls relevant.

## 6. ID- und Persistenzpolitik

1. Primäre TextRefs-IDs sind unabhängige HTTP-URIs.
2. Externe Identifikatoren wie CTS URNs, Wikidata-IDs, DOIs, ARKs, Perseus-URLs oder Scaife-URLs sind keine primären TextRefs-IDs.
3. Alle Registereinträge tragen deterministische IDs, die aus ihren Identitätsfeldern berechenbar sind.
4. Provisorische Einträge werden über den Status `draft` ausgedrückt, der von der Persistenzzusage ausgenommen ist; ihre IDs können bis zur Promotion zu `active` verschwinden oder sich ändern.
5. Einmal publizierte IDs werden nicht geändert, nur weil Labels, Titel, Aliase oder externe Mappings verbessert werden.
6. Lesbare Citation-URLs sind Aliase und können umgeleitet, geändert, deprecated oder einem anderen Datensatz neu zugeordnet werden; nur die primären `/id/`-Identifikatoren sind dauerhaft.

## 7. Contribution-Prozess

### 7.1 Einreichung

Beiträge sollen grundsätzlich über öffentliche GitHub Issues oder Pull Requests eingereicht werden.

Ein Beitrag soll enthalten:

- betroffene Entität oder vorgeschlagene neue Entität;
- Art der Änderung;
- Begründung;
- Quellen- oder Evidenzangaben;
- Einschätzung von Unsicherheit;
- Rechte- und Lizenzhinweise, soweit relevant.

### 7.2 Prüfung

Der Beitrag wird triagiert und einem Review-Track zugeordnet:

- technische Änderung;
- fachliche Änderung;
- rechtlich/policybezogen sensible Änderung;
- unvollständiger oder nicht prüfbarer Beitrag.

### 7.3 Annahme

Ein Beitrag kann angenommen werden, wenn:

- die automatisierte Validierung bestanden ist;
- erforderliche Reviews erfolgt sind;
- Rechte- und Lizenzfragen hinreichend geklärt sind;
- der Beitrag mit Zweck, Datenmodell und Governance vereinbar ist;
- Status, Provenienz und Unsicherheiten angemessen dokumentiert sind.

### 7.4 Ablehnung

Ein Beitrag kann abgelehnt werden, insbesondere wenn:

- er unerlaubte Volltextinhalte enthält;
- Rechte- oder Lizenzlage unklar oder problematisch ist;
- die Evidenz unzureichend ist;
- er gegen das Datenmodell oder die Persistenzpolitik verstösst;
- er kommerzielle, proprietäre oder exklusive Interessen in unvereinbarer Weise begünstigt;
- er nicht mit dem gemeinnützigen Zweck vereinbar ist.

Ablehnungen sollen kurz begründet werden.

## 8. Release- und Archivierungspolitik

1. Der Verein veröffentlicht regelmässige versionierte Datenstände.
2. Jeder Release enthält einen Changelog.
3. Releases sollen reproduzierbar sein.
4. Datenexports können insbesondere als JSON-LD und JSONL bereitgestellt werden.
5. Wichtige Releases sollen durch Git-Tags und, soweit möglich, über [Zenodo](https://zenodo.org/communities/textrefs/) oder eine vergleichbare Archivierungsinfrastruktur dauerhaft archiviert werden.
6. Schemaänderungen werden versioniert.
7. Breaking Changes an Schemata erfordern eine neue Major-Version.

## 9. Rechte- und Takedown-Prozess

### 9.1 Grundsatz

TextRefs hostet grundsätzlich keine urheberrechtlich geschützten Editionstexte, kritischen Apparate, Kommentare oder Übersetzungen aus geschützten Ausgaben.

Der Verein veröffentlicht primär Referenzdaten, Metadaten, externe Identifikatoren, Resolver-Ziele, Mapping-Aussagen, Provenienz- und Statusinformationen.

### 9.2 Rechte-Metadaten

Resolver-Ziele und Mapping-Aussagen sollen, soweit möglich, Informationen enthalten zu:

- Anbieter oder Quelle;
- Zugriffsstatus;
- Rechte- oder Lizenzstatus;
- Lizenz-URL, falls vorhanden;
- Datum der letzten Prüfung;
- Provenienz;
- Vertrauensniveau.

### 9.3 Verbotene Inhalte

Nicht aufgenommen werden sollen insbesondere:

- urheberrechtlich geschützte Volltexte ohne Lizenz;
- kritische Apparate aus geschützten Ausgaben;
- geschützte Kommentare oder Übersetzungen ohne Lizenz;
- proprietäre Segmentierungs- oder Mapping-Daten aus rechtlich unklaren Quellen;
- Daten, die technische Schutzmassnahmen umgehen oder Paywalls aushebeln;
- Massenimporte aus Quellen ohne klare Rechte- oder Lizenzgrundlage.

### 9.4 Takedown-Begehren

Ein Takedown-Begehren soll enthalten:

1. verifizierbare Kontaktinformationen;
2. genaue TextRefs-URL oder Datensatz-ID;
3. genaue Beschreibung des beanstandeten Materials;
4. Begründung der behaupteten Rechtsverletzung oder Policy-Verletzung;
5. Erklärung, dass die Angaben nach bestem Wissen zutreffen.

### 9.5 Behandlung

Der Vorstand oder eine von ihm bezeichnete Stelle prüft das Begehren.

Mögliche Massnahmen:

- keine Massnahme bei offensichtlich unbegründetem Begehren;
- Korrektur von Metadaten;
- Änderung des Zugriffs- oder Rechte-Status;
- Deprecation einer Mapping-Aussage;
- Blockierung eines Resolver-Ziels;
- Redaction bestimmter Felder;
- temporäre De-Publikation bis zur Klärung;
- Veröffentlichung eines Tombstones oder Takedown-Hinweises.

CanonicalReference-, Work- und CitationSystem-IDs sollen nicht gelöscht werden, nur weil ein externer Link oder ein Mapping problematisch ist.

## 10. Finanz- und Vergütungsgrundsätze

1. Vereinsmittel dürfen nur für den gemeinnützigen Zweck verwendet werden.
2. Der Vorstand arbeitet ehrenamtlich.
3. Effektive, notwendige und belegte Spesen werden ersetzt.
4. Eine Entschädigung für besondere oder operative Leistungen ist ausgeschlossen.
5. Betroffene Personen treten bei Beschlüssen über eigene Spesen in den Ausstand.
6. Aufträge an Vorstandsmitglieder oder an ihnen nahestehende Personen sind ausgeschlossen.
7. Spenden und Fördermittel werden zweckgemäss verwendet.
8. Zweckgebundene Mittel werden separat nachvollziehbar dokumentiert.

## 11. Internationale Tätigkeit

TextRefs richtet sich an einen internationalen Nutzerkreis in Wissenschaft, Bildung, Kultur und digitaler Infrastruktur.

Internationale Wirkung ist mit der Gemeinnützigkeit vereinbar, weil die Tätigkeit offen, nicht-kommerziell, wissenschafts- und bildungsbezogen ist und der Allgemeinheit dient.

Der Sitz in Zürich dient als rechtlicher und organisatorischer Anker. Der Verein wahrt Transparenz, Rechnungslegung, Mittelbindung und Governance nach Schweizer Standards.
