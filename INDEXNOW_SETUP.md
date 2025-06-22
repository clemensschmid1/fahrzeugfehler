# Bing IndexNow Setup

This project now supports Bing IndexNow for immediate indexing of new knowledge pages.

## What is IndexNow?

IndexNow is a protocol that allows websites to instantly inform search engines about new or updated content. This helps your new knowledge pages appear in search results much faster.

## Setup Instructions

### 1. Get Your IndexNow Key

1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Add and verify your website (infoneva.com)
3. Navigate to the IndexNow section
4. Generate a new key or use an existing one

### 2. Update Configuration

#### Option A: Environment Variable (Recommended)
Add your IndexNow key to your `.env.local` file:
```
INDEXNOW_KEY=your_actual_key_here
```

#### Option B: Update the JSON File
Replace the placeholder in `public/indexnow.json`:
```json
{
  "key": "your_actual_key_here",
  "keyLocation": "https://infoneva.com/indexnow.json"
}
```

### 3. Verify Setup

After deployment, verify that:
- `https://infoneva.com/indexnow.json` is accessible
- The key in the JSON file matches your IndexNow key
- The `keyLocation` URL is correct

## How It Works

1. **Automatic Submission**: When a new knowledge page is created and passes quality checks, it's automatically submitted to Bing IndexNow
2. **Non-blocking**: The submission happens in the background and doesn't affect user experience
3. **Live Pages Only**: Only pages with `status: 'live'` are submitted for indexing
4. **Multiple Sources**: Works for pages created via:
   - Chat functionality
   - Bulk import feature
   - Manual creation

## Bulk Submission for Existing Pages

### One-Time Setup for Existing Content

If you have existing knowledge pages that were created before IndexNow was implemented, you can submit them all at once using the bulk submission script.

#### Run the Bulk Submission Script

```bash
npm run bulk-indexnow
```

This script will:
- Fetch all existing live knowledge pages from your database
- Submit them to Bing IndexNow in batches of 100 URLs
- Provide detailed progress and success/failure statistics
- **Safely read-only**: Does not modify any data in your database

#### What the Bulk Script Does

1. **Connects to Supabase** and fetches all questions where `status = 'live'`
2. **Constructs full URLs** like `https://infoneva.com/en/knowledge/[slug]`
3. **Batches URLs** into groups of 100 (IndexNow API limit)
4. **Submits each batch** to Bing IndexNow with retry logic
5. **Provides a summary** of successful and failed submissions

#### Example Output

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
📤 Submitting batch 2 (100 URLs, attempt 1/3)...
✅ Batch 2 submitted successfully (100 URLs)
📤 Submitting batch 3 (50 URLs, attempt 1/3)...
✅ Batch 3 submitted successfully (50 URLs)

📊 Submission Summary:
✅ Successful batches: 3/3
✅ Total URLs submitted: 250/250
❌ Failed batches: 0
🎉 All batches submitted successfully!
```

For more details, see `scripts/README.md`.

## Monitoring

Check your server logs for IndexNow-related messages:
- `[IndexNow] Successfully submitted URL for indexing: https://infoneva.com/en/knowledge/your-slug`
- `[IndexNow] Failed to submit URL, status: 400` (if there are issues)

## Troubleshooting

- **Key not configured**: If you see "Key not configured, skipping submission", make sure your `INDEXNOW_KEY` environment variable is set
- **404 on indexnow.json**: Ensure the file is in the `public/` folder and the middleware excludes it from redirection
- **Submission failures**: Check that your key is valid and the URL format is correct
- **Bulk script errors**: Make sure your `.env.local` file is loaded and contains the required environment variables

## Benefits

- **Faster Indexing**: New pages appear in Bing search results within hours instead of days
- **Better SEO**: Improved crawl efficiency and indexing speed
- **Automatic**: No manual work required - happens automatically for all new live pages
- **Bulk Processing**: One-time script to submit all existing content 