# Google Secret Manager Setup Guide

This guide will help you create the required secrets for Firebase App Hosting.

## Prerequisites

1. Enable Secret Manager API:
   - Go to: https://console.cloud.google.com/apis/library/secretmanager.googleapis.com?project=tanzen-186b4
   - Click "ENABLE"

## Step 1: Create Secrets in Secret Manager

Go to Secret Manager: https://console.cloud.google.com/security/secret-manager?project=tanzen-186b4

### Create the following secrets:

#### 1. firebase-client-email
- Click "CREATE SECRET"
- Name: `firebase-client-email`
- Secret value: `firebase-adminsdk-fbsvc@tanzen-186b4.iam.gserviceaccount.com`
- Click "CREATE SECRET"

#### 2. firebase-private-key
- Click "CREATE SECRET"
- Name: `firebase-private-key`
- Secret value (paste the entire key **without outer quotes**):
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCjpmK55krG9Y5K
upLIazQzZLKast5cm4FWRAqKzjcJz870r7ReLuDutQEzPP4237wS2qwYry73jug4
lTMFHIdrxAJtlQRhzkHl3bYkTSTbq0N6aOLic7bGDV7VAZwAAWTluhF+Drm+Lizd
tUp+ZooVLbxDrx+6+HTsPyOz2dWpSyj3MQnEN75+c85WHWb658RLoQGFZlzcwcXn
i+ki4M8dLKYO1i1W65wSO4W6wvty4XL+mNnzB18Yqk21C1GMJTaAT8BueGtbQ5vA
+k4IqG/AokGMaPgcZmMjgSvoXiwysicOesErrn6YE88JY/Cv2VYT1LIiA+nHtj2L
3j4RSGWZAgMBAAECggEAAOzHA6rCVjvup4veZuhhAL/Bv3YU8HKm8uHd9vx4Ll03
G9Lr/6XfYS0zHVY4gzIVUgkowXFcBpiPX29Lo1L1J2Era/GHqmkMBLL4FveiQBhi
GgycG6nwj0+Y1Zz1g/QXqeS47JZD60gMVBFBcCCl1Ypoofx/ZWmG36VYgk+2d9QR
zg74kmXauBkE/KoHP4EzYyR9SX20BqMQqMYpEYgZxqcXWqb7UR86uBLNnKJG1d9W
WLVhe+DqJ5clz8DFXmQOp9kqrmfeVjCDnqC4PIXqHX/i0P/rWoWAukE/h0jxQM4F
WaK2AsMjYSVO8gG24DL7zhFET0en16GzfvdYPD5acQKBgQDPTPw7SXh/s3ZwvXA4
0t9T44TOhhELzkDb2JB4UZihVFz2CcookaQ94XzcggpQ9mJI9tBWq7Qv6SOg7+ua
/xXkdj33LbQv9l28o5WE85E62JTg1cvugsEE+nLCxWOIfU21+LS6N43deFaFnQvV
zss59u8ZZRpWoym387oSRe9yvwKBgQDKGEDPvrzQhPM3Yyvb0XfJveW3byrMrLZ7
CJwr6nX/GGJ7ZL7ogBAvrKbTodo1KkT06zhYYvjCdw7UO9/nyXKsyGUv1oDQ6vHk
IZUfB/4pJbOWSXT7v8IV5VdE1CO8fPGayojl3cUGHH/Zp5pl2+ZMCwQF1l7Yv/US
rfQQ/G01pwKBgAViNHK9t7lpSbwnz1BKea5ODFbouGycEKck+quFQvd9n2RsYKmp
DqDkyD9ZyTbND0Rh1ItLrkRIQ7qcQHwn/8ONJpLSxwkv1sNdZDattKnYkhU8uC0b
jDO65VwVkD4tMuV07gygALkttOGHcJU+55w7w33fWE3DswOp+r0av9s1AoGAFJCl
P76sHhf5XACGfQbyxp/BWYpBc7R7mUeGBN4GBeBoXSAiYSxu+Tr7evu0ZcaYX8fz
4uKnZ7qP0r8JCOAyAC0gRt7wGtJdrRZRw2ef0HYasUdmVRvtVycQW1uvC0Y3m8XS
annHy9holjB9ALKA2+ofDa0D19Co0q7K8FOPlW8CgYEAwtszyTUhLvcWjdEShD1H
BPb+0D7Kyxxr8Rr5q8JWnEDhIfcmxzCYIfh9kHeivJ7qyy88NE5ZOqEJyQgoFAUg
gphtLZOEOd7VRCss/9gxweLI8mKLmK5hEbSW3d1EDgwT68GqTZrA3HWS6MW4LFqu
ylkLccmLKVSzMgJ+r75eiwk=
-----END PRIVATE KEY-----
```
- **Important**: Keep the `\n` characters as newlines in the text box
- Click "CREATE SECRET"

#### 3. huggingface-api-key
- Click "CREATE SECRET"
- Name: `huggingface-api-key`
- Secret value: `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`
- Click "CREATE SECRET"

#### 4. replicate-api-key (Optional - if you have it)
- Click "CREATE SECRET"
- Name: `replicate-api-key`
- Secret value: `<your-replicate-api-key>`
- Click "CREATE SECRET"

#### 5. openrouter-api-key (Optional - if you have it)
- Click "CREATE SECRET"
- Name: `openrouter-api-key`
- Secret value: `<your-openrouter-api-key>`
- Click "CREATE SECRET"

## Step 2: Grant Access to Firebase App Hosting Service Account

For each secret you created:

1. Click on the secret name
2. Go to the "PERMISSIONS" tab
3. Click "GRANT ACCESS"
4. In "New principals" field, add: `firebase-app-hosting-compute@tanzen-186b4.iam.gserviceaccount.com`
5. Select role: **Secret Manager Secret Accessor**
6. Click "SAVE"

**Or use this direct link to IAM:**
https://console.cloud.google.com/iam-admin/iam?project=tanzen-186b4

Add the service account with "Secret Manager Secret Accessor" role if not already present.

## Step 3: Verify apphosting.yaml

The `apphosting.yaml` file has been updated to reference these secrets. Make sure it's committed to your repository.

## Step 4: Trigger Deployment

Once secrets are created and permissions granted:

1. Commit and push the `apphosting.yaml` changes:
   ```bash
   git add apphosting.yaml
   git commit -m "Add Secret Manager integration"
   git push origin main
   ```

2. Firebase will automatically trigger a new deployment

3. Monitor deployment at:
   https://console.firebase.google.com/project/tanzen-186b4/apphosting/rabbit-ai-studio-main

## Secrets Summary

Required secrets in Secret Manager:
- ✅ `firebase-client-email` - Firebase Admin service account email
- ✅ `firebase-private-key` - Firebase Admin private key
- ✅ `huggingface-api-key` - Hugging Face API key
- ⚠️ `replicate-api-key` - Replicate API key (optional)
- ⚠️ `openrouter-api-key` - OpenRouter API key (optional)

## Troubleshooting

### Error: "Secret not found"
- Make sure the secret name matches exactly (case-sensitive)
- Check that the secret exists in the correct project

### Error: "Permission denied"
- Verify the service account has "Secret Manager Secret Accessor" role
- Check IAM permissions at: https://console.cloud.google.com/iam-admin/iam?project=tanzen-186b4

### Build fails with "undefined" environment variables
- Check that secrets are created with the exact names in `apphosting.yaml`
- Verify permissions are granted to `firebase-app-hosting-compute@tanzen-186b4.iam.gserviceaccount.com`

## Service Account

Firebase App Hosting Service Account:
```
firebase-app-hosting-compute@tanzen-186b4.iam.gserviceaccount.com
```

This service account needs access to all secrets for the application to work.
