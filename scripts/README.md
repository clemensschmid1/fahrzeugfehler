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
   - Add and verify your website (infoneva.com)
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

1. **Fetches Data**: Connects to Supabase and fetches all questions where `status = 'live'` and have valid slugs
2. **Constructs URLs**: Creates full URLs like `https://infoneva.com/en/knowledge/[slug]`
3. **Batches URLs**: Splits URLs into batches of 100 (IndexNow limit)
4. **Submits to Bing**: Sends each batch to Bing IndexNow API
5. **Handles Errors**: Retries failed submissions and logs all errors
6. **Provides Summary**: Shows success/failure statistics

### Configuration

The script uses these default settings (can be modified in the script):

- **Batch Size**: 100 URLs per submission
- **Delay**: 1 second between batches
- **Retries**: 3 attempts per batch
- **Host**: infoneva.com

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