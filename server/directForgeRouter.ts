/**
 * Direct Forge API Router
 * No sessions, no cookies - direct Forge API calls like working_chat31.html
 */

import { Router } from "express";
import type { Request, Response } from "express";

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

export default router;
