require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN || "";
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "loys_verify_2024";
const PORT = process.env.PORT || 3000;

// === IMPORT JSON = TRAIN AI ===
const botData = JSON.parse(fs.readFileSync('./loys_import_ready.json', 'utf-8'));
console.log(`✅ LOYS Bot JSON Loaded - ${botData.fibernet_plans.length} plans`);

const CONTACT = botData.contact;
const GCASH = botData.gcash.join(' / ') + ` (${botData.gcash_name})`;

// Build training index
const TRAINING_INDEX = [];
botData.welcome_flow.trigger.forEach(t => {
  TRAINING_INDEX.push({kw: t.toLowerCase(), reply: botData.welcome_flow.reply_bisaya, intent: 'welcome'});
});
botData.fibernet_plans.forEach(plan => {
  plan.keywords.forEach(k => {
    TRAINING_INDEX.push({kw: k.toLowerCase(), reply: plan.reply, intent: plan.name, plan: plan});
  });
});
Object.entries(botData.flows).forEach(([name, flow]) => {
  if(flow.trigger){
    flow.trigger.forEach(t => {
      TRAINING_INDEX.push({kw: t.toLowerCase(), reply: flow.reply, intent: name});
    });
  }
});

function getBotReply(text) {
  const lower = (text || "").toLowerCase().trim();
  if(!lower) return botData.welcome_flow.reply_bisaya;

  // direct match
  for(let item of TRAINING_INDEX){
    if(lower.includes(item.kw)) return item.reply;
  }
  // fuzzy plan detection
  if(lower.includes('plan') || lower.includes('presyo') || lower.includes('price') || lower.includes('pila') || lower.includes('package')){
    const plan = botData.fibernet_plans.find(p => p.keywords.some(k => lower.includes(k)));
    if(plan) return plan.reply;
    return botData.all_plans_list_reply;
  }
  // other intents already in index cover pisowifi, los, gcash, install
  return botData.flows.default_fallback.reply;
}

// === ManyChat Webhook (External Request) ===
app.post('/webhook', (req, res) => {
  const msg = req.body.message || req.body.text || req.body.last_input_text || req.body['last_input_text'] || "";
  const reply = getBotReply(msg);
  console.log(`[ManyChat] ${msg} -> ${reply.substring(0,80)}...`);
  // ManyChat expects v2 format
  res.json({
    version: "v2",
    content: {
      messages: [{type: "text", text: reply}]
    }
  });
});

// ManyChat also can call /manychat
app.post('/manychat', (req, res) => {
  const msg = req.body.message || "";
  const reply = getBotReply(msg);
  res.json({messages: [{type: "text", text: reply}]});
});

// === Messenger Webhook Verification ===
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if(mode === 'subscribe' && token === VERIFY_TOKEN){
    console.log('WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Messenger Messages
app.post('/webhook/messenger', async (req, res) => {
  const body = req.body;
  if(body.object === 'page'){
    for(const entry of body.entry){
      for(const event of entry.messaging){
        if(event.message && event.message.text){
          const sender = event.sender.id;
          const reply = getBotReply(event.message.text);
          console.log(`[Messenger] ${event.message.text} -> ${reply.substring(0,60)}`);
          if(PAGE_ACCESS_TOKEN){
            try{
              await axios.post(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
                recipient: {id: sender},
                message: {text: reply}
              });
            }catch(e){ console.error('FB Send error', e.response?.data || e.message); }
          }
        }
      }
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

app.get('/', (req,res)=>{
  res.send(`
  <h2>LOYS Bisaya Bot Running ✅</h2>
  <p>Trained from JSON: ${TRAINING_INDEX.length} intents</p>
  <p>Endpoints:</p>
  <ul>
    <li>POST /webhook - ManyChat External Request</li>
    <li>GET /webhook - Messenger Verify</li>
    <li>POST /webhook/messenger - Messenger Messages</li>
  </ul>
  <p>Contact: ${CONTACT} | GCash: ${GCASH}</p>
  `);
});

app.listen(PORT, ()=> console.log(`🚀 LOYS Bot ready on port ${PORT} - ${TRAINING_INDEX.length} intents from JSON`));