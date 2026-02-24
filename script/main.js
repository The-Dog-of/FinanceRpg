let audioCtx = null; 
let soundEnabled = true; 
let radioOn = false;
let historyChartInst = null; 
let expenseChartInst = null;
let stonksChartInst = null;
let expInterval = null;
let bgVideoInterval = null;
let recIdx = 0; 
let recData = {i:0, e:0, v:0};

if ('serviceWorker' in navigator) { 
    window.addEventListener('load', () => { 
        navigator.serviceWorker.register('sw.js').catch(() => {}); 
    }); 
}

function lsGet(key, defaultVal) {
    try {
        const val = localStorage.getItem(key);
        if (val === null) return defaultVal;
        const parsed = JSON.parse(val);
        if (Array.isArray(defaultVal) && !Array.isArray(parsed)) return defaultVal;
        return parsed;
    } catch (e) {
        return localStorage.getItem(key) || defaultVal;
    }
}

function lsSet(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
}

function fCurr(v) {
    return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fBrDate(iso) { 
    if (!iso) return new Date().toLocaleDateString('pt-BR'); 
    const [y, m, d] = iso.split('-'); 
    return `${d}/${m}/${y}`; 
}

function fIsoDate(br) { 
    const [d, m, y] = br.split('/'); 
    return `${y}-${m}-${d}`; 
}

function initAudio() { 
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); 
}

function playSound(type) {
    if (!soundEnabled) return; 
    try { 
        initAudio(); 
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator(); 
        const gn = audioCtx.createGain(); 
        osc.connect(gn); 
        gn.connect(audioCtx.destination);
        
        if (type === 'coin') { 
            osc.type = 'sine'; 
            osc.frequency.setValueAtTime(800, audioCtx.currentTime); 
            osc.frequency.exponentialRampToValueAtTime(1400, audioCtx.currentTime + 0.1); 
            gn.gain.setValueAtTime(0.2, audioCtx.currentTime); 
            gn.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1); 
            osc.start(); 
            osc.stop(audioCtx.currentTime + 0.1); 
        } else if (type === 'error') { 
            osc.type = 'sawtooth'; 
            osc.frequency.setValueAtTime(150, audioCtx.currentTime); 
            gn.gain.setValueAtTime(0.2, audioCtx.currentTime); 
            gn.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2); 
            osc.start(); 
            osc.stop(audioCtx.currentTime + 0.2); 
        } else if (type === 'success') { 
            osc.type = 'square'; 
            osc.frequency.setValueAtTime(400, audioCtx.currentTime); 
            osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.15); 
            osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.3); 
            gn.gain.setValueAtTime(0.15, audioCtx.currentTime); 
            gn.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5); 
            osc.start(); 
            osc.stop(audioCtx.currentTime + 0.5); 
        } else if (type === 'boop') { 
            osc.type = 'sine'; 
            osc.frequency.setValueAtTime(1200, audioCtx.currentTime); 
            osc.frequency.exponentialRampToValueAtTime(1600, audioCtx.currentTime + 0.1); 
            gn.gain.setValueAtTime(0.3, audioCtx.currentTime); 
            gn.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1); 
            osc.start(); 
            osc.stop(audioCtx.currentTime + 0.1); 
        }
    } catch (e) {}
}

function initBgVideo() { 
    const hr = new Date().getHours(); 
    const v = document.getElementById('bgVideo'); 
    if(v) v.src = (hr >= 6 && hr < 18) ? 'assets/bg_dia.mp4' : 'assets/bg_noite.mp4'; 
} 

