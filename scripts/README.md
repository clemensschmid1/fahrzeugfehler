# Scripts

This directory contains utility scripts for the project.

## Bulk IndexNow Submission

### `bulkSubmitToIndexNow.ts`

This script submits all existing live knowledge pages to Bing IndexNow for immediate indexing.

**⚠️ IMPORTANT**: This is a **read-only** process that does not modify any data in your database.

### Prerequisites

1. **Configure IndexNow Key**: Add your IndexNow key to `.env.local`:
   ```
   INDEXNOW_KEY=your_actual_key_here
   ```

2. **Get IndexNow Key**: 
   - Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
   - Add and verify your website (faultbase.com)
   - Navigate to the IndexNow section
   - Generate a new key

### Usage

Run the script using npm:

```bash
npm run bulk-indexnow
```

Or directly with tsx:

```bash
npx tsx scripts/bulkSubmitToIndexNow.ts
```

### What It Does

1. **Fetches Data**: Connects to Supabase and fetches all questions from `questions2` where `status = 'live'` and `is_main = true` with valid slugs
2. **Constructs URLs**: Creates full URLs like `https://faultbase.com/en/knowledge/[slug]`
3. **Batches URLs**: Splits URLs into batches of 100 (IndexNow limit)
4. **Submits to Bing**: Sends each batch to Bing IndexNow API
5. **Handles Errors**: Retries failed submissions and logs all errors
6. **Provides Summary**: Shows success/failure statistics

### Configuration

The script uses these default settings (can be modified in the script):

- **Batch Size**: 100 URLs per submission
- **Delay**: 1 second between batches
- **Retries**: 3 attempts per batch
- **Host**: faultbase.com

### Output Example

```
🚀 Starting bulk IndexNow submission...
🔑 Using IndexNow key: CONFIGURED
📊 Fetching live knowledge pages from Supabase...
📋 Found 250 live knowledge pages
✅ 250 questions have valid slugs and language
🔗 Constructed 250 URLs for submission
📦 Split into 3 batches of up to 100 URLs each
📤 Submitting batch 1 (100 URLs, attempt 1/3)...
✅ Batch 1 submitted successfully (100 URLs)
⏳ Waiting 1000ms before next batch...
📤 Submitting batch 2 (100 URLs, attempt 1/3)...
✅ Batch 2 submitted successfully (100 URLs)
⏳ Waiting 1000ms before next batch...
📤 Submitting batch 3 (50 URLs, attempt 1/3)...
✅ Batch 3 submitted successfully (50 URLs)

📊 Submission Summary:
✅ Successful batches: 3/3
✅ Total URLs submitted: 250/250
❌ Failed batches: 0
🎉 All batches submitted successfully!
🏁 Script completed
```

### Safety Features

- **Read-only**: Only reads from Supabase, never writes
- **Error Handling**: Catches and logs all errors without crashing
- **Validation**: Only submits URLs with valid slugs and language
- **Rate Limiting**: Respects Bing's API limits with delays
- **Retry Logic**: Automatically retries failed submissions

### Troubleshooting

- **"Key not configured"**: Make sure `INDEXNOW_KEY` is set in `.env.local`
- **"Missing Supabase environment variables"**: Ensure your `.env.local` file is loaded
- **Network errors**: Check your internet connection and Bing API status
- **Batch failures**: Check the logs for specific error messages

## Bulk Page Generation

### `bulkPageGeneration.ts`

This script generates metadata for all questions in `questions2` that don't have metadata yet. It's an improved version of `catchup-metadata-generation.ts` with better error handling, progress tracking, and resume capability.

**⚠️ IMPORTANT**: This is a **read-write** process that updates questions in your database.

### Prerequisites

1. **Environment Variables**: Ensure your `.env.local` file contains:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   NEXT_PUBLIC_SITE_URL=https://faultbase.com
   ```

2. **API Endpoint**: The script requires the `/api/questions/generate-metadata` endpoint to be available.

### Usage

Run the script using npm:

```bash
# Generate metadata for all questions without metadata
npm run bulk-generate

