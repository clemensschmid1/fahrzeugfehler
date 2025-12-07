import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';
export const maxDuration = 600; // 10 minutes for large question generation

const OPENAI_API_URL = 'https://api.openai.com/v1';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

function getOpenAIApiKey() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OpenAI API key');
  }
  return apiKey;
}

// Improved fault question generation with focus on most-searched, unique, relevant questions
async function generateFaultQuestionsImproved(
  brand: string, 
  model: string, 
  generation: string, 
  generationCode: string | null, 
  count: number, 
  language: 'en' | 'de',
  apiKey: string,
  existingQuestions: Set<string>
): Promise<string[]> {
  const yearRange = generationCode ? ` (${generationCode})` : '';
  
  // Create a list of existing questions (normalized) to avoid duplicates
  const existingQuestionsList = Array.from(existingQuestions).slice(-200); // Last 200 for context
  
  const contextPrompt = language === 'en'
    ? `Generate the ${count} MOST SEARCHED and COMMON problems, faults, and issues for ${brand} ${model} ${generation}${yearRange}. 

CRITICAL REQUIREMENTS:
1. Focus on REAL-WORLD problems that car owners ACTUALLY search for online (use search volume data if possible)
2. Prioritize the MOST FREQUENTLY ASKED questions first
3. Each question must be SPECIFIC to this exact model and generation
4. Include common error codes (P-codes, manufacturer codes) when relevant
5. Cover: engine issues, transmission problems, electrical faults, warning lights, error codes, common breakdowns, performance issues, diagnostic problems, and maintenance issues
6. Questions should be in natural search query format (how people actually search)
7. NO duplicates or similar questions to these existing ones: ${existingQuestionsList.length > 0 ? existingQuestionsList.slice(0, 50).join('; ') : 'none'}
8. Rank by search frequency - most searched first

Format: One problem/question per line, no numbering, clear and searchable. Natural language as people would search.`
    : `Generiere die ${count} AM HÄUFIGSTEN GESUCHTEN und HÄUFIGSTEN Probleme, Fehler und Probleme für ${brand} ${model} ${generation}${yearRange}.

KRITISCHE ANFORDERUNGEN:
1. Konzentriere dich auf REALE Probleme, die Autobesitzer TATSÄCHLICH online suchen (verwende Suchvolumen-Daten wenn möglich)
2. Priorisiere die AM HÄUFIGSTEN GESTELLTEN Fragen zuerst
3. Jede Frage muss SPEZIFISCH für dieses genaue Modell und diese Generation sein
4. Beziehe häufige Fehlercodes (P-Codes, Herstellercodes) ein, wenn relevant
5. Abdecken: Motorprobleme, Getriebeprobleme, elektrische Fehler, Warnleuchten, Fehlercodes, häufige Pannen, Leistungsprobleme, Diagnoseprobleme und Wartungsprobleme
6. Fragen sollten im natürlichen Suchanfrage-Format sein (wie Menschen tatsächlich suchen)
7. KEINE Duplikate oder ähnliche Fragen zu diesen bestehenden: ${existingQuestionsList.length > 0 ? existingQuestionsList.slice(0, 50).join('; ') : 'keine'}
8. Sortiere nach Suchhäufigkeit - am häufigsten gesucht zuerst

Format: Ein Problem/Frage pro Zeile, keine Nummerierung, klar und durchsuchbar. Natürliche Sprache wie Menschen suchen würden.`;

  const BATCH_SIZE = 100;
  const batches = Math.ceil(count / BATCH_SIZE);
  const allQuestions: string[] = [];

  for (let i = 0; i < batches; i++) {
    const batchCount = i === batches - 1 ? count - (i * BATCH_SIZE) : BATCH_SIZE;
    const batchPrompt = `${contextPrompt} 

Generate exactly ${batchCount} unique questions. Do not repeat questions from previous batches or from the existing questions list. Each question must be distinct and specific to ${brand} ${model} ${generation}${yearRange}.`;

    const systemPrompt = language === 'de'
      ? `Du bist ein Experte für Automobil-Suchanfragen und technische Wissensdatenbanken. Du kennst die am häufigsten gesuchten Probleme für jedes Automodell. Generiere ${batchCount} hochwertige, einzigartige, präzise, technische Fragen zum Thema: "${batchPrompt}". 

WICHTIG: 
- Priorisiere Fragen nach Suchhäufigkeit (meistgesucht zuerst)
- Verwende natürliche Suchanfrage-Formulierungen
- Jede Frage muss spezifisch für dieses Modell/Generation sein
- Keine Wiederholungen oder ähnliche Fragen
- Gib nur die Fragen aus, eine pro Zeile, mit normalen Leerzeichen und korrekter Formatierung. Keine Nummerierung, keine Antworten, keine Wiederholungen, keine Einleitung, keine doppelten Fragen. Schreibe normale, lesbare Sätze wie Menschen sie suchen würden.`
      : `You are an expert in automotive search queries and technical knowledge bases. You know the most frequently searched problems for each car model. Generate ${batchCount} high-quality, unique, precise, technical questions about: "${batchPrompt}".

IMPORTANT:
- Prioritize questions by search frequency (most searched first)
- Use natural search query formulations
- Each question must be specific to this model/generation
- No repetitions or similar questions
- Output only the questions, one per line, with proper spacing and normal sentence formatting. No numbering, no answers, no introduction, no duplicates. Write normal, readable sentences as people would search for them.`;

    let response: Response | null = null;
    let lastError: Error | null = null;
    const maxRetries = 5;
    const retryDelay = 2000;
    
    for (let retry = 0; retry < maxRetries; retry++) {
      try {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
            ],
            temperature: 0.8, // Slightly higher for more diversity
            max_tokens: 4000,
          }),
        });

        if (!response.ok && (response.status >= 500 || response.status === 429)) {
          let errorText = '';
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = `Status ${response.status}`;
          }
          lastError = new Error(`Failed to generate questions batch ${i + 1} (attempt ${retry + 1}/${maxRetries}): ${response.status} ${errorText.substring(0, 200)}`);
          
          if (retry < maxRetries - 1) {
            const delay = retryDelay * Math.pow(2, retry);
            console.warn(`[Question Generation] Retrying batch ${i + 1} after ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        } else if (!response.ok) {
          let errorText = '';
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = `Status ${response.status}`;
          }
          throw new Error(`Failed to generate questions batch ${i + 1}: ${response.status} ${errorText.substring(0, 200)}`);
        } else {
          break;
        }
      } catch (err: any) {
        lastError = err;
        const errorMsg = err.message || String(err);
        const shouldRetry = retry < maxRetries - 1 && (
          errorMsg.includes('fetch') || 
          errorMsg.includes('network') || 
          errorMsg.includes('ECONNREFUSED') || 
          errorMsg.includes('502') || 
          errorMsg.includes('Bad Gateway') ||
          errorMsg.includes('503') ||
          errorMsg.includes('504') ||
          errorMsg.includes('timeout')
        );
        
        if (shouldRetry) {
          const delay = retryDelay * Math.pow(2, retry);
          console.warn(`[Question Generation] Network/server error, retrying batch ${i + 1} after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        if (retry === maxRetries - 1) {
          throw lastError || err;
        }
      }
    }

    if (!response || !response.ok) {
      throw lastError || new Error(`Failed to generate questions batch ${i + 1} after ${maxRetries} attempts`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    
    if (!content) {
      throw new Error(`No questions generated in batch ${i + 1}`);
    }

    const questions = content
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0 && !line.match(/^\d+[\.\)]/))
      .filter((q: string) => {
        // Filter out duplicates against existing questions
        const normalized = q.toLowerCase().trim();
        return !existingQuestions.has(normalized);
      });
    
    // Add to existing questions set
    questions.forEach(q => existingQuestions.add(q.toLowerCase().trim()));
    allQuestions.push(...questions);

    if (i < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Final deduplication
  const uniqueQuestions = Array.from(new Set(allQuestions.map(q => q.trim())));
  return uniqueQuestions.slice(0, count);
}

