import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

// Generate diverse fault questions based on common search patterns
function generateFaultQuestions(brand: string, model: string, generation: string, generationCode: string | null, count: number, language: 'en' | 'de'): string[] {
  const baseQuestions: string[] = [];
  
  // Common fault categories with variations
  const categories = {
    engine: [
      language === 'en' ? 'Check engine light on' : 'Motorkontrollleuchte leuchtet',
      language === 'en' ? 'Engine misfire' : 'Motoraussetzer',
      language === 'en' ? 'Rough idle' : 'Unruhiger Leerlauf',
      language === 'en' ? 'Loss of power' : 'Leistungsverlust',
      language === 'en' ? 'Engine knocking' : 'Klopfgeräusche',
      language === 'en' ? 'Engine overheating' : 'Motorüberhitzung',
      language === 'en' ? 'Oil consumption high' : 'Hoher Ölverbrauch',
      language === 'en' ? 'Engine won\'t start' : 'Motor startet nicht',
      language === 'en' ? 'Engine stalling' : 'Motor geht aus',
    ],
    transmission: [
      language === 'en' ? 'Transmission slipping' : 'Getriebe rutscht durch',
      language === 'en' ? 'Hard shifting' : 'Hartes Schalten',
      language === 'en' ? 'Transmission fluid leak' : 'Getriebeölleck',
      language === 'en' ? 'Gear won\'t engage' : 'Gang springt nicht ein',
      language === 'en' ? 'Transmission overheating' : 'Getriebeüberhitzung',
    ],
    electrical: [
      language === 'en' ? 'Battery not charging' : 'Batterie lädt nicht',
      language === 'en' ? 'Alternator failure' : 'Lichtmaschine defekt',
      language === 'en' ? 'Electrical short circuit' : 'Kurzschluss',
      language === 'en' ? 'Fuse keeps blowing' : 'Sicherung brennt durch',
      language === 'en' ? 'Dashboard lights flickering' : 'Armaturenbrett leuchtet flackernd',
    ],
    brakes: [
      language === 'en' ? 'Brake pedal soft' : 'Brems pedal weich',
      language === 'en' ? 'Brake noise' : 'Bremsgeräusche',
      language === 'en' ? 'ABS light on' : 'ABS-Leuchte leuchtet',
      language === 'en' ? 'Brake fluid leak' : 'Bremsflüssigkeitsleck',
    ],
    cooling: [
      language === 'en' ? 'Coolant leak' : 'Kühlmittelleck',
      language === 'en' ? 'Radiator failure' : 'Kühler defekt',
      language === 'en' ? 'Thermostat stuck' : 'Thermostat klemmt',
      language === 'en' ? 'Cooling fan not working' : 'Kühlerlüfter funktioniert nicht',
    ],
    fuel: [
      language === 'en' ? 'Fuel pump failure' : 'Kraftstoffpumpe defekt',
      language === 'en' ? 'Poor fuel economy' : 'Hoher Kraftstoffverbrauch',
      language === 'en' ? 'Fuel injector clogged' : 'Einspritzdüse verstopft',
      language === 'en' ? 'Fuel filter dirty' : 'Kraftstofffilter verschmutzt',
    ],
    suspension: [
      language === 'en' ? 'Suspension noise' : 'Federungsgeräusche',
      language === 'en' ? 'Uneven tire wear' : 'Ungleichmäßiger Reifenverschleiß',
      language === 'en' ? 'Steering wheel vibration' : 'Lenkradvibration',
    ],
  };

  // Generate questions with variations
  const allQuestions = Object.values(categories).flat();
  
  // Add brand/model specific variations
  for (let i = 0; i < count; i++) {
    const baseQuestion = allQuestions[i % allQuestions.length];
    const variations = [
      `${baseQuestion} ${brand} ${model}`,
      `${baseQuestion} ${model} ${generationCode || generation}`,
      `${baseQuestion} ${brand} ${model} ${generationCode || generation}`,
      `How to fix ${baseQuestion.toLowerCase()} ${brand} ${model}`,
      `${baseQuestion} solution ${model}`,
      `Diagnose ${baseQuestion.toLowerCase()} ${brand} ${model}`,
    ];
    
    baseQuestions.push(variations[i % variations.length]);
  }

  return baseQuestions.slice(0, count);
}