function fireConfetti() { 
    const c = document.getElementById('confettiContainer'); 
    if(!c) return;
    const cls = ['#FB7185', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA']; 
    for (let i = 0; i < 60; i++) { 
        const p = document.createElement('div'); 
        p.className = 'confetti-particle'; 
        p.style.left = Math.random() * 100 + 'vw'; 
        p.style.backgroundColor = cls[Math.floor(Math.random() * cls.length)]; 
        const d = Math.random() * 2 + 2; 
        p.style.animationDuration = d + 's'; 
        p.style.animationDelay = Math.random() * 0.5 + 's'; 
        c.appendChild(p); 
        setTimeout(() => p.remove(), (d + 0.5) * 1000); 
    } 
}

function showToast(msg, emo = '✨', col = 'var(--primary)') { 
    const c = document.getElementById('toastContainer'); 
    if(!c) return;
    const t = document.createElement('div'); 
    t.className = 'toast'; 
    t.style.borderColor = col; 
    t.innerHTML = `<span style="font-size: 1.8rem;">${emo}</span> ${msg}`; 
    c.appendChild(t); 
    setTimeout(() => { 
        t.classList.add('hide'); 
        setTimeout(() => t.remove(), 400); 
    }, 3500); 
}

let transactions = lsGet('financas_kawaii', []); 
let quests = lsGet('quests_kawaii', []);
let subs = lsGet('kawaii_subs', []); 
let lastSubRun = lsGet('kawaii_last_sub_run', '');

let guildCoins = Number(lsGet('kawaii_guild_coins', 0)) || 0; 
let unlockedThemes = lsGet('kawaii_unlocked_themes', ['default', 'dark']);
if(!Array.isArray(unlockedThemes)) unlockedThemes = ['default', 'dark'];

let unlockedWaifus = lsGet('kawaii_unlocked_waifus', ['zerotwo']); 
if(!Array.isArray(unlockedWaifus)) unlockedWaifus = ['zerotwo'];

let unlockedTitles = lsGet('kawaii_unlocked_titles', ['title_0']); 
if(!Array.isArray(unlockedTitles)) unlockedTitles = ['title_0'];

let unlockedArts = lsGet('kawaii_unlocked_arts', []);
if(!Array.isArray(unlockedArts)) unlockedArts = [];

let equippedWaifu = lsGet('kawaii_equipped_waifu', 'zerotwo'); 
let equippedTitle = lsGet('kawaii_equipped_title', 'title_0');
let playerClass = lsGet('kawaii_class', null); 

let monthlyBudget = Number(lsGet('kawaii_budget', 2000)) || 2000; 
let bonusXP = Number(lsGet('kawaii_bonus_xp', 0)) || 0;
let lastStoredLevel = Number(lsGet('kawaii_last_level', 1)) || 1; 
let completedQuestsCount = Number(lsGet('completed_quests_kawaii', 0)) || 0;
let mascotName = lsGet('kawaii_mascot_name', 'Mascote'); 

let bankCoins = Number(lsGet('kawaii_bank_coins', 0)) || 0; 
let bankLastDate = lsGet('kawaii_bank_date', new Date().toLocaleDateString('pt-BR'));
let userAchievements = lsGet('achievements_kawaii', []); 
if(!Array.isArray(userAchievements)) userAchievements = [];

let affinities = lsGet('kawaii_affinities', { zerotwo: 0 });
let dTrack = lsGet('dailyTrack', { date: '', pets: 0, items: 0, claimed: [false,false,false] });
let expData = lsGet('expedition', { active: false, end: 0 }); 

let sp = Number(lsGet('kawaii_sp', 0)) || 0; 
let userSkills = lsGet('userSkills', { labia: 0, midas: 0, sabio: 0 });
let stonks = lsGet('stonks', { owned: 0, hist: [10, 12, 11, 15, 14], price: 14, lastUpd: Date.now() });

let pIdx = unlockedWaifus.indexOf('padrao');
if (pIdx !== -1) unlockedWaifus[pIdx] = 'zerotwo';
let nIdx = unlockedWaifus.indexOf('nezuko');
if (nIdx !== -1) unlockedWaifus[nIdx] = 'chiko';
lsSet('kawaii_unlocked_waifus', unlockedWaifus);

if (equippedWaifu === 'padrao') equippedWaifu = 'zerotwo';
if (equippedWaifu === 'nezuko') equippedWaifu = 'chiko';
lsSet('kawaii_equipped_waifu', equippedWaifu);

let currentTheme = lsGet('kawaii_theme', 'default'); 
if (currentTheme !== 'default') document.documentElement.setAttribute('data-theme', currentTheme);

let filteredDataCache = []; 

function toggleThemeAct() { 
    currentTheme = currentTheme === 'dark' ? 'default' : 'dark'; 
    document.documentElement.setAttribute('data-theme', currentTheme === 'default' ? '' : currentTheme); 
    lsSet('kawaii_theme', currentTheme); 
    renderCharts(filteredDataCache); 
}
window.toggleThemeAct = toggleThemeAct;

const waifusDB = [
    { id: 'zerotwo', name: 'ZeroTwo', price: 0, r: 'comum', mH: 'A nossa lenda começa agora!', mT: 'Oh não, o ouro sumiu...' },
    { id: 'rem', name: 'Rem', price: 100, r: 'raro', mH: 'Rem está muito orgulhosa de ti! 💙', mT: 'Rem vai cuidar de ti, não importa o quê...' },
    { id: 'aqua', name: 'Aqua', price: 100, r: 'raro', mH: 'Mais vinho excelente hoje! 🍻', mT: 'Waaaaah! O nosso ouro sumiu todo! 😭' },
    { id: 'kanna', name: 'Kanna', price: 100, r: 'raro', mH: 'Isso parece delicioso... 🐉', mT: 'Kanna está com fome...' },
    { id: 'anya', name: 'Anya', price: 150, r: 'raro', mH: 'Anya gosta de amendoins! 🥜', mT: 'Anya quer chorar...' },
    { id: 'chiko', name: 'Chiko', price: 150, r: 'raro', mH: 'Hmmf! (Feliz) 🎋', mT: 'Hmmf... (Triste)' },
    { id: 'chika', name: 'Chika', price: 150, r: 'raro', mH: 'Vamos jogar um jogo! 🎀', mT: 'Isso é assustador...' },
    { id: 'beatrice', name: 'Beatrice', price: 300, r: 'epico', mH: 'Parece que sabes poupar, eu suponho. 🦋', mT: 'Gastaste tudo com lixo de novo, eu suponho.' },
    { id: 'megumin', name: 'Megumin', price: 300, r: 'epico', mH: 'O nosso orçamento é uma EXPLOSÃO! 💥', mT: 'Estou sem mana...' },
    { id: 'shinobu', name: 'Shinobu', price: 300, r: 'epico', mH: 'Ara ara, excelente trabalho. 🦋', mT: 'Que atitude dececionante...' },
    { id: 'emilia', name: 'Emilia', price: 300, r: 'epico', mH: 'Obrigada por ajudares todos. ❄️', mT: 'Por favor, tem cuidado...' },
    { id: 'makima', name: 'Makima', price: 0, r: 'mitico', gacha: true, mH: 'Seja um bom cãozinho e continue assim. ⛓️', mT: 'Acho que precisas ser disciplinado...' },
    { id: 'esdeath', name: 'Esdeath', price: 0, r: 'mitico', gacha: true, mH: 'Os fortes poupam, os fracos gastam. 🧊', mT: 'Vou congelar a sua conta bancária.' },
    { id: 'kurumi', name: 'Kurumi', price: 0, r: 'mitico', gacha: true, mH: 'O seu tempo pertence-me agora. 🕰️', mT: 'Que desperdício de vida...' }
];

const themesDB = [
    { id: 'forest', name: 'Floresta', price: 50, icon: '🌲' }, 
    { id: 'ocean', name: 'Oceano', price: 100, icon: '🌊' }, 
    { id: 'fire', name: 'Fogo', price: 150, icon: '🔥' }, 
    { id: 'abyss', name: 'Abismo', price: 300, icon: '🌑' }, 
    { id: 'cyberpunk', name: 'Cyber', price: 500, icon: '🤖' }, 
    { id: 'sakura', name: 'Sakura', price: 600, icon: '🌸' }, 
    { id: 'galaxy', name: 'Galáxia', price: 1000, icon: '🌌' }
];

const titlesDB = [
    { id: 'title_0', name: 'Novato', price: 0, icon: '🔰' }, 
    { id: 'title_1', name: 'O Poupador', price: 100, icon: '💸' }, 
    { id: 'title_2', name: 'Lorde do Ouro', price: 300, icon: '🏛️' }, 
    { id: 'title_3', name: 'Deus Supremo', price: 2000, icon: '⚡' }, 
    { id: 'title_4', name: 'Mão de Vaca', price: 50, icon: '🐄' }, 
    { id: 'title_5', name: 'Aristocrata', price: 500, icon: '🎩' }
];

const artsDB = [
    { id: 'art_calice', name: 'Cálice da Riqueza', desc: 'Banco rende 2% ao dia.', price: 800, icon: '🍷' }, 
    { id: 'art_ampulheta', name: 'Ampulheta', desc: 'XP Diário a dobrar.', price: 800, icon: '⏳' }
];

function getClassMod(type, val) { 
    if (playerClass === 'mago' && type === 'xp') return val * 1.2; 
    if (playerClass === 'ladino' && type === 'discount') return Math.floor(val * (1 - (userSkills.labia * 0.05 + 0.15))); 
    return type === 'discount' ? Math.floor(val * (1 - (userSkills.labia * 0.05))) : val; 
}

function bindMascotData() {
    document.querySelectorAll('.lblName, #mascotNameDisplay').forEach(el => el.innerText = mascotName);
    
    document.querySelectorAll('.lblTitle, #playerTitleDisplay').forEach(el => { 
        const t = titlesDB.find(x => x.id === equippedTitle) || {name:'Lenda da Sorte'}; 
        el.innerText = t.name; 
    });
    
    document.querySelectorAll('.lblClass, #playerClassDisplay').forEach(el => el.innerText = playerClass ? playerClass.toUpperCase() : 'Nenhuma');
    document.querySelectorAll('.lblCoins, #guildCoinsDisplay').forEach(el => el.innerText = `${guildCoins} 🟡`);
    document.querySelectorAll('.lblSp').forEach(el => el.innerText = sp);
    
    let aff = affinities[equippedWaifu] || 0; 
    let aLvl = Math.floor(aff / 20) + 1;
    document.querySelectorAll('.lblAffinityText').forEach(el => el.innerText = `Nvl ${aLvl}`);
    document.querySelectorAll('.lblAffinityBar').forEach(el => el.style.width = `${(aff % 20) * 5}%`);
}

function setupMascotPetting() {
    document.querySelectorAll('#petZone, .petZone').forEach(z => {
        const nZ = z.cloneNode(true); 
        z.parentNode.replaceChild(nZ, z);
        
        nZ.addEventListener('click', (e) => {
            playSound('boop'); 
            nZ.classList.remove('jump'); 
            void nZ.offsetWidth; 
            nZ.classList.add('jump');
            
            const h = document.createElement('div'); 
            h.className = 'heart-particle'; 
            h.innerText = '❤️'; 
            h.style.left = e.clientX + 'px'; 
            h.style.top = e.clientY + 'px'; 
            document.body.appendChild(h); 
            setTimeout(() => h.remove(), 1000);
            
            dTrack.pets++; 
            lsSet('dailyTrack', dTrack); 
            window.checkDaily();
            
            affinities[equippedWaifu] = (affinities[equippedWaifu] || 0) + 1; 
            lsSet('kawaii_affinities', affinities); 
            bindMascotData();
        });
    });
}

function initMascotDOM() {
    const t = document.getElementById('mascotTemplate'); 
    const d = document.getElementById('mascotPanelDesktop'); 
    const m = document.getElementById('mascotPanelMobile');
    
    if (t && d && m) { 
        d.innerHTML = ''; 
        m.innerHTML = ''; 
        d.appendChild(t.content.cloneNode(true)); 
        m.appendChild(t.content.cloneNode(true)); 
        setupMascotPetting(); 
        bindMascotData(); 
    }
} 

window.setBudget = function() {
    const el = document.getElementById('budgetInput');
    if(!el) return;
    const val = parseFloat(el.value);
    if (val > 0) {
        monthlyBudget = val;
        lsSet('kawaii_budget', val);
        updateUI();
        showToast('HP do Boss definido!', '🐉', 'var(--success)');
        playSound('error');
        el.value = '';
    }
};

window.tradeStonks = function(act) { 
    if (act === 'buy') {
        if (guildCoins >= stonks.price) { 
            guildCoins -= stonks.price; 
            stonks.owned++; 
            playSound('coin'); 
        } else {
            return showToast('Ouro Insuficiente!', '❌', 'var(--danger)');
        }
    } else if (act === 'sell') {
        if (stonks.owned > 0) { 
            stonks.owned--; 
            guildCoins += stonks.price; 
            playSound('coin'); 
        } else {
            return showToast('Nenhuma ação na carteira!', '❌', 'var(--warning)');
        }
    }
    lsSet('kawaii_guild_coins', guildCoins); 
    lsSet('stonks', stonks); 
    updateUI(); 
};

window.startExpedition = function() {
    expData = { active: true, end: Date.now() + 8 * 3600 * 1000 }; 
    lsSet('expedition', expData); 
    playSound('success'); 
    window.checkExp(); 
};

window.collectExpedition = function() {
    let mult = 1 + (userSkills.midas * 0.1); 
    let loot = Math.floor(50 * mult); 
    guildCoins += loot; 
    lsSet('kawaii_guild_coins', guildCoins); 
    expData = { active: false, end: 0 }; 
    lsSet('expedition', expData); 
    playSound('success'); 
    fireConfetti(); 
    showToast(`Loot da Expedição: +${loot} 🟡!`, '🎁', 'var(--success)'); 
    window.checkExp(); 
    updateUI(); 
};

window.bankAction = function(action) {
    if (action === 'dep' && guildCoins >= 10) { 
        guildCoins -= 10; bankCoins += 10; 
    } else if (action === 'with' && bankCoins >= 10) { 
        bankCoins -= 10; guildCoins += 10; 
    } else { 
        return showToast('Ouro ou Saldo Insuficiente!', '❌', 'var(--danger)'); 
    } 
    lsSet('kawaii_guild_coins', guildCoins); 
    lsSet('kawaii_bank_coins', bankCoins); 
    lsSet('kawaii_bank_date', new Date().toLocaleDateString('pt-BR')); 
    playSound('coin'); 
    updateUI(); 
};

window.buyItem = function(t, id, p) {
    if (guildCoins >= p) { 
        guildCoins -= p; 
        lsSet('kawaii_guild_coins', guildCoins); 
        
        if (t === 'theme') { unlockedThemes.push(id); lsSet('kawaii_unlocked_themes', unlockedThemes); } 
        else if (t === 'waifu') { unlockedWaifus.push(id); lsSet('kawaii_unlocked_waifus', unlockedWaifus); } 
        else if (t === 'title') { unlockedTitles.push(id); lsSet('kawaii_unlocked_titles', unlockedTitles); } 
        else if (t === 'art') { unlockedArts.push(id); lsSet('kawaii_unlocked_arts', unlockedArts); } 
        
        playSound('coin'); 
        fireConfetti(); 
        showToast('Comprado com Sucesso!', '🛍️', 'var(--success)'); 
        updateUI(); 
    } else { 
        playSound('error'); 
        showToast('Moedas Insuficientes!', '❌', 'var(--danger)'); 
    }
};

window.equipItem = function(t, id) { 
    if (t === 'theme') { 
        currentTheme = id; 
        lsSet('kawaii_theme', id); 
        document.documentElement.setAttribute('data-theme', id === 'default' ? '' : id); 
        renderCharts(filteredDataCache); 
    } else if (t === 'waifu') { 
        equippedWaifu = id; 
        lsSet('kawaii_equipped_waifu', id); 
    } else if (t === 'title') { 
        equippedTitle = id; 
        lsSet('kawaii_equipped_title', id); 
    } 
    playSound('success'); 
    updateUI(); 
};

window.pullGacha = function(times) {
    let cost = times * 50; 
    if (guildCoins < cost) return showToast('Moedas Insuficientes!', '❌', 'var(--danger)');
    
    guildCoins -= cost; 
    let resStr = ''; 
    let gotRare = false;
    
    for (let i = 0; i < times; i++) {
        let r = Math.random();
        if (r < 0.05) { 
            const ms = waifusDB.filter(w => w.gacha && !unlockedWaifus.includes(w.id)); 
            if (ms.length > 0) { 
                let win = ms[Math.floor(Math.random() * ms.length)]; 
                unlockedWaifus.push(win.id); 
                lsSet('kawaii_unlocked_waifus', unlockedWaifus); 
                resStr += `MÍTICO: ${win.name}!\n`; 
                gotRare = true; 
            } else { 
                guildCoins += 200; resStr += `Duplicata Mítica (+200🟡)\n`; 
            } 
        }
        else if (r < 0.20) { 
            const ws = waifusDB.filter(w => !w.gacha && w.r === 'epico' && !unlockedWaifus.includes(w.id)); 
            if (ws.length > 0) { 
                let win = ws[Math.floor(Math.random() * ms.length)]; 
                unlockedWaifus.push(win.id); 
                lsSet('kawaii_unlocked_waifus', unlockedWaifus); 
                resStr += `ÉPICO: ${win.name}!\n`; 
                gotRare = true; 
            } else { 
                bonusXP += 200; resStr += `XP Épico (+200XP)\n`; 
            } 
        }
        else if (r < 0.50) { 
            const ws = waifusDB.filter(w => !w.gacha && w.r === 'raro' && !unlockedWaifus.includes(w.id)); 
            if (ws.length > 0) { 
                let win = ws[Math.floor(Math.random() * ms.length)]; 
                unlockedWaifus.push(win.id); 
                lsSet('kawaii_unlocked_waifus', unlockedWaifus); 
                resStr += `RARO: ${win.name}!\n`; 
                gotRare = true; 
            } else { 
                guildCoins += 50; resStr += `Reembolso (+50🟡)\n`; 
            } 
        }
        else { 
            let xpG = 50 + Math.floor(Math.random() * 50); 
            bonusXP += xpG; 
            resStr += `Comum: +${xpG} XP\n`; 
        }
    }
    
    lsSet('kawaii_guild_coins', guildCoins); 
    lsSet('kawaii_bonus_xp', bonusXP);
    
    const descEl = document.getElementById('gachaResultDesc');
    const modalEl = document.getElementById('gachaModal');
    if(descEl) descEl.innerText = resStr; 
    if(modalEl) modalEl.classList.add('active'); 
    
    if (gotRare) { playSound('success'); fireConfetti(); } else playSound('coin'); 
    updateUI();
};

window.claimDailyQ = function(id, rw) { 
    if (dTrack.claimed[id]) return; 
    dTrack.claimed[id] = true; 
    lsSet('dailyTrack', dTrack); 
    guildCoins += rw; 
    lsSet('kawaii_guild_coins', guildCoins); 
    playSound('coin'); 
    showToast(`Loot Resgatado: +${rw} 🟡!`, '✅', 'var(--success)'); 
    window.checkDaily(); 
    updateUI(); 
};

window.addQuest = function(id) { 
    const input = document.getElementById(`addQ_${id}`);
    if(!input) return;
    const amount = parseFloat(input.value); 
    if (!amount || amount <= 0) return; 
    
    const q = quests.find(q => q.id === id);
    if(q) {
        q.current += amount; 
        lsSet('quests_kawaii', quests); 
        playSound('coin'); 
        updateUI(); 
    }
};

window.delQuest = function(id) { 
    quests = quests.filter(q => q.id !== id); 
    lsSet('quests_kawaii', quests); 
    playSound('error'); 
    updateUI(); 
};

window.finishQuest = function(id) { 
    const qIdx = quests.findIndex(x => x.id === id);
    if (qIdx === -1) return;
    
    quests.splice(qIdx, 1);
    completedQuestsCount++; 
    guildCoins += 50; 
    lsSet('quests_kawaii', quests);
    lsSet('completed_quests_kawaii', completedQuestsCount); 
    lsSet('kawaii_guild_coins', guildCoins); 
    playSound('success'); 
    fireConfetti(); 
    showToast('Missão Cumprida! (+50🟡)', '🎉', 'var(--success)'); 
    updateUI(); 
};

window.delSub = function(id) {
    subs = subs.filter(s => s.id !== id);
    lsSet('kawaii_subs', subs);
    playSound('success');
    updateUI(); 
};

window.selectClass = function(c) { 
    playerClass = c; 
    lsSet('kawaii_class', c); 
    const classM = document.getElementById('classModal');
    if(classM) classM.classList.remove('active'); 
    playSound('success'); 
    fireConfetti(); 
    updateUI(); 
};

window.renameMascot = function() { 
    const el = document.getElementById('mascotNameInput');
    if(!el) return;
    const n = el.value.trim(); 
    if (n) { 
        mascotName = n; 
        lsSet('kawaii_mascot_name', n); 
        bindMascotData(); 
        showToast('Companheira Batizada!', '🐾', 'var(--success)'); 
        playSound('success'); 
        el.value = '';
    } else {
        showToast('Digite um nome primeiro!', '❌', 'var(--danger)');
        playSound('error');
    }
};

window.deleteTransaction = function(id) { 
    transactions = transactions.filter(t => t.id !== id); 
    lsSet('financas_kawaii', transactions); 
    playSound('error'); 
    updateUI(); 
};

window.duplicateTransaction = function(id) { 
    const t = transactions.find(t => t.id === id); 
    if (t) { 
        transactions.push({ ...t, id: Date.now(), date: new Date().toLocaleDateString('pt-BR') }); 
        lsSet('financas_kawaii', transactions); 
        playSound('coin'); updateUI(); showToast('Clonado!', '👯', 'var(--primary)'); 
    } 
};

window.openEditModal = function(id) { 
    const t = transactions.find(t => t.id === id); 
    if(!t) return;
    document.getElementById('editId').value = t.id; 
    document.getElementById('editDesc').value = t.desc; 
    document.getElementById('editAmount').value = t.amount; 
    document.getElementById('editType').value = t.type; 
    
    const catEl = document.getElementById('editCategory');
    catEl.innerHTML = '';
    let o = []; 
    if (t.type === 'income') o = ['Salário', 'Loot', 'Venda', 'Outros']; 
    else if (t.type === 'expense') o = ['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Outros']; 
    else o = ['Baú', 'Bolsa', 'Cripto']; 
    o.forEach(opt => { const el = document.createElement('option'); el.value = opt; el.innerText = opt; catEl.appendChild(el); }); 
    
    document.getElementById('editCategory').value = t.category; 
    document.getElementById('editDate').value = fIsoDate(t.date); 
    document.getElementById('editModal').classList.add('active'); 
};

window.buySkill = function(id, max) { 
    if (max) return; 
    if (sp > 0) { 
        sp--; 
        userSkills[id]++; 
        lsSet('kawaii_sp', sp); 
        lsSet('userSkills', userSkills); 
        playSound('success'); 
        fireConfetti(); 
        updateUI(); 
    } else { 
        playSound('error'); 
        showToast('SP Insuficiente!', '❌', 'var(--danger)'); 
    } 
};

window.exportCSV = function() { 
    let csv = "data:text/csv;charset=utf-8,\uFEFFData,Descrição,Categoria,Tipo,Valor\r\n"; 
    transactions.forEach(t => csv += `${t.date},"${t.desc}","${t.category}",${t.type},${t.amount}\r\n`); 
    const link = document.createElement("a"); link.href = encodeURI(csv); link.download = "bolsa.csv"; link.click(); playSound('coin'); 
};

window.exportJSON = function() { 
    const p = { transactions, subs, guildCoins, unlockedThemes, unlockedWaifus, unlockedTitles, unlockedArts, equippedWaifu, equippedTitle, playerClass, monthlyBudget, bonusXP, mascotName, bankCoins, bankLastDate, affinities, dTrack, expData, sp, userSkills, stonks, quests }; 
    const link = document.createElement("a"); link.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(p)); link.download = "save_kawaii.json"; link.click(); playSound('coin'); 
};

