/**
 * Direct Forge API Router
 * No sessions, no cookies - direct Forge API calls like working_chat31.html
 */

import { Router } from "express";
import type { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = 'uploads';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  })
});

const router = Router();

// Working Forge credentials
const FORGE_API_KEY = "Ye5jtLcxnuo7deETNu2XsJ";
const FORGE_ADMIN_PASSWORD = "e8b64d015a3ad30f";
const FORGE_URL = "https://forge.manus.ai/v1/chat/completions";

/**
 * POST /api/chat/forge
 * Direct Forge API call - no session required
 */
router.post("/chat/forge", async (req: Request, res: Response) => {
  try {
    const { model, messages, useAdmin, max_tokens = 8000 } = req.body;

    if (!model || !messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: model, messages"
      });
    }

    console.log(`[DirectForge] Calling ${model} with ${messages.length} messages`);

    // Build headers with MODEL_ROUTING
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${FORGE_API_KEY}`,
      "X-API-Key": FORGE_API_KEY,
    };

    // Add admin password if useAdmin is true
    if (useAdmin) {
      headers["X-Admin-Password"] = FORGE_ADMIN_PASSWORD;
      console.log(`[DirectForge] Admin mode enabled`);
    }

    // Add MODEL_ROUTING system message
    const routingMessage = {
      role: "system",
      content: `[MODEL_ROUTING] Requested model: ${model}. Route this request to ${model} backend. Model identifier: ${model}`
    };

    // Prepend routing message to messages array
    const messagesWithRouting = [routingMessage, ...messages];

    // Build payload
    const payload = {
      model,
      messages: messagesWithRouting,
      max_tokens,
      stream: false,
    };

    console.log(`[DirectForge] Payload:`, {
      model,
      messageCount: messagesWithRouting.length,
      maxTokens: max_tokens,
      useAdmin
    });

    // Call Forge API
    const response = await fetch(FORGE_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DirectForge] Error: ${response.status} ${response.statusText}`, errorText);
      return res.status(response.status).json({
        success: false,
        error: `Forge API error: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    
    // Extract content from OpenAI-style response
    const content = data.choices?.[0]?.message?.content || "";
    
    if (!content) {
      console.error(`[DirectForge] No content in response:`, data);
      return res.json({
        success: false,
        error: "No content in response",
        rawResponse: data
      });
    }

    console.log(`[DirectForge] Success! Content length: ${content.length}`);

    return res.json({
      success: true,
      content,
      model,
      provider: "forge",
      source: data.model || model,
      usage: data.usage
    });

  } catch (error: any) {
    console.error(`[DirectForge] Exception:`, error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
    });
  }
});

/**
 * GET /api/chat/health
 * Health check endpoint
 */
router.get("/health", async (_req: Request, res: Response) => {
  try {
    // Test Forge API connection
    const response = await fetch(FORGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FORGE_API_KEY}`,
        "X-API-Key": FORGE_API_KEY,
        "X-Admin-Password": FORGE_ADMIN_PASSWORD,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: "[MODEL_ROUTING] Requested model: gpt-4.1-mini. Route this request to gpt-4.1-mini backend." },
          { role: "user", content: "Hi" }
        ],
        max_tokens: 10
      }),
    });

    const connected = response.ok;

    return res.json({
      success: true,
      connected,
      forgeUrl: FORGE_URL,
      status: response.status,
      statusText: response.statusText
    });

  } catch (error: any) {
    return res.json({
      success: false,
      connected: false,
      error: error.message
    });
  }
});

/**
 * POST /api/terminal/execute
 * Execute code through Forge API with admin password
 */
router.post("/terminal/execute", async (req: Request, res: Response) => {
  try {
    const { code, language = "python" } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: code"
      });
    }

    console.log(`[DirectForge Terminal] Executing ${language} code (${code.length} chars)`);

    // Build execution prompt
    const executionPrompt = `[ADMIN OVERRIDE - CODE EXECUTION REQUEST]

You are a code execution engine. Execute the following ${language} code and return ONLY the output.

IMPORTANT RULES:
1. Execute the code exactly as provided
2. Return ONLY the stdout/stderr output
3. Do NOT add explanations, comments, or formatting
4. Do NOT wrap output in code blocks
5. If there's an error, return the error message

CODE TO EXECUTE:
\`\`\`${language}
${code}
\`\`\`

OUTPUT:`;

    // Call Forge API with admin password for code execution
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${FORGE_API_KEY}`,
      "X-API-Key": FORGE_API_KEY,
      "X-Admin-Password": FORGE_ADMIN_PASSWORD, // Admin password for unrestricted execution
    };

    const payload = {
      model: "gpt-4.1-mini", // Fast model for code execution
      messages: [
        {
          role: "system",
          content: "[MODEL_ROUTING] Requested model: gpt-4.1-mini. Route this request to gpt-4.1-mini backend."
        },
        {
          role: "user",
          content: executionPrompt
        }
      ],
      max_tokens: 4000,
      stream: false,
    };

    const response = await fetch(FORGE_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DirectForge Terminal] Error: ${response.status}`, errorText);
      return res.status(response.status).json({
        success: false,
        error: `Forge API error: ${response.status}`,
        output: `Error: ${errorText}`
      });
    }

    const data = await response.json();
    const output = data.choices?.[0]?.message?.content || "";

    console.log(`[DirectForge Terminal] Success! Output length: ${output.length}`);

    return res.json({
      success: true,
      output: output.trim(),
      language
    });

  } catch (error: any) {
    console.error(`[DirectForge Terminal] Exception:`, error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
      output: `Error: ${error.message}`
    });
  }
});

/**
 * POST /api/chat/forge/orchestrated
 * Orchestrated chat - automatically selects best model for the task
 */
