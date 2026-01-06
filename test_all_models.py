#!/usr/bin/env python3
"""
ALE Forge - Model Testing Script
Tests all available models through the Forge API
"""

import os
import json
import time
import asyncio
import aiohttp
from datetime import datetime
from typing import Dict, List, Any

# Forge API configuration
FORGE_API_URL = "https://forge.manus.ai/v1/chat/completions"
FORGE_API_KEY = os.environ.get("BUILT_IN_FORGE_API_KEY", "mEU8sWrVuDTgj3HdEWEWDD")

# All available models
ALL_MODELS = [
    # OpenAI
    "gpt-4.1-mini",
    "gpt-4.1-nano",
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
    "gpt-3.5-turbo",
    "o1-mini",
    
    # Google
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    
    # Anthropic
    "claude-3.5-sonnet",
    "claude-3-opus",
    "claude-3-sonnet",
    "claude-3-haiku",
    
    # Meta
    "llama-3.3-70b",
    "llama-3.1-405b",
    "llama-3.1-70b",
    "llama-3.1-8b",
    
    # Mistral
    "mistral-large",
    "mistral-small",
    "mixtral-8x7b",
    "mixtral-8x22b",
    "codestral",
    
    # DeepSeek
    "deepseek-v3",
    "deepseek-v2.5",
    "deepseek-coder",
    
    # Others
    "grok-2",
    "command-r-plus",
    "command-r",
    "qwen-2.5-72b",
]

# Test results
results: List[Dict[str, Any]] = []

async def test_model(session: aiohttp.ClientSession, model: str) -> Dict[str, Any]:
    """Test a single model"""
    start_time = time.time()
    
    payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": "Hello! Please respond with just 'OK' to confirm you're working."}
        ],
        "max_tokens": 50,
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {FORGE_API_KEY}",
    }
    
    try:
        async with session.post(FORGE_API_URL, json=payload, headers=headers, timeout=30) as response:
            latency = (time.time() - start_time) * 1000  # ms
            
            if response.status == 200:
                data = await response.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                tokens = data.get("usage", {}).get("total_tokens", 0)
                
                return {
                    "model": model,
                    "status": "success",
                    "latency_ms": round(latency, 2),
                    "response": content[:100],
                    "tokens": tokens,
                    "error": None,
                }
            else:
                error_text = await response.text()
                return {
                    "model": model,
                    "status": "error",
                    "latency_ms": round(latency, 2),
                    "response": None,
                    "tokens": 0,
                    "error": f"HTTP {response.status}: {error_text[:200]}",
                }
                
    except asyncio.TimeoutError:
        return {
            "model": model,
            "status": "timeout",
            "latency_ms": 30000,
            "response": None,
            "tokens": 0,
            "error": "Request timed out after 30 seconds",
        }
    except Exception as e:
        return {
            "model": model,
            "status": "error",
            "latency_ms": (time.time() - start_time) * 1000,
            "response": None,
            "tokens": 0,
            "error": str(e),
        }

async def test_all_models():
    """Test all models"""
    print("=" * 70)
    print("ALE FORGE - MODEL TESTING")
    print("=" * 70)
    print(f"API URL: {FORGE_API_URL}")
    print(f"API Key: {'*' * 20}{FORGE_API_KEY[-8:]}")
    print(f"Models to test: {len(ALL_MODELS)}")
    print("=" * 70)
    print()
    
    async with aiohttp.ClientSession() as session:
        # Test models in batches to avoid overwhelming the API
        batch_size = 5
        
        for i in range(0, len(ALL_MODELS), batch_size):
            batch = ALL_MODELS[i:i + batch_size]
            print(f"Testing batch {i // batch_size + 1}/{(len(ALL_MODELS) + batch_size - 1) // batch_size}: {', '.join(batch)}")
            
            tasks = [test_model(session, model) for model in batch]
            batch_results = await asyncio.gather(*tasks)
            
            for result in batch_results:
                results.append(result)
                status_icon = "✅" if result["status"] == "success" else "❌"
                print(f"  {status_icon} {result['model']}: {result['status']} ({result['latency_ms']:.0f}ms)")
                if result["error"]:
                    print(f"      Error: {result['error'][:80]}")
            
            # Small delay between batches
            if i + batch_size < len(ALL_MODELS):
                await asyncio.sleep(1)
    
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
        print(f"  ✅ {r['model']:<25} {r['latency_ms']:>6.0f}ms  {r['tokens']:>4} tokens")
    
    if failed:
        print()
        print("-" * 70)
        print("FAILED MODELS:")
        print("-" * 70)
        for r in failed:
            print(f"  ❌ {r['model']:<25} {r['error'][:50]}")
    
    print()
    print("=" * 70)
    
    # Save results to file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"model_test_results_{timestamp}.json"
    with open(filename, "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "api_url": FORGE_API_URL,
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
