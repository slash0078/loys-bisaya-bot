# LOYS Pisowifi Fibernetworks - Bisaya AI Bot - Deploy Package

## What's inside - JSON Trained AI
- `loys_import_ready.json` - Your main training JSON (11 plans + flows)
- `server.js` - Express server that IMPORTS JSON = TRAINS AI
- `loys_train.jsonl` - For OpenAI / Meta AI Studio fine-tuning
- `manychat_knowledge_base.csv` - Import to ManyChat AI Knowledge Base
- `manychat_flow_import.json` - ManyChat flows
- `manychat_ai_intents.json` - ManyChat AI Steps

## Deploy in 2 minutes

### Option 1: Render.com (Free)
1. Zip this folder or push to GitHub
2. Render > New Web Service > Connect repo
3. Build: npm install | Start: npm start
4. Add ENV: PAGE_ACCESS_TOKEN, VERIFY_TOKEN
5. Copy URL: https://your-app.onrender.com/webhook

### Option 2: Pisowifi Server / VPS
```bash
npm install
npm start
# runs on port 3000
# PM2: pm2 start server.js --name loys-bot
```

### Option 3: ManyChat (No Code)
1. ManyChat > Settings > AI > Knowledge Base > Import CSV > manychat_knowledge_base.csv
2. OR Automation > External Request > POST https://your-app.onrender.com/webhook
3. Body: { "message": "{{last_input_text}}" }

### Messenger Setup
Facebook Developers > Webhook > https://your-app.onrender.com/webhook/messenger
Verify Token: loys_verify_2024
Subscribe to: messages

## Test
curl -X POST https://your-app.onrender.com/webhook -H "Content-Type: application/json" -d '{"message":"Plan799"}'

Contact: 09999690008 | GCash: 09664903825 / 09999690008 (SHN J)
