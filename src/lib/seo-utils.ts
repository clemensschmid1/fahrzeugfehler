/**
 * SEO Utilities für Fahrzeugfehler.de
 * Hilft bei der Seitenlimitierung und Qualitätsprüfung für Google Trust
 */

export interface PageQualityCheck {
  shouldIndex: boolean;
  reason?: string;
  priority?: 'high' | 'medium' | 'low';
}

/**
 * Prüft ob eine Marke genug Inhalt hat, um indexiert zu werden
 */
export function shouldIndexBrand(faultCount: number): PageQualityCheck {
  const MIN_FAULTS = 10;
  
  if (faultCount >= MIN_FAULTS) {
    return {
      shouldIndex: true,
      priority: faultCount >= 50 ? 'high' : faultCount >= 25 ? 'medium' : 'low',
    };
  }
  
  return {
    shouldIndex: false,
    reason: `Marke hat nur ${faultCount} Fehler, benötigt mindestens ${MIN_FAULTS} für Indexierung`,
  };
}

/**
 * Prüft ob ein Modell genug Inhalt hat, um indexiert zu werden
 */
export function shouldIndexModel(faultCount: number): PageQualityCheck {
  const MIN_FAULTS = 5;
  
  if (faultCount >= MIN_FAULTS) {
    return {
      shouldIndex: true,
      priority: faultCount >= 20 ? 'high' : faultCount >= 10 ? 'medium' : 'low',
    };
  }
  
  return {
    shouldIndex: false,
    reason: `Modell hat nur ${faultCount} Fehler, benötigt mindestens ${MIN_FAULTS} für Indexierung`,
  };
}

/**
 * Prüft ob eine Generation genug Inhalt hat, um indexiert zu werden
 */
export function shouldIndexGeneration(faultCount: number, manualCount: number = 0): PageQualityCheck {
  const MIN_FAULTS = 3;
  const totalContent = faultCount + manualCount;
  
  if (totalContent >= MIN_FAULTS) {
    return {
      shouldIndex: true,
      priority: totalContent >= 15 ? 'high' : totalContent >= 8 ? 'medium' : 'low',
    };
  }
  
  return {
    shouldIndex: false,
    reason: `Generation hat nur ${totalContent} Inhalte, benötigt mindestens ${MIN_FAULTS} für Indexierung`,
  };
}

/**
 * Prüft ob eine Fehlercode-Übersicht genug Inhalt hat
 */
export function shouldIndexErrorCodesPage(errorCodeCount: number): PageQualityCheck {
  const MIN_ERROR_CODES = 3;
  
  if (errorCodeCount >= MIN_ERROR_CODES) {
    return {
      shouldIndex: true,
      priority: errorCodeCount >= 10 ? 'high' : errorCodeCount >= 5 ? 'medium' : 'low',
    };
  }
  
  return {
    shouldIndex: false,
    reason: `Fehlercode-Seite hat nur ${errorCodeCount} Codes, benötigt mindestens ${MIN_ERROR_CODES} für Indexierung`,
  };
}

/**
 * Prüft ob eine Fehler-Detail-Seite vollständig genug ist
 */
export function shouldIndexFaultPage(fault: {
  title?: string;
  description?: string;
  solution?: string;
  error_code?: string;
  affected_component?: string;
}): PageQualityCheck {
  // Mindestanforderungen für eine vollständige Fehlerlösung
  const hasTitle = !!fault.title && fault.title.length > 10;
  const hasDescription = !!fault.description && fault.description.length > 50;
  const hasSolution = !!fault.solution && fault.solution.length > 100;
  
  if (hasTitle && hasDescription && hasSolution) {
    return {
      shouldIndex: true,
      priority: fault.error_code && fault.affected_component ? 'high' : 'medium',
    };
  }
  
  return {
    shouldIndex: false,
    reason: 'Fehler-Detail-Seite ist unvollständig (fehlende Titel, Beschreibung oder Lösung)',
  };
}

/**
 * Generiert Robots Meta-Tag basierend auf Qualitätsprüfung
 */
export function getRobotsMetaTag(qualityCheck: PageQualityCheck): string {
  if (qualityCheck.shouldIndex) {
    return 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  }
  return 'noindex, follow';
}

/**
 * Generiert Priorität für Sitemap (0.0 - 1.0)
 */
export function getSitemapPriority(qualityCheck: PageQualityCheck, defaultPriority: number = 0.5): string {
  if (!qualityCheck.shouldIndex) {
    return '0.0';
  }
  
  switch (qualityCheck.priority) {
    case 'high':
      return '0.9';
    case 'medium':
      return '0.7';
    case 'low':
      return '0.5';
    default:
      return defaultPriority.toFixed(1);
  }
}

/**
 * Generiert Change Frequency für Sitemap
 */
export function getSitemapChangeFreq(qualityCheck: PageQualityCheck, lastModified?: Date): string {
  if (!qualityCheck.shouldIndex) {
    return 'never';
  }
  
  // Wenn Seite kürzlich modifiziert wurde, häufiger crawlen
  if (lastModified) {
    const daysSinceModification = (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceModification < 7) {
      return 'daily';
    } else if (daysSinceModification < 30) {
      return 'weekly';
    }
  }
  
  switch (qualityCheck.priority) {
    case 'high':
      return 'weekly';
    case 'medium':
      return 'monthly';
    case 'low':
      return 'monthly';
    default:
      return 'monthly';
  }
}

