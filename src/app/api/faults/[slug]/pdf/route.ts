import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 30;

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const searchParams = request.nextUrl.searchParams;
    const lang = searchParams.get('lang') || 'en';
    const brand = searchParams.get('brand');
    const model = searchParams.get('model');
    const generation = searchParams.get('generation');

    if (!brand || !model || !generation) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Fetch brand
    const brandResult = await supabase
      .from('car_brands')
      .select('*')
      .eq('slug', brand)
      .single();

    if (brandResult.error || !brandResult.data) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Fetch model
    const modelResult = await supabase
      .from('car_models')
      .select('*')
      .eq('brand_id', brandResult.data.id)
      .eq('slug', model)
      .single();

    if (modelResult.error || !modelResult.data) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    // Fetch generation
    const generationResult = await supabase
      .from('model_generations')
      .select('*')
      .eq('car_model_id', modelResult.data.id)
      .eq('slug', generation)
      .single();

    if (generationResult.error || !generationResult.data) {
      return NextResponse.json({ error: 'Generation not found' }, { status: 404 });
    }

    // Fetch fault
    const faultResult = await supabase
      .from('car_faults')
      .select('*')
      .eq('model_generation_id', generationResult.data.id)
      .eq('slug', slug)
      .eq('language_path', lang)
      .eq('status', 'live')
      .single();

    if (faultResult.error || !faultResult.data) {
      return NextResponse.json({ error: 'Fault not found' }, { status: 404 });
    }

    const fault = faultResult.data;

    // Generate PDF HTML
    const pdfHtml = generatePDFHTML(fault, brandResult.data, modelResult.data, generationResult.data, lang);

    // Return HTML that can be printed/saved as PDF
    return new NextResponse(pdfHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${fault.slug}.html"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function generatePDFHTML(fault: any, brand: any, model: any, generation: any, lang: string) {
  const t = (en: string, de: string) => lang === 'de' ? de : en;
  
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fault.title} - ${brand.name} ${model.name} ${generation.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background: #ffffff;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 3px solid #dc2626;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 10px;
    }
    .header .subtitle {
      font-size: 16px;
      color: #64748b;
      margin-bottom: 15px;
    }
    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 30px;
    }
    .badge {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-severity {
      background: #fef3c7;
      color: #92400e;
      border: 2px solid #fbbf24;
    }
    .badge-difficulty {
      background: #dbeafe;
      color: #1e40af;
      border: 2px solid #3b82f6;
    }
    .badge-time {
      background: #dcfce7;
      color: #166534;
      border: 2px solid #22c55e;
    }
    .problem-statement {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 2px solid #e2e8f0;
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 30px;
    }
    .problem-statement h2 {
      font-size: 22px;
      font-weight: 700;
      color: #dc2626;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .problem-statement p {
      font-size: 16px;
      line-height: 1.8;
      color: #334155;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e2e8f0;
    }
    .section h3 {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    .section ul, .section ol {
      margin-left: 20px;
      margin-bottom: 15px;
    }
    .section li {
      margin-bottom: 8px;
      line-height: 1.6;
    }
    .info-box {
      background: #f8fafc;
      border-left: 4px solid #3b82f6;
      padding: 15px;
      margin: 15px 0;
      border-radius: 8px;
    }
    .warning-box {
      background: #fef2f2;
      border-left: 4px solid #dc2626;
      padding: 15px;
      margin: 15px 0;
      border-radius: 8px;
    }
    .solution-box {
      background: #f0fdf4;
      border-left: 4px solid #22c55e;
      padding: 15px;
      margin: 15px 0;
      border-radius: 8px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }
    @media print {
      body { padding: 20px; }
      .badges { page-break-inside: avoid; }
      .problem-statement { page-break-inside: avoid; }
      .section { page-break-inside: avoid; }
    }
    @media print {
      @page {
        margin: 1cm;
        size: A4;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${fault.title}</h1>
    <div class="subtitle">${brand.name} ${model.name} ${generation.name}</div>
    <div class="badges">
      ${fault.severity ? `<span class="badge badge-severity">${t('Severity', 'Schweregrad')}: ${fault.severity}</span>` : ''}
      ${fault.difficulty_level ? `<span class="badge badge-difficulty">${t('Difficulty', 'Schwierigkeit')}: ${fault.difficulty_level}</span>` : ''}
      ${fault.estimated_repair_time ? `<span class="badge badge-time">${fault.estimated_repair_time}</span>` : ''}
    </div>
  </div>

  ${fault.description ? `
  <div class="problem-statement">
    <h2>⚠️ ${t('Problem Statement', 'Problembeschreibung')}</h2>
    <p>${fault.description}</p>
  </div>
  ` : ''}

  ${fault.error_code ? `
  <div class="info-box">
    <strong>${t('Error Code', 'Fehlercode')}:</strong> <code>${fault.error_code}</code>
  </div>
  ` : ''}

  ${fault.affected_component ? `
  <div class="info-box">
    <strong>${t('Affected Component', 'Betroffene Komponente')}:</strong> ${fault.affected_component}
  </div>
  ` : ''}

  ${fault.symptoms && fault.symptoms.length > 0 ? `
  <div class="section">
    <h2>${t('Symptoms', 'Symptome')}</h2>
    <ul>
      ${fault.symptoms.map((s: string) => `<li>${s}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  ${fault.diagnostic_steps && fault.diagnostic_steps.length > 0 ? `
  <div class="section">
    <h2>${t('Diagnostic Steps', 'Diagnoseschritte')}</h2>
    <ol>
      ${fault.diagnostic_steps.map((s: string) => `<li>${s}</li>`).join('')}
    </ol>
  </div>
  ` : ''}

  ${fault.safety_warnings && fault.safety_warnings.length > 0 ? `
  <div class="warning-box">
    <h3>${t('Safety Warnings', 'Sicherheitshinweise')}</h3>
    <ul>
      ${fault.safety_warnings.map((w: string) => `<li>${w}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  ${fault.tools_required && fault.tools_required.length > 0 ? `
  <div class="info-box">
    <h3>${t('Tools Required', 'Benötigte Werkzeuge')}</h3>
    <ul>
      ${fault.tools_required.map((t: string) => `<li>${t}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  ${fault.parts_required && fault.parts_required.length > 0 ? `
  <div class="info-box">
    <h3>${t('Parts Required', 'Benötigte Teile')}</h3>
    <ul>
      ${fault.parts_required.map((p: string) => `<li>${p}</li>`).join('')}
    </ul>
  </div>
  ` : ''}

  <div class="section solution-box">
    <h2>${t('Solution', 'Lösung')}</h2>
    <div>${fault.solution.replace(/\n/g, '<br>').replace(/## /g, '<h3>').replace(/### /g, '<h4>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>')}</div>
  </div>

  <div class="footer">
    <p>${t('Generated by', 'Generiert von')} FAULTBASE.com</p>
    <p>${new Date().toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>
</body>
</html>`;
}

