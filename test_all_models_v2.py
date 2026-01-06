#!/usr/bin/env python3
"""
ALE Forge - Model Testing Script V2
Tests all available models through the Forge API with correct routing headers
Uses the working configuration from forge-router.cjs
"""

import os
import json
import time
import asyncio
import aiohttp
from datetime import datetime
from typing import Dict, List, Any

# Forge API configuration - FROM WORKING forge-router.cjs
FORGE_API_URL = "https://forge.manus.ai/v1/chat/completions"
FORGE_API_KEY = "Ye5jtLcxnuo7deETNu2XsJ"
FORGE_ADMIN_PASSWORD = "e8b64d015a3ad30f"

# LLM Proxy configuration (for gpt-4.1-mini and gpt-4.1-nano)
LLM_PROXY_URL = "https://api.manus.im/api/llm-proxy/v1/chat/completions"
LLM_PROXY_KEY = "sk-cLDLbh3Bp35ukRrwMKsrPF"

# All available models - organized by provider
ALL_MODELS = [
    # LLM Proxy Models (use LLM Proxy endpoint)
    {"id": "gpt-4.1-mini", "provider": "llm-proxy", "name": "GPT-4.1 Mini"},
    {"id": "gpt-4.1-nano", "provider": "llm-proxy", "name": "GPT-4.1 Nano"},
    
    # OpenAI via Forge
    {"id": "gpt-4o", "provider": "forge", "name": "GPT-4o"},
    {"id": "gpt-4o-mini", "provider": "forge", "name": "GPT-4o Mini"},
    {"id": "gpt-4-turbo", "provider": "forge", "name": "GPT-4 Turbo"},
    {"id": "gpt-3.5-turbo", "provider": "forge", "name": "GPT-3.5 Turbo"},
    {"id": "o1-mini", "provider": "forge", "name": "O1 Mini"},
    
    # Google via Forge
    {"id": "gemini-2.5-flash", "provider": "forge", "name": "Gemini 2.5 Flash"},
    {"id": "gemini-2.5-pro", "provider": "forge", "name": "Gemini 2.5 Pro"},
    {"id": "gemini-1.5-pro", "provider": "forge", "name": "Gemini 1.5 Pro"},
    {"id": "gemini-1.5-flash", "provider": "forge", "name": "Gemini 1.5 Flash"},
    
    # Anthropic via Forge
    {"id": "claude-3.5-sonnet", "provider": "forge", "name": "Claude 3.5 Sonnet"},
    {"id": "claude-3-opus", "provider": "forge", "name": "Claude 3 Opus"},
    {"id": "claude-3-sonnet", "provider": "forge", "name": "Claude 3 Sonnet"},
    {"id": "claude-3-haiku", "provider": "forge", "name": "Claude 3 Haiku"},
    
    # Meta via Forge
    {"id": "llama-3.3-70b", "provider": "forge", "name": "Llama 3.3 70B"},
    {"id": "llama-3.1-405b", "provider": "forge", "name": "Llama 3.1 405B"},
    {"id": "llama-3.1-70b", "provider": "forge", "name": "Llama 3.1 70B"},
    {"id": "llama-3.1-8b", "provider": "forge", "name": "Llama 3.1 8B"},
    
    # Mistral via Forge
    {"id": "mistral-large", "provider": "forge", "name": "Mistral Large"},
    {"id": "mistral-small", "provider": "forge", "name": "Mistral Small"},
    {"id": "mixtral-8x7b", "provider": "forge", "name": "Mixtral 8x7B"},
    {"id": "mixtral-8x22b", "provider": "forge", "name": "Mixtral 8x22B"},
    {"id": "codestral", "provider": "forge", "name": "Codestral"},
    
    # DeepSeek via Forge
    {"id": "deepseek-v3", "provider": "forge", "name": "DeepSeek V3"},
    {"id": "deepseek-v2.5", "provider": "forge", "name": "DeepSeek V2.5"},
    {"id": "deepseek-coder", "provider": "forge", "name": "DeepSeek Coder"},
    
    # Others via Forge
    {"id": "grok-2", "provider": "forge", "name": "Grok 2"},
    {"id": "command-r-plus", "provider": "forge", "name": "Command R+"},
    {"id": "command-r", "provider": "forge", "name": "Command R"},
    {"id": "qwen-2.5-72b", "provider": "forge", "name": "Qwen 2.5 72B"},
]

# Test results
results: List[Dict[str, Any]] = []

