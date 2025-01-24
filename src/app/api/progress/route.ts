import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

// In-memory progress tracking
const progressMap = new Map<string, {
  progress: number;
  status: string;
  type: 'training' | 'generation';
  startTime: number;
  lastUpdate: number;
}>();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const type = searchParams.get('type') as 'training' | 'generation';
  
  if (!id) {
    return NextResponse.json({ 
      error: 'Process ID required' 
    }, { status: 400 });
  }

  if (!type || !['training', 'generation'].includes(type)) {
    return NextResponse.json({ 
      error: 'Valid type (training/generation) required' 
    }, { status: 400 });
  }

  try {
    // Get progress from memory
    const processInfo = progressMap.get(id);
    
    if (!processInfo) {
      // Check for completed files
      const baseDir = process.cwd();
      let isComplete = false;
      let completedFile = '';

      if (type === 'training') {
        const modelPath = path.join(baseDir, 'models', `music_generator_${id}.pth`);
        const historyPath = path.join(baseDir, 'public', `training_history_${id}.png`);
        
        try {
          await fs.access(modelPath);
          await fs.access(historyPath);
          isComplete = true;
          completedFile = modelPath;
        } catch {
          isComplete = false;
        }
      } else {
        const outputPath = path.join(baseDir, 'public', 'generated', `generated_${id}.mid`);
        try {
          await fs.access(outputPath);
          isComplete = true;
          completedFile = outputPath;
        } catch {
          isComplete = false;
        }
      }

      if (isComplete) {
        return NextResponse.json({
          progress: 100,
          status: 'complete',
          file: completedFile
        });
      }

      return NextResponse.json({ 
        progress: 0,
        status: 'not_started'
      });
    }

    // Check for stalled processes (no updates in 5 minutes)
    const now = Date.now();
    if (now - processInfo.lastUpdate > 300000) {
      progressMap.delete(id);
      return NextResponse.json({ 
        error: 'Process appears to have stalled',
        lastProgress: processInfo.progress
      }, { status: 500 });
    }

    // Calculate time elapsed
    const timeElapsed = Math.floor((now - processInfo.startTime) / 1000); // in seconds
    const estimatedTimeRemaining = processInfo.progress > 0 
      ? Math.floor((timeElapsed / processInfo.progress) * (100 - processInfo.progress))
      : null;

    return NextResponse.json({
      progress: processInfo.progress,
      status: processInfo.status,
      timeElapsed,
      estimatedTimeRemaining,
      type: processInfo.type
    });

  } catch (error) {
    console.error('Progress check error:', error);
    return NextResponse.json({ 
      error: 'Failed to get progress: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}

// Add progress update function for other routes to use
export function updateProgress(id: string, progress: number, status: string, type: 'training' | 'generation') {
  if (!progressMap.has(id)) {
    progressMap.set(id, {
      progress,
      status,
      type,
      startTime: Date.now(),
      lastUpdate: Date.now()
    });
  } else {
    const info = progressMap.get(id)!;
    info.progress = progress;
    info.status = status;
    info.lastUpdate = Date.now();
  }
}

// Clean up completed or stalled processes
setInterval(() => {
  const now = Date.now();
  for (const [id, info] of progressMap.entries()) {
    if (info.progress === 100 || now - info.lastUpdate > 300000) {
      progressMap.delete(id);
    }
  }
}, 60000); // Clean up every minute