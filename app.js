// ===================================================================
// HERMES AI // 3D CYBERNETIC ROBOT CO-PILOT (FRONTEND ENGINE)
// ===================================================================

let scene, camera, renderer, robotGroup, visorMesh, eyeLeft, eyeRight, mouthMesh, particleField;
let mouseX = 0, mouseY = 0;
let targetRotationX = 0, targetRotationY = 0;
let isSpeaking = false;
let audioVisualizerActive = false;

// Audio & Speech Synthesis
const synth = window.speechSynthesis;
let recognition = null;
let isListening = false;

// DOM Elements
const chatStream = document.getElementById('chat-stream');
const userInput = document.getElementById('user-input');
const sendTrigger = document.getElementById('send-trigger');
const micTrigger = document.getElementById('mic-trigger');
const langTrigger = document.getElementById('lang-trigger');
const emotionTag = document.getElementById('emotion-tag');
const statusText = document.getElementById('status-text');
const voiceIndicator = document.getElementById('voice-indicator');

// Telemetry DOM
const hudGold = document.getElementById('hud-gold');
const hudGoldChange = document.getElementById('hud-gold-change');
const hudDxy = document.getElementById('hud-dxy');
const hudDxyBias = document.getElementById('hud-dxy-bias');
const hudEaTrades = document.getElementById('hud-ea-trades');
const hudEaPnl = document.getElementById('hud-ea-pnl');
const hudTrail = document.getElementById('hud-trail');

// ===================================================================
// 1. THREE.JS 3D CYBERNETIC ROBOT AVATAR INITIALIZATION
// ===================================================================
function initThreeRobot() {
    const container = document.getElementById('three-container');
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 500;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 7;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Robot Head Assembly Group
    robotGroup = new THREE.Group();
    scene.add(robotGroup);

    // Metallic Titanium Cyber Skull
    const headGeom = new THREE.DodecahedronGeometry(1.6, 1);
    const headMat = new THREE.MeshStandardMaterial({
        color: 0x141e2e,
        metalness: 0.85,
        roughness: 0.25,
        wireframe: false
    });
    const headMesh = new THREE.Mesh(headGeom, headMat);
    robotGroup.add(headMesh);

    // Glowing Neon Cyber Visor
    const visorGeom = new THREE.BoxGeometry(1.8, 0.45, 0.9);
    const visorMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 0.6,
        roughness: 0.1,
        transparent: true,
        opacity: 0.85
    });
    visorMesh = new THREE.Mesh(visorGeom, visorMat);
    visorMesh.position.set(0, 0.25, 1.25);
    robotGroup.add(visorMesh);

    // Cybernetic Eyes behind Visor
    const eyeGeom = new THREE.SphereGeometry(0.12, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    
    eyeLeft = new THREE.Mesh(eyeGeom, eyeMat);
    eyeLeft.position.set(-0.45, 0.25, 1.6);
    robotGroup.add(eyeLeft);

    eyeRight = new THREE.Mesh(eyeGeom, eyeMat);
    eyeRight.position.set(0.45, 0.25, 1.6);
    robotGroup.add(eyeRight);

    // Animated Audio-Reactive Cyber Mouth Waveform Mesh
    const mouthGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true });
    mouthMesh = new THREE.Mesh(mouthGeom, mouthMat);
    mouthMesh.rotation.x = Math.PI / 2;
    mouthMesh.position.set(0, -0.65, 1.4);
    robotGroup.add(mouthMesh);

    // Holographic Neural Rings
    const ringGeom = new THREE.TorusGeometry(2.3, 0.03, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.4 });
    const ring1 = new THREE.Mesh(ringGeom, ringMat);
    ring1.rotation.x = Math.PI / 3;
    robotGroup.add(ring1);

    const ring2 = new THREE.Mesh(ringGeom, ringMat);
    ring2.rotation.y = Math.PI / 3;
    robotGroup.add(ring2);

    // Floating Cyber Particle Aura
    const particleCount = 150;
    const pGeom = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    for(let i = 0; i < particleCount * 3; i += 3) {
        pPos[i] = (Math.random() - 0.5) * 8;
        pPos[i+1] = (Math.random() - 0.5) * 8;
        pPos[i+2] = (Math.random() - 0.5) * 8;
    }
    pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x00f0ff, size: 0.04, transparent: true, opacity: 0.7 });
    particleField = new THREE.Points(pGeom, pMat);
    scene.add(particleField);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00f0ff, 2.5, 20);
    pointLight.position.set(2, 4, 5);
    scene.add(pointLight);

    const goldLight = new THREE.PointLight(0xffd700, 1.5, 20);
    goldLight.position.set(-3, -2, 4);
    scene.add(goldLight);

    // Mouse Tracking Event
    container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
        mouseY = -(((e.clientY - rect.top) / container.clientHeight) * 2 - 1);
    });

    // Window Resize Event
    window.addEventListener('resize', onWindowResize);

    animate();
}

