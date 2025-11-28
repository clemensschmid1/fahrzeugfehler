import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(req: Request) {
  try {
    const { question, answer, language = 'en' } = await req.json();
    
    if (!question || !answer) {
      return NextResponse.json({ error: 'Missing question or answer' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OpenAI API key' }, { status: 500 });
    }

    // Step 1: Detect if this is a car-related question
    const detectionPrompt = `Analyze the following question and answer to determine if it's about automotive/car repair/maintenance.

Question: ${question}
Answer: ${answer.substring(0, 500)}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "is_car_related": boolean,
  "is_fault": boolean (true if it's about a problem/fault, false if it's a maintenance/repair procedure),
  "detected_brand": string | null (e.g., "Toyota", "BMW", "Mercedes-Benz"),
  "detected_model": string | null (e.g., "Corolla", "3 Series", "C-Class"),
  "detected_generation": string | null (e.g., "E210", "E46", "W205"),
  "confidence": number (0-100, how confident you are this is car-related)
}

Only return is_car_related: true if you're confident (confidence > 70) this is about cars.`;

    const detectionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are an expert at analyzing technical questions. Return only valid JSON.' },
          { role: 'user', content: detectionPrompt }
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
    });

    if (!detectionResponse.ok) {
      return NextResponse.json({ error: 'Detection failed' }, { status: 500 });
    }

    const detectionData = await detectionResponse.json();
    const detectionContent = detectionData.choices?.[0]?.message?.content?.trim();
    
    let detection: {
      is_car_related: boolean;
      is_fault: boolean;
      detected_brand: string | null;
      detected_model: string | null;
      detected_generation: string | null;
      confidence: number;
    };

    try {
      detection = JSON.parse(detectionContent.replace(/```json|```/g, '').trim());
    } catch {
      return NextResponse.json({ error: 'Failed to parse detection result' }, { status: 500 });
    }

    // If not car-related or low confidence, return early
    if (!detection.is_car_related || detection.confidence < 70) {
      return NextResponse.json({ 
        inserted: false, 
        reason: 'Not car-related or low confidence',
        detection 
      });
    }

    // Step 2: Find matching brand/model/generation in database
    const supabase = getSupabaseClient();
    
    let brandId: string | null = null;
    let modelId: string | null = null;
    let generationId: string | null = null;

    if (detection.detected_brand) {
      const { data: brand } = await supabase
        .from('car_brands')
        .select('id')
        .ilike('name', `%${detection.detected_brand}%`)
        .maybeSingle();
      
      if (brand) {
        brandId = brand.id;

        if (detection.detected_model && brandId) {
          const { data: model } = await supabase
            .from('car_models')
            .select('id')
            .eq('brand_id', brandId)
            .ilike('name', `%${detection.detected_model}%`)
            .maybeSingle();
          
          if (model) {
            modelId = model.id;

            if (detection.detected_generation && modelId) {
              const { data: generation } = await supabase
                .from('model_generations')
                .select('id')
                .eq('car_model_id', modelId)
                .or(`name.ilike.%${detection.detected_generation}%,generation_code.ilike.%${detection.detected_generation}%`)
                .maybeSingle();
              
              if (generation) {
                generationId = generation.id;
              }
            }
          }
        }
      }
    }

    // If we couldn't find a matching generation, we can't insert
    if (!generationId) {
      return NextResponse.json({ 
        inserted: false, 
        reason: 'Could not find matching car brand/model/generation in database',
        detection,
        brandId,
        modelId
      });
    }

    // Step 3: Generate metadata
    const metadataResponse = await fetch(`${req.headers.get('origin') || 'http://localhost:3000'}/api/cars/generate-metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        answer,
        questionType: detection.is_fault ? 'fault' : 'manual',
        brand: detection.detected_brand,
        model: detection.detected_model,
        generation: detection.detected_generation,
      }),
    });

    if (!metadataResponse.ok) {
      return NextResponse.json({ error: 'Metadata generation failed' }, { status: 500 });
    }

    const { metadata } = await metadataResponse.json();

    // Step 4: Generate slug and insert
    function generateSlug(title: string): string {
      return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 100);
    }

    const baseSlug = generateSlug(question);
    let slug = baseSlug;
    let counter = 0;

    // Check for unique slug
    while (true) {
      const { data: existing } = await supabase
        .from(detection.is_fault ? 'car_faults' : 'car_manuals')
        .select('id')
        .eq('slug', slug)
        .eq('model_generation_id', generationId)
        .eq('language_path', language)
        .maybeSingle();

      if (!existing) break;
      counter++;
      slug = `${baseSlug}-${counter}`;
      if (counter > 100) {
        slug = `${baseSlug}-${Date.now()}`;
        break;
      }
    }

    const title = question.length > 100 ? question.substring(0, 100).trim() + '...' : question.trim();
    const description = metadata.meta_description || answer.split('\n\n')[0]?.substring(0, 200) || question;

    const insertData: any = {
      model_generation_id: generationId,
      slug: slug.trim(),
      title: title.trim(),
      description: description,
      language_path: language,
      status: 'live',
    };

    // Add metadata
    if (detection.is_fault) {
      insertData.solution = answer.trim();
      if (metadata.severity) insertData.severity = metadata.severity;
      if (metadata.difficulty_level) insertData.difficulty_level = metadata.difficulty_level;
      if (metadata.error_code) insertData.error_code = metadata.error_code;
      if (metadata.affected_component) insertData.affected_component = metadata.affected_component;
      if (metadata.symptoms) insertData.symptoms = metadata.symptoms;
      if (metadata.diagnostic_steps) insertData.diagnostic_steps = metadata.diagnostic_steps;
      if (metadata.tools_required) insertData.tools_required = metadata.tools_required;
      if (metadata.estimated_repair_time) insertData.estimated_repair_time = metadata.estimated_repair_time;
      if (metadata.meta_title) insertData.meta_title = metadata.meta_title;
      if (metadata.meta_description) insertData.meta_description = metadata.meta_description;
      if (metadata.seo_score !== undefined) insertData.seo_score = metadata.seo_score;
      if (metadata.content_score !== undefined) insertData.content_score = metadata.content_score;

      const { data, error } = await supabase
        .from('car_faults')
        .insert(insertData)
        .select('id, slug')
        .single();

      if (error) {
        return NextResponse.json({ error: `Insert failed: ${error.message}` }, { status: 500 });
      }

      return NextResponse.json({ 
        inserted: true, 
        type: 'fault',
        id: data.id,
        slug: data.slug,
        detection 
      });
    } else {
      insertData.content = answer.trim();
      if (metadata.difficulty_level) insertData.difficulty_level = metadata.difficulty_level;
      if (metadata.manual_type) insertData.manual_type = metadata.manual_type;
      if (metadata.estimated_time) insertData.estimated_time = metadata.estimated_time;
      if (metadata.tools_required) insertData.tools_required = metadata.tools_required;
      if (metadata.parts_required) insertData.parts_required = metadata.parts_required;
      if (metadata.meta_title) insertData.meta_title = metadata.meta_title;
      if (metadata.meta_description) insertData.meta_description = metadata.meta_description;

      const { data, error } = await supabase
        .from('car_manuals')
        .insert(insertData)
        .select('id, slug')
        .single();

      if (error) {
        return NextResponse.json({ error: `Insert failed: ${error.message}` }, { status: 500 });
      }

      return NextResponse.json({ 
        inserted: true, 
        type: 'manual',
        id: data.id,
        slug: data.slug,
        detection 
      });
    }
  } catch (error) {
    console.error('Auto-detect and insert error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

