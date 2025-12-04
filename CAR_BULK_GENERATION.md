# Car Bulk Content Generation System

## Overview

The bulk generation system allows you to generate 100-1000 car faults or manuals at a time using OpenAI's API. This system is designed for cost efficiency and scalability.

## Architecture

### Two-Step Generation Process

1. **Content Generation**: Generate the actual fault solution or manual content
2. **Metadata Enhancement**: Extract and enhance metadata to improve SEO and categorization

This two-step approach saves costs by:
- Using cheaper models for initial content generation
- Only using expensive models for metadata extraction when needed
- Avoiding redundant "thinking" tokens

### Cost Optimization

- Uses OpenAI batch API (50% discount) for large-scale generation
- Processes in batches of 50 to avoid rate limits
- Streams progress updates to the frontend

## Metadata Structure

### Fault Metadata

```typescript
{
  // Required fields
  severity: "low" | "medium" | "high" | "critical",
  difficulty_level: "easy" | "medium" | "hard" | "expert",
  meta_title: string, // 50-60 characters, SEO optimized
  meta_description: string, // 150-160 characters
  seo_score: number, // 1-99
  content_score: number, // 1-99
  
  // Extracted from content
  symptoms: string[], // Minimum 2-3 symptoms
  diagnostic_steps: string[], // Minimum 3-5 steps
  tools_required: string[], // Minimum 2-3 tools
  affected_component: string, // Main component
  estimated_repair_time: string, // e.g., "1-2 hours"
  
  // Optional but preferred
  error_code: string | null, // OBD-II or manufacturer codes
}
```

### Manual Metadata

```typescript
{
  // Required fields
  difficulty_level: "easy" | "medium" | "hard" | "expert",
  manual_type: "maintenance" | "repair" | "diagnostic" | "parts" | "specifications" | "other",
  meta_title: string,
  meta_description: string,
  
  // Optional but preferred
  estimated_time: string | null,
  tools_required: string[] | null,
  parts_required: string[] | null,
}
```

## Categorization System

### By Component System

Faults are categorized by the main affected component:

- **Engine**: Engine-related issues (misfires, overheating, oil consumption)
- **Transmission**: Transmission problems (slipping, hard shifting)
- **Electrical**: Electrical system issues (battery, alternator, fuses)
- **Brakes**: Brake system problems
- **Cooling**: Cooling system issues (radiator, thermostat, fan)
- **Fuel**: Fuel system problems (pump, injectors, filter)
- **Suspension**: Suspension and steering issues
- **HVAC**: Heating, ventilation, air conditioning
- **Exhaust**: Exhaust system problems
- **Body/Interior**: Body and interior issues

### By Severity

- **Critical**: Safety-critical issues (brakes, steering, airbags)
- **High**: Major problems affecting drivability
- **Medium**: Moderate issues that should be addressed
- **Low**: Minor issues or maintenance items

### By Difficulty

- **Expert**: Requires professional tools and expertise
- **Hard**: Advanced DIY with specialized tools
- **Medium**: Moderate DIY difficulty
- **Easy**: Simple DIY tasks

### By Frequency

- **Common**: Frequently occurring issues
- **Occasional**: Sometimes happens
- **Rare**: Uncommon problems

## Question Generation Strategy

### Variability

The system generates diverse questions while maintaining relevance:

1. **Base Categories**: Common fault categories (engine, transmission, electrical, etc.)
2. **Variations**: Multiple phrasings of the same issue
3. **Brand/Model Specific**: Includes brand and model in questions
4. **Generation Codes**: Includes generation codes when available

### Examples

**Fault Questions:**
- "Check engine light on BMW 3 Series E46"
- "Engine misfire Toyota Corolla E210"
- "How to fix rough idle Mercedes-Benz C-Class W205"
- "Diagnose transmission slipping Ford F-150"

**Manual Questions:**
- "How to change engine oil BMW 3 Series"
- "How to replace brake pads Toyota Corolla E210"
- "How to replace air filter Mercedes-Benz C-Class"

## Usage

### Access

1. Navigate to `/en/carbulk` or `/de/carbulk`
2. Enter the internal area password
3. Select brand, model, and generation
4. Choose content type (faults or manuals)
5. Set count (100-1000)
6. Click "Generate"

### Progress Tracking

The system provides real-time progress updates:
- Current stage (generating answers, metadata, processing)
- Progress bar showing completion percentage
- Success/failure counts
- Error messages for failed items

## API Endpoints

### POST `/api/cars/bulk-generate`

Generates bulk content using streaming responses.

**Request:**
```json
{
  "brandId": "uuid",
  "modelId": "uuid",
  "generationId": "uuid",
  "contentType": "fault" | "manual",
  "count": 100-1000,
  "language": "en" | "de"
}
```

**Response:** Server-Sent Events (SSE) stream with progress updates

### POST `/api/cars/generate-metadata`

Enhances content with metadata extraction.

**Request:**
```json
{
  "question": "string",
  "answer": "string",
  "questionType": "fault" | "manual",
  "brand": "string",
  "model": "string",
  "generation": "string"
}
```

**Response:**
```json
{
  "metadata": {
    // See metadata structure above
  }
}
```

## Database Schema

### car_faults

- `model_generation_id`: Links to specific generation
- `slug`: Unique identifier (with language)
- `title`: Question/problem title
- `description`: Brief description
- `solution`: Full solution content
- `severity`, `difficulty_level`: Categorization
- `error_code`, `affected_component`: Technical details
- `symptoms`, `diagnostic_steps`, `tools_required`: Arrays
- `meta_title`, `meta_description`: SEO fields
- `seo_score`, `content_score`: Quality metrics

### car_manuals

- `model_generation_id`: Links to specific generation
- `slug`: Unique identifier (with language)
- `title`: Manual title
- `description`: Brief description
- `content`: Full manual content
- `manual_type`, `difficulty_level`: Categorization
- `estimated_time`: Time estimate
- `tools_required`, `parts_required`: Arrays
- `meta_title`, `meta_description`: SEO fields

## SEO Optimization

### Metadata Fields

- **meta_title**: Optimized for search engines (50-60 chars)
- **meta_description**: Compelling description (150-160 chars)
- **seo_score**: Quality metric (1-99)
- **content_score**: Content quality metric (1-99)

### Best Practices

1. Include brand/model in titles
2. Use specific error codes when available
3. Include key search terms
4. Maintain consistent formatting
5. Ensure uniqueness across generations

## Performance Considerations

- Batch processing (50 items at a time)
- Streaming responses for real-time updates
- Error handling and retry logic
- Database transaction optimization
- Rate limiting protection

## Security

- Protected by InternalAuth component
- Requires internal area password
- Server-side API key management
- No client-side API key exposure

## Future Enhancements

1. OpenAI Batch API integration for true 50% cost savings
2. Parallel metadata generation
3. Quality filtering before insertion
4. Automatic categorization improvements
5. A/B testing for question variations
6. Analytics and success rate tracking

