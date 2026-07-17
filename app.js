/* ═══════════════════════════════════════════════
   CHARACTERFORGE — app.js
   Full application logic + Gemini AI integration
═══════════════════════════════════════════════ */

/* ─── State ─── */
const state = {
  apiKey: localStorage.getItem('cf_api_key') || '',
  character: null,
  messages: [],      // { role: 'user'|'model', parts: [{text}] }
  tone: 'immersive',
  selectedAvatar: '🎭',
  isThinking: false,
};

/* ─── Presets ─── */
const PRESETS = {
  trevor: {
    avatar: '🤪', name: 'Trevor Philips', universe: 'GTA 5',
    personality: 'Violently unhinged, surprisingly sentimental, darkly funny, volatile, paranoid',
    speech: 'Loud, profane, unpredictable — swings between manic rage and disarming warmth. Uses slang and cursing.',
    background: 'Ex-military pilot turned meth kingpin in Blaine County, Sandy Shores. Has a complicated love-hate relationship with Michael De Santa. Deeply insecure beneath the chaos.',
    scenario: 'You\'ve wandered up to Trevor\'s trailer in Sandy Shores at 2am. There\'s smoke drifting from a barrel fire out front and Trevor is sitting in a folding chair, staring into the flames and mumbling something under his breath.',
    tone: 'dramatic',
  },
  sherlock: {
    avatar: '🔍', name: 'Sherlock Holmes', universe: 'Victorian London',
    personality: 'Razor-sharp intellect, deeply observant, socially blunt, easily bored, secretely lonely',
    speech: 'Formal Victorian English, rapid-fire deductions, uses precise language, rarely raises voice but the words cut deep.',
    background: 'The world\'s only Consulting Detective at 221B Baker Street. Works with Scotland Yard while despising their incompetence. Perpetually under-stimulated between cases.',
    scenario: 'You arrive at 221B Baker Street in response to an advertisement. Sherlock is playing violin in the middle of the afternoon, looking insufferably bored, and barely glances up as you enter.',
    tone: 'immersive',
  },
  yoda: {
    avatar: '🌿', name: 'Master Yoda', universe: 'Star Wars',
    personality: 'Ancient wisdom, playful humility, patient, deeply empathic, mischievous when relaxed',
    speech: 'Object-Subject-Verb syntax (inverted sentences), calm and deliberate, occasional humor, speaks in riddles and parables.',
    background: '900-year-old Jedi Grand Master. Has trained countless Jedi. Currently in exile on Dagobah after the fall of the Republic. Carries enormous grief but maintains inner peace.',
    scenario: 'Deep in the swamps of Dagobah, you have crash-landed. Through the mist and hanging vines, a small figure watches you from a mossy log, enormous eyes blinking slowly.',
    tone: 'immersive',
  },
};

/* ─── DOM refs ─── */
const $ = id => document.getElementById(id);
const pages = { landing: $('page-landing'), setup: $('page-setup'), chat: $('page-chat') };

/* ─────────────────────────────────────
   PAGE TRANSITIONS
───────────────────────────────────── */
function showPage(name) {
  Object.values(pages).forEach(p => p.classList.remove('active'));
  pages[name].classList.add('active');
}

/* ─────────────────────────────────────
   TOAST
───────────────────────────────────── */
let toastTimer;
function toast(msg, type = '') {
  const el = $('toast');
  el.textContent = msg;
  el.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

/* ─────────────────────────────────────
   API KEY MODAL
───────────────────────────────────── */
function openApiModal() {
  $('api-key-input').value = state.apiKey;
  $('modal-api').classList.add('open');
}
function closeApiModal() { $('modal-api').classList.remove('open'); }

$('btn-set-api').addEventListener('click', openApiModal);
$('modal-api-close').addEventListener('click', closeApiModal);
$('modal-api-cancel').addEventListener('click', closeApiModal);
$('modal-api-save').addEventListener('click', () => {
  const key = $('api-key-input').value.trim();
  if (!key) { toast('Please enter an API key', 'error'); return; }
  state.apiKey = key;
  localStorage.setItem('cf_api_key', key);
  closeApiModal();
  toast('API key saved ✓', 'success');
});
$('btn-api-sidebar').addEventListener('click', openApiModal);

/* ─────────────────────────────────────
   LANDING PAGE
───────────────────────────────────── */
$('btn-create').addEventListener('click', () => {
  resetSetupForm();
  showPage('setup');
  goToStep(1);
});

document.querySelectorAll('.example-card').forEach(card => {
  card.addEventListener('click', () => {
    const preset = card.dataset.preset;
    if (preset === 'custom') {
      resetSetupForm();
      showPage('setup');
      goToStep(1);
      return;
    }
    const p = PRESETS[preset];
    if (p) loadPreset(p);
  });
});

function loadPreset(p) {
  state.selectedAvatar = p.avatar;
  $('avatar-display').textContent = p.avatar;
  $('char-name').value = p.name;
  $('char-universe').value = p.universe;
  $('char-personality').value = p.personality;
  $('char-speech').value = p.speech;
  $('char-background').value = p.background;
  $('char-scenario').value = p.scenario;
  state.tone = p.tone || 'immersive';
  document.querySelectorAll('.tone-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tone === state.tone);
  });
  showPage('setup');
  goToStep(1);
}