window.importJSON = function() {
    const fileEl = document.getElementById('importJSON');
    if (!fileEl || !fileEl.files[0]) {
        showToast('Selecione um arquivo!', '❌', 'var(--danger)');
        return; 
    }
    
    const file = fileEl.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const s = JSON.parse(e.target.result);
            if (s.transactions) transactions = s.transactions; if (s.subs) subs = s.subs; if (s.guildCoins) guildCoins = s.guildCoins; 
            if (s.unlockedThemes) unlockedThemes = s.unlockedThemes; if (s.unlockedWaifus) unlockedWaifus = s.unlockedWaifus; 
            if (s.unlockedTitles) unlockedTitles = s.unlockedTitles; if (s.unlockedArts) unlockedArts = s.unlockedArts; 
            if (s.equippedWaifu) equippedWaifu = s.equippedWaifu; if (s.equippedTitle) equippedTitle = s.equippedTitle; 
            if (s.playerClass) playerClass = s.playerClass; if (s.monthlyBudget) monthlyBudget = s.monthlyBudget; 
            if (s.bonusXP) bonusXP = s.bonusXP; if (s.mascotName) mascotName = s.mascotName; 
            if (s.bankCoins) bankCoins = s.bankCoins; if (s.bankLastDate) bankLastDate = s.bankLastDate; 
            if (s.sp) sp = s.sp; if (s.userSkills) userSkills = s.userSkills; if (s.quests) quests = s.quests;
            
            lsSet('financas_kawaii', transactions); lsSet('kawaii_subs', subs); lsSet('kawaii_guild_coins', guildCoins); 
            lsSet('kawaii_unlocked_themes', unlockedThemes); lsSet('kawaii_unlocked_waifus', unlockedWaifus); 
            lsSet('kawaii_unlocked_titles', unlockedTitles); lsSet('kawaii_equipped_waifu', equippedWaifu); 
            lsSet('kawaii_equipped_title', equippedTitle); lsSet('kawaii_class', playerClass); 
            lsSet('kawaii_budget', monthlyBudget); lsSet('kawaii_bonus_xp', bonusXP); lsSet('kawaii_mascot_name', mascotName); 
            lsSet('kawaii_bank_coins', bankCoins); lsSet('kawaii_bank_date', bankLastDate); lsSet('kawaii_sp', sp); 
            lsSet('userSkills', userSkills); lsSet('quests_kawaii', quests);
            
            playSound('success'); updateUI(); showToast('Save Carregado!', '🧙‍♂️', 'var(--success)');
        } catch (err) { playSound('error'); showToast('Corrompido!', '❌', 'var(--danger)'); }
    }; 
    reader.readAsText(file);
};

