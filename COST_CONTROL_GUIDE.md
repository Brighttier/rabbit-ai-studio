# 💰 GCP GPU Cost Control Guide
## Cost Management for Rabbit AI Studio GPU Instance

### 📊 Cost Breakdown

**Expected Monthly Costs:**
- GPU Instance (Spot): ~$108/month
  - N1-standard-4: $0.14/hour
  - NVIDIA T4 GPU: $0.11/hour
  - Spot discount: ~70% off
  - Final hourly: ~$0.15/hour
- Storage (150GB): ~$20/month
- Network: ~$5-10/month
**Total Expected: ~$145/month**

### 🚨 Critical Cost Controls

1. **Immediate Setup After Approval**
```bash
# Set automatic shutdown if costs exceed $150
gcloud beta billing budgets create \
  --billing-account=YOUR_BILLING_ACCOUNT_ID \
  --display-name="GPU-Cost-Control" \
  --budget-amount=150 \
  --threshold-rules=percent=90,percent=100 \
  --threshold-rule-trigger-email=true

# Create a monitoring alert for high GPU usage
gcloud beta monitoring alerting policies create \
  --display-name="High-GPU-Cost-Alert" \
  --condition="metric.type='compute.googleapis.com/instance/gpu/utilization' AND resource.type='gce_instance' AND metric.labels.instance_name='rabbit-ai-gpu'" \
  --threshold-value=0.8 \
  --duration=1h \
  --trigger-count=1
```

2. **Daily Cost Monitoring**
```bash
#!/bin/bash
# Save as: /home/ubuntu/monitor-costs.sh

# Get today's usage
gcloud billing accounts list
gcloud beta billing accounts get-spend > /home/ubuntu/daily-cost.txt

# Check GPU utilization
nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total --format=csv >> /home/ubuntu/daily-cost.txt
```

3. **Automatic Shutdown Triggers**
- If costs reach 90% of budget ($135)
- If GPU utilization < 10% for 2 hours
- If instance running > 12 hours continuously

### 📝 Daily Checklist

1. **Morning Check (Start of Day)**
   - [ ] Review previous day's cost report
   - [ ] Check GPU utilization history
   - [ ] Verify no unused running processes

2. **During Operation**
   - [ ] Monitor real-time GPU usage
   - [ ] Track API call counts
   - [ ] Watch network egress

3. **Evening Check (End of Day)**
   - [ ] Stop unused models
   - [ ] Clear cache if needed
   - [ ] Save daily cost report

### 🔄 Weekly Cost Review

1. **Every Monday**
   - Review weekly cost trends
   - Identify optimization opportunities
   - Adjust resource allocation

2. **Cost Optimization Steps**
   - Remove unused models
   - Compress model files
   - Clean Docker images

### 🛑 Emergency Shutdown Procedure

If costs spike unexpectedly:

1. **Immediate Actions**
```bash
# Stop the instance
gcloud compute instances stop rabbit-ai-gpu --zone=us-central1-a

# Check current charges
gcloud beta billing accounts get-spend
```

2. **Investigation Steps**
   - Check billing dashboard
   - Review usage logs
   - Identify spike source

### 📊 Monitoring Setup

1. **Dashboard Setup**
```bash
# Create monitoring dashboard
gcloud monitoring dashboards create \
  --display-name="GPU-Cost-Monitor" \
  --config-from-file=dashboard-config.json
```

2. **Alert Configurations**
- Daily cost exceeds $5
- GPU memory > 90%
- Network egress > 50GB/day

### 💡 Cost Optimization Tips

1. **Model Management**
   - Use smaller models when possible
   - Implement model unloading
   - Share models between services

2. **Resource Optimization**
   - Use spot instances
   - Implement auto-shutdown
   - Cache common requests

3. **Network Optimization**
   - Compress responses
   - Cache results locally
   - Limit max tokens/image size

### 📱 Mobile Monitoring

1. **Setup Mobile Alerts**
   - Install GCP mobile app
   - Configure critical alerts
   - Set up SMS notifications

2. **Quick Actions**
   - Instance stop/start
   - View current costs
   - Check GPU usage

### 🔍 Monthly Audit

1. **Review Areas**
   - Usage patterns
   - Cost per service
   - Optimization opportunities

2. **Adjustment Actions**
   - Update budgets
   - Modify resources
   - Optimize workflows

### ⚠️ Critical Thresholds

1. **Daily Limits**
   - Max cost: $5/day
   - GPU hours: 16/day
   - Network: 10GB/day

2. **Weekly Limits**
   - Max cost: $35/week
   - Average GPU usage: 70%
   - Storage growth: 5GB/week

3. **Monthly Targets**
   - Total budget: $150
   - Reserved: $15 buffer
   - Emergency fund: $20

### 📞 Support Contacts

1. **GCP Support**
   - Billing support
   - Technical issues
   - Quota requests

2. **Team Contacts**
   - Primary admin
   - Backup admin
   - Emergency contact

---

**Remember:**
- Always monitor costs daily
- Set up alerts before usage
- Have emergency procedures ready
- Keep contact info updated