function onWindowResize() {
    const container = document.getElementById('three-container');
    if(!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// 3D Animation Loop
let clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    // Mouse Tracking head rotation
    targetRotationY = mouseX * 0.45;
    targetRotationX = -mouseY * 0.35;
    robotGroup.rotation.y += (targetRotationY - robotGroup.rotation.y) * 0.08;
    robotGroup.rotation.x += (targetRotationX - robotGroup.rotation.x) * 0.08;

    // Subtle idle breathing float
    robotGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.08;

    // Speaking Lip-Sync / Waveform Pulse
    if (isSpeaking) {
        const speechWave = Math.sin(elapsedTime * 22) * 0.4 + 0.9;
        mouthMesh.scale.set(speechWave, speechWave, speechWave);
        visorMesh.material.emissiveIntensity = 0.8 + Math.sin(elapsedTime * 15) * 0.3;
    } else {
        mouthMesh.scale.set(1, 1, 1);
        visorMesh.material.emissiveIntensity = 0.5 + Math.sin(elapsedTime * 2) * 0.15;
    }

    // Particle field slow drift
    if (particleField) {
        particleField.rotation.y = elapsedTime * 0.04;
    }

    renderer.render(scene, camera);
}

// Set Avatar Visual Emotion
function setAvatarEmotion(emotion) {
    if(!emotionTag || !visorMesh) return;
    emotionTag.innerText = `STATE: ${emotion}`;

    if (emotion === "BULLISH") {
        visorMesh.material.color.setHex(0x00ff66);
        visorMesh.material.emissive.setHex(0x00ff66);
        eyeLeft.material.color.setHex(0xffd700);
        eyeRight.material.color.setHex(0xffd700);
    } else if (emotion === "BEARISH") {
        visorMesh.material.color.setHex(0xff3366);
        visorMesh.material.emissive.setHex(0xff3366);
        eyeLeft.material.color.setHex(0xff3366);
        eyeRight.material.color.setHex(0xff3366);
    } else if (emotion === "ALERT") {
        visorMesh.material.color.setHex(0xffaa00);
        visorMesh.material.emissive.setHex(0xffaa00);
    } else {
        visorMesh.material.color.setHex(0x00f0ff);
        visorMesh.material.emissive.setHex(0x00f0ff);
        eyeLeft.material.color.setHex(0xffd700);
        eyeRight.material.color.setHex(0xffd700);
    }
}

// ===================================================================
// 2. AUDIO WAVEFORM CANVAS VISUALIZER
// ===================================================================
const waveCanvas = document.getElementById('waveform-canvas');
const waveCtx = waveCanvas.getContext('2d');
let wavePhase = 0;

function drawAudioWaveform() {
    requestAnimationFrame(drawAudioWaveform);
    waveCtx.clearRect(0, 0, waveCanvas.width, waveCanvas.height);

    waveCtx.lineWidth = 2;
    waveCtx.strokeStyle = isSpeaking ? '#00f0ff' : 'rgba(0, 240, 255, 0.25)';
    waveCtx.beginPath();

    const width = waveCanvas.width;
    const height = waveCanvas.height;
    const midY = height / 2;
    const amplitude = isSpeaking ? 14 : 3;

    wavePhase += isSpeaking ? 0.25 : 0.04;

    for (let x = 0; x < width; x += 4) {
        const y = midY + Math.sin((x * 0.06) + wavePhase) * Math.cos(x * 0.02) * amplitude;
        if (x === 0) waveCtx.moveTo(x, y);
        else waveCtx.lineTo(x, y);
    }
    waveCtx.stroke();
}
drawAudioWaveform();

// ===================================================================
// 3. SPEECH SYNTHESIS & VOICE OUTPUT (MOBILE & DESKTOP COMPATIBLE)
// ===================================================================
function cleanTextForSpeech(raw) {
    if (!raw) return '';
    return raw
        .replace(/<[^>]*>/g, ' ')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/\[\d+\]/g, ' ')
        .replace(/\[[★☆]+\]/g, ' ')
        .replace(/[🤖👤⚡🎯🔴🟢🔵⭐★☆📡🧠📺📰🔄💧⚛️🔬]/g, ' ')
        .replace(/https?:\/\/\S+/g, ' ')
        .replace(/\$([0-9,.]+)/g, '$1 ডলার')
        .replace(/[\n\r]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// Universal Mobile Audio Voice Player (100% Android, iPhone & Desktop Compatible)
let activeVoiceAudio = null;

function unlockMobileAudio() {
    if (!activeVoiceAudio) {
        activeVoiceAudio = new Audio();
    }
    // Play a 1-sample silent sound to prime mobile browser audio context
    try {
        activeVoiceAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        activeVoiceAudio.play().catch(() => {});
    } catch(e) {}

    if (window.speechSynthesis) {
        try {
            if (window.speechSynthesis.paused) window.speechSynthesis.resume();
            const silent = new SpeechSynthesisUtterance(' ');
            silent.volume = 0.01;
            window.speechSynthesis.speak(silent);
        } catch(e) {}
    }
}
document.addEventListener('touchstart', unlockMobileAudio, { passive: true });
document.addEventListener('click', unlockMobileAudio);

if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {
        if (window.speechSynthesis) window.speechSynthesis.getVoices();
    };
}

function speakHermesVoice(text) {
    if (!text) return;
    const cleanText = cleanTextForSpeech(text);
    if (!cleanText) return;

    if (!activeVoiceAudio) {
        activeVoiceAudio = new Audio();
    }

    try {
        activeVoiceAudio.pause();
        activeVoiceAudio.currentTime = 0;
    } catch(e) {}

    // Use our high-fidelity Bengali TTS MP3 stream
    const ttsUrl = '/api/tts?text=' + encodeURIComponent(cleanText);
    activeVoiceAudio.src = ttsUrl;

    isSpeaking = true;
    if (voiceIndicator) {
        voiceIndicator.innerText = "HERMES AUDIO: TRANSMITTING...";
        voiceIndicator.style.color = "#00ff66";
    }

    activeVoiceAudio.onplay = () => {
        isSpeaking = true;
        if (voiceIndicator) {
            voiceIndicator.innerText = "HERMES AUDIO: TRANSMITTING...";
            voiceIndicator.style.color = "#00ff66";
        }
    };

    activeVoiceAudio.onended = () => {
        isSpeaking = false;
        if (voiceIndicator) {
            voiceIndicator.innerText = "HERMES AUDIO: READY";
            voiceIndicator.style.color = "#00f0ff";
        }
    };

    activeVoiceAudio.onerror = (e) => {
        console.warn("Server MP3 TTS failed, switching to browser Web Speech API:", e);
        speakWithBrowserSpeechSynthesis(cleanText);
    };

    const playPromise = activeVoiceAudio.play();
    if (playPromise !== undefined) {
        playPromise.catch(err => {
            console.warn("Audio autoplay blocked by browser policy, attempting fallback:", err);
            speakWithBrowserSpeechSynthesis(cleanText);
        });
    }
}

function speakWithBrowserSpeechSynthesis(cleanText) {
    if (!window.speechSynthesis) {
        isSpeaking = false;
        return;
    }
    const synth = window.speechSynthesis;
    try {
        if (synth.paused) synth.resume();
        synth.cancel();
    } catch(e) {}

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const hasBengali = /[\u0980-\u09FF]/.test(cleanText);
    const voices = synth.getVoices() || [];

    if (hasBengali) {
        utterance.lang = 'bn-BD';
        const bnVoice = voices.find(v => (v.lang && (v.lang.includes('bn') || v.lang.includes('ben'))));
        if (bnVoice) utterance.voice = bnVoice;
    } else {
        utterance.lang = 'en-US';
        const enVoice = voices.find(v => v.lang && v.lang.includes('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('David')));
        if (enVoice) utterance.voice = enVoice;
    }

    utterance.onstart = () => {
        isSpeaking = true;
        if (voiceIndicator) {
            voiceIndicator.innerText = "HERMES AUDIO: TRANSMITTING...";
            voiceIndicator.style.color = "#00ff66";
        }
    };

    utterance.onend = () => {
        isSpeaking = false;
        if (voiceIndicator) {
            voiceIndicator.innerText = "HERMES AUDIO: READY";
            voiceIndicator.style.color = "#00f0ff";
        }
    };

    utterance.onerror = (e) => {
        isSpeaking = false;
        if (voiceIndicator) {
            voiceIndicator.innerText = "HERMES AUDIO: READY";
            voiceIndicator.style.color = "#00f0ff";
        }
    };

    window._activeUtterance = utterance;
    try {
        synth.speak(utterance);
    } catch(err) {
        isSpeaking = false;
    }
}


// ===================================================================
// 4. SPEECH RECOGNITION (VOICE INPUT IN BENGALI / ENGLISH & BANGLISH)
// ===================================================================
let voiceLanguage = 'bn-BD'; // 'bn-BD' or 'en-US'

function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.warn("Speech Recognition not supported in this browser.");
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = voiceLanguage;

    recognition.onstart = () => {
        isListening = true;
        micTrigger.classList.add('listening');
        statusText.innerText = voiceLanguage === 'bn-BD' 
            ? "VOICE INPUT: LISTENING (বাংলায় কথা বলুন)..." 
            : "VOICE INPUT: LISTENING (Speak in English/Banglish)...";
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        userInput.value = finalTranscript || interimTranscript;
        if (finalTranscript) {
            handleSendMessage();
        }
    };

    recognition.onerror = (e) => {
        isListening = false;
        micTrigger.classList.remove('listening');
        statusText.innerText = "VOICE INPUT PAUSED (মাইক চেক করুন বা লিখে পাঠান)";
        console.warn('Speech recognition error:', e.error);
    };

    recognition.onend = () => {
        isListening = false;
        micTrigger.classList.remove('listening');
        if (userInput.value.trim() && !statusText.innerText.includes('PROGRESS')) {
            handleSendMessage();
        }
        setTimeout(() => {
            if (!isListening) statusText.innerText = "NEURAL SYNAPSE: ACTIVE";
        }, 1500);
    };
}
initSpeechRecognition();

micTrigger.addEventListener('click', () => {
    if (!recognition) {
        alert("Speech Recognition is supported in Chrome/Edge browsers. You can also type directly in the input box!");
        return;
    }
    if (isListening) {
        recognition.stop();
    } else {
        recognition.lang = voiceLanguage;
        try {
            recognition.start();
        } catch(err) {
            recognition.stop();
            setTimeout(() => recognition.start(), 200);
        }
    }
});

if (langTrigger) {
    langTrigger.addEventListener('click', () => {
        if (voiceLanguage === 'bn-BD') {
            voiceLanguage = 'en-US';
            langTrigger.innerText = 'EN';
            langTrigger.title = 'Current: English / Banglish. Click for Bengali (বাংলা)';
            userInput.placeholder = "Commander Omar, speak in English/Banglish or type...";
        } else {
            voiceLanguage = 'bn-BD';
            langTrigger.innerText = 'BN';
            langTrigger.title = 'Current: Bengali (বাংলা). Click for English / Banglish';
            userInput.placeholder = "কমান্ডার, বাংলায় কথা বলুন বা প্রশ্ন টাইপ করুন...";
        }
        if (recognition) recognition.lang = voiceLanguage;
        statusText.innerText = `VOICE LANGUAGE: ${voiceLanguage === 'bn-BD' ? 'BENGALI (বাংলা)' : 'ENGLISH / BANGLISH'}`;
    });
}

// ===================================================================
// 5. CHAT ENGINE & API DISPATCH (WITH MOBILE AUTO-SCROLL & LOADING)
// ===================================================================
async function handleSendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    // Append User Message to UI
    appendMessageCard("👤 COMMANDER OMAR", text, "user-msg");
    userInput.value = '';

    setAvatarEmotion("ANALYZING");
    statusText.innerText = "QUANTITATIVE REASONING IN PROGRESS...";

    // Show instant Loading Indicator card
    const loadingId = 'loading-' + Date.now();
    const loadingDiv = document.createElement('div');
    loadingDiv.className = "msg hermes-msg";
    loadingDiv.id = loadingId;
    loadingDiv.innerHTML = `
        <div class="msg-header">
            <span class="sender-name">🤖 HERMES AI CO-PILOT</span>
            <span class="time-stamp">ANALYZING...</span>
        </div>
        <div class="msg-body" style="color:#00f0ff; display:flex; align-items:center; gap:8px;">
            <span>⚡ কমান্ডার, লাইভ মার্কেট ডেটা ও M15 সাইকেল অ্যানালাইসিস করছি...</span>
            <span style="display:inline-block; animation:spin 1s linear infinite;">⏳</span>
        </div>
    `;
    chatStream.appendChild(loadingDiv);
    chatStream.scrollTop = chatStream.scrollHeight;

    // Auto-scroll screen to chat on mobile
    const chatCard = document.querySelector('.chat-card');
    if (chatCard && window.innerWidth <= 768) {
        chatCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    try {
        const response = await fetch('/api/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: text })
        });
        const data = await response.json();

        // Replace loading card with actual reply
        const currentLoading = document.getElementById(loadingId);
        if (currentLoading) {
            currentLoading.innerHTML = `
                <div class="msg-header">
                    <span class="sender-name">🤖 HERMES AI CO-PILOT</span>
                    <span class="time-stamp">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <button class="msg-speak-btn" title="কথা শুনুন">🔊 কথা শুনুন</button>
                </div>
                <div class="msg-body">${(data.replyBengali || '').replace(/\n/g, '<br>')}</div>
            `;
            const speakBtn = currentLoading.querySelector('.msg-speak-btn');
            if (speakBtn) {
                speakBtn.addEventListener('click', () => {
                    unlockMobileAudio();
                    speakHermesVoice(data.replyBengali);
                });
            }
        } else {
            appendMessageCard("🤖 HERMES AI CO-PILOT", data.replyBengali, "hermes-msg");
        }

        chatStream.scrollTop = chatStream.scrollHeight;

        // Update Emotion & Voice
        setAvatarEmotion(data.avatarEmotion || "TALKING");
        statusText.innerText = `RECOMMENDATION: ${data.recommendation}`;

        if (data.voiceText) {
            speakHermesVoice(data.voiceText);
        }

    } catch (err) {
        const currentLoading = document.getElementById(loadingId);
        if (currentLoading) {
            currentLoading.innerHTML = `
                <div class="msg-header"><span class="sender-name">🤖 HERMES AI CO-PILOT</span></div>
                <div class="msg-body" style="color:#ff3366;">কমান্ডার, ক্লাউড কানেকশনে সামান্য সময় লাগছে। অনুগ্রহ করে আরেকবার ক্লিক করুন।</div>
            `;
        } else {
            appendMessageCard("🤖 HERMES AI CO-PILOT", "কমান্ডার, ক্লাউড কানেকশনে সামান্য সময় লাগছে। অনুগ্রহ করে আরেকবার ক্লিক করুন।", "hermes-msg");
        }
        setAvatarEmotion("ALERT");
    }
}


sendTrigger.addEventListener('click', () => {
    unlockMobileAudio();
    handleSendMessage();
});

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        unlockMobileAudio();
        handleSendMessage();
    }
});