window.wipeData = function() { 
    if (confirm("⚠️ APAGAR TUDO PERMANENTEMENTE?")) { localStorage.clear(); location.reload(); } 
};

function runBank() {
    const td = new Date().toLocaleDateString('pt-BR');
    if (bankCoins > 0 && bankLastDate !== td) { 
        let juros = unlockedArts.includes('art_calice') ? 0.02 : 0.01; 
        bankCoins += bankCoins * juros; 
        lsSet('kawaii_bank_coins', bankCoins); 
        lsSet('kawaii_bank_date', td); 
        bankLastDate = td; 
        showToast('Juros da Guilda renderam!', '🏛️', 'var(--success)'); 
    }
    const bd = document.getElementById('bankBalanceDisplay'); 
    if (bd) bd.innerText = bankCoins.toFixed(1) + ' 🟡';
}

function updateStonks() {
    let now = Date.now(); 
    if (now - stonks.lastUpd > 4 * 3600 * 1000) { 
        let c = (Math.random() - 0.5) * 10; 
        let nP = Math.max(1, Math.floor(stonks.price + c)); 
        stonks.hist.push(nP); 
        if (stonks.hist.length > 10) stonks.hist.shift(); 
        stonks.price = nP; 
        stonks.lastUpd = now; 
        lsSet('stonks', stonks); 
    }
    
    const pD = document.getElementById('stonksPriceDisplay'); 
    const oD = document.getElementById('stonksOwnedDisplay'); 
    if (pD) pD.innerText = `1 Ação = ${stonks.price} 🟡`; 
    if (oD) oD.innerText = stonks.owned;
    
    const ctx = document.getElementById('stonksChart'); 
    if (!ctx) return;
    
    if (ctx.parentElement) {
        ctx.parentElement.style.height = '150px';
        ctx.parentElement.style.minHeight = '150px';
        ctx.parentElement.style.maxHeight = '150px';
        ctx.parentElement.style.display = 'block';
    }
    
    if (stonksChartInst) {
        stonksChartInst.destroy();
        stonksChartInst = null;
    }
    
    if (Chart.getChart("stonksChart")) {
        Chart.getChart("stonksChart").destroy();
    }
    
    stonksChartInst = new Chart(ctx.getContext('2d'), { 
        type: 'line', 
        data: { 
            labels: stonks.hist.map((_, i) => i), 
            datasets: [{ data: stonks.hist, borderColor: '#F43F5E', borderWidth: 2, pointRadius: 0, tension: 0.1 }] 
        }, 
        options: { 
            responsive: true, maintainAspectRatio: false, 
            plugins: { legend: { display: false } }, 
            scales: { x: { display: false }, y: { display: false } } 
        } 
    });
}

