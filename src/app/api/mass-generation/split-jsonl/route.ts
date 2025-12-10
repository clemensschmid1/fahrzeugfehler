import { NextResponse } from 'next/server';
import { createReadStream, createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { createInterface } from 'readline';
import { existsSync, statSync } from 'fs';

export const runtime = 'nodejs';
export const maxDuration = 600; // 10 minutes for large files

// OpenAI Batch API limit: 200 MB (209715200 bytes)
const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB
const TARGET_FILE_SIZE_BYTES = 180 * 1024 * 1024; // 180 MB (safety margin)

// Stream-based line counting (for large files)
async function countLines(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    let lineCount = 0;
    const fileStream = createReadStream(filePath, { encoding: 'utf-8' });
    const rl = createInterface({ input: fileStream });

    rl.on('line', (line) => {
      if (line.trim().length > 0) {
        lineCount++;
      }
    });

    rl.on('close', () => resolve(lineCount));
    rl.on('error', reject);
  });
}

export async function POST(req: Request) {
  try {
    const contentTypeHeader = req.headers.get('content-type') || '';
    let filePath: string;
    let filename: string;
    let numParts: number = 2;
    let fileSizeBytes: number;

    if (contentTypeHeader.includes('multipart/form-data')) {
      // Handle file upload - save to temp file first
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const numPartsStr = formData.get('numParts') as string;
      
      if (!file) {
        return NextResponse.json({ error: 'Missing file' }, { status: 400 });
      }

      filename = file.name;
      numParts = numPartsStr ? parseInt(numPartsStr) : 2;

      // Save uploaded file to temp location
      const publicDir = join(process.cwd(), 'public', 'generated');
      await mkdir(publicDir, { recursive: true });
      const tempFilePath = join(publicDir, `temp-${Date.now()}-${filename}`);
      
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fileSizeBytes = buffer.length;
      
      // Write temp file
      const { writeFile } = await import('fs/promises');
      await writeFile(tempFilePath, buffer);
      filePath = tempFilePath;
    } else {
      // Handle fileUrl
      const { fileUrl, numParts: numPartsParam = 2 } = await req.json();
      
      if (!fileUrl) {
        return NextResponse.json({ error: 'Missing fileUrl' }, { status: 400 });
      }

      filename = fileUrl.split('/').pop() || 'file.jsonl';
      numParts = numPartsParam;

      if (fileUrl.startsWith('http')) {
        // Download from URL - save to temp file
        const response = await fetch(fileUrl);
        if (!response.ok) {
          return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
        }
        
        const publicDir = join(process.cwd(), 'public', 'generated');
        await mkdir(publicDir, { recursive: true });
        const tempFilePath = join(publicDir, `temp-${Date.now()}-${filename}`);
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fileSizeBytes = buffer.length;
        
        const { writeFile } = await import('fs/promises');
        await writeFile(tempFilePath, buffer);
        filePath = tempFilePath;
      } else {
        // Local file path
        filePath = join(process.cwd(), 'public', fileUrl.replace(/^\//, ''));
        if (!existsSync(filePath)) {
          return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }
        const stats = statSync(filePath);
        fileSizeBytes = stats.size;
      }
    }

    const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);
    console.log(`[Split JSONL] File: ${filename}, Size: ${fileSizeMB} MB, Target parts: ${numParts}`);

    // Count lines first (stream-based for large files)
    console.log('[Split JSONL] Counting lines...');
    const totalLines = await countLines(filePath);
    console.log(`[Split JSONL] Total lines: ${totalLines}`);

    if (totalLines === 0) {
      return NextResponse.json({ error: 'No valid lines found in file' }, { status: 400 });
    }

    if (fileSizeBytes <= MAX_FILE_SIZE_BYTES && numParts === 1) {
      return NextResponse.json({
        success: true,
        message: 'File is already under the limit, no splitting needed',
        fileSizeMB: parseFloat(fileSizeMB),
        parts: [{
          filename,
          fileUrl: fileUrl || `/generated/${filename}`,
          sizeMB: parseFloat(fileSizeMB),
          lineCount: totalLines,
        }],
      });
    }

    // Calculate lines per part - split evenly by line count to ensure consistency
    // This is critical: if splitting multiple files (questions, answers, metadata),
    // they must all have the same number of lines per part to maintain alignment
    const linesPerPart = Math.ceil(totalLines / numParts);
    const parts: Array<{ filename: string; fileUrl: string; sizeMB: number; lineCount: number }> = [];

    console.log(`[Split JSONL] Splitting ${totalLines} lines into ${numParts} parts, ${linesPerPart} lines per part`);

    // Stream-based splitting - split evenly by line count to maintain consistency
    const publicDir = join(process.cwd(), 'public', 'generated');
    await mkdir(publicDir, { recursive: true });
    
    const baseName = filename.replace('.jsonl', '');
    const fileStream = createReadStream(filePath, { encoding: 'utf-8' });
    const rl = createInterface({ input: fileStream });

    let currentLineIndex = 0;
    let currentPartIndex = 1; // Start at 1 (part 1, part 2, etc.)
    let currentPartLines: string[] = [];
    let currentPartSizeBytes = 0;
    let currentPartWriteStream: ReturnType<typeof createWriteStream> | null = null;
    let currentPartFilename = '';

    const createNewPart = () => {
      // Close previous part if exists
      if (currentPartWriteStream) {
        currentPartWriteStream.end();
        const partSizeMB = (currentPartSizeBytes / (1024 * 1024)).toFixed(2);
        parts.push({
          filename: currentPartFilename,
          fileUrl: `/generated/${currentPartFilename}`,
          sizeMB: parseFloat(partSizeMB),
          lineCount: currentPartLines.length,
        });
        console.log(`[Split JSONL] Completed part ${currentPartIndex - 1}/${numParts}: ${currentPartFilename}, ${partSizeMB} MB, ${currentPartLines.length} lines`);
      }
      
      // Create new part
      currentPartFilename = `${baseName}-part${currentPartIndex}of${numParts}.jsonl`;
      const partFilePath = join(publicDir, currentPartFilename);
      currentPartWriteStream = createWriteStream(partFilePath, { encoding: 'utf-8' });
      currentPartLines = [];
      currentPartSizeBytes = 0;
      currentPartIndex++;
    };

    // Start first part
    createNewPart();

    rl.on('line', (line) => {
      if (line.trim().length === 0) return;

      const lineWithNewline = line + '\n';
      const lineSizeBytes = Buffer.byteLength(lineWithNewline, 'utf-8');

      // Check if we've reached the target number of lines for this part
      // Split evenly by line count to ensure consistency across multiple files
      if (currentLineIndex > 0 && currentLineIndex % linesPerPart === 0 && currentPartIndex <= numParts) {
        createNewPart();
      }

      // Also check file size limit as a safety measure
      // If a single part would exceed the limit even with fewer lines, we need more parts
      if (currentPartSizeBytes + lineSizeBytes > TARGET_FILE_SIZE_BYTES && currentPartSizeBytes > 0 && currentPartIndex <= numParts) {
        // Only create new part if we haven't reached the line limit yet
        // This handles cases where lines are extremely long
        if (currentLineIndex % linesPerPart !== 0) {
          console.warn(`[Split JSONL] Part ${currentPartIndex - 1} approaching size limit (${(currentPartSizeBytes / (1024 * 1024)).toFixed(2)} MB) before reaching line limit. Creating new part early.`);
          createNewPart();
        }
      }

      // Write line to current part
      if (currentPartWriteStream) {
        currentPartWriteStream.write(lineWithNewline);
        currentPartLines.push(line);
        currentPartSizeBytes += lineSizeBytes;
      }

      currentLineIndex++;
    });

    await new Promise<void>((resolve, reject) => {
      rl.on('close', () => {
        // Close last part
        if (currentPartWriteStream) {
          currentPartWriteStream.end();
          const partSizeMB = (currentPartSizeBytes / (1024 * 1024)).toFixed(2);
          parts.push({
            filename: currentPartFilename,
            fileUrl: `/generated/${currentPartFilename}`,
            sizeMB: parseFloat(partSizeMB),
            lineCount: currentPartLines.length,
          });
          console.log(`[Split JSONL] Completed part ${currentPartIndex - 1}/${numParts}: ${currentPartFilename}, ${partSizeMB} MB, ${currentPartLines.length} lines`);
        }
        resolve();
      });
      rl.on('error', reject);
    });

    // Wait for all write streams to finish
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 1000); // Give streams time to flush
    });

    // Clean up temp file if it was created
    if (filePath.includes('temp-')) {
      const { unlink } = await import('fs/promises');
      try {
        await unlink(filePath);
      } catch (e) {
        console.warn('[Split JSONL] Failed to delete temp file:', e);
      }
    }

    // Validate part sizes
    for (const part of parts) {
      if (part.sizeMB > MAX_FILE_SIZE_BYTES / (1024 * 1024)) {
        return NextResponse.json({
          error: `Part ${part.filename} is still too large (${part.sizeMB} MB). The file may have very long lines. Please try splitting into more parts.`,
          currentParts: parts.length,
          suggestedParts: Math.ceil(fileSizeBytes / TARGET_FILE_SIZE_BYTES),
        }, { status: 400 });
      }
    }

    // Log line distribution for verification
    const lineDistribution = parts.map(p => `${p.filename}: ${p.lineCount} lines`).join(', ');
    console.log(`[Split JSONL] Line distribution: ${lineDistribution}`);
    
    // Verify that line counts are consistent (all parts except last should have same line count)
    const expectedLinesPerPart = linesPerPart;
    const lastPartLines = parts[parts.length - 1]?.lineCount || 0;
    const otherPartsLines = parts.slice(0, -1).map(p => p.lineCount);
    const allOtherPartsSame = otherPartsLines.every(count => count === expectedLinesPerPart);
    
    if (!allOtherPartsSame) {
      console.warn(`[Split JSONL] WARNING: Line counts are not consistent across parts. This may cause alignment issues when splitting multiple files.`);
    }

    return NextResponse.json({
      success: true,
      originalFile: filename,
      originalSizeMB: parseFloat(fileSizeMB),
      originalLineCount: totalLines,
      numParts: parts.length,
      linesPerPart: linesPerPart,
      parts,
    });
  } catch (error) {
    console.error('Split JSONL error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}



