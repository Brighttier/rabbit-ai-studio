#!/bin/bash

# HuggingFace Setup Script
echo "Setting up HuggingFace configuration..."

# Check if API key is provided
if [ -z "$1" ]; then
    echo "Please provide your HuggingFace API key as an argument:"
    echo "./setup-hf.sh your_api_key_here"
    exit 1
fi

# Export API key
export HUGGINGFACE_API_KEY=$1

# Test the API key
echo "Testing HuggingFace API key..."
curl -s -X POST \
    -H "Authorization: Bearer $HUGGINGFACE_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"inputs": "Test message"}' \
    https://api-inference.huggingface.co/models/mistralai/Mistral-7B-v0.1

if [ $? -eq 0 ]; then
    echo "✓ API key works!"
else
    echo "✗ Error: Could not connect to HuggingFace API. Please check your API key."
    exit 1
fi

# Add API key to environment file
echo "Adding API key to .env.local..."
if [ -f .env.local ]; then
    # Remove existing HF key if present
    sed -i '' '/HUGGINGFACE_API_KEY/d' .env.local
fi
echo "HUGGINGFACE_API_KEY=$1" >> .env.local

# Seed HuggingFace models
echo "Seeding HuggingFace models..."
npx ts-node scripts/seedHFModels.ts

echo "Setup complete! Please restart your development server."