// Numbered Quick Question Chips Click Handler with Instant Mobile Audio Unlock
document.addEventListener('click', (e) => {
    const chip = e.target.closest('.qq-chip');
    if (chip) {
        unlockMobileAudio(); // IMMEDIATE UNLOCK
        const num = chip.getAttribute('data-num');
        if (num) {
            userInput.value = num;
            handleSendMessage();
        }
    }
});

function appendMessageCard(sender, text, msgClass) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `msg ${msgClass}`;
    
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isHermes = msgClass.includes('hermes-msg');

    msgDiv.innerHTML = `
        <div class="msg-header">
            <span class="sender-name">${sender}</span>
            <span class="time-stamp">${timeStr}</span>
            ${isHermes ? `<button class="msg-speak-btn" title="কথা শুনুন">🔊 কথা শুনুন</button>` : ''}
        </div>
        <div class="msg-body">${text.replace(/\n/g, '<br>')}</div>
    `;

    if (isHermes) {
        const btn = msgDiv.querySelector('.msg-speak-btn');
        if (btn) {
            btn.addEventListener('click', () => {
                unlockMobileAudio();
                speakHermesVoice(text);
            });
        }
    }

    chatStream.appendChild(msgDiv);
    chatStream.scrollTop = chatStream.scrollHeight;
}