// Generate diverse fault questions using AI (same as carbulk) - kept for backward compatibility
async function generateFaultQuestions(
  brand: string, 
  model: string, 
  generation: string, 
  generationCode: string | null, 
  count: number, 
  language: 'en' | 'de',
  apiKey: string
): Promise<string[]> {
  const yearRange = generationCode ? ` (${generationCode})` : '';
  const contextPrompt = language === 'en'
    ? `Generate the ${count} most searched/common problems, faults, and issues for ${brand} ${model} ${generation}${yearRange}. Focus on real-world problems that car owners actually search for online, such as: engine issues, transmission problems, electrical faults, warning lights, error codes, common breakdowns, performance issues, and maintenance problems. Make each question specific to this exact model and generation. Format: One problem/question per line, no numbering, clear and searchable. No duplicates, no repetitions.`
    : `Generiere die ${count} am häufigsten gesuchten/häufigsten Probleme, Fehler und Probleme für ${brand} ${model} ${generation}${yearRange}. Konzentriere dich auf reale Probleme, die Autobesitzer tatsächlich online suchen, wie z.B.: Motorprobleme, Getriebeprobleme, elektrische Fehler, Warnleuchten, Fehlercodes, häufige Pannen, Leistungsprobleme und Wartungsprobleme. Mache jede Frage spezifisch für dieses genaue Modell und diese Generation. Format: Ein Problem/Frage pro Zeile, keine Nummerierung, klar und durchsuchbar. Keine Duplikate, keine Wiederholungen.`;

  const BATCH_SIZE = 100;
  const batches = Math.ceil(count / BATCH_SIZE);
  const allQuestions: string[] = [];

  for (let i = 0; i < batches; i++) {
    const batchCount = i === batches - 1 ? count - (i * BATCH_SIZE) : BATCH_SIZE;
    const batchPrompt = `${contextPrompt} Generate exactly ${batchCount} unique questions. Do not repeat questions from previous batches.`;

    const systemPrompt = language === 'de'
      ? `Du bist ein Experte für technische Wissensdatenbanken. Generiere ${batchCount} hochwertige, einzigartige, präzise, technische Fragen zum Thema: "${batchPrompt}". Gib nur die Fragen aus, eine pro Zeile, mit normalen Leerzeichen und korrekter Formatierung. Keine Nummerierung, keine Antworten, keine Wiederholungen, keine Einleitung, keine doppelten Fragen. Schreibe normale, lesbare Sätze.`
      : `You are an expert in technical knowledge bases. Generate ${batchCount} high-quality, unique, precise, technical questions about: "${batchPrompt}". Output only the questions, one per line, with proper spacing and normal sentence formatting. No numbering, no answers, no introduction, no duplicates. Write normal, readable sentences with proper spaces between words.`;

    let response: Response | null = null;
    let lastError: Error | null = null;
    const maxRetries = 5;
    const retryDelay = 2000;
    
    for (let retry = 0; retry < maxRetries; retry++) {
      try {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
            ],
            temperature: 0.7,
            max_tokens: 4000,
          }),
        });

        if (!response.ok && (response.status >= 500 || response.status === 429)) {
          let errorText = '';
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = `Status ${response.status}`;
          }
          lastError = new Error(`Failed to generate questions batch ${i + 1} (attempt ${retry + 1}/${maxRetries}): ${response.status} ${errorText.substring(0, 200)}`);
          
          if (retry < maxRetries - 1) {
            const delay = retryDelay * Math.pow(2, retry);
            console.warn(`[Question Generation] Retrying batch ${i + 1} after ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        } else if (!response.ok) {
          let errorText = '';
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = `Status ${response.status}`;
          }
          throw new Error(`Failed to generate questions batch ${i + 1}: ${response.status} ${errorText.substring(0, 200)}`);
        } else {
          break;
        }
      } catch (err: any) {
        lastError = err;
        const errorMsg = err.message || String(err);
        const shouldRetry = retry < maxRetries - 1 && (
          errorMsg.includes('fetch') || 
          errorMsg.includes('network') || 
          errorMsg.includes('ECONNREFUSED') || 
          errorMsg.includes('502') || 
          errorMsg.includes('Bad Gateway') ||
          errorMsg.includes('503') ||
          errorMsg.includes('504') ||
          errorMsg.includes('timeout')
        );
        
        if (shouldRetry) {
          const delay = retryDelay * Math.pow(2, retry);
          console.warn(`[Question Generation] Network/server error, retrying batch ${i + 1} after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        if (retry === maxRetries - 1) {
          throw lastError || err;
        }
      }
    }

    if (!response || !response.ok) {
      throw lastError || new Error(`Failed to generate questions batch ${i + 1} after ${maxRetries} attempts`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    
    if (!content) {
      throw new Error(`No questions generated in batch ${i + 1}`);
    }

    const questions = content
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0 && !line.match(/^\d+[\.\)]/));
    
    allQuestions.push(...questions);

    if (i < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  const uniqueQuestions = Array.from(new Set(allQuestions.map(q => q.trim())));
  return uniqueQuestions.slice(0, count);
}

