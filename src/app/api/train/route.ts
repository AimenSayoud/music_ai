import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const { epochs, batchSize } = await req.json();
    const trainingId = uuidv4();
    
    // Define all necessary paths
    const baseDir = process.cwd();
    const pythonDir = path.join(baseDir, 'src', 'python');
    const modelsDir = path.join(baseDir, 'models');
    const outputDir = path.join(baseDir, 'output');
    const publicDir = path.join(baseDir, 'public');
    
    // Ensure script path is correct
    const scriptPath = path.join(pythonDir, 'train_model.py');
    
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', [
        scriptPath,
        JSON.stringify({
          id: trainingId,
          epochs: epochs || 100,
          batch_size: batchSize || 32,
          base_dir: baseDir,
          model_dir: modelsDir,
          output_dir: outputDir,
          public_dir: publicDir
        })
      ]);

      let buffer = '';

      pythonProcess.stdout.on('data', (data) => {
        buffer += data.toString();
        
        // Process complete JSON messages
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const message = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          
          try {
            const parsed = JSON.parse(message);
            
            if (parsed.status === 'complete') {
              // Convert file paths to URL paths for client
              const modelPath = parsed.model_path;
              const historyPath = parsed.history_path.replace(
                path.join(baseDir, 'public'),
                ''
              ).split(path.sep).join('/');
              
              resolve(NextResponse.json({
                id: trainingId,
                modelPath: modelPath,
                historyPath: historyPath,
                trainLoss: parsed.final_train_loss,
                valLoss: parsed.final_val_loss
              }));
            } else if (parsed.status === 'error') {
              resolve(NextResponse.json({ 
                error: parsed.error 
              }, { status: 500 }));
            } else if (parsed.status === 'progress') {
              // Optionally handle progress updates
              console.log(`Training progress: ${parsed.progress}%`);
            } else if (parsed.status === 'early_stopping') {
              console.log(`Early stopping at epoch ${parsed.epoch}`);
            }
          } catch (e) {
            console.error('Error parsing Python output:', e);
          }
        }
      });

      pythonProcess.stderr.on('data', (data) => {
        const errorMessage = data.toString();
        console.error(`Python error: ${errorMessage}`);
        
        // Handle specific error types
        if (errorMessage.includes('FileNotFoundError')) {
          resolve(NextResponse.json({ 
            error: 'Required data files not found. Please ensure processed data exists.' 
          }, { status: 500 }));
        } else if (errorMessage.includes('CUDA')) {
          resolve(NextResponse.json({ 
            error: 'GPU error occurred. Falling back to CPU.' 
          }, { status: 500 }));
        } else if (errorMessage.includes('torch')) {
          resolve(NextResponse.json({ 
            error: 'PyTorch error: ' + errorMessage 
          }, { status: 500 }));
        } else {
          resolve(NextResponse.json({ 
            error: 'Training process error: ' + errorMessage 
          }, { status: 500 }));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('Process error:', error);
        resolve(NextResponse.json({ 
          error: 'Failed to start training process. Check if Python is installed correctly.' 
        }, { status: 500 }));
      });

      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        pythonProcess.kill();
        resolve(NextResponse.json({ 
          error: 'Training process timed out' 
        }, { status: 500 }));
      }, 7200000); // 2 hour timeout for training

      pythonProcess.on('close', (code) => {
        clearTimeout(timeout);
        if (code !== 0 && !buffer.includes('"status":"complete"')) {
          resolve(NextResponse.json({ 
            error: `Process exited with code ${code}` 
          }, { status: 500 }));
        }
      });
    });
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ 
      error: 'Server error: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}