function renderShop() {
    const cT = document.getElementById('shopContainer'); 
    const cW = document.getElementById('waifuContainer'); 
    const cA = document.getElementById('artifactContainer'); 
    const cTi = document.getElementById('titleContainer');
    
    if (cT) cT.innerHTML = ''; 
    if (cW) cW.innerHTML = ''; 
    if (cA) cA.innerHTML = ''; 
    if (cTi) cTi.innerHTML = '';
    
    if (cT) {
        themesDB.forEach(s => { 
            const isO = unlockedThemes.includes(s.id); 
            const isA = currentTheme === s.id; 
            const p = getClassMod('discount', s.price); 
            cT.innerHTML += `
                <div class="achievement-card shop-item ${isO ? 'owned' : ''} ${isA ? 'active-theme' : ''}" style="${isO ? 'pointer-events: auto;' : ''}" onclick="${isO ? `window.equipItem('theme', '${s.id}')` : `window.buyItem('theme', '${s.id}', ${p})`}">
                    <span class="ach-icon">${s.icon}</span>
                    <div class="ach-name">${s.name}</div>
                    <div style="margin-top: 1rem; font-weight: 800; color: ${isO ? 'var(--success)' : 'var(--warning)'};">${isO ? (isA ? 'Equipado ✅' : 'Equipar') : p + ' 🟡'}</div>
                </div>`; 
        });
    }
    
    if (cW) {
        waifusDB.filter(w => !w.gacha || unlockedWaifus.includes(w.id)).forEach(s => { 
            const isO = unlockedWaifus.includes(s.id); 
            const isA = equippedWaifu === s.id; 
            const p = getClassMod('discount', s.price); 
            cW.innerHTML += `
                <div class="achievement-card shop-item ${isO ? 'owned' : ''} ${isA ? 'active-theme' : ''}" style="${isO ? 'pointer-events: auto;' : ''}" onclick="${isO ? `window.equipItem('waifu', '${s.id}')` : `window.buyItem('waifu', '${s.id}', ${p})`}">
                    <span class="ach-icon" style="font-size:2rem;">${s.name}</span>
                    <div class="ach-desc">Raridade: ${s.r.toUpperCase()}</div>
                    <div style="margin-top: 1rem; font-weight: 800; color: ${isO ? 'var(--success)' : 'var(--warning)'};">${isO ? (isA ? 'Equipada ✅' : 'Equipar') : p + ' 🟡'}</div>
                </div>`; 
        });
    }
    
    if (cA) {
        artsDB.forEach(s => { 
            const isO = unlockedArts.includes(s.id); 
            const p = getClassMod('discount', s.price); 
            cA.innerHTML += `
                <div class="achievement-card shop-item ${isO ? 'owned' : ''}" ${isO ? '' : `onclick="window.buyItem('art','${s.id}',${p})"`}>
                    <span class="ach-icon">${s.icon}</span>
                    <div class="ach-name">${s.name}</div>
                    <div class="ach-desc">${s.desc}</div>
                    <div style="margin-top: 1rem; font-weight: 800; color: ${isO ? 'var(--success)' : 'var(--warning)'};">${isO ? 'Ativo ♾️' : p + ' 🟡'}</div>
                </div>`; 
        });
    }
    
    if (cTi) {
        titlesDB.forEach(s => { 
            const isO = unlockedTitles.includes(s.id); 
            const isA = equippedTitle === s.id; 
            const p = getClassMod('discount', s.price); 
            cTi.innerHTML += `
                <div class="achievement-card shop-item ${isO ? 'owned' : ''} ${isA ? 'active-theme' : ''}" style="${isO ? 'pointer-events: auto;' : ''}" onclick="${isO ? `window.equipItem('title', '${s.id}')` : `window.buyItem('title', '${s.id}', ${p})`}">
                    <span class="ach-icon">${s.icon}</span>
                    <div class="ach-name">${s.name}</div>
                    <div style="margin-top: 1rem; font-weight: 800; color: ${isO ? 'var(--success)' : 'var(--warning)'};">${isO ? (isA ? 'Equipado ✅' : 'Equipar') : p + ' 🟡'}</div>
                </div>`; 
        });
    }
}

window.checkDaily = function() {
    const td = new Date().toLocaleDateString('pt-BR');
    if (dTrack.date !== td) { 
        dTrack = { date: td, pets: 0, items: 0, claimed: [false,false,false] }; 
        lsSet('dailyTrack', dTrack); 
    }
    
    const lastLg = lsGet('kawaii_last_login', ''); 
    if (lastLg !== td && playerClass) { 
        const dm = document.getElementById('dailyModal');
        if(dm) dm.classList.add('active'); 
        playSound('success'); 
        fireConfetti(); 
    }
    
    const c = document.getElementById('dailyQuestsContainer'); 
    if (!c) return; 
    c.innerHTML = '';
    
    const qs = [ 
        { id: 0, n: "Fazer Login", g: 1, c: 1, r: 10 }, 
        { id: 1, n: "Fazer carinho 5x", g: 5, c: dTrack.pets, r: 15 }, 
        { id: 2, n: "Registar 1 item", g: 1, c: dTrack.items, r: 20 } 
    ];
    
    qs.forEach(q => { 
        let dn = q.c >= q.g; 
        let cl = dTrack.claimed[q.id]; 
        let displayC = Math.min(q.c, q.g);
        
        c.innerHTML += `
            <div class="quest-item glass" style="border-color:${cl ? 'var(--success)' : (dn ? 'var(--warning)' : 'var(--border-soft)')}">
                <div class="quest-header">
                    <h4 style="color:${cl ? 'var(--success)' : (dn ? 'var(--warning)' : 'var(--text-dark)')}">
                        ${cl ? '✅' : (dn ? '⭐' : '⏳')} ${q.n}
                    </h4>
                    <span class="text-muted">${displayC}/${q.g}</span>
                </div>
                ${!cl ? `<button class="btn-primary" style="margin-top:10px; background:${dn ? 'var(--success)' : 'var(--border-soft)'}" ${dn ? '' : 'disabled'} onclick="window.claimDailyQ(${q.id}, ${q.r})">${dn ? 'Resgatar Loot' : 'Pendente'}</button>` : ''}
            </div>`; 
    });
};

window.checkExp = function() {
    const z = document.getElementById('expeditionTimer'); 
    const b = document.getElementById('btnExpedition'); 
    if (!z || !b) return;
    
    if (!expData.active) { 
        z.innerText = "Pronta para partir!"; 
        b.innerText = "Iniciar Expedição (8h)"; 
        b.disabled = false; 
        b.style.background = 'var(--success)';
        b.onclick = window.startExpedition;
    } else {
        let l = expData.end - Date.now();
        if (l <= 0) { 
            z.innerText = "Expedição Concluída!"; 
            b.innerText = "Recolher Loot 🎁"; 
            b.disabled = false; 
            b.style.background = 'var(--warning)';
            b.onclick = window.collectExpedition;
        } else { 
            let h = Math.floor(l / 3600000); 
            let m = Math.floor((l % 3600000) / 60000); 
            z.innerText = `Em Missão... ${h}h ${m}m`; 
            b.innerText = "Aguarde..."; 
            b.disabled = true; 
            b.style.background = 'var(--border-soft)'; 
            b.onclick = null; 
        }
    }
}; 