# Resume from previous run (skips already processed questions)
npm run bulk-generate:resume

# Generate metadata for only 50 questions (useful for testing)
npm run bulk-generate:limit
```

Or directly with tsx:

```bash
# Basic usage
npx tsx scripts/bulkPageGeneration.ts

# With options
npx tsx scripts/bulkPageGeneration.ts --limit=50
npx tsx scripts/bulkPageGeneration.ts --resume
```

### What It Does

1. **Fetches Questions**: Connects to Supabase and fetches all questions from `questions2` where `meta_generated = false` and have valid question/answer pairs
2. **Validates Data**: Filters out questions without valid question/answer content
3. **Processes in Batches**: Processes questions in small batches (5 at a time) to avoid rate limits
4. **Generates Metadata**: Calls the `/api/questions/generate-metadata` endpoint for each question
5. **Tracks Progress**: Saves progress to `.bulk-generation-progress.json` for resume capability
6. **Handles Errors**: Retries failed requests up to 3 times with exponential backoff
7. **Provides Summary**: Shows detailed success/failure statistics

### Features

- **Progress Tracking**: Automatically saves progress after each batch
- **Resume Capability**: Can resume from where it left off using `--resume` flag
- **Error Handling**: Retries failed requests with exponential backoff
- **Rate Limiting**: Configurable delays between batches to avoid API rate limits
- **Validation**: Only processes questions with valid question/answer pairs
- **Detailed Logging**: Shows progress for each question with slug or ID

### Configuration

The script uses these default settings (can be modified in the script):

- **Batch Size**: 5 questions per batch (smaller to avoid rate limits)
- **Delay**: 2 seconds between batches
- **Retries**: 3 attempts per question
- **Progress File**: `.bulk-generation-progress.json` (in project root)

### Output Example

```
🚀 Starting bulk page generation...
📡 Using site URL: https://faultbase.com
🔎 Fetching questions that need metadata generation...
📝 Found 100 questions needing metadata generation
✅ 100 questions have valid question/answer pairs

📦 Processing batch 1/20 (5 questions)...
   ✅ causes-of-signal-loss-ifm-sensors
   ✅ abb-acs880-error-code-2330
   ✅ siemens-s7-plc-communication-error
   ✅ motor-overheating-troubleshooting
   ✅ encoder-fault-resolution
⏳ Waiting 2000ms before next batch...

📊 Generation Summary:
✅ Successfully processed: 95
❌ Failed: 5
📈 Total processed (this run + previous): 95
📉 Total failed (this run + previous): 5

🎉 All questions processed successfully!
🏁 Script completed
```

### Safety Features

- **Progress Tracking**: Never loses progress - can resume anytime
- **Error Handling**: Catches and logs all errors without crashing
- **Validation**: Only processes questions with valid data
- **Rate Limiting**: Respects API limits with configurable delays
- **Retry Logic**: Automatically retries failed requests
- **Idempotent**: Safe to run multiple times (skips already processed questions)

### Troubleshooting

- **"Missing Supabase environment variables"**: Ensure your `.env.local` file is loaded
- **"No questions need metadata generation"**: All questions already have metadata
- **Network errors**: Check your internet connection and API endpoint status
- **Rate limit errors**: Increase `DELAY_MS` in the script
- **Failed questions**: Run with `--resume` to retry failed ones

### Progress File

The script creates a `.bulk-generation-progress.json` file in the project root to track:
- Processed question IDs (successful)
- Failed question IDs (for retry)
- Last run timestamp
- Total questions found

This file is automatically created and updated. You can delete it to start fresh.

## Legacy: Metadata Catch-up

### `catchup-metadata-generation.ts`

**⚠️ DEPRECATED**: This script is now deprecated in favor of `bulkPageGeneration.ts`. It has been updated to use `questions2` table but lacks the advanced features of the new script.

Use `bulkPageGeneration.ts` instead for:
- Better error handling
- Progress tracking
- Resume capability
- More detailed logging