// Generate diverse manual questions
function generateManualQuestions(brand: string, model: string, generation: string, generationCode: string | null, count: number, language: 'en' | 'de'): string[] {
  const baseQuestions: string[] = [];
  
  const procedures = [
    language === 'en' ? 'How to change engine oil' : 'Motoröl wechseln',
    language === 'en' ? 'How to replace brake pads' : 'Bremsbeläge wechseln',
    language === 'en' ? 'How to replace air filter' : 'Luftfilter wechseln',
    language === 'en' ? 'How to replace spark plugs' : 'Zündkerzen wechseln',
    language === 'en' ? 'How to replace battery' : 'Batterie wechseln',
    language === 'en' ? 'How to replace timing belt' : 'Zahnriemen wechseln',
    language === 'en' ? 'How to flush coolant system' : 'Kühlsystem spülen',
    language === 'en' ? 'How to replace fuel filter' : 'Kraftstofffilter wechseln',
    language === 'en' ? 'How to replace cabin air filter' : 'Innenraumfilter wechseln',
    language === 'en' ? 'How to replace transmission fluid' : 'Getriebeöl wechseln',
    language === 'en' ? 'How to replace serpentine belt' : 'Keilriemen wechseln',
    language === 'en' ? 'How to replace water pump' : 'Wasserpumpe wechseln',
    language === 'en' ? 'How to replace alternator' : 'Lichtmaschine wechseln',
    language === 'en' ? 'How to replace starter motor' : 'Anlasser wechseln',
    language === 'en' ? 'How to replace oxygen sensor' : 'Lambdasonde wechseln',
  ];

  for (let i = 0; i < count; i++) {
    const baseProcedure = procedures[i % procedures.length];
    const variations = [
      `${baseProcedure} ${brand} ${model}`,
      `${baseProcedure} ${model} ${generationCode || generation}`,
      `${baseProcedure} ${brand} ${model} ${generationCode || generation}`,
      `${baseProcedure} guide ${model}`,
      `${baseProcedure} tutorial ${brand} ${model}`,
    ];
    
    baseQuestions.push(variations[i % variations.length]);
  }

  return baseQuestions.slice(0, count);
}