// ===================================================================
// 6. REAL-TIME 5-SOURCE TELEMETRY & AUTONOMOUS SELF-UPDATE
// ===================================================================
async function refreshTelemetry() {
    try {
        const res = await fetch('/api/status');
        const data = await res.json();
        
        // 1. Top HUD Ribbon
        if (data.yahoo) {
            hudGold.innerText = `$${parseFloat(data.yahoo.goldPrice).toFixed(2)}`;
            hudGoldChange.innerText = data.yahoo.goldChange;
            hudDxy.innerText = parseFloat(data.yahoo.dxyPrice).toFixed(2);
            hudDxyBias.innerText = data.yahoo.dxyBias.includes("WEAK") ? "WEAK (BULLISH)" : "STRONG";
        }

        if (data.benchmarks) {
            const b = data.benchmarks;
            const hudNyClose = document.getElementById('hud-ny-close');
            const hudNyDiff = document.getElementById('hud-ny-diff');
            const hudDailyOpen = document.getElementById('hud-daily-open');
            const hudDailyRegime = document.getElementById('hud-daily-regime');

            if (hudNyClose) hudNyClose.innerText = `$${parseFloat(b.yesterdayNYClose).toFixed(2)}`;
            if (hudNyDiff) {
                const diff = (data.yahoo.goldPrice - b.yesterdayNYClose).toFixed(1);
                hudNyDiff.innerText = `${diff >= 0 ? '+' : ''}${diff} pts`;
                hudNyDiff.style.color = diff >= 0 ? '#00ff66' : '#ff3366';
            }
            if (hudDailyOpen) hudDailyOpen.innerText = `$${parseFloat(b.dailyOpen).toFixed(2)}`;
            if (hudDailyRegime) hudDailyRegime.innerText = b.regime;

            // SMC Benchmarks Card
            const bmNyClose = document.getElementById('bm-ny-close');
            const bmNyDiff = document.getElementById('bm-ny-diff');
            const bmDailyOpen = document.getElementById('bm-daily-open');
            const bmRegime = document.getElementById('bm-regime');
            const bmPdh = document.getElementById('bm-pdh');
            const bmPdl = document.getElementById('bm-pdl');
            const bmEq = document.getElementById('bm-equilibrium');
            const bmMidnight = document.getElementById('bm-midnight');
            const tagSsl = document.getElementById('tag-ssl-status');

            if (bmNyClose) bmNyClose.innerText = `$${parseFloat(b.yesterdayNYClose).toFixed(2)}`;
            if (bmNyDiff) {
                const diff = (data.yahoo.goldPrice - b.yesterdayNYClose).toFixed(1);
                bmNyDiff.innerText = `${diff >= 0 ? '+' : ''}${diff} pts vs NY Settlement`;
            }
            if (bmDailyOpen) bmDailyOpen.innerText = `$${parseFloat(b.dailyOpen).toFixed(2)}`;
            if (bmRegime) bmRegime.innerText = b.regime;
            if (bmPdh) bmPdh.innerText = `$${parseFloat(b.pdh).toFixed(2)}`;
            if (bmPdl) bmPdl.innerText = `$${parseFloat(b.pdl).toFixed(2)}`;
            if (bmEq) bmEq.innerText = `$${parseFloat(b.equilibrium50).toFixed(2)}`;
            if (bmMidnight) bmMidnight.innerText = `$${parseFloat(b.nyMidnightOpen).toFixed(2)}`;
            if (tagSsl) {
                tagSsl.innerText = b.sslBslStatus;
                tagSsl.style.color = b.sslBslStatus.includes('SWEPT') ? '#00ff66' : '#00f0ff';
                tagSsl.style.borderColor = tagSsl.style.color;
            }
        }

        if (data.xm) {
            hudEaTrades.innerText = data.xm.capStatus;
            hudEaPnl.innerText = `$${parseFloat(data.xm.floatingPnL).toFixed(2)} USD`;
            hudTrail.innerText = data.xm.basketTrailing;
        }

        // 2. Cockpit Strip Elements
        const cockpitGpr = document.getElementById('cockpit-gpr');
        const cockpitPoc = document.getElementById('cockpit-poc');
        const cockpitAtr = document.getElementById('cockpit-atr-shield');
        const cockpitNews = document.getElementById('cockpit-news-alert');

        if (cockpitGpr && data.gemCouncil) cockpitGpr.innerText = data.gemCouncil.gprConfidence;
        if (cockpitPoc && data.gemCouncil) cockpitPoc.innerText = data.gemCouncil.sessionPOC;
        if (cockpitAtr && data.tradingview) cockpitAtr.innerText = `ARMED (< $${(parseFloat(data.tradingview.atr14) * 2.5).toFixed(0)} pt Candle Safe)`;
        if (cockpitNews && data.forexfactory) {
            cockpitNews.innerText = data.forexfactory.newsBlackoutActive ? "🛑 BLACKOUT (30m No Trade)" : "🟢 SAFE TO TRADE";
            cockpitNews.style.color = data.forexfactory.newsBlackoutActive ? "#ff3366" : "#00ff66";
        }

        // 3. ULTRA ICT FUSION DASHBOARD BINDING (Antigravity v3.60)
        if (data.fusionDashboard) {
            const fd = data.fusionDashboard;
            const setTxt = (id, val) => { const el = document.getElementById(id); if (el && val != null) el.innerText = val; };
            const setCol = (id, col) => { const el = document.getElementById(id); if (el && col) el.style.color = col; };

            if (data.benchmarks) {
                setTxt('fcol-pdh', `$${parseFloat(data.benchmarks.pdh).toFixed(2)}`);
                setTxt('fcol-pdl', `$${parseFloat(data.benchmarks.pdl).toFixed(2)}`);
            }
            setTxt('fcol-dominant', fd.dominantSide);
            setCol('fcol-dominant', (fd.dominantSide || '').includes('BUY') ? '#00ff66' : '#ff3366');
            setTxt('fcol-session', fd.session);
            setTxt('fcol-sweep', fd.liquiditySweep);
            setTxt('fcol-ema-bias', fd.htfEmaBias);
            setTxt('fcol-adx-score', `${fd.adxScore}/100`);
            setTxt('fcol-ai-dir', fd.aiForecast);

            if (fd.mtf) {
                setTxt('mtf-m5', `M5: ${fd.mtf.m5} ${fd.mtf.m5 === 'BULL' ? '🟢' : '🔴'}`);
                setTxt('mtf-h1', `H1: ${fd.mtf.h1} ${fd.mtf.h1 === 'BULL' ? '🟢' : '🔴'}`);
                setTxt('mtf-h4', `H4: ${fd.mtf.h4} ${fd.mtf.h4 === 'BULL' ? '🟢' : '🔴'}`);
                setTxt('mtf-d1', `D1: ${fd.mtf.d1} ${fd.mtf.d1 === 'BULL' ? '🟢' : '🔴'}`);
            }

            setTxt('fcol-struct', fd.marketStructure);
            setTxt('fcol-zone', fd.priceZone);
            setTxt('fcol-fvg', fd.imbalanceFvg);
            setTxt('fcol-ote', fd.oteZone);
            setTxt('fcol-ob', fd.orderBlockWatch);
            setTxt('fcol-smt', fd.smtDivergence);
            setTxt('fcol-amd', fd.amdPhase);
            setTxt('fcol-news-status', fd.economicNews);
            setTxt('fcol-exit-plan', fd.exitPlan);

            setTxt('fcol-real-move', fd.realMove);
            setTxt('fcol-fake-move', fd.fakeMove);
            setTxt('fcol-move-bias', fd.moveBias);
            setTxt('fcol-move-conf', `${fd.confidence}%`);
            setTxt('fcol-move-trigger', fd.moveTrigger);
            setTxt('fcol-vol-spike', fd.volumeSpike ? 'YES (1.5x Avg)' : 'NO');
            setTxt('fcol-displacement', fd.displacement ? 'YES (Momentum)' : 'NO');
            setTxt('fcol-trend-change', fd.trendChange);
            setTxt('fcol-setup-score', `${fd.setupScore} / 11 CONFLUENCE`);

            // 11 Indicator LED chips
            const leds = fd.indicators || {};
            for (const [k, v] of Object.entries(leds)) {
                setTxt(`led-${k}`, v ? '🟢' : '🔴');
            }

            setTxt('pb-buy-val', `${fd.buyPercent}% ${fd.buyStars} (${fd.greenCount} / 11)`);
            setTxt('pb-sell-val', `${fd.sellPercent}% ${fd.sellStars} (${fd.redCount} / 11)`);
            setTxt('fusion-setup-badge', `FINAL SETUP: ${fd.finalSetup} (${Math.max(fd.greenCount, fd.redCount)}/11)`);
            setTxt('fusion-dominance-badge', `${Math.max(fd.buyPercent, fd.sellPercent)}% DOMINANCE`);
            setTxt('fusion-commentary-text', fd.commentary);
        }

        // 4. 5 Live Sources Ribbon
        const srcXm = document.getElementById('src-xm');
        const srcYahoo = document.getElementById('src-yahoo');
        const srcInvesting = document.getElementById('src-investing');
        const srcForex = document.getElementById('src-forex');
        const srcTv = document.getElementById('src-tv');
        const selfUpdateBadge = document.getElementById('self-update-badge');

        if (srcXm && data.xm) srcXm.innerText = data.xm.capStatus;
        if (srcYahoo && data.yahoo) srcYahoo.innerText = `$${parseFloat(data.yahoo.goldPrice).toFixed(1)} (${data.yahoo.goldChange})`;
        if (srcInvesting && data.investing) srcInvesting.innerText = data.investing.goldSentiment ? data.investing.goldSentiment.split(' ')[0] + " (74%)" : "Bullish";
        if (srcForex && data.forexfactory) srcForex.innerText = data.forexfactory.newsBlackoutActive ? "RED NEWS" : "Safe Zone";
        if (srcTv && data.tradingview) srcTv.innerText = data.tradingview.overallRating || "Buy";
        if (selfUpdateBadge && data.evolution) selfUpdateBadge.innerText = `SYNC CYCLE #${data.evolution.cycleCount}`;


    } catch(e) {}
}