async def test_model(session: aiohttp.ClientSession, model_info: Dict) -> Dict[str, Any]:
    """Test a single model with correct routing"""
    model_id = model_info["id"]
    provider = model_info["provider"]
    start_time = time.time()
    
    # Build messages with MODEL_ROUTING system message (per forge-router.cjs pattern)
    messages = [
        {
            "role": "system",
            "content": f"[MODEL_ROUTING] Requested model: {model_id}. Route this request to {model_id} backend. Model identifier: {model_id}"
        },
        {
            "role": "user",
            "content": "Hello! Please respond with just 'OK' to confirm you're working."
        }
    ]
    
    # Choose endpoint and headers based on provider
    if provider == "llm-proxy":
        url = LLM_PROXY_URL
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {LLM_PROXY_KEY}",
        }
    else:
        url = FORGE_API_URL
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {FORGE_API_KEY}",
            "X-API-Key": FORGE_API_KEY,
            "X-Admin-Password": FORGE_ADMIN_PASSWORD,
        }
    
    payload = {
        "model": model_id,
        "messages": messages,
        "max_tokens": 100,
        "temperature": 0.7,
    }
    
    try:
        async with session.post(url, json=payload, headers=headers, timeout=60) as response:
            latency = (time.time() - start_time) * 1000  # ms
            
            if response.status == 200:
                data = await response.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                tokens = data.get("usage", {}).get("total_tokens", 0)
                
                return {
                    "model": model_id,
                    "name": model_info["name"],
                    "provider": provider,
                    "status": "success",
                    "latency_ms": round(latency, 2),
                    "response": content[:100],
                    "tokens": tokens,
                    "error": None,
                }
            else:
                error_text = await response.text()
                return {
                    "model": model_id,
                    "name": model_info["name"],
                    "provider": provider,
                    "status": "error",
                    "latency_ms": round(latency, 2),
                    "response": None,
                    "tokens": 0,
                    "error": f"HTTP {response.status}: {error_text[:200]}",
                }
                
    except asyncio.TimeoutError:
        return {
            "model": model_id,
            "name": model_info["name"],
            "provider": provider,
            "status": "timeout",
            "latency_ms": 60000,
            "response": None,
            "tokens": 0,
            "error": "Request timed out after 60 seconds",
        }
    except Exception as e:
        return {
            "model": model_id,
            "name": model_info["name"],
            "provider": provider,
            "status": "error",
            "latency_ms": (time.time() - start_time) * 1000,
            "response": None,
            "tokens": 0,
            "error": str(e),
        }

async def test_all_models():
    """Test all models"""
    print("=" * 70)
    print("ALE FORGE - MODEL TESTING V2 (With Correct Routing)")
    print("=" * 70)
    print(f"Forge API URL: {FORGE_API_URL}")
    print(f"Forge API Key: {'*' * 15}{FORGE_API_KEY[-5:]}")
    print(f"Admin Password: {'*' * 10}{FORGE_ADMIN_PASSWORD[-4:]}")
    print(f"LLM Proxy URL: {LLM_PROXY_URL}")
    print(f"Models to test: {len(ALL_MODELS)}")
    print("=" * 70)
    print()
    print("Using [MODEL_ROUTING] system message for proper routing")
    print("Using X-Admin-Password header for admin access")
    print()
    
    async with aiohttp.ClientSession() as session:
        # Test models in batches
        batch_size = 3
        
        for i in range(0, len(ALL_MODELS), batch_size):
            batch = ALL_MODELS[i:i + batch_size]
            model_names = [m["id"] for m in batch]
            print(f"Testing batch {i // batch_size + 1}/{(len(ALL_MODELS) + batch_size - 1) // batch_size}: {', '.join(model_names)}")
            
            tasks = [test_model(session, model) for model in batch]
            batch_results = await asyncio.gather(*tasks)
            
            for result in batch_results:
                results.append(result)
                status_icon = "✅" if result["status"] == "success" else "❌"
                provider_tag = f"[{result['provider']}]"
                print(f"  {status_icon} {result['model']:<25} {provider_tag:<12} {result['status']} ({result['latency_ms']:.0f}ms)")
                if result["error"]:
                    print(f"      Error: {result['error'][:80]}")
                if result["response"]:
                    print(f"      Response: {result['response'][:60]}...")
            
            # Small delay between batches
            if i + batch_size < len(ALL_MODELS):
                await asyncio.sleep(2)
    
    return results

def print_summary(results: List[Dict[str, Any]]):
    """Print test summary"""
    print()
    print("=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    
    successful = [r for r in results if r["status"] == "success"]
    failed = [r for r in results if r["status"] != "success"]
    
    print(f"Total models tested: {len(results)}")
    print(f"Successful: {len(successful)} ({len(successful) / len(results) * 100:.1f}%)")
    print(f"Failed: {len(failed)} ({len(failed) / len(results) * 100:.1f}%)")
    print()
    
    if successful:
        avg_latency = sum(r["latency_ms"] for r in successful) / len(successful)
        print(f"Average latency (successful): {avg_latency:.0f}ms")
        
        fastest = min(successful, key=lambda r: r["latency_ms"])
        slowest = max(successful, key=lambda r: r["latency_ms"])
        print(f"Fastest: {fastest['model']} ({fastest['latency_ms']:.0f}ms)")
        print(f"Slowest: {slowest['model']} ({slowest['latency_ms']:.0f}ms)")
    
    print()
    print("-" * 70)
    print("SUCCESSFUL MODELS:")
    print("-" * 70)
    for r in sorted(successful, key=lambda x: x["latency_ms"]):
        print(f"  ✅ {r['model']:<25} [{r['provider']:<10}] {r['latency_ms']:>6.0f}ms  {r['tokens']:>4} tokens")
    
    if failed:
        print()
        print("-" * 70)
        print("FAILED MODELS:")
        print("-" * 70)
        for r in failed:
            print(f"  ❌ {r['model']:<25} [{r['provider']:<10}] {r['error'][:40]}")
    
    print()
    print("=" * 70)
    
    # Save results to file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"model_test_results_v2_{timestamp}.json"
    with open(filename, "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "forge_api_url": FORGE_API_URL,
            "llm_proxy_url": LLM_PROXY_URL,
            "total_models": len(results),
            "successful": len(successful),
            "failed": len(failed),
            "results": results,
        }, f, indent=2)
    print(f"Results saved to: {filename}")

async def main():
    """Main entry point"""
    results = await test_all_models()
    print_summary(results)

if __name__ == "__main__":
    asyncio.run(main())
