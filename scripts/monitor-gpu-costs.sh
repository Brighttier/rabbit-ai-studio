#!/bin/bash
# GPU Cost Monitoring Script

# Configuration
COST_LIMIT_DAILY=5
COST_LIMIT_WEEKLY=35
COST_LIMIT_MONTHLY=150
ALERT_EMAIL="akhare@brighttier.com,khare85@gmail.com,admin@brighttier.com"
INSTANCE_NAME="rabbit-ai-gpu"
ZONE="us-central1-a"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get current date
DATE=$(date '+%Y-%m-%d')
TIME=$(date '+%H:%M:%S')

# Create log directory
LOG_DIR="/home/ubuntu/cost-monitoring"
mkdir -p $LOG_DIR

# Log file
LOG_FILE="$LOG_DIR/cost-monitor-$DATE.log"

# Function to log messages
log_message() {
    echo -e "[$TIME] $1" | tee -a $LOG_FILE
}

# Check GPU utilization
check_gpu() {
    log_message "${YELLOW}Checking GPU utilization...${NC}"
    nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu \
        --format=csv,noheader | tee -a $LOG_FILE
}

# Check instance running time
check_uptime() {
    log_message "${YELLOW}Checking instance uptime...${NC}"
    uptime | tee -a $LOG_FILE
}

# Get current costs
check_costs() {
    log_message "${YELLOW}Checking current costs...${NC}"
    gcloud beta billing accounts get-spend | tee -a $LOG_FILE
}

# Check for low utilization
check_low_utilization() {
    GPU_UTIL=$(nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader | tr -d ' %')
    if [ "$GPU_UTIL" -lt 10 ]; then
        log_message "${RED}WARNING: Low GPU utilization ($GPU_UTIL%)${NC}"
        LOW_UTIL_COUNT=$((LOW_UTIL_COUNT + 1))
        
        # If low utilization for more than 2 hours (12 checks at 10-minute intervals)
        if [ "$LOW_UTIL_COUNT" -gt 12 ]; then
            log_message "${RED}ALERT: Shutting down due to extended low utilization${NC}"
            shutdown_instance
        fi
    else
        LOW_UTIL_COUNT=0
    fi
}

# Emergency shutdown
shutdown_instance() {
    log_message "${RED}EMERGENCY SHUTDOWN INITIATED${NC}"
    
    # Stop all AI services
    sudo systemctl stop ollama
    sudo systemctl stop webui
    sudo systemctl stop comfyui
    
    # Stop the instance
    gcloud compute instances stop $INSTANCE_NAME --zone=$ZONE
    
    # Send alert email
    echo "Emergency shutdown triggered on $INSTANCE_NAME at $TIME" | \
        mail -s "ALERT: GPU Instance Shutdown" $ALERT_EMAIL
}

# Main monitoring loop
log_message "${GREEN}Starting GPU cost monitoring${NC}"
check_gpu
check_uptime
check_costs

# Check if costs exceed limits
CURRENT_COST=$(gcloud beta billing accounts get-spend | grep "currentSpend:" | awk '{print $2}')
if (( $(echo "$CURRENT_COST > $COST_LIMIT_DAILY" | bc -l) )); then
    log_message "${RED}ALERT: Daily cost limit exceeded!${NC}"
    shutdown_instance
fi

# Log completion
log_message "${GREEN}Monitoring check completed${NC}"