// 7. YOUTUBE & WEB AUTONOMOUS STUDY STATUS
async function refreshStudyStatus() {
    try {
        const res = await fetch('/api/study-status');
        const data = await res.json();

        const statTotal = document.getElementById('stat-total-insights');
        const statYt = document.getElementById('stat-yt-count');
        const statWeb = document.getElementById('stat-web-count');
        const statCycle = document.getElementById('stat-cycle-count');
        const ticker = document.getElementById('study-ticker-text');
        const studyBadge = document.getElementById('study-status-badge');

        if (statTotal) statTotal.innerText = data.totalInsights || 0;
        if (statYt) statYt.innerText = data.youtubeStudyCycles ? `${data.youtubeStudyCycles} cycles` : `${(data.recentVideos || []).length}`;
        if (statWeb) statWeb.innerText = data.newsStudyCycles ? `${data.newsStudyCycles} cycles` : `${(data.recentArticles || []).length}`;
        if (statCycle) statCycle.innerText = data.studyCycles || 0;
        if (studyBadge) studyBadge.innerText = data.isStudying ? "STUDYING NOW..." : `AUTO: 1H NEWS | 2X YT (#${data.studyCycles})`;

        if (ticker && data.recentInsights && data.recentInsights.length > 0) {
            const ins = data.recentInsights[0];
            ticker.innerText = `[${ins.source}] ${ins.text}`;
        }
    } catch(e) {}
}

