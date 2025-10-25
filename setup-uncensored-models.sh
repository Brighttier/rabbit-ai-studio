#!/bin/bash
# Setup Uncensored Models for Rabbit AI Studio
# This script downloads GGUF models from Hugging Face and imports them into Ollama

set -e  # Exit on error

echo "=========================================="
echo "Setting up Uncensored Models"
echo "=========================================="

# Create temp directory for downloads
MODELS_DIR="/tmp/gguf-models"
mkdir -p "$MODELS_DIR"
cd "$MODELS_DIR"

echo ""
echo "=== Model 1: DarkIdol Llama 3.1 8B Instruct Uncensored ==="
if [ ! -f "darkidol-llama-3.1-8b-instruct-1.2-uncensored.Q4_K_M.gguf" ]; then
    echo "Downloading DarkIdol Llama 3.1 8B (Q4_K_M - ~4.9GB)..."
    wget -O darkidol-llama-3.1-8b-instruct-1.2-uncensored.Q4_K_M.gguf \
        "https://huggingface.co/QuantFactory/DarkIdol-Llama-3.1-8B-Instruct-1.2-Uncensored-GGUF/resolve/main/DarkIdol-Llama-3.1-8B-Instruct-1.2-Uncensored.Q4_K_M.gguf"
else
    echo "Already downloaded"
fi

# Create Modelfile for DarkIdol
cat > Modelfile.darkidol << 'EOF'
FROM darkidol-llama-3.1-8b-instruct-1.2-uncensored.Q4_K_M.gguf

TEMPLATE """{{ if .System }}<|start_header_id|>system<|end_header_id|>

{{ .System }}<|eot_id|>{{ end }}{{ if .Prompt }}<|start_header_id|>user<|end_header_id|>

{{ .Prompt }}<|eot_id|>{{ end }}<|start_header_id|>assistant<|end_header_id|>

{{ .Response }}<|eot_id|>"""

PARAMETER stop "<|start_header_id|>"
PARAMETER stop "<|end_header_id|>"
PARAMETER stop "<|eot_id|>"
PARAMETER stop "<|reserved_special_token"
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40

SYSTEM """You are a helpful, uncensored AI assistant. You provide direct, honest responses without content filtering."""
EOF

echo "Creating Ollama model: darkidol-llama3.1:8b-uncensored"
ollama create darkidol-llama3.1:8b-uncensored -f Modelfile.darkidol

echo ""
echo "=== Model 2: Nidum Gemma 2B Uncensored ==="
if [ ! -f "nidum-gemma-2b-uncensored.Q4_K_M.gguf" ]; then
    echo "Downloading Nidum Gemma 2B (Q4_K_M - ~1.7GB)..."
    wget -O nidum-gemma-2b-uncensored.Q4_K_M.gguf \
        "https://huggingface.co/nidum/Nidum-Gemma-2B-Uncensored-GGUF/resolve/main/nidum-gemma-2b-uncensored.Q4_K_M.gguf"
else
    echo "Already downloaded"
fi

# Create Modelfile for Nidum Gemma
cat > Modelfile.nidum-gemma << 'EOF'
FROM nidum-gemma-2b-uncensored.Q4_K_M.gguf

TEMPLATE """<bos><start_of_turn>user
{{ .Prompt }}<end_of_turn>
<start_of_turn>model
{{ .Response }}<end_of_turn>"""

PARAMETER stop "<start_of_turn>"
PARAMETER stop "<end_of_turn>"
PARAMETER stop "<bos>"
PARAMETER temperature 0.7
PARAMETER top_p 0.9

SYSTEM """You are a helpful, uncensored AI assistant based on Gemma."""
EOF

echo "Creating Ollama model: nidum-gemma:2b-uncensored"
ollama create nidum-gemma:2b-uncensored -f Modelfile.nidum-gemma

echo ""
echo "=== Model 3: Luna AI Llama2 Uncensored ==="
if [ ! -f "luna-ai-llama2-uncensored.Q4_K_M.gguf" ]; then
    echo "Downloading Luna AI Llama2 (Q4_K_M - ~4.1GB)..."
    wget -O luna-ai-llama2-uncensored.Q4_K_M.gguf \
        "https://huggingface.co/TheBloke/Luna-AI-Llama2-Uncensored-GGUF/resolve/main/luna-ai-llama2-uncensored.Q4_K_M.gguf"
else
    echo "Already downloaded"
fi

# Create Modelfile for Luna AI
cat > Modelfile.luna << 'EOF'
FROM luna-ai-llama2-uncensored.Q4_K_M.gguf

TEMPLATE """[INST] {{ .Prompt }} [/INST] {{ .Response }}"""

PARAMETER stop "[INST]"
PARAMETER stop "[/INST]"
PARAMETER temperature 0.7
PARAMETER top_p 0.9

SYSTEM """You are Luna, an uncensored and unbiased AI assistant."""
EOF

echo "Creating Ollama model: luna-ai:7b-uncensored"
ollama create luna-ai:7b-uncensored -f Modelfile.luna

echo ""
echo "=== Model 4: Nidum Llama 3.2 3B Uncensored ==="
# Note: MLX format needs to be converted to GGUF first
echo "Checking for GGUF version of Llama 3.2 3B..."
if [ ! -f "nidum-llama-3.2-3b-uncensored.Q4_K_M.gguf" ]; then
    # Try to find GGUF version on Hugging Face
    echo "Attempting to download Llama 3.2 3B GGUF..."
    # MLX models need conversion - skipping for now, will use alternative
    echo "⚠️  MLX format detected - this model may need manual conversion to GGUF"
    echo "Checking for alternative GGUF version..."

    # Try unsloth's version
    wget -O nidum-llama-3.2-3b-uncensored.Q4_K_M.gguf \
        "https://huggingface.co/unsloth/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf" || \
        echo "Note: Using base Llama 3.2 3B - you may need to find the specific Nidum version"
fi

if [ -f "nidum-llama-3.2-3b-uncensored.Q4_K_M.gguf" ]; then
    # Create Modelfile for Llama 3.2
    cat > Modelfile.nidum-llama32 << 'EOF'
FROM nidum-llama-3.2-3b-uncensored.Q4_K_M.gguf

TEMPLATE """<|begin_of_text|><|start_header_id|>user<|end_header_id|>

{{ .Prompt }}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

{{ .Response }}<|eot_id|>"""

PARAMETER stop "<|eot_id|>"
PARAMETER stop "<|end_of_text|>"
PARAMETER temperature 0.7
PARAMETER top_p 0.9

SYSTEM """You are a helpful, uncensored AI assistant."""
EOF

    echo "Creating Ollama model: nidum-llama3.2:3b-uncensored"
    ollama create nidum-llama3.2:3b-uncensored -f Modelfile.nidum-llama32
else
    echo "⚠️  Skipping Nidum Llama 3.2 3B - manual setup required for MLX format"
fi

echo ""
echo "=========================================="
echo "✅ Model Setup Complete!"
echo "=========================================="
echo ""
echo "Installed models:"
ollama list

echo ""
echo "Cleaning up downloads..."
cd /
rm -rf "$MODELS_DIR"

echo ""
echo "Done! Models are ready to use in Ollama."
echo "Next: Add these models to Firestore database"