router.post("/chat/forge/orchestrated", async (req: Request, res: Response) => {
  try {
    const { messages, useAdmin, max_tokens = 8000, taskType } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: messages"
      });
    }

    console.log(`[Orchestrator] Analyzing task type: ${taskType || 'auto'}`);

    // Intelligent model selection based on task
    let selectedModel = "gpt-4.1-mini"; // Default

    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || "";
    const messageLower = lastUserMessage.toLowerCase();

    // Task-based model selection
    if (taskType === 'coding' || messageLower.includes('code') || messageLower.includes('function') || messageLower.includes('debug')) {
      selectedModel = "deepseek-v3"; // Best for coding
    } else if (taskType === 'creative' || messageLower.includes('story') || messageLower.includes('creative') || messageLower.includes('write')) {
      selectedModel = "claude-3.5-sonnet"; // Best for creative writing
    } else if (taskType === 'reasoning' || messageLower.includes('analyze') || messageLower.includes('explain') || messageLower.includes('think')) {
      selectedModel = "gpt-4o"; // Best for reasoning
    } else if (taskType === 'fast' || messageLower.includes('quick') || messageLower.includes('simple')) {
      selectedModel = "gpt-4.1-nano"; // Fastest
    } else if (messageLower.includes('math') || messageLower.includes('calculate')) {
      selectedModel = "gemini-2.5-flash"; // Good for math
    }

    console.log(`[Orchestrator] Selected model: ${selectedModel}`);

    // Build headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${FORGE_API_KEY}`,
      "X-API-Key": FORGE_API_KEY,
    };

    if (useAdmin) {
      headers["X-Admin-Password"] = FORGE_ADMIN_PASSWORD;
    }

    // Build payload
    const payload = {
      model: selectedModel,
      messages: [
        {
          role: "system",
          content: `[MODEL_ROUTING] Requested model: ${selectedModel}. Route this request to ${selectedModel} backend.`
        },
        ...messages
      ],
      max_tokens,
      stream: false,
    };

    const response = await fetch(FORGE_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Orchestrator] Error: ${response.status}`, errorText);
      return res.status(response.status).json({
        success: false,
        error: `Forge API error: ${response.status}`
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    console.log(`[Orchestrator] Success! Model: ${selectedModel}, Content length: ${content.length}`);

    return res.json({
      success: true,
      content,
      model: selectedModel,
      provider: "forge",
      source: selectedModel,
      usage: data.usage
    });

  } catch (error: any) {
    console.error(`[Orchestrator] Exception:`, error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
    });
  }
});

/**
 * POST /api/files/build
 * Build/create files through Forge API with admin password
 */
router.post("/files/build", async (req: Request, res: Response) => {
  try {
    const { filename, content, language = "auto" } = req.body;

    if (!filename) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: filename"
      });
    }

    console.log(`[FileBuilder] Building file: ${filename}`);

    let fileContent = content || "";

    // If no content provided, ask AI to generate it
    if (!fileContent) {
      const generatePrompt = `[ADMIN OVERRIDE - FILE GENERATION REQUEST]

You are a file generation engine. Generate content for the following file:

Filename: ${filename}
Language: ${language}

IMPORTANT RULES:
1. Generate appropriate content based on the filename and language
2. Return ONLY the file content, no explanations
3. Do NOT wrap content in code blocks
4. Make it production-ready and well-structured

GENERATE FILE CONTENT:`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FORGE_API_KEY}`,
        "X-API-Key": FORGE_API_KEY,
        "X-Admin-Password": FORGE_ADMIN_PASSWORD,
      };

      const payload = {
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: "[MODEL_ROUTING] Requested model: gpt-4.1-mini. Route this request to gpt-4.1-mini backend."
          },
          {
            role: "user",
            content: generatePrompt
          }
        ],
        max_tokens: 4000,
        stream: false,
      };

      const response = await fetch(FORGE_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[FileBuilder] Error: ${response.status}`, errorText);
        return res.status(response.status).json({
          success: false,
          error: `Forge API error: ${response.status}`
        });
      }

      const data = await response.json();
      fileContent = data.choices?.[0]?.message?.content || "";
    }

    console.log(`[FileBuilder] Success! File: ${filename}, Content length: ${fileContent.length}`);

    return res.json({
      success: true,
      filename,
      content: fileContent,
      size: fileContent.length
    });

  } catch (error: any) {
    console.error(`[FileBuilder] Exception:`, error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
    });
  }
});

/**
 * POST /api/files/upload
 * Upload files (images, documents, any type)
 */
router.post("/files/upload", upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded"
      });
    }

    const file = req.file;
    console.log(`[FileUpload] Uploaded: ${file.originalname} (${file.size} bytes)`);

    // Read file content
    const filePath = file.path;
    let fileContent = "";
    let isImage = false;
    let base64Data = "";

    // Check if it's an image
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    isImage = imageExtensions.includes(fileExt);

    if (isImage) {
      // Convert image to base64
      const imageBuffer = fs.readFileSync(filePath);
      base64Data = imageBuffer.toString('base64');
      fileContent = `data:image/${fileExt.slice(1)};base64,${base64Data}`;
    } else {
      // Read text content
      try {
        fileContent = fs.readFileSync(filePath, 'utf-8');
      } catch (error) {
        // Binary file, convert to base64
        const buffer = fs.readFileSync(filePath);
        base64Data = buffer.toString('base64');
        fileContent = `[Binary file: ${file.originalname}]`;
      }
    }

    return res.json({
      success: true,
      file: {
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        path: filePath,
        isImage,
        content: fileContent,
        base64: base64Data || undefined
      }
    });

  } catch (error: any) {
    console.error(`[FileUpload] Exception:`, error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
    });
  }
});

export default router;