function renderSkills() {
    const c = document.getElementById('skillsContainer'); 
    if (!c) return; 
    c.innerHTML = ''; 
    
    const elSp = document.getElementById('spDisplayCount');
    if(elSp) elSp.innerText = sp;
    
    const sD = [ 
        { id: 'labia', name: 'Lábia', desc: '-5% preços da Loja', max: 5, icon: '🗣️' }, 
        { id: 'midas', name: 'Midas', desc: '+10% Loot de Expedição', max: 5, icon: '👑' }, 
        { id: 'sabio', name: 'Sábio', desc: '+5% XP passivo', max: 5, icon: '📖' } 
    ];
    
    sD.forEach(s => { 
        let lvl = userSkills[s.id]; 
        let isM = lvl >= s.max; 
        c.innerHTML += `
            <div class="skill-card ${isM ? 'maxed' : ''}" onclick="window.buySkill('${s.id}', ${isM})">
                <h1 style="font-size:3rem; margin-bottom:10px;">${s.icon}</h1>
                <h3 style="color:var(--primary)">${s.name}</h3>
                <p class="text-muted">${s.desc}</p>
                <div style="margin-top:10px; font-weight:800; color:${isM ? 'var(--success)' : 'var(--warning)'}">
                    Lvl ${lvl}/${s.max} ${isM ? '' : '(Custa 1 SP)'}
                </div>
            </div>`; 
    });
}

function renderSubs() {
    const container = document.getElementById('subsContainer');
    if(!container) return;
    
    container.innerHTML = '';
    subs.forEach(s => {
        container.innerHTML += `
            <div class="quest-item glass" style="border-color: var(--danger)">
                <div class="quest-header">
                    <h4 style="color:var(--danger)">☠️ ${s.name}</h4>
                    <span>${fCurr(s.amount)} /mês</span>
                </div>
                <button class="btn-icon" style="color:var(--danger); width:100%" onclick="window.delSub(${s.id})">Quebrar Maldição 🗑️</button>
            </div>
        `;
    });
}

function runSubscriptions() {
    const today = new Date(); 
    const currentMonth = `${today.getMonth()}-${today.getFullYear()}`;
    if (lastSubRun !== currentMonth && subs.length > 0) {
        subs.forEach(s => { 
            transactions.push({ 
                id: Date.now() + Math.random(), 
                desc: `Maldição: ${s.name}`, 
                amount: s.amount, 
                type: 'expense', 
                category: s.category, 
                date: today.toLocaleDateString('pt-BR') 
            }); 
        });
        lsSet('financas_kawaii', transactions); 
        lsSet('kawaii_last_sub_run', currentMonth); 
        lastSubRun = currentMonth; 
        showToast('As Maldições atacaram!', '☠️', 'var(--danger)');
    }
}

function renderQuests() {
    const container = document.getElementById('questsContainer'); 
    if (!container) return; 
    container.innerHTML = '';
    
    if (quests.length === 0) { 
        container.innerHTML = '<p class="text-muted" style="text-align:center;">Nenhuma missão de caça no momento.</p>'; 
        return; 
    }
    
    quests.forEach(q => { 
        let percentage = (q.current / q.target) * 100; 
        let isComplete = percentage >= 100; 
        
        container.innerHTML += `
            <div class="quest-item glass" style="border-color: ${isComplete ? 'var(--success)' : 'var(--border-soft)'}">
                <div class="quest-header">
                    <h4>${isComplete ? '✅' : '🗺️'} ${q.name}</h4>
                    <span class="text-muted" style="font-weight:700;">${fCurr(q.current)} / ${fCurr(q.target)}</span>
                </div>
                <div class="quest-bar-container">
                    <div class="quest-bar-fill pulse" style="width:${Math.min(percentage, 100)}%; background-color:${isComplete ? 'var(--success)' : 'var(--warning)'}"></div>
                </div>
                ${!isComplete ? `
                <div class="quest-actions" style="margin-top:1rem;">
                    <input type="number" id="addQ_${q.id}" class="input-glass" style="width:120px; padding:0.8rem;" placeholder="Ouros" step="0.01">
                    <button class="btn-icon" style="background:var(--success); color:white;" onclick="window.addQuest(${q.id})">💰</button>
                    <button class="btn-icon" style="margin-left:auto; color:var(--danger);" onclick="window.delQuest(${q.id})">🗑️</button>
                </div>` : `
                <button class="btn-primary pulse-hover" style="background:var(--success); margin-top:1rem;" onclick="window.finishQuest(${q.id})">Pegar Recompensa!</button>
                `}
            </div>`; 
    });
}

function renderTabs(data) {
    const fB = document.getElementById('fullTableBody'); 
    const dB = document.getElementById('dashboardTableBody');
    if (!fB || !dB) return; 
    
    fB.innerHTML = ''; 
    dB.innerHTML = '';
    
    if (!data.length) { 
        fB.innerHTML = dB.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem;">Inventário Vazio! 🏜️</td></tr>`; 
        return; 
    }
    
    const rD = [...data].reverse();
    
    rD.slice(0, 5).forEach(t => { 
        const c = t.type === 'income' ? 'val-income' : (t.type === 'expense' ? 'val-expense' : 'val-investment'); 
        const s = t.type === 'expense' ? '-' : (t.type === 'income' ? '+' : ''); 
        dB.innerHTML += `<tr><td>${t.desc}</td><td class="${c}">${s} ${fCurr(t.amount)}</td></tr>`; 
    });
    
    rD.forEach(t => { 
        const c = t.type === 'income' ? 'val-income' : (t.type === 'expense' ? 'val-expense' : 'val-investment'); 
        const s = t.type === 'expense' ? '-' : (t.type === 'income' ? '+' : ''); 
        const b = `
            <button class="btn-icon" onclick="window.openEditModal(${t.id})" title="Editar">🔨</button>
            <button class="btn-icon" style="color:var(--primary)" onclick="window.duplicateTransaction(${t.id})" title="Clonar">👯</button>
            <button class="btn-icon" style="color:var(--danger)" onclick="window.deleteTransaction(${t.id})" title="Apagar">🗑️</button>
        `; 
        fB.innerHTML += `<tr><td>${t.desc}</td><td>${t.category}</td><td>${t.date}</td><td class="${c}">${s} ${fCurr(t.amount)}</td><td style="display:flex;gap:5px;flex-wrap:nowrap;">${b}</td></tr>`; 
    });
}