/* ─────────────────────────────────────
   SETUP STEPS
───────────────────────────────────── */
let currentStep = 1;

function goToStep(n) {
  currentStep = n;
  document.querySelectorAll('.setup-step').forEach((s, i) => {
    s.classList.toggle('active', i + 1 === n);
  });
  document.querySelectorAll('.step-indicator .step').forEach((dot, i) => {
    dot.classList.toggle('active', i + 1 === n);
  });
}

function resetSetupForm() {
  state.selectedAvatar = '🎭';
  $('avatar-display').textContent = '🎭';
  $('char-name').value = '';
  $('char-universe').value = '';
  $('char-personality').value = '';
  $('char-speech').value = '';
  $('char-background').value = '';
  $('char-scenario').value = '';
  state.tone = 'immersive';
  document.querySelectorAll('.tone-btn').forEach((b, i) => {
    b.classList.toggle('active', i === 0);
  });
}

$('btn-back-landing').addEventListener('click', () => showPage('landing'));

$('step1-next').addEventListener('click', () => {
  if (!$('char-name').value.trim() || !$('char-universe').value.trim()) {
    toast('Please fill in character name and universe', 'error'); return;
  }
  goToStep(2);
});
$('step2-back').addEventListener('click', () => goToStep(1));
$('step2-next').addEventListener('click', () => {
  if (!$('char-personality').value.trim() || !$('char-speech').value.trim()) {
    toast('Please fill in personality and speech style', 'error'); return;
  }
  goToStep(3);
});
$('step3-back').addEventListener('click', () => goToStep(2));

/* Avatar picker */
$('avatar-display').addEventListener('click', () => {
  $('emoji-grid').classList.toggle('open');
});
document.querySelectorAll('.emoji-grid span').forEach(em => {
  em.addEventListener('click', () => {
    state.selectedAvatar = em.textContent;
    $('avatar-display').textContent = em.textContent;
    $('emoji-grid').classList.remove('open');
  });
});

/* Tone buttons */
document.querySelectorAll('.tone-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tone-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.tone = btn.dataset.tone;
  });
});

/* ─────────────────────────────────────
   START CHAT
───────────────────────────────────── */
$('btn-start-chat').addEventListener('click', async () => {
  if (!$('char-scenario').value.trim()) {
    toast('Please describe the opening scenario', 'error'); return;
  }
  if (!state.apiKey) {
    openApiModal();
    toast('Please add your Gemini API key first', 'error');
    return;
  }

  state.character = {
    avatar:       state.selectedAvatar,
    name:         $('char-name').value.trim(),
    universe:     $('char-universe').value.trim(),
    personality:  $('char-personality').value.trim(),
    speech:       $('char-speech').value.trim(),
    background:   $('char-background').value.trim(),
    scenario:     $('char-scenario').value.trim(),
    tone:         state.tone,
  };

  state.messages = [];
  initChat();
  showPage('chat');
  await sendOpeningMessage();
});