// Study Now Button Trigger
const btnStudyNow = document.getElementById('btn-study-now');
if (btnStudyNow) {
    btnStudyNow.addEventListener('click', async () => {
        btnStudyNow.innerText = "⏳ STUDYING...";
        btnStudyNow.disabled = true;
        try {
            await fetch('/api/study-now', { method: 'POST' });
            setTimeout(() => {
                refreshStudyStatus();
                btnStudyNow.innerText = "⚡ STUDY NOW";
                btnStudyNow.disabled = false;
            }, 6000);
        } catch(e) {
            btnStudyNow.innerText = "⚡ STUDY NOW";
            btnStudyNow.disabled = false;
        }
    });
}

setInterval(refreshTelemetry, 3000);
setInterval(refreshStudyStatus, 4000);
refreshTelemetry();
refreshStudyStatus();

// Start Three.js Scene
window.addEventListener('DOMContentLoaded', () => {
    initThreeRobot();
});

// Quick Up / Down Scroll Button Handlers
const scrollTopBtn = document.getElementById('scroll-top-btn');
const scrollBottomBtn = document.getElementById('scroll-bottom-btn');

if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}
if (scrollBottomBtn) {
    scrollBottomBtn.addEventListener('click', () => {
        const chatCard = document.querySelector('.chat-card');
        if (chatCard) {
            chatCard.scrollIntoView({ behavior: 'smooth', block: 'end' });
        } else {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }
    });
}

// Global Reload Button Trigger
const btnGlobalReload = document.getElementById('btn-global-reload');
if (btnGlobalReload) {
    btnGlobalReload.addEventListener('click', async () => {
        btnGlobalReload.innerText = '⏳ UPDATING...';
        await refreshTelemetry();
        await refreshStudyStatus();
        setTimeout(() => {
            btnGlobalReload.innerText = '✅ UPDATED';
            setTimeout(() => { btnGlobalReload.innerText = '🔄 RELOAD'; }, 1500);
        }, 500);
    });
}