function renderCharts(data) {
    const elH = document.getElementById('historyChart'); 
    const elE = document.getElementById('expenseChart'); 
    if (!elH || !elE) return;
    
    if(elH.parentElement) {
        elH.parentElement.style.height = '250px';
        elH.parentElement.style.minHeight = '250px';
        elH.parentElement.style.maxHeight = '250px';
        elH.parentElement.style.width = '100%';
        elH.parentElement.style.display = 'block';
    }
    if(elE.parentElement) {
        elE.parentElement.style.height = '250px';
        elE.parentElement.style.minHeight = '250px';
        elE.parentElement.style.maxHeight = '250px';
        elE.parentElement.style.width = '100%';
        elE.parentElement.style.display = 'block';
    }

    const isD = ['dark', 'abyss', 'galaxy', 'cyberpunk', 'arcade', 'vampire'].includes(document.documentElement.getAttribute('data-theme')); 
    const tC = isD ? '#F8FAFC' : '#4B5563';
    
    const exO = data.filter(t => t.type === 'expense'); 
    const cT = {}; 
    exO.forEach(t => cT[t.category] = (cT[t.category] || 0) + t.amount);
    
    if (expenseChartInst) {
        expenseChartInst.destroy();
        expenseChartInst = null;
    }
    
    if (Chart.getChart("expenseChart")) {
        Chart.getChart("expenseChart").destroy();
    }
    
    expenseChartInst = new Chart(elE.getContext('2d'), { 
        type: 'doughnut', 
        data: { 
            labels: Object.keys(cT).length ? Object.keys(cT) : ['Paz'], 
            datasets: [{ 
                data: Object.values(cT).length ? Object.values(cT) : [1], 
                backgroundColor: Object.values(cT).length ? ['#FB7185', '#FBBF24', '#A78BFA', '#34D399', '#60A5FA'] : [isD ? '#1E293B' : '#FFFFFF'], 
                borderWidth: 0, 
                hoverOffset: 15 
            }] 
        }, 
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { legend: { position: 'right', labels: { color: tC, font: { family: "'Fredoka'" } } } }, 
            cutout: '70%' 
        } 
    });
    
    const sD = [...data].sort((a, b) => new Date(fIsoDate(a.date)) - new Date(fIsoDate(b.date))); 
    let rB = 0; const dts = []; const bls = [];
    sD.forEach(t => { 
        rB += t.type === 'expense' ? -t.amount : t.amount; 
        dts.push(t.date.substring(0, 5)); 
        bls.push(rB); 
    });
    
    if (historyChartInst) {
        historyChartInst.destroy();
        historyChartInst = null;
    }
    
    if (Chart.getChart("historyChart")) {
        Chart.getChart("historyChart").destroy();
    }
    
    historyChartInst = new Chart(elH.getContext('2d'), { 
        type: 'line', 
        data: { 
            labels: dts.length ? dts : ['Hoje'], 
            datasets: [{ 
                label: 'Baú', 
                data: bls.length ? bls : [0], 
                borderColor: '#A78BFA', 
                backgroundColor: 'rgba(167, 139, 250, 0.2)', 
                borderWidth: 3, fill: true, tension: 0.4 
            }] 
        }, 
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            scales: { x: { ticks: { color: tC } }, y: { ticks: { color: tC } } }, 
            plugins: { legend: { display: false } } 
        } 
    });
}

function updateUI() {
    initMascotDOM(); 
    
    if (!playerClass) { 
        const modal = document.getElementById('classModal');
        if(modal) modal.classList.add('active'); 
        return; 
    }
    
    const filterSelect = document.getElementById('monthFilter'); 
    if(filterSelect) {
        const uniqueMonths = new Set();
        transactions.forEach(t => { 
            const parts = t.date.split('/'); 
            if (parts.length === 3) uniqueMonths.add(`${parts[1]}/${parts[2]}`); 
        });
        
        const currentSelection = filterSelect.value; 
        filterSelect.innerHTML = '<option value="all">Todo o Tempo</option>';
        
        Array.from(uniqueMonths).sort((a, b) => { 
            return new Date(b.split('/')[1], b.split('/')[0] - 1) - new Date(a.split('/')[1], a.split('/')[0] - 1); 
        }).forEach(month => filterSelect.appendChild(new Option(month, month)));
        
        if (Array.from(uniqueMonths).includes(currentSelection) || currentSelection === 'all') { 
            filterSelect.value = currentSelection; 
        }

        filteredDataCache = filterSelect.value === 'all' ? transactions : transactions.filter(t => t.date.includes(filterSelect.value));
    } else {
        filteredDataCache = transactions;
    }
    
    let i=0, e=0, v=0; 
    filteredDataCache.forEach(t => { 
        if (t.type === 'income') i += t.amount; 
        if (t.type === 'expense') e += t.amount; 
        if (t.type === 'investment') v += t.amount; 
    });
    
    let lifeV = 0;
    transactions.forEach(t => { if(t.type === 'investment') lifeV += t.amount; });
    
    const setInner = (id, val) => { const el = document.getElementById(id); if(el) el.innerText = val; };
    setInner('balanceDisplay', fCurr(i - e - v));
    setInner('incomeDisplay', fCurr(i));
    setInner('expenseDisplay', fCurr(e));
    setInner('investmentDisplay', fCurr(v));

    let totXP = Math.floor(getClassMod('xp', (transactions.length * 15) + (lifeV * 0.5))) + bonusXP + (userSkills.sabio * 50);
    let cLvl = 1; let xpNeeded = 500; let xpAcc = 0; 
    
    while (totXP >= xpAcc + xpNeeded) { 
        xpAcc += xpNeeded; cLvl++; xpNeeded = cLvl * 500; 
    } 
    const xpInLevel = totXP - xpAcc;

    if (cLvl > lastStoredLevel) { 
        sp += (cLvl - lastStoredLevel); 
        const lvlModal = document.getElementById('levelUpModal');
        if(lvlModal) {
            const nl = document.getElementById('newLevelText');
            if(nl) nl.innerText = `Lvl ${cLvl}`; 
            lvlModal.classList.add('active'); 
            playSound('success'); 
            fireConfetti(); 
        }
        lsSet('kawaii_last_level', cLvl); 
        lastStoredLevel = cLvl; 
        guildCoins += 50; 
        lsSet('kawaii_guild_coins', guildCoins); 
        lsSet('kawaii_sp', sp); 
    }
    
    document.querySelectorAll('.lblLevel').forEach(el => el.innerText = cLvl); 
    document.querySelectorAll('.barXp').forEach(el => el.style.width = `${(xpInLevel / xpNeeded) * 100}%`); 
    document.querySelectorAll('.lblXp').forEach(el => el.innerText = `${xpInLevel} / ${xpNeeded} XP`);

    const bossHp = monthlyBudget - e; 
    const hpPerc = Math.max(0, (bossHp / monthlyBudget) * 100);
    
    document.querySelectorAll('#bossHpText').forEach(el => el.innerText = `${fCurr(bossHp)} / ${fCurr(monthlyBudget)}`); 
    document.querySelectorAll('#bossHpBar').forEach(el => el.style.width = `${hpPerc}%`);
    document.querySelectorAll('#bossEmoji').forEach(be => { 
        if (bossHp <= 0) { be.innerText = '💀'; be.style.filter = 'grayscale(1)'; } 
        else { be.innerText = '🐉'; be.style.filter = 'none'; } 
    });
    
    const wf = waifusDB.find(x => x.id === equippedWaifu) || waifusDB[0];
    const isSad = (e > i * 0.75 && i > 0) || bossHp <= 0;
    
    document.querySelectorAll('.imgFace').forEach(img => { 
        img.style.display = 'block';
        if(img.nextElementSibling && img.nextElementSibling.classList.contains('imgFallback')) {
            img.nextElementSibling.style.display = 'none';
        }
        const newSrc = `assets/gifs/${wf.id}_${isSad ? 'triste' : 'feliz'}.gif`;
        if (img.getAttribute('src') !== newSrc) {
            img.src = newSrc; 
        }
    });
    
    document.querySelectorAll('.lblMsg').forEach(msg => { msg.innerText = isSad ? wf.mT : wf.mH; });
    document.querySelectorAll('.lblEvo').forEach(evo => { 
        if (cLvl < 10) evo.innerText = 'Aprendiz'; 
        else if (cLvl < 50) evo.innerText = 'Aventureira'; 
        else evo.innerText = 'Lenda Viva'; 
    });

    bindMascotData(); 
    renderSubs(); 
    renderTabs(filteredDataCache); 
    renderCharts(filteredDataCache); 
    renderShop(); 
    updateStonks(); 
    renderSkills();
    renderQuests(); 
    runBank();
}