export async function POST(req: Request) {
  try {
    const { brandId, modelId, generationId, contentType, count, language } = await req.json();

    if (!brandId || !modelId || !generationId || !contentType || !count) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OpenAI API key' }, { status: 500 });
    }

    const supabase = getSupabaseClient();

    // Fetch brand, model, generation data
    const [brandResult, modelResult, generationResult] = await Promise.all([
      supabase.from('car_brands').select('name, slug').eq('id', brandId).single(),
      supabase.from('car_models').select('name, slug').eq('id', modelId).single(),
      supabase.from('model_generations').select('name, slug, generation_code').eq('id', generationId).single(),
    ]);

    const brandSlug = brandResult.data?.slug;
    const modelSlug = modelResult.data?.slug;
    const generationSlug = generationResult.data?.slug;

    if (brandResult.error || !brandResult.data) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }
    if (modelResult.error || !modelResult.data) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }
    if (generationResult.error || !generationResult.data) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
    }

    const brand = brandResult.data.name;
    const model = modelResult.data.name;
    const generation = generationResult.data.name;
    const generationCode = generationResult.data.generation_code;

    // Generate questions
    const questions = contentType === 'fault'
      ? generateFaultQuestions(brand, model, generation, generationCode, count, language)
      : generateManualQuestions(brand, model, generation, generationCode, count, language);

    // Create a readable stream for progress updates
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        const sendProgress = (current: number, total: number, stage: string) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ progress: { current, total, stage } })}\n\n`));
        };

        try {
          sendProgress(0, count, 'Generating content...');

          // Step 1: Generate answers in batches
          const batchSize = 50;
          const answers: Array<{ question: string; answer: string }> = [];

          for (let i = 0; i < questions.length; i += batchSize) {
            const batch = questions.slice(i, i + batchSize);
            sendProgress(i, count, `Generating answers (batch ${Math.floor(i / batchSize) + 1})...`);

            const answerPromises = batch.map(async (question, idx) => {
              try {
                // Add small delay to avoid rate limits
                if (idx > 0) {
                  await new Promise(resolve => setTimeout(resolve, 100 * idx));
                }
                
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [
                      {
                        role: 'system',
                        content: contentType === 'fault'
                          ? `You are an expert automotive technician. Provide detailed, step-by-step solutions for car problems. Include symptoms, diagnostic steps, tools required, and repair instructions. Be specific and technical. Format your response with clear headings and structured steps.`
                          : `You are an expert automotive technician. Provide detailed, step-by-step maintenance and repair procedures. Include tools required, parts needed, time estimates, and safety warnings. Be specific and technical. Format your response with clear headings and structured steps.`,
                      },
                      {
                        role: 'user',
                        content: `${question} - ${brand} ${model} ${generation}${generationCode ? ` (${generationCode})` : ''}`,
                      },
                    ],
                    temperature: 0.7,
                    max_tokens: 2000,
                  }),
                });

                if (!response.ok) {
                  throw new Error(`OpenAI API error: ${response.statusText}`);
                }

                const data = await response.json();
                const answer = data.choices?.[0]?.message?.content?.trim();
                
                if (!answer) {
                  throw new Error('No answer generated');
                }

                return { question, answer };
              } catch (error) {
                console.error(`Error generating answer for question "${question}":`, error);
                return null;
              }
            });

            const batchResults = await Promise.all(answerPromises);
            answers.push(...batchResults.filter((r): r is { question: string; answer: string } => r !== null));
          }

          sendProgress(count, count, 'Generating metadata...');

          // Step 2: Generate metadata and insert
          let successCount = 0;
          let failedCount = 0;
          const errors: string[] = [];

          for (let i = 0; i < answers.length; i++) {
            const { question, answer } = answers[i];
            
            try {
              sendProgress(i, count, `Processing ${i + 1}/${count}...`);

              // Generate metadata
              const metadataResponse = await fetch(`${req.headers.get('origin') || 'http://localhost:3000'}/api/cars/generate-metadata`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  question,
                  answer,
                  questionType: contentType,
                  brand,
                  model,
                  generation,
                }),
              });

              if (!metadataResponse.ok) {
                throw new Error('Metadata generation failed');
              }

              const { metadata } = await metadataResponse.json();

              // Generate slug
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
                  .from(contentType === 'fault' ? 'car_faults' : 'car_manuals')
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

              // Insert into database
              const insertData: any = {
                model_generation_id: generationId,
                slug,
                title,
                description,
                language_path: language,
                status: 'live',
                ...(contentType === 'fault' ? {
                  solution: answer,
                  severity: metadata.severity || 'medium',
                  difficulty_level: metadata.difficulty_level || 'medium',
                  error_code: metadata.error_code || null,
                  affected_component: metadata.affected_component || null,
                  symptoms: metadata.symptoms || [],
                  diagnostic_steps: metadata.diagnostic_steps || [],
                  tools_required: metadata.tools_required || [],
                  estimated_repair_time: metadata.estimated_repair_time || null,
                  meta_title: metadata.meta_title || title,
                  meta_description: metadata.meta_description || description,
                  seo_score: metadata.seo_score || null,
                  content_score: metadata.content_score || null,
                } : {
                  content: answer,
                  manual_type: metadata.manual_type || 'repair',
                  difficulty_level: metadata.difficulty_level || 'medium',
                  estimated_time: metadata.estimated_time || null,
                  tools_required: metadata.tools_required || [],
                  parts_required: metadata.parts_required || [],
                  meta_title: metadata.meta_title || title,
                  meta_description: metadata.meta_description || description,
                }),
              };

              const { error: insertError } = await supabase
                .from(contentType === 'fault' ? 'car_faults' : 'car_manuals')
                .insert(insertData);

              if (insertError) {
                throw new Error(`Database insert failed: ${insertError.message}`);
              }

              // Submit to IndexNow for immediate indexing (non-blocking)
              if (brandSlug && modelSlug && generationSlug) {
                try {
                  const { submitToIndexNow } = await import('@/lib/submitToIndexNow');
                  const url = `https://faultbase.com/${language}/cars/${brandSlug}/${modelSlug}/${generationSlug}/${contentType === 'fault' ? 'faults' : 'manuals'}/${slug}`;
                  submitToIndexNow(url).catch(err => {
                    console.warn('[IndexNow] Failed to submit URL:', err);
                  });
                } catch (err) {
                  // Fail silently - don't let IndexNow errors affect the response
                  console.warn('[IndexNow] Error importing submitToIndexNow:', err);
                }
              }

              successCount++;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ result: { success: true } })}\n\n`));
            } catch (error) {
              failedCount++;
              const errorMsg = error instanceof Error ? error.message : 'Unknown error';
              errors.push(errorMsg);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ result: { success: false, error: errorMsg } })}\n\n`));
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ complete: true })}\n\n`));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Bulk generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