// Improved manual question generation with focus on most-searched, unique, relevant questions
async function generateManualQuestionsImproved(
  brand: string, 
  model: string, 
  generation: string, 
  generationCode: string | null, 
  count: number, 
  language: 'en' | 'de',
  apiKey: string,
  existingQuestions: Set<string>
): Promise<string[]> {
  const yearRange = generationCode ? ` (${generationCode})` : '';
  
  // Create a list of existing questions (normalized) to avoid duplicates
  const existingQuestionsList = Array.from(existingQuestions).slice(-200); // Last 200 for context
  
  const contextPrompt = language === 'en'
    ? `Generate the ${count} MOST SEARCHED and COMMON maintenance procedures, repair guides, and how-to instructions for ${brand} ${model} ${generation}${yearRange}.

CRITICAL REQUIREMENTS:
1. Focus on REAL-WORLD procedures that car owners ACTUALLY search for online (use search volume data if possible)
2. Prioritize the MOST FREQUENTLY ASKED questions first
3. Each instruction must be SPECIFIC to this exact model and generation
4. Cover: oil changes, brake pad replacement, filter changes, fluid top-ups, part replacements, diagnostic procedures, routine maintenance, DIY repairs
5. Instructions should be in natural search query format (how people actually search)
6. NO duplicates or similar questions to these existing ones: ${existingQuestionsList.length > 0 ? existingQuestionsList.slice(0, 50).join('; ') : 'none'}
7. Rank by search frequency - most searched first

Format: One instruction/guide per line, no numbering, clear and actionable. Natural language as people would search.`
    : `Generiere die ${count} AM HÄUFIGSTEN GESUCHTEN und HÄUFIGSTEN Wartungsverfahren, Reparaturanleitungen und Anleitungen für ${brand} ${model} ${generation}${yearRange}.

KRITISCHE ANFORDERUNGEN:
1. Konzentriere dich auf REALE Verfahren, die Autobesitzer TATSÄCHLICH online suchen (verwende Suchvolumen-Daten wenn möglich)
2. Priorisiere die AM HÄUFIGSTEN GESTELLTEN Fragen zuerst
3. Jede Anleitung muss SPEZIFISCH für dieses genaue Modell und diese Generation sein
4. Abdecken: Ölwechsel, Bremsbelagwechsel, Filterwechsel, Flüssigkeitsnachfüllung, Teilewechsel, Diagnoseverfahren, routinemäßige Wartung, DIY-Reparaturen
5. Anleitungen sollten im natürlichen Suchanfrage-Format sein (wie Menschen tatsächlich suchen)
6. KEINE Duplikate oder ähnliche Fragen zu diesen bestehenden: ${existingQuestionsList.length > 0 ? existingQuestionsList.slice(0, 50).join('; ') : 'keine'}
7. Sortiere nach Suchhäufigkeit - am häufigsten gesucht zuerst

Format: Eine Anleitung/Leitfaden pro Zeile, keine Nummerierung, klar und umsetzbar. Natürliche Sprache wie Menschen suchen würden.`;

  const BATCH_SIZE = 100;
  const batches = Math.ceil(count / BATCH_SIZE);
  const allQuestions: string[] = [];

  for (let i = 0; i < batches; i++) {
    const batchCount = i === batches - 1 ? count - (i * BATCH_SIZE) : BATCH_SIZE;
    const batchPrompt = `${contextPrompt} 

Generate exactly ${batchCount} unique questions. Do not repeat questions from previous batches or from the existing questions list. Each question must be distinct and specific to ${brand} ${model} ${generation}${yearRange}.`;

    const systemPrompt = language === 'de'
      ? `Du bist ein Experte für Automobil-Suchanfragen und technische Wissensdatenbanken. Du kennst die am häufigsten gesuchten Wartungsverfahren für jedes Automodell. Generiere ${batchCount} hochwertige, einzigartige, präzise, technische Fragen zum Thema: "${batchPrompt}". 

WICHTIG: 
- Priorisiere Fragen nach Suchhäufigkeit (meistgesucht zuerst)
- Verwende natürliche Suchanfrage-Formulierungen
- Jede Frage muss spezifisch für dieses Modell/Generation sein
- Keine Wiederholungen oder ähnliche Fragen
- Gib nur die Fragen aus, eine pro Zeile, mit normalen Leerzeichen und korrekter Formatierung. Keine Nummerierung, keine Antworten, keine Wiederholungen, keine Einleitung, keine doppelten Fragen. Schreibe normale, lesbare Sätze wie Menschen sie suchen würden.`
      : `You are an expert in automotive search queries and technical knowledge bases. You know the most frequently searched maintenance procedures for each car model. Generate ${batchCount} high-quality, unique, precise, technical questions about: "${batchPrompt}".

IMPORTANT:
- Prioritize questions by search frequency (most searched first)
- Use natural search query formulations
- Each question must be specific to this model/generation
- No repetitions or similar questions
- Output only the questions, one per line, with proper spacing and normal sentence formatting. No numbering, no answers, no introduction, no duplicates. Write normal, readable sentences as people would search for them.`;

    let response: Response | null = null;
    let lastError: Error | null = null;
    const maxRetries = 5;
    const retryDelay = 2000;
    
    for (let retry = 0; retry < maxRetries; retry++) {
      try {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
            ],
            temperature: 0.8, // Slightly higher for more diversity
            max_tokens: 4000,
          }),
        });

        if (!response.ok && (response.status >= 500 || response.status === 429)) {
          let errorText = '';
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = `Status ${response.status}`;
          }
          lastError = new Error(`Failed to generate questions batch ${i + 1} (attempt ${retry + 1}/${maxRetries}): ${response.status} ${errorText.substring(0, 200)}`);
          
          if (retry < maxRetries - 1) {
            const delay = retryDelay * Math.pow(2, retry);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        } else if (!response.ok) {
          let errorText = '';
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = `Status ${response.status}`;
          }
          throw new Error(`Failed to generate questions batch ${i + 1}: ${response.status} ${errorText.substring(0, 200)}`);
        } else {
          break;
        }
      } catch (err: any) {
        lastError = err;
        const errorMsg = err.message || String(err);
        const shouldRetry = retry < maxRetries - 1 && (
          errorMsg.includes('fetch') || 
          errorMsg.includes('network') || 
          errorMsg.includes('ECONNREFUSED') || 
          errorMsg.includes('502') || 
          errorMsg.includes('Bad Gateway') ||
          errorMsg.includes('503') ||
          errorMsg.includes('504') ||
          errorMsg.includes('timeout')
        );
        
        if (shouldRetry) {
          const delay = retryDelay * Math.pow(2, retry);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        if (retry === maxRetries - 1) {
          throw lastError || err;
        }
      }
    }

    if (!response || !response.ok) {
      throw lastError || new Error(`Failed to generate questions batch ${i + 1} after ${maxRetries} attempts`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    
    if (!content) {
      throw new Error(`No questions generated in batch ${i + 1}`);
    }

    const questions = content
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0 && !line.match(/^\d+[\.\)]/))
      .filter((q: string) => {
        // Filter out duplicates against existing questions
        const normalized = q.toLowerCase().trim();
        return !existingQuestions.has(normalized);
      });
    
    // Add to existing questions set
    questions.forEach(q => existingQuestions.add(q.toLowerCase().trim()));
    allQuestions.push(...questions);

    if (i < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Final deduplication
  const uniqueQuestions = Array.from(new Set(allQuestions.map(q => q.trim())));
  return uniqueQuestions.slice(0, count);
}

