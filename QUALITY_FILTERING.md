# Quality Filtering System

## Overview

The quality filtering system automatically evaluates newly created knowledge entries and sets their status to "bin" if they don't meet quality thresholds. This prevents low-quality content from going live automatically.

## How It Works

1. **Question Creation**: When questions are created via `/api/ask`, they are initially saved with `status: 'draft'`
2. **Metadata Generation**: The `/api/questions/generate-metadata` endpoint is called to enrich the question with metadata and quality scores
3. **Quality Check**: The system evaluates four quality scores and compares them against thresholds
4. **Status Assignment**: If any score is below its threshold, the status is set to "bin". Otherwise, it's set to "live"

## Quality Score Thresholds

| Score Type | Threshold | Description |
|------------|-----------|-------------|
| `seo_score` | 50 | SEO optimization for technical search intent |
| `content_score` | 70 | Content detail, accuracy, and practical relevance |
| `expertise_score` | 60 | Technical depth and industry terminology |
| `helpfulness_score` | 40 | Actionability for engineers and technicians |

## Score Evaluation Criteria

### SEO Score (1-99)
- Keyword usage and relevance to real industrial problems
- Structure and clarity
- Penalizes off-topic or generic content
- **Threshold: 50**

### Content Score (1-99)
- Detail and technical accuracy
- Practical relevance for industrial systems
- Requires clear, step-by-step solutions
- **Threshold: 70**

### Expertise Score (1-99)
- Technical depth and precise terminology
- Understanding of industry-level challenges
- Penalizes vague, consumer-level explanations
- **Threshold: 60**

### Helpfulness Score (1-99)
- Actionability for real-world scenarios
- Solves concrete technical issues
- Guides through troubleshooting tasks
- **Threshold: 40**

## Implementation Details

### Database Schema

The following fields have been added to the `questions` table:

```sql
ALTER TABLE questions 
ADD COLUMN seo_score INTEGER,
ADD COLUMN content_score INTEGER,
ADD COLUMN expertise_score INTEGER,
ADD COLUMN helpfulness_score INTEGER;
```

### API Changes

The `/api/questions/generate-metadata` endpoint now includes quality filtering logic:

```typescript
// Quality score thresholds
const SCORE_THRESHOLDS = {
  seo_score: 50,
  content_score: 70,
  expertise_score: 60,
  helpfulness_score: 40
};

// Check if any score is below threshold
const failedScores = [];
for (const [scoreField, threshold] of Object.entries(SCORE_THRESHOLDS)) {
  const score = metadata[scoreField];
  if (score !== null && score !== undefined && score < threshold) {
    failedScores.push(`${scoreField}: ${score} < ${threshold}`);
  }
}

// Set status based on quality check
if (failedScores.length > 0) {
  metadata.status = 'bin';
} else {
  metadata.status = 'live';
}
```

## Testing

Run the quality filter test to verify the logic:

```bash
npx tsx scripts/test-quality-filter.ts
```

This will test various score combinations and verify that the filtering works correctly.

## Monitoring

The system logs quality check results:

```
[generate-metadata] seo_score: 75
[generate-metadata] content_score: 85
[generate-metadata] expertise_score: 80
[generate-metadata] helpfulness_score: 70
[generate-metadata] final_status: live
```

If quality check fails:
```
[generate-metadata] Quality check failed: seo_score: 30 < 50
[generate-metadata] final_status: bin
```

## Workflow

1. **Draft Creation**: Questions start as drafts
2. **Metadata Generation**: AI generates metadata and quality scores
3. **Quality Filtering**: System checks scores against thresholds
4. **Status Assignment**: 
   - All scores above thresholds → `live`
   - Any score below threshold → `bin`
5. **Manual Review**: Binned questions can be reviewed and manually approved if needed

## Benefits

- **Automatic Quality Control**: Prevents low-quality content from going live
- **Consistent Standards**: Applies uniform quality criteria across all content
- **Reduced Manual Review**: Only binned content needs manual review
- **Scalable**: Works automatically as content volume grows

## Future Enhancements

- Configurable thresholds via environment variables
- Quality score analytics dashboard
- Automatic retraining based on manual review decisions
- Integration with content review workflows 