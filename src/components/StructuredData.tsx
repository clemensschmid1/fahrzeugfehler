'use client';

import { useEffect } from 'react';

type OrganizationSchema = {
  '@context': string;
  '@type': string;
  name: string;
  url: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
  contactPoint?: {
    '@type': string;
    contactType: string;
    availableLanguage: string[];
  };
};

type WebsiteSchema = {
  '@context': string;
  '@type': string;
  name: string;
  url: string;
  description: string;
  publisher: {
    '@type': string;
    name: string;
  };
  potentialAction?: {
    '@type': string;
    target: {
      '@type': string;
      urlTemplate: string;
    };
    'query-input': string;
  };
};

type BreadcrumbSchema = {
  '@context': string;
  '@type': string;
  itemListElement: Array<{
    '@type': string;
    position: number;
    name: string;
    item?: string;
  }>;
};

export function OrganizationStructuredData() {
  useEffect(() => {
    const schema: OrganizationSchema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Fahrzeugfehler.de',
      url: 'https://fahrzeugfehler.de',
      logo: 'https://fahrzeugfehler.de/icon.svg',
      description: 'Technische Diagnose-Datenbank für Fahrzeugfehler. Umfassende Lösungen, Ursachenanalysen und Reparaturhinweise für alle Automarken und Modelle.',
      sameAs: [],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'Kundensupport',
        availableLanguage: ['de'],
      },
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'organization-schema';
    script.text = JSON.stringify(schema);
    
    // Remove existing if present
    const existing = document.getElementById('organization-schema');
    if (existing) existing.remove();
    
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('organization-schema');
      if (scriptToRemove) scriptToRemove.remove();
    };
  }, []);

  return null;
}

export function WebsiteStructuredData() {
  useEffect(() => {
    const schema: WebsiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Fahrzeugfehler.de',
      url: 'https://fahrzeugfehler.de',
      description: 'Technische Diagnose-Datenbank für Fahrzeugfehler',
      publisher: {
        '@type': 'Organization',
        name: 'Fahrzeugfehler.de',
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://fahrzeugfehler.de/cars?search={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'website-schema';
    script.text = JSON.stringify(schema);
    
    const existing = document.getElementById('website-schema');
    if (existing) existing.remove();
    
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('website-schema');
      if (scriptToRemove) scriptToRemove.remove();
    };
  }, []);

  return null;
}

export function BreadcrumbStructuredData({ items }: { items: Array<{ name: string; url?: string }> }) {
  useEffect(() => {
    if (items.length === 0) return;

    const schema: BreadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        ...(item.url ? { item: item.url } : {}),
      })),
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'breadcrumb-schema';
    script.text = JSON.stringify(schema);
    
    const existing = document.getElementById('breadcrumb-schema');
    if (existing) existing.remove();
    
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('breadcrumb-schema');
      if (scriptToRemove) scriptToRemove.remove();
    };
  }, [items]);

  return null;
}

type ItemListSchema = {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  numberOfItems?: number;
  itemListElement: Array<{
    '@type': string;
    position: number;
    name: string;
    description?: string;
    url?: string;
  }>;
};

export function ItemListStructuredData({ 
  name, 
  description, 
  items 
}: { 
  name: string; 
  description: string; 
  items: Array<{ name: string; description?: string; url?: string }> 
}) {
  useEffect(() => {
    if (items.length === 0) return;

    const schema: ItemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name,
      description,
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        ...(item.description ? { description: item.description } : {}),
        ...(item.url ? { url: item.url } : {}),
      })),
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'itemlist-schema';
    script.text = JSON.stringify(schema);
    
    const existing = document.getElementById('itemlist-schema');
    if (existing) existing.remove();
    
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('itemlist-schema');
      if (scriptToRemove) scriptToRemove.remove();
    };
  }, [name, description, items]);

  return null;
}

type FAQPageSchema = {
  '@context': string;
  '@type': string;
  mainEntity: Array<{
    '@type': string;
    name: string;
    acceptedAnswer: {
      '@type': string;
      text: string;
    };
  }>;
};

export function FAQPageStructuredData({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  useEffect(() => {
    if (faqs.length === 0) return;

    const schema: FAQPageSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'faqpage-schema';
    script.text = JSON.stringify(schema);
    
    const existing = document.getElementById('faqpage-schema');
    if (existing) existing.remove();
    
    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('faqpage-schema');
      if (scriptToRemove) scriptToRemove.remove();
    };
  }, [faqs]);

  return null;
}