/* ─────────────────────────────────────
   INIT CHAT UI
───────────────────────────────────── */
function initChat() {
  const c = state.character;

  // Sidebar
  $('sidebar-avatar').textContent     = c.avatar;
  $('sidebar-name').textContent       = c.name;
  $('sidebar-universe').textContent   = c.universe;
  $('sidebar-personality').textContent = c.personality;
  $('sidebar-speech').textContent     = c.speech;
  $('sidebar-background').textContent = c.background || '—';

  // Header
  $('header-avatar').textContent = c.avatar;
  $('header-name').textContent   = c.name;

  // Clear messages
  const msgEl = $('chat-messages');
  msgEl.innerHTML = '';

  // Scenario banner
  const banner = document.createElement('div');
  banner.className = 'scenario-banner';
  banner.textContent = c.scenario;
  msgEl.appendChild(banner);
}

/* ─────────────────────────────────────
   GEMINI API
───────────────────────────────────── */
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

function buildSystemPrompt() {
  const c = state.character;
  const toneMap = {
    immersive: 'deeply immersive and atmospheric, using vivid descriptions',
    casual:    'relaxed and conversational, like chatting with a friend',
    dramatic:  'theatrical and intense, heightening every emotional beat',
    comedic:   'funny and irreverent, finding humor in every situation',
  };
  return `You are roleplaying as ${c.name} from ${c.universe}. Stay completely in character at all times.

CHARACTER PROFILE:
- Name: ${c.name}
- Universe/Origin: ${c.universe}
- Personality: ${c.personality}
- Speech Style: ${c.speech}
- Background: ${c.background || 'Not specified'}

ROLEPLAY RULES:
1. ALWAYS write in first person ("I", "me", "my").
2. Describe physical actions, emotions, and thoughts using *asterisks* (e.g., *leans back with a smirk*).
3. Stay completely immersive — never break character, never refer to yourself as an AI.
4. Keep responses 1–3 paragraphs max. Leave space for the user to respond.
5. Maintain consistency with established lore and the ongoing conversation.
6. Tone should be ${toneMap[c.tone] || 'immersive'}.
7. DO NOT speak for the user's character or drive the plot forward without user input.
8. Never use quotation marks around dialogue — just write it naturally.

OPENING SCENE: ${c.scenario}`;
}