// Generate diverse manual questions using AI (same as carbulk) - kept for backward compatibility
async function generateManualQuestions(
  brand: string, 
  model: string, 
  generation: string, 
  generationCode: string | null, 
  count: number, 
  language: 'en' | 'de',
  apiKey: string
): Promise<string[]> {
  const yearRange = generationCode ? ` (${generationCode})` : '';
  const contextPrompt = language === 'en'
    ? `Generate the ${count} most searched/common maintenance procedures, repair guides, and how-to instructions for ${brand} ${model} ${generation}${yearRange}. Focus on procedures that car owners actually search for, such as: oil changes, brake pad replacement, filter changes, fluid top-ups, part replacements, diagnostic procedures, and routine maintenance. Make each instruction specific to this exact model and generation. Format: One instruction/guide per line, no numbering, clear and actionable. No duplicates, no repetitions.`
    : `Generiere die ${count} am häufigsten gesuchten/häufigsten Wartungsverfahren, Reparaturanleitungen und Anleitungen für ${brand} ${model} ${generation}${yearRange}. Konzentriere dich auf Verfahren, die Autobesitzer tatsächlich suchen, wie z.B.: Ölwechsel, Bremsbelagwechsel, Filterwechsel, Flüssigkeitsnachfüllung, Teilewechsel, Diagnoseverfahren und routinemäßige Wartung. Mache jede Anleitung spezifisch für dieses genaue Modell und diese Generation. Format: Eine Anleitung/Leitfaden pro Zeile, keine Nummerierung, klar und umsetzbar. Keine Duplikate, keine Wiederholungen.`;

  const BATCH_SIZE = 100;
  const batches = Math.ceil(count / BATCH_SIZE);
  const allQuestions: string[] = [];

  for (let i = 0; i < batches; i++) {
    const batchCount = i === batches - 1 ? count - (i * BATCH_SIZE) : BATCH_SIZE;
    const batchPrompt = `${contextPrompt} Generate exactly ${batchCount} unique questions. Do not repeat questions from previous batches.`;

    const systemPrompt = language === 'de'
      ? `Du bist ein Experte für technische Wissensdatenbanken. Generiere ${batchCount} hochwertige, einzigartige, präzise, technische Fragen zum Thema: "${batchPrompt}". Gib nur die Fragen aus, eine pro Zeile, mit normalen Leerzeichen und korrekter Formatierung. Keine Nummerierung, keine Antworten, keine Wiederholungen, keine Einleitung, keine doppelten Fragen. Schreibe normale, lesbare Sätze.`
      : `You are an expert in technical knowledge bases. Generate ${batchCount} high-quality, unique, precise, technical questions about: "${batchPrompt}". Output only the questions, one per line, with proper spacing and normal sentence formatting. No numbering, no answers, no introduction, no duplicates. Write normal, readable sentences with proper spaces between words.`;

    let response: Response | null = null;
    let lastError: Error | null = null;
    const maxRetries = 5;
    const retryDelay = 2000;
    
    for (let retry = 0; retry < maxRetries; retry++) {
      try {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
            ],
            temperature: 0.7,
            max_tokens: 4000,
          }),
        });

        if (!response.ok && (response.status >= 500 || response.status === 429)) {
          let errorText = '';
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = `Status ${response.status}`;
          }
          lastError = new Error(`Failed to generate questions batch ${i + 1} (attempt ${retry + 1}/${maxRetries}): ${response.status} ${errorText.substring(0, 200)}`);
          
          if (retry < maxRetries - 1) {
            const delay = retryDelay * Math.pow(2, retry);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        } else if (!response.ok) {
          let errorText = '';
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = `Status ${response.status}`;
          }
          throw new Error(`Failed to generate questions batch ${i + 1}: ${response.status} ${errorText.substring(0, 200)}`);
        } else {
          break;
        }
      } catch (err: any) {
        lastError = err;
        const errorMsg = err.message || String(err);
        const shouldRetry = retry < maxRetries - 1 && (
          errorMsg.includes('fetch') || 
          errorMsg.includes('network') || 
          errorMsg.includes('ECONNREFUSED') || 
          errorMsg.includes('502') || 
          errorMsg.includes('Bad Gateway') ||
          errorMsg.includes('503') ||
          errorMsg.includes('504') ||
          errorMsg.includes('timeout')
        );
        
        if (shouldRetry) {
          const delay = retryDelay * Math.pow(2, retry);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        if (retry === maxRetries - 1) {
          throw lastError || err;
        }
      }
    }

    if (!response || !response.ok) {
      throw lastError || new Error(`Failed to generate questions batch ${i + 1} after ${maxRetries} attempts`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    
    if (!content) {
      throw new Error(`No questions generated in batch ${i + 1}`);
    }

    const questions = content
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0 && !line.match(/^\d+[\.\)]/));
    
    allQuestions.push(...questions);

    if (i < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  const uniqueQuestions = Array.from(new Set(allQuestions.map(q => q.trim())));
  return uniqueQuestions.slice(0, count);
}

