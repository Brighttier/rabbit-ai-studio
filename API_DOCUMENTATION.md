# Rabbit AI Studio API Documentation

Welcome to the Rabbit AI Studio API! This document provides comprehensive information on how to integrate AI generation capabilities into your applications.

## Table of Contents

- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [Rate Limits](#rate-limits)
- [Endpoints](#endpoints)
  - [Text Generation](#text-generation)
  - [Image Generation](#image-generation)
  - [Video Generation](#video-generation)
  - [List Models](#list-models)
- [Error Handling](#error-handling)
- [Code Examples](#code-examples)
- [Best Practices](#best-practices)

---

## Getting Started

### Base URL

```
https://rabbit.brighttier.com
```

### Prerequisites

1. Admin account on Rabbit AI Studio
2. API key (obtain from Admin → API Keys)

### Quick Start

1. Log in to [Rabbit AI Studio](https://rabbit.brighttier.com)
2. Navigate to **Admin** → **API Keys**
3. Click **Create New API Key**
4. Copy your API key (shown only once!)
5. Use the key in your API requests

---

## Authentication

All API requests must include an API key in the `Authorization` header:

```http
Authorization: Bearer rabbit_sk_your_api_key_here
```

### Example

```bash
curl https://rabbit.brighttier.com/api/models \
  -H "Authorization: Bearer rabbit_sk_abcd1234..."
```

### Security Notes

- **Never commit API keys** to version control
- Store keys as environment variables
- Rotate keys regularly
- Use different keys for different applications
- Revoke keys immediately if compromised

---

## Rate Limits

| Resource | Limit |
|----------|-------|
| Text generation | 100 requests/minute |
| Image generation | 20 requests/minute |
| Video generation | 20 requests/minute |
| Model listing | 100 requests/minute |

### Rate Limit Headers

Response headers include rate limit information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

---

## Endpoints

### Text Generation

Generate text using AI language models.

**Endpoint:** `POST /api/generate-text`

#### Request Body

```json
{
  "prompt": "string (required)",
  "modelId": "string (required)",
  "systemPrompt": "string (optional)",
  "temperature": "number 0-2 (optional, default: 0.7)",
  "maxTokens": "number 1-8192 (optional, default: 1024)",
  "stream": "boolean (optional, default: false)"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "content": "Generated text content...",
    "modelId": "llama3-8b",
    "usage": {
      "promptTokens": 10,
      "completionTokens": 50,
      "totalTokens": 60
    },
    "finishReason": "stop"
  }
}
```

#### Example (cURL)

```bash
curl -X POST https://rabbit.brighttier.com/api/generate-text \
  -H "Authorization: Bearer rabbit_sk_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a haiku about artificial intelligence",
    "modelId": "llama3-8b",
    "temperature": 0.7,
    "maxTokens": 100
  }'
```

#### Example (Python)

```python
import requests

url = "https://rabbit.brighttier.com/api/generate-text"
headers = {
    "Authorization": "Bearer rabbit_sk_your_api_key",
    "Content-Type": "application/json"
}
data = {
    "prompt": "Write a haiku about artificial intelligence",
    "modelId": "llama3-8b",
    "temperature": 0.7,
    "maxTokens": 100
}

response = requests.post(url, headers=headers, json=data)
result = response.json()

if result["success"]:
    print(result["data"]["content"])
else:
    print(f"Error: {result['error']['message']}")
```

#### Example (JavaScript/Node.js)

```javascript
const response = await fetch('https://rabbit.brighttier.com/api/generate-text', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer rabbit_sk_your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'Write a haiku about artificial intelligence',
    modelId: 'llama3-8b',
    temperature: 0.7,
    maxTokens: 100
  })
});

const result = await response.json();

if (result.success) {
  console.log(result.data.content);
} else {
  console.error('Error:', result.error.message);
}
```

---

### Image Generation

Generate images from text prompts.

**Endpoint:** `POST /api/generate-image`

#### Request Body

```json
{
  "prompt": "string (required)",
  "modelId": "string (required)",
  "negativePrompt": "string (optional)",
  "width": "number (optional, default: 512)",
  "height": "number (optional, default: 512)",
  "numImages": "number 1-4 (optional, default: 1)",
  "guidanceScale": "number 1-20 (optional, default: 7.5)",
  "steps": "number 1-100 (optional, default: 50)",
  "seed": "number (optional, random if not specified)"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "images": ["https://storage.googleapis.com/.../image1.png"],
    "modelId": "stable-diffusion-xl",
    "metadata": {
      "width": 512,
      "height": 512,
      "seed": 123456,
      "steps": 50,
      "guidanceScale": 7.5
    }
  }
}
```

#### Example (cURL)

```bash
curl -X POST https://rabbit.brighttier.com/api/generate-image \
  -H "Authorization: Bearer rabbit_sk_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A majestic lion in the African savanna at sunset, photorealistic",
    "modelId": "stable-diffusion-xl",
    "negativePrompt": "blurry, low quality, distorted",
    "width": 1024,
    "height": 1024,
    "steps": 50
  }'
```

#### Example (Python)

```python
import requests

url = "https://rabbit.brighttier.com/api/generate-image"
headers = {
    "Authorization": "Bearer rabbit_sk_your_api_key",
    "Content-Type": "application/json"
}
data = {
    "prompt": "A majestic lion in the African savanna at sunset, photorealistic",
    "modelId": "stable-diffusion-xl",
    "negativePrompt": "blurry, low quality, distorted",
    "width": 1024,
    "height": 1024,
    "steps": 50
}

response = requests.post(url, headers=headers, json=data)
result = response.json()

if result["success"]:
    image_url = result["data"]["images"][0]
    print(f"Image generated: {image_url}")

    # Download the image
    img_response = requests.get(image_url)
    with open("generated_image.png", "wb") as f:
        f.write(img_response.content)
else:
    print(f"Error: {result['error']['message']}")
```

---

### Video Generation

Generate videos from text prompts or animate images.

**Endpoint:** `POST /api/generate-video`

#### Request Body

```json
{
  "prompt": "string (required)",
  "modelId": "string (required)",
  "inputImage": "string (optional, base64 or URL)",
  "duration": "number 2-10 (optional, default: 5)",
  "fps": "number 6-30 (optional, default: 24)",
  "resolution": "string (optional, default: '720p')",
  "seed": "number (optional, random if not specified)"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "videoUrl": "https://storage.googleapis.com/.../video.mp4",
    "modelId": "svd-xt-1-1",
    "metadata": {
      "duration": 5,
      "fps": 24,
      "resolution": "720p",
      "seed": 789012
    }
  }
}
```

#### Example (cURL)

```bash
curl -X POST https://rabbit.brighttier.com/api/generate-video \
  -H "Authorization: Bearer rabbit_sk_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A serene ocean wave crashing on a beach",
    "modelId": "svd-xt-1-1",
    "duration": 5,
    "fps": 24,
    "resolution": "720p"
  }'
```

---

### List Models

Get all available AI models.

**Endpoint:** `GET /api/models`

#### Query Parameters

- `type` (optional): Filter by model type (`text`, `image`, `video`, `multimodal`)

#### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "llama3-8b",
      "name": "llama3-8b",
      "displayName": "Llama 3 8B",
      "description": "Meta's Llama 3 8B model",
      "provider": "ollama",
      "type": "text",
      "enabled": true,
      "metadata": {
        "contextWindow": 8192,
        "capabilities": ["chat", "completion"]
      }
    }
  ]
}
```

#### Example (cURL)

```bash
curl https://rabbit.brighttier.com/api/models?type=text \
  -H "Authorization: Bearer rabbit_sk_your_api_key"
```

#### Example (Python)

```python
import requests

url = "https://rabbit.brighttier.com/api/models?type=text"
headers = {"Authorization": "Bearer rabbit_sk_your_api_key"}

response = requests.get(url, headers=headers)
result = response.json()

if result["success"]:
    for model in result["data"]:
        print(f"{model['displayName']} ({model['id']})")
```

---

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid API key |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `MODEL_NOT_FOUND` | 404 | Specified model doesn't exist |
| `GENERATION_FAILED` | 500 | AI generation failed |
| `INTERNAL_ERROR` | 500 | Server error |

### Error Handling Example

```python
try:
    response = requests.post(url, headers=headers, json=data)
    result = response.json()

    if not result["success"]:
        error_code = result["error"]["code"]
        error_message = result["error"]["message"]

        if error_code == "RATE_LIMIT_EXCEEDED":
            print("Rate limit exceeded, retrying after 60 seconds...")
            time.sleep(60)
            # Retry request
        elif error_code == "UNAUTHORIZED":
            print("Invalid API key!")
        else:
            print(f"Error: {error_message}")

except requests.exceptions.RequestException as e:
    print(f"Network error: {e}")
```

---

## Code Examples

### Complete Python Example

```python
import requests
import os
from typing import Optional, Dict, Any

class RabbitAI:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://rabbit.brighttier.com"
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    def generate_text(self, prompt: str, model_id: str, **kwargs) -> Dict[str, Any]:
        """Generate text using AI model"""
        data = {
            "prompt": prompt,
            "modelId": model_id,
            **kwargs
        }
        response = requests.post(
            f"{self.base_url}/api/generate-text",
            headers=self.headers,
            json=data
        )
        return response.json()

    def generate_image(self, prompt: str, model_id: str, **kwargs) -> Dict[str, Any]:
        """Generate image using AI model"""
        data = {
            "prompt": prompt,
            "modelId": model_id,
            **kwargs
        }
        response = requests.post(
            f"{self.base_url}/api/generate-image",
            headers=self.headers,
            json=data
        )
        return response.json()

    def list_models(self, model_type: Optional[str] = None) -> Dict[str, Any]:
        """List available models"""
        url = f"{self.base_url}/api/models"
        if model_type:
            url += f"?type={model_type}"
        response = requests.get(url, headers=self.headers)
        return response.json()

# Usage
api_key = os.getenv("RABBIT_API_KEY")
client = RabbitAI(api_key)

# Generate text
result = client.generate_text(
    prompt="Explain quantum computing in simple terms",
    model_id="llama3-8b",
    temperature=0.7,
    maxTokens=200
)

if result["success"]:
    print(result["data"]["content"])
```

### Complete JavaScript Example

```javascript
class RabbitAI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://rabbit.brighttier.com';
    this.headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  async generateText(prompt, modelId, options = {}) {
    const response = await fetch(`${this.baseUrl}/api/generate-text`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        prompt,
        modelId,
        ...options
      })
    });
    return response.json();
  }

  async generateImage(prompt, modelId, options = {}) {
    const response = await fetch(`${this.baseUrl}/api/generate-image`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        prompt,
        modelId,
        ...options
      })
    });
    return response.json();
  }

  async listModels(type = null) {
    const url = type
      ? `${this.baseUrl}/api/models?type=${type}`
      : `${this.baseUrl}/api/models`;
    const response = await fetch(url, { headers: this.headers });
    return response.json();
  }
}