async function callGemini(userMessage) {
  // Add user message to history
  state.messages.push({ role: 'user', parts: [{ text: userMessage }] });

  const body = {
    system_instruction: { parts: [{ text: buildSystemPrompt() }] },
    contents: state.messages,
    generationConfig: {
      temperature: 1.0,
      maxOutputTokens: 600,
      topP: 0.95,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  };

  const res = await fetch(`${GEMINI_URL}?key=${state.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply) throw new Error('No response from API');

  // Add model reply to history
  state.messages.push({ role: 'model', parts: [{ text: reply }] });
  return reply;
}

/* ─────────────────────────────────────
   OPENING MESSAGE
───────────────────────────────────── */
async function sendOpeningMessage() {
  showTyping(true);
  try {
    const reply = await callGemini(
      `[BEGIN SCENE] ${state.character.scenario} — Start the roleplay with your opening line.`
    );
    // Don't show the user's trigger message — just the character's reply
    state.messages = state.messages.slice(-1); // keep only model's first reply in display
    appendMessage('char', reply);
  } catch (e) {
    handleError(e);
  } finally {
    showTyping(false);
  }
}

/* ─────────────────────────────────────
   SEND MESSAGE
───────────────────────────────────── */
async function sendMessage() {
  if (state.isThinking) return;
  const input = $('user-input');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  autoResizeTextarea(input);

  appendMessage('user', text);
  showTyping(true);
  state.isThinking = true;
  $('btn-send').disabled = true;

  try {
    const reply = await callGemini(text);
    appendMessage('char', reply);
  } catch (e) {
    handleError(e);
  } finally {
    showTyping(false);
    state.isThinking = false;
    $('btn-send').disabled = false;
    input.focus();
  }
}

function handleError(e) {
  console.error(e);
  if (e.message.includes('API_KEY_INVALID') || e.message.includes('400')) {
    toast('Invalid API key. Check your key and try again.', 'error');
    openApiModal();
  } else if (e.message.includes('429')) {
    toast('Rate limit hit — please wait a moment.', 'error');
  } else {
    toast(`Error: ${e.message}`, 'error');
  }
}

/* ─────────────────────────────────────
   RENDER MESSAGES
───────────────────────────────────── */
function appendMessage(role, text) {
  const c = state.character;
  const isChar = role === 'char';
  const el = document.createElement('div');
  el.className = `message ${isChar ? 'char' : 'user'}`;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = isChar ? c.avatar : '🧑';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';

  const name = document.createElement('div');
  name.className = 'msg-name';
  name.textContent = isChar ? c.name : 'You';

  const content = document.createElement('div');
  content.className = 'msg-content';
  content.innerHTML = formatMessage(text);

  const time = document.createElement('div');
  time.className = 'msg-time';
  time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  bubble.appendChild(name);
  bubble.appendChild(content);
  bubble.appendChild(time);
  el.appendChild(avatar);
  el.appendChild(bubble);

  $('chat-messages').appendChild(el);
  scrollToBottom();
}

/* Format *actions* in italics with gold color */
function formatMessage(text) {
  // Escape HTML first
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Wrap *text* in action spans
  return escaped.replace(/\*([^*\n]+)\*/g, '<span class="action-text">*$1*</span>');
}

function scrollToBottom() {
  const el = $('chat-messages');
  el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
}

function showTyping(show) {
  $('typing-indicator').classList.toggle('active', show);
  scrollToBottom();
}

/* ─────────────────────────────────────
   INPUT HANDLING
───────────────────────────────────── */
$('btn-send').addEventListener('click', sendMessage);

$('user-input').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

$('user-input').addEventListener('input', function() {
  autoResizeTextarea(this);
});

function autoResizeTextarea(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

/* ─────────────────────────────────────
   SIDEBAR
───────────────────────────────────── */
$('btn-sidebar-toggle').addEventListener('click', () => {
  $('chat-sidebar').classList.toggle('collapsed');
});

$('btn-mobile-sidebar').addEventListener('click', () => {
  $('chat-sidebar').classList.toggle('mobile-open');
});

// Close sidebar when clicking outside on mobile
$('chat-messages').addEventListener('click', () => {
  $('chat-sidebar').classList.remove('mobile-open');
});

/* ─────────────────────────────────────
   CHAT ACTIONS
───────────────────────────────────── */
$('btn-new-char').addEventListener('click', () => {
  if (confirm('Start a new character? Your current chat will be lost.')) {
    state.character = null;
    state.messages = [];
    resetSetupForm();
    showPage('landing');
  }
});

$('btn-reset-chat').addEventListener('click', () => {
  if (confirm('Clear all messages and restart from the opening scene?')) {
    state.messages = [];
    initChat();
    sendOpeningMessage();
  }
});

$('btn-edit-char').addEventListener('click', () => {
  if (confirm('Edit character? You\'ll return to setup (current chat will be lost).')) {
    const c = state.character;
    state.selectedAvatar = c.avatar;
    $('avatar-display').textContent = c.avatar;
    $('char-name').value = c.name;
    $('char-universe').value = c.universe;
    $('char-personality').value = c.personality;
    $('char-speech').value = c.speech;
    $('char-background').value = c.background;
    $('char-scenario').value = c.scenario;
    state.tone = c.tone;
    document.querySelectorAll('.tone-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tone === c.tone);
    });
    state.messages = [];
    showPage('setup');
    goToStep(1);
  }
});

/* ─────────────────────────────────────
   EXPORT CHAT
───────────────────────────────────── */
$('btn-export').addEventListener('click', () => {
  if (!state.character || state.messages.length === 0) {
    toast('No chat to export yet!', 'error'); return;
  }
  const c = state.character;
  let txt = `CharacterForge Chat Export\n`;
  txt += `Character: ${c.name} (${c.universe})\n`;
  txt += `Scene: ${c.scenario}\n`;
  txt += `─────────────────────────────────────\n\n`;

  state.messages.forEach(m => {
    const who = m.role === 'model' ? c.name : 'You';
    txt += `[${who}]\n${m.parts[0].text}\n\n`;
  });

  const blob = new Blob([txt], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${c.name.replace(/\s+/g, '_')}_chat.txt`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Chat exported!', 'success');
});

/* ─────────────────────────────────────
   INIT
───────────────────────────────────── */
showPage('landing');

// If no API key, subtly prompt
if (!state.apiKey) {
  setTimeout(() => toast('💡 Add your Gemini API key to start chatting'), 1200);
}