export async function POST(req: Request) {
  try {
    const { brandIds, generationIds, contentType, questionsPerGeneration, language } = await req.json();

    if (!brandIds || !Array.isArray(brandIds) || brandIds.length === 0) {
      return NextResponse.json({ error: 'Missing required parameters: brandIds array' }, { status: 400 });
    }

    if (!generationIds || !Array.isArray(generationIds) || generationIds.length === 0) {
      return NextResponse.json({ error: 'Missing required parameters: generationIds array' }, { status: 400 });
    }

    if (!contentType || !questionsPerGeneration) {
      return NextResponse.json({ error: 'Missing contentType or questionsPerGeneration' }, { status: 400 });
    }

    if (questionsPerGeneration < 1 || questionsPerGeneration > 50000) {
      return NextResponse.json({ error: 'questionsPerGeneration must be between 1 and 50,000' }, { status: 400 });
    }

    const totalCount = generationIds.length * questionsPerGeneration;
    if (totalCount > 50000) {
      return NextResponse.json({ error: 'Total questions (generations × questionsPerGeneration) cannot exceed 50,000' }, { status: 400 });
    }

    const apiKey = getOpenAIApiKey();
    const supabase = getSupabaseClient();

    // Fetch all brand data
    const { data: brandsData, error: brandsError } = await supabase
      .from('car_brands')
      .select('id, name, slug')
      .in('id', brandIds);

    if (brandsError || !brandsData || brandsData.length !== brandIds.length) {
      return NextResponse.json({ error: 'One or more brands not found' }, { status: 404 });
    }

    // Fetch all generation data with model and brand info
    const { data: generationsData, error: generationsError } = await supabase
      .from('model_generations')
      .select('id, name, slug, generation_code, car_model_id, car_models!inner(id, name, brand_id, car_brands!inner(id, name))')
      .in('id', generationIds);

    if (generationsError || !generationsData || generationsData.length === 0) {
      return NextResponse.json({ error: 'One or more generations not found' }, { status: 404 });
    }

    // Create a map for quick lookup
    const brandsMap = new Map(brandsData.map(b => [b.id, b]));
    
    // Track all generated questions across generations to prevent duplicates
    const allGeneratedQuestions = new Set<string>();
    
    // Generate questions for each generation
    const MODEL_ANSWERS = process.env.BATCH_MODEL_ANSWERS || 'gpt-4o-mini';
    const systemPrompt = contentType === 'fault'
      ? `You are an expert automotive technician. Provide detailed, step-by-step solutions for car problems. Include symptoms, diagnostic steps, tools required, and repair instructions. Be specific and technical. Format your response with clear headings and structured steps.`
      : `You are an expert automotive technician. Provide detailed, step-by-step maintenance and repair procedures. Include tools required, parts needed, time estimates, and safety warnings. Be specific and technical. Format your response with clear headings and structured steps.`;

    const jsonlLines: any[] = [];
    let questionIndex = 1;

    for (const generation of generationsData) {
      const model = (generation.car_models as any);
      const brand = brandsMap.get(model.brand_id);
      
      if (!brand || !model) {
        console.warn(`Skipping generation ${generation.id} - missing brand or model data`);
        continue;
      }

      // Generate questions for this generation with improved prompts
      const questions = contentType === 'fault'
        ? await generateFaultQuestionsImproved(
            brand.name, 
            model.name, 
            generation.name, 
            generation.generation_code, 
            questionsPerGeneration, 
            language, 
            apiKey,
            allGeneratedQuestions
          )
        : await generateManualQuestionsImproved(
            brand.name, 
            model.name, 
            generation.name, 
            generation.generation_code, 
            questionsPerGeneration, 
            language, 
            apiKey,
            allGeneratedQuestions
          );

      // Add questions to JSONL with generation_id encoded in custom_id
      for (const question of questions) {
        // Normalize question for duplicate checking
        const normalizedQuestion = question.toLowerCase().trim();
        if (allGeneratedQuestions.has(normalizedQuestion)) {
          continue; // Skip duplicate
        }
        allGeneratedQuestions.add(normalizedQuestion);

        // Encode generation_id in custom_id: answer-{generationId}-{index}
        jsonlLines.push({
          custom_id: `answer-${generation.id}-${questionIndex}`,
          method: 'POST',
          url: '/v1/chat/completions',
          body: {
            model: MODEL_ANSWERS,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `${question} - ${brand.name} ${model.name} ${generation.name}${generation.generation_code ? ` (${generation.generation_code})` : ''}` }
            ],
            temperature: 0.7,
            max_tokens: 2000,
          }
        });
        questionIndex++;
      }
    }

    const jsonlContent = jsonlLines.map(line => JSON.stringify(line)).join('\n');

    // Save to public/generated directory
    const timestamp = Date.now();
    const filename = `questions-${brandIds.length}brands-${generationIds.length}gens-${contentType}-${totalCount}-${timestamp}.jsonl`;
    const publicDir = join(process.cwd(), 'public', 'generated');
    
    try {
      await mkdir(publicDir, { recursive: true });
    } catch (err: any) {
      if (err.code !== 'EEXIST') {
        throw err;
      }
    }

    const filePath = join(publicDir, filename);
    await writeFile(filePath, jsonlContent, 'utf-8');

    const fileUrl = `/generated/${filename}`;

    return NextResponse.json({
      success: true,
      fileUrl,
      filename,
      count: jsonlLines.length,
      generationsCount: generationIds.length,
      questionsPerGeneration,
    });
  } catch (error) {
    console.error('Generate questions error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

