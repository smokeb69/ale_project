import { router, publicProcedure } from './_core/trpc';
import { z } from 'zod';
import { modelWeightDownloader } from './_core/modelWeightDownloader';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const exportRouter = router({
  // Get available models
  getAvailableModels: publicProcedure
    .query(() => {
      const models = modelWeightDownloader.getAvailableModels();
      return {
        count: models.length,
        models: models.map((m) => ({
          key: Object.keys(modelWeightDownloader['POPULAR_MODELS'] || {}).find(
            (k) => modelWeightDownloader.getModelInfo(k)?.modelId === m.modelId
          ),
          name: m.name,
          modelId: m.modelId,
          size: m.size,
          sizeBytes: m.sizeBytes,
          description: m.description,
          url: m.url,
        })),
      };
    }),

  // Get model info
  getModelInfo: publicProcedure
    .input(z.object({ modelKey: z.string() }))
    .query(({ input }) => {
      const model = modelWeightDownloader.getModelInfo(input.modelKey);
      if (!model) {
        return { error: 'Model not found' };
      }
      return {
        name: model.name,
        modelId: model.modelId,
        size: model.size,
        sizeBytes: model.sizeBytes,
        description: model.description,
        url: model.url,
        downloadUrl: modelWeightDownloader.getDownloadUrl(input.modelKey),
      };
    }),

  // Download model weights
  downloadModel: publicProcedure
    .input(z.object({
      modelKey: z.string(),
      sessionId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const model = modelWeightDownloader.getModelInfo(input.modelKey);
      if (!model) {
        throw new Error('Model not found');
      }

      const outputPath = `/home/ubuntu/ale_project/models/${input.modelKey}`;

      try {
        const metadataPath = await modelWeightDownloader.downloadModel(
          input.modelKey,
          outputPath
        );

        return {
          success: true,
          modelKey: input.modelKey,
          modelName: model.name,
          modelId: model.modelId,
          size: model.size,
          path: outputPath,
          metadataPath: metadataPath,
          message: `Model ${model.name} prepared for download`,
        };
      } catch (error) {
        throw new Error(`Failed to download model: ${String(error)}`);
      }
    }),

  // Stream download with progress
  streamDownloadModel: publicProcedure
    .input(z.object({
      modelKey: z.string(),
      sessionId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const model = modelWeightDownloader.getModelInfo(input.modelKey);
      if (!model) {
        throw new Error('Model not found');
      }

      const outputPath = `/home/ubuntu/ale_project/models/${input.modelKey}`;

      try {
        const result = await modelWeightDownloader.streamDownloadModel(
          input.modelKey,
          outputPath,
          (progress, total, speed) => {
            const percent = ((progress / total) * 100).toFixed(1);
            console.log(
              `[${percent}%] Downloaded ${modelWeightDownloader.formatBytes(progress)} / ${modelWeightDownloader.formatBytes(total)} @ ${speed}`
            );
          }
        );

        return {
          success: result.success,
          modelKey: input.modelKey,
          modelName: model.name,
          modelId: model.modelId,
          size: result.size,
          path: result.path,
          message: `Model ${model.name} downloaded successfully`,
        };
      } catch (error) {
        throw new Error(`Failed to stream download: ${String(error)}`);
      }
    }),

  // Export ALE with pre-trained model
  exportWithModel: publicProcedure
    .input(z.object({
      modelKey: z.string(),
      sessionId: z.string().optional(),
      includeSource: z.boolean().default(true),
      includeRAG: z.boolean().default(true),
      includeFederation: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const model = modelWeightDownloader.getModelInfo(input.modelKey);
      if (!model) {
        throw new Error('Model not found');
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const exportName = `ale-forge-${input.modelKey}-${timestamp}`;
      const exportPath = `/home/ubuntu/ale_project/exports/${exportName}`;

      try {
        // Create export directory
        if (!fs.existsSync(exportPath)) {
          fs.mkdirSync(exportPath, { recursive: true });
        }

        // 1. Copy source code if requested
        if (input.includeSource) {
          console.log('📦 Including source code...');
          const srcPath = '/home/ubuntu/ale_project';
          const dirs = ['client', 'server', 'shared', 'drizzle'];

          for (const dir of dirs) {
            const src = path.join(srcPath, dir);
            const dest = path.join(exportPath, dir);
            if (fs.existsSync(src)) {
              await execAsync(`cp -r "${src}" "${dest}"`);
            }
          }

          // Copy config files
          const configFiles = ['package.json', 'tsconfig.json', 'vite.config.ts'];
          for (const file of configFiles) {
            const src = path.join(srcPath, file);
            const dest = path.join(exportPath, file);
            if (fs.existsSync(src)) {
              fs.copyFileSync(src, dest);
            }
          }
        }

        // 2. Download and include model weights
        console.log(`📥 Including model: ${model.name}...`);
        const modelPath = path.join(exportPath, 'models', input.modelKey);
        if (!fs.existsSync(modelPath)) {
          fs.mkdirSync(modelPath, { recursive: true });
        }

        await modelWeightDownloader.downloadModel(input.modelKey, modelPath);

        // 3. Create model configuration
        const modelConfig = {
          selectedModel: input.modelKey,
          modelName: model.name,
          modelId: model.modelId,
          modelSize: model.size,
          modelUrl: model.url,
          preTrainedAt: new Date().toISOString(),
          description: `ALE Forge pre-trained with ${model.name}`,
        };

        fs.writeFileSync(
          path.join(exportPath, 'model-config.json'),
          JSON.stringify(modelConfig, null, 2)
        );

        // 4. Create startup script
        const startupScript = `#!/bin/bash
# ALE Forge with ${model.name}
# Pre-trained model: ${model.modelId}
# Size: ${model.size}

echo "🚀 Starting ALE Forge with ${model.name}..."
echo "Model: ${model.modelId}"
echo "Size: ${model.size}"

# Install dependencies
pnpm install

# Set model environment
export SELECTED_MODEL="${input.modelKey}"
export MODEL_NAME="${model.name}"
export MODEL_ID="${model.modelId}"

# Start dev server
pnpm dev
`;

        fs.writeFileSync(path.join(exportPath, 'start.sh'), startupScript);
        fs.chmodSync(path.join(exportPath, 'start.sh'), 0o755);

        // 5. Create README
        const readme = `# ALE Forge - Pre-trained with ${model.name}

## Model Information
- **Name**: ${model.name}
- **Model ID**: ${model.modelId}
- **Size**: ${model.size}
- **URL**: ${model.url}
- **Pre-trained**: ${new Date().toISOString()}

## Quick Start

\`\`\`bash
# Install dependencies
pnpm install

# Start ALE Forge
./start.sh
# or
pnpm dev
\`\`\`

## Features
- ✅ Pre-trained with ${model.name}
- ✅ Autonomous exploration and learning
- ✅ Real file system access
- ✅ Multi-instance federation
- ✅ Free-roam autopilot
- ✅ CVE database integration
- ✅ Self-healing capabilities

## Model Usage

The system will automatically use the pre-trained model:
\`${model.modelId}\`

## Documentation
See the main ALE Forge documentation for full details.
`;

        fs.writeFileSync(path.join(exportPath, 'README.md'), readme);

        // 6. Create ZIP archive
        console.log('📦 Creating archive...');
        const zipPath = `/home/ubuntu/ale_project/exports/${exportName}.zip`;
        await execAsync(`cd /home/ubuntu/ale_project/exports && zip -r "${exportName}.zip" "${exportName}"`);

        // Get file size
        const stats = fs.statSync(zipPath);
        const sizeGB = (stats.size / (1024 * 1024 * 1024)).toFixed(2);

        return {
          success: true,
          exportName: exportName,
          zipPath: zipPath,
          exportPath: exportPath,
          modelKey: input.modelKey,
          modelName: model.name,
          modelId: model.modelId,
          modelSize: model.size,
          archiveSize: `${sizeGB} GB`,
          downloadUrl: `/exports/${exportName}.zip`,
          message: `ALE Forge exported with ${model.name} (${sizeGB} GB)`,
        };
      } catch (error) {
        throw new Error(`Export failed: ${String(error)}`);
      }
    }),

  // List exported packages
  listExports: publicProcedure
    .query(() => {
      const exportsPath = '/home/ubuntu/ale_project/exports';
      if (!fs.existsSync(exportsPath)) {
        return { exports: [], count: 0 };
      }

      const files = fs.readdirSync(exportsPath).filter((f) => f.endsWith('.zip'));
      const exports = files.map((file) => {
        const filePath = path.join(exportsPath, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: `${(stats.size / (1024 * 1024 * 1024)).toFixed(2)} GB`,
          createdAt: stats.birthtime,
          downloadUrl: `/exports/${file}`,
        };
      });

      return {
        exports: exports.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
        count: exports.length,
      };
    }),

  // Delete export
  deleteExport: publicProcedure
    .input(z.object({ exportName: z.string() }))
    .mutation(async ({ input }) => {
      const zipPath = `/home/ubuntu/ale_project/exports/${input.exportName}.zip`;
      const dirPath = `/home/ubuntu/ale_project/exports/${input.exportName}`;

      try {
        if (fs.existsSync(zipPath)) {
          fs.unlinkSync(zipPath);
        }
        if (fs.existsSync(dirPath)) {
          await execAsync(`rm -rf "${dirPath}"`);
        }
        return { success: true, message: 'Export deleted' };
      } catch (error) {
        throw new Error(`Failed to delete export: ${String(error)}`);
      }
    }),
});