// Usage
const client = new RabbitAI(process.env.RABBIT_API_KEY);

const result = await client.generateText(
  'Explain quantum computing in simple terms',
  'llama3-8b',
  { temperature: 0.7, maxTokens: 200 }
);

if (result.success) {
  console.log(result.data.content);
}
```

---

## Best Practices

### 1. API Key Security

```bash
# Store API key as environment variable
export RABBIT_API_KEY="rabbit_sk_your_key_here"

# Never hardcode in source code
# ❌ BAD
api_key = "rabbit_sk_abc123..."

# ✅ GOOD
api_key = os.getenv("RABBIT_API_KEY")
```

### 2. Error Handling & Retries

```python
import time

def generate_with_retry(client, max_retries=3):
    for attempt in range(max_retries):
        try:
            result = client.generate_text(prompt="Hello", model_id="llama3-8b")
            if result["success"]:
                return result
            elif result["error"]["code"] == "RATE_LIMIT_EXCEEDED":
                time.sleep(60)  # Wait before retry
            else:
                break  # Don't retry other errors
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)  # Exponential backoff
    return None
```

### 3. Efficient Model Selection

```python
# Cache model list
models_cache = client.list_models()["data"]

# Find best model for task
def find_model(task_type):
    return next(
        (m for m in models_cache if m["type"] == task_type and m["enabled"]),
        None
    )

text_model = find_model("text")
```

### 4. Batch Processing

```python
# Process multiple prompts efficiently
prompts = ["prompt1", "prompt2", "prompt3"]
results = []

for prompt in prompts:
    result = client.generate_text(prompt, model_id="llama3-8b")
    results.append(result)
    time.sleep(0.6)  # Rate limit: 100/min = ~0.6s between requests
```

### 5. Streaming for Real-Time UX

```python
# Enable streaming for long responses
result = client.generate_text(
    prompt="Write a long story",
    model_id="llama3-8b",
    stream=True  # Get tokens as they're generated
)
```

---

## Support

For issues or questions:
- **GitHub Issues**: [Report a bug](https://github.com/your-org/rabbit-ai-studio/issues)
- **Documentation**: [Full docs](https://rabbit.brighttier.com/docs)
- **Email**: support@brighttier.com

---

**Last Updated**: 2025-10-23
**API Version**: 1.0.0