function initApp() {
    document.addEventListener('click', (e) => {
        if (e.target.closest('#themeToggleDesk') || e.target.closest('#themeToggleMob')) {
            window.toggleThemeAct();
        }
        
        if (e.target.closest('#toggleSoundDesk') || e.target.closest('#toggleSoundMob')) {
            soundEnabled = !soundEnabled; 
            const txt = soundEnabled ? '🔊 SFX' : '🔇 SFX';
            const btnDesk = document.getElementById('toggleSoundDesk');
            const btnMob = document.getElementById('toggleSoundMob');
            if (btnDesk) btnDesk.innerText = txt;
            if (btnMob) btnMob.innerText = txt;
            playSound('boop');
        }
        
        if (e.target.closest('#toggleRadioDesk') || e.target.closest('#toggleRadioMob')) {
            radioOn = !radioOn; 
            const p = document.getElementById('lofiPlayer'); 
            if (p) { 
                if (radioOn) p.play().catch(() => {}); 
                else p.pause(); 
            }
            const txt = radioOn ? '📻 Rádio: ON' : '📻 Rádio: OFF'; 
            const rdDesk = document.getElementById('toggleRadioDesk');
            const rdMob = document.getElementById('toggleRadioMob');
            if (rdDesk) rdDesk.innerText = txt;
            if (rdMob) rdMob.innerText = txt;
            playSound('coin');
        }
    });

    function upSel(tId, cId) { 
        const tEl = document.getElementById(tId);
        const cEl = document.getElementById(cId);
        if(!tEl || !cEl) return;
        
        const t = tEl.value; 
        cEl.innerHTML = ''; 
        let o = []; 
        if (t === 'income') o = ['Salário', 'Loot', 'Venda', 'Outros']; 
        else if (t === 'expense') o = ['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Outros']; 
        else o = ['Baú', 'Bolsa', 'Cripto']; 
        
        o.forEach(opt => { 
            const el = document.createElement('option'); 
            el.value = opt; el.innerText = opt; cEl.appendChild(el); 
        }); 
    }

    function addEventSafely(id, event, callback) {
        const el = document.getElementById(id);
        if(el) el.addEventListener(event, callback);
    }

    addEventSafely('type', 'change', () => upSel('type', 'category'));
    addEventSafely('editType', 'change', () => upSel('editType', 'editCategory'));
    addEventSafely('monthFilter', 'change', updateUI);

    const formEl = document.getElementById('transactionForm');
    if(formEl) {
        formEl.addEventListener('submit', (e) => {
            e.preventDefault(); 
            transactions.push({ 
                id: Date.now(), 
                desc: document.getElementById('desc').value, 
                amount: parseFloat(document.getElementById('amount').value), 
                type: document.getElementById('type').value, 
                category: document.getElementById('category').value, 
                date: fBrDate(document.getElementById('transDate').value) 
            }); 
            
            lsSet('financas_kawaii', transactions); 
            e.target.reset(); 
            document.getElementById('transDate').value = new Date().toISOString().split('T')[0];
            
            document.querySelectorAll('#bossEmoji').forEach(be => { be.classList.remove('boss-hit'); void be.offsetWidth; be.classList.add('boss-hit'); }); 
            
            playSound('coin'); 
            dTrack.items++; 
            lsSet('dailyTrack', dTrack); 
            window.checkDaily(); 
            updateUI(); 
            showToast('Ação Salva!', '🎒', 'var(--success)');
        });
    }

    const editFormEl = document.getElementById('editForm');
    if(editFormEl) {
        editFormEl.addEventListener('submit', (e) => {
            e.preventDefault(); 
            const id = parseInt(document.getElementById('editId').value); 
            const index = transactions.findIndex(t => t.id === id);
            
            if (index !== -1) { 
                transactions[index] = { 
                    id, 
                    desc: document.getElementById('editDesc').value, 
                    amount: parseFloat(document.getElementById('editAmount').value), 
                    type: document.getElementById('editType').value, 
                    category: document.getElementById('editCategory').value, 
                    date: fBrDate(document.getElementById('editDate').value) 
                }; 
                lsSet('financas_kawaii', transactions); 
                document.getElementById('editModal').classList.remove('active'); 
                playSound('coin'); 
                updateUI(); 
                showToast('Reforjado!', '🔨', 'var(--warning)'); 
            }
        });
    }

    const subFormEl = document.getElementById('subForm');
    if(subFormEl) {
        subFormEl.addEventListener('submit', (e) => {
            e.preventDefault(); 
            subs.push({
                id: Date.now(),
                name: document.getElementById('subName').value,
                amount: parseFloat(document.getElementById('subAmount').value),
                category: document.getElementById('subCategory').value
            });
            lsSet('kawaii_subs', subs);
            e.target.reset();
            playSound('error');
            showToast('Maldição aceita!', '📜', 'var(--danger)');
            updateUI();
        });
    }

    const questFormEl = document.getElementById('questForm');
    if(questFormEl) {
        questFormEl.addEventListener('submit', (e) => { 
            e.preventDefault(); 
            quests.push({ 
                id: Date.now(), 
                name: document.getElementById('questName').value, 
                target: parseFloat(document.getElementById('questTarget').value), 
                current: 0 
            }); 
            lsSet('quests_kawaii', quests); 
            e.target.reset(); 
            playSound('coin'); 
            updateUI(); 
            showToast('Contrato Assinado!', '📜', 'var(--warning)'); 
        });
    }

    addEventSafely('btnRecap', 'click', () => { 
        const pD = transactions.filter(t => t.date.includes(new Date().getMonth() === 0 ? `12/${new Date().getFullYear() - 1}` : `${String(new Date().getMonth()).padStart(2, '0')}/${new Date().getFullYear()}`)); 
        let i=0, e=0, v=0; 
        pD.forEach(t => { 
            if(t.type === 'income') i += t.amount; 
            if(t.type === 'expense') e += t.amount; 
            if(t.type === 'investment') v += t.amount; 
        }); 
        recData = {i, e, v}; 
        recIdx = 0; 
        document.getElementById('recapModal').classList.add('active'); 
        playSound('success'); 
        showRecapSlide(); 
    });

    addEventSafely('recapContent', 'click', () => { recIdx++; playSound('coin'); showRecapSlide(); });

    document.querySelectorAll('#navMenu li, #navMenuMobile li').forEach(item => { 
        item.addEventListener('click', () => { 
            const tId = item.getAttribute('data-target'); 
            document.querySelectorAll('#navMenu li, #navMenuMobile li').forEach(n => n.classList.remove('active')); 
            document.querySelectorAll(`[data-target="${tId}"]`).forEach(el => el.classList.add('active')); 
            document.querySelectorAll('.view').forEach(v => { v.classList.remove('active'); v.style.display = 'none'; }); 
            
            const tv = document.getElementById(tId); 
            if(tv) {
                tv.style.display = 'block'; 
                setTimeout(() => tv.classList.add('active'), 10); 
            }
            
            const tit = { 
                'view-dashboard': ['Sua Base', 'Onde a magia acontece! ✨'], 
                'view-lancamentos': ['Sua Bolsa', 'Guarde ouros e poções. 🎒'], 
                'view-arena': ['Arena do Boss', 'Sobrevive à inflação! 🐉'], 
                'view-taverna': ['Taverna', 'Invoque aliados e faça missões! 🍻'], 
                'view-loja': ['Cidade Real', 'Compre temas e invista! 🛍️'], 
                'view-skills': ['Habilidades', 'Constelação de poder! 🌌'], 
                'view-config': ['Grimório', 'Ajustes e Backup. 📜'] 
            }; 
            const titleEl = document.getElementById('pageTitle');
            const subEl = document.getElementById('pageSubtitle');
            if(titleEl && tit[tId]) titleEl.innerText = tit[tId][0]; 
            if(subEl && tit[tId]) subEl.innerText = tit[tId][1]; 
        }); 
    });

    addEventSafely('btnExportCSV', 'click', window.exportCSV);
    addEventSafely('btnExportJSON', 'click', window.exportJSON);
    addEventSafely('btnImportJSON', 'click', window.importJSON);
    addEventSafely('btnWipe', 'click', window.wipeData);

    const btnClaimDaily = document.getElementById('claimDailyBtn');
    if(btnClaimDaily) {
        btnClaimDaily.addEventListener('click', () => { 
            let dXP = unlockedArts.includes('art_ampulheta') ? 100 : 50; 
            bonusXP += dXP; guildCoins += 15; 
            lsSet('kawaii_bonus_xp', bonusXP); lsSet('kawaii_guild_coins', guildCoins); lsSet('kawaii_last_login', new Date().toLocaleDateString('pt-BR')); 
            document.getElementById('dailyModal').classList.remove('active'); 
            playSound('coin'); 
            updateUI(); 
        });
    }

    upSel('type', 'category'); 
    runSubscriptions();
    updateUI();
    
    if(!expInterval) {
        window.checkExp();
        expInterval = setInterval(window.checkExp, 60000);
    }
    
    if(!bgVideoInterval) {
        bgVideoInterval = setInterval(initBgVideo, 3600000);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}