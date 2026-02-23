if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => console.log('Erro PWA', err));
    });
}

let audioCtx = null;
let soundEnabled = true;

const initAudio = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
};

const playSound = (type) => {
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
            osc.start(); osc.stop(audioCtx.currentTime + 0.1);
        } else if (type === 'error') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, audioCtx.currentTime);
            gn.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gn.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
            osc.start(); osc.stop(audioCtx.currentTime + 0.2);
        } else if (type === 'success') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(400, audioCtx.currentTime);
            osc.frequency.setValueAtTime(600, audioCtx.currentTime + 0.15);
            osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.3);
            gn.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gn.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
            osc.start(); osc.stop(audioCtx.currentTime + 0.5);
        } else if (type === 'boop') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1600, audioCtx.currentTime + 0.1);
            gn.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gn.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            osc.start(); osc.stop(audioCtx.currentTime + 0.1);
        }
    } catch (e) {
        console.error("Erro no som", e);
    }
};

document.getElementById('toggleSound').addEventListener('click', (e) => {
    soundEnabled = !soundEnabled;
    e.target.innerText = soundEnabled ? '🔊' : '🔇';
});

const fireConfetti = () => {
    const container = document.getElementById('confettiContainer');
    const colors = ['#FB7185', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA'];
    for (let i = 0; i < 60; i++) {
        const p = document.createElement('div');
        p.className = 'confetti-particle';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        const dur = Math.random() * 2 + 2;
        p.style.animationDuration = dur + 's';
        p.style.animationDelay = Math.random() * 0.5 + 's';
        container.appendChild(p);
        setTimeout(() => p.remove(), (dur + 0.5) * 1000);
    }
};

const showToast = (msg, emo = '✨', col = 'var(--primary)') => {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.borderColor = col;
    toast.innerHTML = `<span style="font-size: 1.8rem;">${emo}</span> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 400);
    }, 3500);
};

const fCurr = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fBrDate = (iso) => {
    if (!iso) return new Date().toLocaleDateString('pt-BR');
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
};
const fIsoDate = (br) => {
    const [d, m, y] = br.split('/');
    return `${y}-${m}-${d}`;
};

document.getElementById('transDate').value = new Date().toISOString().split('T')[0];

let transactions = JSON.parse(localStorage.getItem('financas_kawaii')) || [];
let subs = JSON.parse(localStorage.getItem('kawaii_subs')) || [];
let lastSubRun = localStorage.getItem('kawaii_last_sub_run') || '';
let guildCoins = parseInt(localStorage.getItem('kawaii_guild_coins')) || 0;
let unlockedThemes = JSON.parse(localStorage.getItem('kawaii_unlocked_themes')) || ['default', 'dark'];
let unlockedSkins = JSON.parse(localStorage.getItem('kawaii_unlocked_skins')) || ['none'];
let unlockedTitles = JSON.parse(localStorage.getItem('kawaii_unlocked_titles')) || ['title_0'];
let equippedSkin = localStorage.getItem('kawaii_equipped_skin') || 'none';
let equippedTitle = localStorage.getItem('kawaii_equipped_title') || 'title_0';
let playerClass = localStorage.getItem('kawaii_class') || null;
let monthlyBudget = parseFloat(localStorage.getItem('kawaii_budget')) || 2000;
let bonusXP = parseInt(localStorage.getItem('kawaii_bonus_xp')) || 0;
let lastStoredLevel = parseInt(localStorage.getItem('kawaii_last_level')) || 1;
let completedQuestsCount = parseInt(localStorage.getItem('completed_quests_kawaii')) || 0;
let mascotName = localStorage.getItem('kawaii_mascot_name') || 'Mascote';
let bankCoins = parseFloat(localStorage.getItem('kawaii_bank_coins')) || 0;
let bankLastDate = localStorage.getItem('kawaii_bank_date') || new Date().toLocaleDateString('pt-BR');
let userAchievements = JSON.parse(localStorage.getItem('achievements_kawaii')) || [];

let filteredDataCache = [];
let historyChartInst = null;
let expenseChartInst = null;

if (!playerClass) {
    document.getElementById('classModal').classList.add('active');
} else {
    document.getElementById('playerClassDisplay').innerText = playerClass.toUpperCase();
}

window.selectClass = (c) => {
    playerClass = c;
    localStorage.setItem('kawaii_class', c);
    document.getElementById('playerClassDisplay').innerText = c.toUpperCase();
    document.getElementById('classModal').classList.remove('active');
    playSound('success');
    fireConfetti();
    updateUI();
};

const getClassMod = (type, val) => {
    if (playerClass === 'mago' && type === 'xp') return val * 1.2;
    if (playerClass === 'ladino' && type === 'discount') return Math.floor(val * 0.85);
    return val;
};

document.getElementById('petZone').addEventListener('click', (e) => {
    playSound('boop');
    const img = document.getElementById('petZone');
    img.classList.remove('jump');
    void img.offsetWidth;
    img.classList.add('jump');
    const heart = document.createElement('div');
    heart.className = 'heart-particle';
    heart.innerText = '❤️';
    heart.style.left = e.clientX + 'px';
    heart.style.top = e.clientY + 'px';
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 1000);
});

window.renameMascot = () => {
    const n = document.getElementById('mascotNameInput').value;
    if (n) {
        mascotName = n;
        localStorage.setItem('kawaii_mascot_name', n);
        document.getElementById('mascotNameDisplay').innerText = n;
        showToast('Mascote Batizada!', '🐾');
        playSound('success');
    }
};

document.getElementById('mascotNameDisplay').innerText = mascotName;

const runSubscriptions = () => {
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
        localStorage.setItem('financas_kawaii', JSON.stringify(transactions));
        localStorage.setItem('kawaii_last_sub_run', currentMonth);
        lastSubRun = currentMonth;
        showToast('As Maldições atacaram!', '☠️', 'var(--danger)');
    }
};

const runBank = () => {
    const todayStr = new Date().toLocaleDateString('pt-BR');
    if (bankCoins > 0 && bankLastDate !== todayStr) {
        bankCoins += bankCoins * 0.01;
        localStorage.setItem('kawaii_bank_coins', bankCoins);
        localStorage.setItem('kawaii_bank_date', todayStr);
        bankLastDate = todayStr;
        showToast('Juros da Guilda rendidos!', '🏛️', 'var(--success)');
    }
    document.getElementById('bankBalanceDisplay').innerText = bankCoins.toFixed(1) + ' 🟡';
};

window.bankAction = (action) => {
    if (action === 'dep' && guildCoins >= 10) {
        guildCoins -= 10;
        bankCoins += 10;
    } else if (action === 'with' && bankCoins >= 10) {
        bankCoins -= 10;
        guildCoins += 10;
    } else {
        return showToast('Fundos insuficientes!', '❌', 'var(--danger)');
    }
    localStorage.setItem('kawaii_guild_coins', guildCoins);
    localStorage.setItem('kawaii_bank_coins', bankCoins);
    localStorage.setItem('kawaii_bank_date', new Date().toLocaleDateString('pt-BR'));
    playSound('coin');
    updateUI();
};

document.getElementById('subForm').addEventListener('submit', (e) => {
    e.preventDefault();
    subs.push({
        id: Date.now(),
        name: document.getElementById('subName').value,
        amount: parseFloat(document.getElementById('subAmount').value),
        category: document.getElementById('subCategory').value
    });
    localStorage.setItem('kawaii_subs', JSON.stringify(subs));
    e.target.reset();
    playSound('error');
    showToast('Maldição aceita!', '📜', 'var(--danger)');
    renderSubs();
});

const renderSubs = () => {
    const container = document.getElementById('subsContainer');
    container.innerHTML = '';
    subs.forEach(s => {
        container.innerHTML += `
            <div class="quest-item glass" style="border-color: var(--danger)">
                <div class="quest-header">
                    <h4 style="color:var(--danger)">☠️ ${s.name}</h4>
                    <span>${fCurr(s.amount)} /mês</span>
                </div>
                <button class="btn-icon" style="color:var(--danger); width:100%" onclick="delSub(${s.id})">Quebrar Maldição 🗑️</button>
            </div>
        `;
    });
};

window.delSub = (id) => {
    subs = subs.filter(s => s.id !== id);
    localStorage.setItem('kawaii_subs', JSON.stringify(subs));
    renderSubs();
    playSound('success');
};

const shopThemes = [
    { id: 'forest', name: 'Floresta', price: 50, icon: '🌲' },
    { id: 'ocean', name: 'Oceano', price: 100, icon: '🌊' },
    { id: 'fire', name: 'Fogo', price: 150, icon: '🔥' },
    { id: 'abyss', name: 'Abismo', price: 300, icon: '🌑' },
    { id: 'cyberpunk', name: 'Cyber Neon', price: 500, icon: '🤖' },
    { id: 'sakura', name: 'Jardim Sakura', price: 600, icon: '🌸' },
    { id: 'galaxy', name: 'Galáxia', price: 1000, icon: '🌌' },
    { id: 'candy', name: 'Reino Doce', price: 1200, icon: '🍬' },
    { id: 'arcade', name: 'Fliperama', price: 1500, icon: '🕹️' },
    { id: 'vampire', name: 'Castelo Vamp.', price: 2000, icon: '🦇' }
];

const shopSkins = [
    { id: 'none', name: 'Normal', price: 0, icon: '🦊' },
    { id: 'mage', name: 'Chapéu Mago', price: 80, icon: '🧙‍♂️', emoji: '🎩' },
    { id: 'cool', name: 'Óculos', price: 120, icon: '😎', emoji: '🕶️' },
    { id: 'ninja', name: 'Máscara Ninja', price: 200, icon: '🥷', emoji: '🥷' },
    { id: 'horn', name: 'Chifres', price: 250, icon: '😈', emoji: '😈' },
    { id: 'king', name: 'Coroa Real', price: 500, icon: '👑', emoji: '👑' },
    { id: 'scarf', name: 'Cachecol', price: 150, icon: '🧣', emoji: '🧣' },
    { id: 'flower', name: 'Coroa Flores', price: 180, icon: '🌼', emoji: '🌼' },
    { id: 'angel', name: 'Auréola', price: 600, icon: '😇', emoji: '👼' },
    { id: 'sword', name: 'Espada', price: 300, icon: '🗡️', emoji: '🗡️' }
];

const shopTitles = [
    { id: 'title_0', name: 'Novato', price: 0, icon: '🔰' },
    { id: 'title_1', name: 'O Poupador', price: 100, icon: '💸' },
    { id: 'title_2', name: 'Lorde do Ouro', price: 300, icon: '🏛️' },
    { id: 'title_3', name: 'Deus Supremo', price: 2000, icon: '⚡' },
    { id: 'title_4', name: 'Mão de Vaca', price: 50, icon: '🐄' },
    { id: 'title_5', name: 'Aristocrata', price: 500, icon: '🎩' },
    { id: 'title_6', name: 'Caçador Promo', price: 800, icon: '🏹' },
    { id: 'title_7', name: 'Capitalista', price: 5000, icon: '📈' }
];

let currentTheme = localStorage.getItem('kawaii_theme') || 'default';
if (currentTheme !== 'default') {
    document.documentElement.setAttribute('data-theme', currentTheme);
}

document.getElementById('themeToggle').addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'default' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme === 'default' ? '' : currentTheme);
    localStorage.setItem('kawaii_theme', currentTheme);
    renderCharts(filteredDataCache);
});

const renderShop = () => {
    const cThemes = document.getElementById('shopContainer');
    const cSkins = document.getElementById('skinContainer');
    const cTitles = document.getElementById('titleContainer');
    
    cThemes.innerHTML = '';
    cSkins.innerHTML = '';
    cTitles.innerHTML = '';
    
    shopThemes.forEach(s => {
        const isOwned = unlockedThemes.includes(s.id);
        const isActive = currentTheme === s.id;
        const price = getClassMod('discount', s.price);
        cThemes.innerHTML += `
            <div class="achievement-card shop-item ${isOwned ? 'owned' : ''} ${isActive ? 'active-theme' : ''}" onclick="${isOwned ? `equipTheme('${s.id}')` : `buyItem('theme', '${s.id}', ${price})`}">
                <span class="ach-icon">${s.icon}</span>
                <div class="ach-name">${s.name}</div>
                <div style="margin-top: 1rem; font-weight: 800; color: ${isOwned ? 'var(--success)' : 'var(--warning)'};">${isOwned ? (isActive ? 'Equipado ✅' : 'Equipar') : price + ' 🟡'}</div>
            </div>`;
    });
    
    shopSkins.forEach(s => {
        const isOwned = unlockedSkins.includes(s.id);
        const isActive = equippedSkin === s.id;
        const price = getClassMod('discount', s.price);
        cSkins.innerHTML += `
            <div class="achievement-card shop-item ${isOwned ? 'owned' : ''} ${isActive ? 'active-theme' : ''}" onclick="${isOwned ? `equipSkin('${s.id}')` : `buyItem('skin', '${s.id}', ${price})`}">
                <span class="ach-icon">${s.icon}</span>
                <div class="ach-name">${s.name}</div>
                <div style="margin-top: 1rem; font-weight: 800; color: ${isOwned ? 'var(--success)' : 'var(--warning)'};">${isOwned ? (isActive ? 'Equipado ✅' : 'Equipar') : price + ' 🟡'}</div>
            </div>`;
    });
    
    shopTitles.forEach(s => {
        const isOwned = unlockedTitles.includes(s.id);
        const isActive = equippedTitle === s.id;
        const price = getClassMod('discount', s.price);
        cTitles.innerHTML += `
            <div class="achievement-card shop-item ${isOwned ? 'owned' : ''} ${isActive ? 'active-theme' : ''}" onclick="${isOwned ? `equipTitle('${s.id}')` : `buyItem('title', '${s.id}', ${price})`}">
                <span class="ach-icon">${s.icon}</span>
                <div class="ach-name">${s.name}</div>
                <div style="margin-top: 1rem; font-weight: 800; color: ${isOwned ? 'var(--success)' : 'var(--warning)'};">${isOwned ? (isActive ? 'Equipado ✅' : 'Equipar') : price + ' 🟡'}</div>
            </div>`;
    });
};

window.buyItem = (type, id, price) => {
    if (guildCoins >= price) {
        guildCoins -= price;
        localStorage.setItem('kawaii_guild_coins', guildCoins);
        if (type === 'theme') {
            unlockedThemes.push(id);
            localStorage.setItem('kawaii_unlocked_themes', JSON.stringify(unlockedThemes));
        } else if (type === 'skin') {
            unlockedSkins.push(id);
            localStorage.setItem('kawaii_unlocked_skins', JSON.stringify(unlockedSkins));
        } else {
            unlockedTitles.push(id);
            localStorage.setItem('kawaii_unlocked_titles', JSON.stringify(unlockedTitles));
        }
        playSound('coin');
        fireConfetti();
        showToast('Comprado!', '🛍️', 'var(--success)');
        updateUI();
    } else {
        playSound('error');
        showToast('Moedas Insuficientes!', '❌', 'var(--danger)');
    }
};

window.equipTheme = (id) => {
    currentTheme = id;
    localStorage.setItem('kawaii_theme', id);
    document.documentElement.setAttribute('data-theme', id === 'default' ? '' : id);
    playSound('coin');
    updateUI();
    renderCharts(filteredDataCache);
};

window.equipSkin = (id) => {
    equippedSkin = id;
    localStorage.setItem('kawaii_equipped_skin', id);
    playSound('success');
    updateUI();
};

window.equipTitle = (id) => {
    equippedTitle = id;
    localStorage.setItem('kawaii_equipped_title', id);
    playSound('success');
    updateUI();
};

const applySkinAndTitle = (lvl) => {
    const skin = shopSkins.find(x => x.id === equippedSkin);
    const overlay = document.getElementById('mascotSkin');
    overlay.innerText = skin && skin.id !== 'none' ? skin.emoji : '';
    
    if (equippedSkin === 'king') { overlay.style.top = '10%'; overlay.style.fontSize = '60px'; }
    else if (equippedSkin === 'mage') { overlay.style.top = '0%'; overlay.style.fontSize = '80px'; }
    else if (equippedSkin === 'cool') { overlay.style.top = '40%'; overlay.style.fontSize = '70px'; }
    else if (equippedSkin === 'ninja') { overlay.style.top = '50%'; overlay.style.fontSize = '90px'; }
    else if (equippedSkin === 'horn') { overlay.style.top = '0%'; overlay.style.fontSize = '70px'; }
    else if (equippedSkin === 'scarf') { overlay.style.top = '70%'; overlay.style.fontSize = '70px'; }
    else if (equippedSkin === 'flower') { overlay.style.top = '10%'; overlay.style.fontSize = '70px'; }
    else if (equippedSkin === 'angel') { overlay.style.top = '-10%'; overlay.style.fontSize = '80px'; }
    else if (equippedSkin === 'sword') { overlay.style.top = '50%'; overlay.style.left = '80%'; overlay.style.fontSize = '60px'; }
    
    const titleObj = shopTitles.find(x => x.id === equippedTitle);
    document.getElementById('playerTitleDisplay').innerText = titleObj ? titleObj.name : 'Novato';
    
    const evoDisplay = document.getElementById('mascotEvolutionDisplay');
    if (lvl < 10) evoDisplay.innerText = 'Bebê Aprendiz';
    else if (lvl < 50) evoDisplay.innerText = 'Aventureira Jovem';
    else evoDisplay.innerText = 'Raposa Mística (Max)';
};

window.openGacha = () => {
    if (guildCoins >= 30) {
        guildCoins -= 30;
        const rand = Math.random();
        
        if (rand < 0.05) {
            if (!unlockedTitles.includes('title_gacha')) {
                unlockedTitles.push('title_gacha');
                shopTitles.push({id: 'title_gacha', name: 'Lenda da Sorte 🎰', price: 0, icon: '🎰'});
                localStorage.setItem('kawaii_unlocked_titles', JSON.stringify(unlockedTitles));
                showToast('TÍTULO LENDÁRIO ENCONTRADO!', '🎰', 'var(--warning)');
                fireConfetti();
            } else {
                guildCoins += 100;
                showToast('Ganhaste 100 🟡!', '💰');
            }
        } else if (rand < 0.20) {
            bonusXP += 200;
            localStorage.setItem('kawaii_bonus_xp', bonusXP);
            showToast('+200 XP!', '✨', 'var(--primary)');
        } else if (rand < 0.50) {
            guildCoins += 40;
            showToast('Lucro! +40 🟡', '📈', 'var(--success)');
        } else {
            bonusXP += 50;
            localStorage.setItem('kawaii_bonus_xp', bonusXP);
            showToast('+50 XP!', '⭐');
        }
        
        localStorage.setItem('kawaii_guild_coins', guildCoins);
        playSound('coin');
        updateUI();
    } else {
        playSound('error');
        showToast('Falta Ouro!', '❌', 'var(--danger)');
    }
};

setInterval(() => {
    if (!currentTheme || currentTheme === 'default' || currentTheme === 'dark') return;
    const container = document.getElementById('ambientContainer');
    const particle = document.createElement('div');
    particle.className = 'ambient-particle';
    particle.style.left = Math.random() * 100 + 'vw';
    
    if (currentTheme === 'forest') particle.innerText = '🍃';
    else if (currentTheme === 'ocean') particle.innerText = '🫧';
    else if (currentTheme === 'fire') particle.innerText = '🔥';
    else if (currentTheme === 'candy') particle.innerText = '🍬';
    else if (currentTheme === 'arcade') particle.innerText = '👾';
    else if (currentTheme === 'vampire') particle.innerText = '🦇';
    else particle.innerText = '✨';
    
    container.appendChild(particle);
    setTimeout(() => particle.remove(), 10000);
}, 800);

const switchView = (targetId) => {
    document.querySelectorAll('#navMenu li, #navMenuMobile li').forEach(n => n.classList.remove('active'));
    document.querySelectorAll(`[data-target="${targetId}"]`).forEach(el => el.classList.add('active'));
    document.querySelectorAll('.view').forEach(v => { v.classList.remove('active'); v.style.display = 'none'; });
    
    const targetView = document.getElementById(targetId);
    targetView.style.display = 'block';
    setTimeout(() => targetView.classList.add('active'), 10);
    
    const titles = {
        'view-dashboard': ['Sua Base', 'Onde a magia acontece! ✨'],
        'view-lancamentos': ['Sua Bolsa', 'Guarde ouros e poções. 🎒'],
        'view-maldicoes': ['Maldições', 'Gastos fixos sugadores de HP! ☠️'],
        'view-arena': ['Arena do Boss', 'Sobrevive à inflação! 🐉'],
        'view-loja': ['Loja & Banco', 'Compre temas e invista! 🛍️'],
        'view-config': ['Menu', 'Ajustes e Lendas. 📜'],
        'view-trofeus': ['Galeria', 'As tuas lendas. 👑']
    };
    document.getElementById('pageTitle').innerText = titles[targetId][0];
    document.getElementById('pageSubtitle').innerText = titles[targetId][1];
};

document.querySelectorAll('#navMenu li, #navMenuMobile li').forEach(item => {
    item.addEventListener('click', () => switchView(item.getAttribute('data-target')));
});

const calculateTotals = (data = transactions) => {
    let income = 0, expense = 0, investment = 0;
    data.forEach(t => {
        if (t.type === 'income') income += t.amount;
        if (t.type === 'expense') expense += t.amount;
        if (t.type === 'investment') investment += t.amount;
    });
    return { income, expense, investment, balance: income - expense - investment };
};

window.setBudget = () => {
    const val = parseFloat(document.getElementById('budgetInput').value);
    if (val > 0) {
        monthlyBudget = val;
        localStorage.setItem('kawaii_budget', val);
        updateUI();
        showToast('HP do Boss definido!', '🐉');
        playSound('error');
    }
};

const checkDaily = () => {
    const lastLogin = localStorage.getItem('kawaii_last_login');
    const today = new Date().toLocaleDateString('pt-BR');
    if (lastLogin !== today) {
        document.getElementById('dailyModal').classList.add('active');
        playSound('success');
        fireConfetti();
    }
};

document.getElementById('claimDailyBtn').addEventListener('click', () => {
    bonusXP += 50;
    guildCoins += 15;
    localStorage.setItem('kawaii_bonus_xp', bonusXP);
    localStorage.setItem('kawaii_guild_coins', guildCoins);
    localStorage.setItem('kawaii_last_login', new Date().toLocaleDateString('pt-BR'));
    document.getElementById('dailyModal').classList.remove('active');
    playSound('coin');
    updateUI();
});

const defaultAchs = [
    { id: 't_01', rarity: 'comum', name: 'O Início', desc: 'Registrou 1 item.', icon: '🌱', req: () => transactions.length >= 1 },
    { id: 't_10', rarity: 'comum', name: 'Mochileiro', desc: 'Registrou 10 itens.', icon: '🎒', req: () => transactions.length >= 10 },
    { id: 'w_100', rarity: 'comum', name: 'Primeiros Trocos', desc: 'Acumulou R$ 100.', icon: '🪙', req: () => calculateTotals().balance >= 100 },
    { id: 'i_01', rarity: 'comum', name: 'Semente', desc: '1º investimento.', icon: '💧', req: () => transactions.filter(t => t.type === 'investment').length >= 1 },
    { id: 'q_01', rarity: 'comum', name: 'Caçador Novato', desc: '1 missão.', icon: '📜', req: () => completedQuestsCount >= 1 },
    { id: 't_50', rarity: 'raro', name: 'Aventureiro', desc: '50 itens.', icon: '⚔️', req: () => transactions.length >= 50 },
    { id: 'w_1k', rarity: 'raro', name: 'Saco de Ouro', desc: 'Acumulou R$ 1.000.', icon: '💰', req: () => calculateTotals().balance >= 1000 },
    { id: 'i_10', rarity: 'raro', name: 'Mineiro', desc: '10 investimentos.', icon: '⛏️', req: () => transactions.filter(t => t.type === 'investment').length >= 10 },
    { id: 'h_ifood', rarity: 'raro', name: 'Rei do Banquete', desc: '10x Alimentação.', icon: '🍔', req: () => transactions.filter(t => t.category === 'Alimentação').length >= 10 },
    { id: 't_100', rarity: 'epico', name: 'Senhor da Bolsa', desc: '100 itens.', icon: '🧳', req: () => transactions.length >= 100 },
    { id: 'w_10k', rarity: 'epico', name: 'Tesouro Real', desc: 'R$ 10.000.', icon: '👑', req: () => calculateTotals().balance >= 10000 },
    { id: 'i_10k', rarity: 'epico', name: 'Mão de Diamante', desc: 'R$ 10.000 inv.', icon: '🧊', req: () => calculateTotals().investment >= 10000 },
    { id: 'q_20', rarity: 'epico', name: 'Herói', desc: '20 missões.', icon: '🛡️', req: () => completedQuestsCount >= 20 },
    { id: 't_500', rarity: 'lendario', name: 'Grinder', desc: '500 itens!', icon: '💀', req: () => transactions.length >= 500 },
    { id: 'w_100k', rarity: 'lendario', name: 'Lorde', desc: 'R$ 100.000!', icon: '🏰', req: () => calculateTotals().balance >= 100000 },
    { id: 'w_1m', rarity: 'lendario', name: 'DEUS DO OURO', desc: '1 Milhão!', icon: '💸', req: () => calculateTotals().balance >= 1000000 }
];

const checkAchs = () => {
    let newUnlock = false;
    defaultAchs.forEach(ach => {
        if (!userAchievements.includes(ach.id) && ach.req()) {
            userAchievements.push(ach.id);
            guildCoins += 10;
            playSound('success');
            showToast(`Conquista: ${ach.name}! (+10🟡)`, ach.icon, 'var(--warning)');
            newUnlock = true;
        }
    });
    
    if (newUnlock) {
        localStorage.setItem('achievements_kawaii', JSON.stringify(userAchievements));
        localStorage.setItem('kawaii_guild_coins', guildCoins);
        renderAchs();
        renderShop();
        document.getElementById('guildCoinsDisplay').innerText = `${guildCoins} 🟡`;
    }
};

const renderAchs = () => {
    const container = document.getElementById('achievementsContainer');
    const total = defaultAchs.length;
    const unlocked = userAchievements.length;
    const perc = ((unlocked / total) * 100).toFixed(1);
    
    document.getElementById('achievementsCount').innerText = `${unlocked} / ${total} (${perc}%)`;
    document.getElementById('achievementsProgress').style.width = `${perc}%`;
    container.innerHTML = '';
    
    const sortedAchs = [...defaultAchs].sort((a, b) => {
        const aUnl = userAchievements.includes(a.id);
        const bUnl = userAchievements.includes(b.id);
        if (aUnl && !bUnl) return -1;
        if (!aUnl && bUnl) return 1;
        return 0;
    });
    
    sortedAchs.forEach(ach => {
        const isUnlocked = userAchievements.includes(ach.id);
        container.innerHTML += `
            <div class="achievement-card rarity-${ach.rarity} ${isUnlocked ? 'unlocked glass hover-up' : 'glass'}">
                <span class="ach-icon" style="padding-bottom: 10px;">${ach.icon}</span>
                <div class="ach-name">${isUnlocked ? ach.name : 'Misteriosa'}</div>
                <div class="ach-desc">${isUnlocked ? ach.desc : 'Continue jogando.'}</div>
                <div class="rarity-label">${ach.rarity}</div>
            </div>`;
    });
};

const updateUI = () => {
    const filterSelect = document.getElementById('monthFilter');
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
    const totals = calculateTotals(filteredDataCache);

    document.getElementById('balanceDisplay').innerText = fCurr(totals.balance);
    document.getElementById('incomeDisplay').innerText = fCurr(totals.income);
    document.getElementById('expenseDisplay').innerText = fCurr(totals.expense);
    document.getElementById('investmentDisplay').innerText = fCurr(totals.investment);
    document.getElementById('guildCoinsDisplay').innerText = `${guildCoins} 🟡`;

    const totalXP = Math.floor(getClassMod('xp', (transactions.length * 15) + (calculateTotals(transactions).investment * 0.5))) + bonusXP;
    
    let currentLevel = 1;
    let xpNeeded = 500;
    let xpAccumulated = 0;
    
    while (totalXP >= xpAccumulated + xpNeeded) {
        xpAccumulated += xpNeeded;
        currentLevel++;
        xpNeeded = currentLevel * 500;
    }
    
    const xpInLevel = totalXP - xpAccumulated;

    if (currentLevel > lastStoredLevel) {
        document.getElementById('newLevelText').innerText = `Lvl ${currentLevel}`;
        document.getElementById('levelUpModal').classList.add('active');
        playSound('success');
        fireConfetti();
        localStorage.setItem('kawaii_last_level', currentLevel);
        lastStoredLevel = currentLevel;
        guildCoins += 50;
        localStorage.setItem('kawaii_guild_coins', guildCoins);
    }
    
    document.getElementById('levelBadge').innerText = `Lvl ${currentLevel}`;
    document.getElementById('xpBar').style.width = `${(xpInLevel / xpNeeded) * 100}%`;
    document.getElementById('xpText').innerText = `${xpInLevel} / ${xpNeeded} XP`;

    const damage = totals.expense;
    const bossHp = monthlyBudget - damage;
    const hpPerc = Math.max(0, (bossHp / monthlyBudget) * 100);
    
    document.getElementById('bossHpText').innerText = `${fCurr(bossHp)} / ${fCurr(monthlyBudget)}`;
    document.getElementById('bossHpBar').style.width = `${hpPerc}%`;
    
    const bossEmoji = document.getElementById('bossEmoji');
    if (bossHp <= 0) {
        bossEmoji.innerText = '💀';
        bossEmoji.style.filter = 'grayscale(1)';
    } else {
        bossEmoji.innerText = '🐉';
        bossEmoji.style.filter = 'none';
    }
    
    const mascotImg = document.getElementById('mascotImage');
    if (damage > totals.income && totals.income > 0) {
        mascotImg.src = 'assets/triste.jpg';
    } else {
        mascotImg.src = 'assets/feliz.jpg';
    }

    applySkinAndTitle(currentLevel);
    renderTabs(filteredDataCache);
    renderCharts(filteredDataCache);
    renderSubs();
    renderShop();
    runBank();
    checkAchs();
};

document.getElementById('monthFilter').addEventListener('change', updateUI);

const renderTabs = (data) => {
    const fullBody = document.getElementById('fullTableBody');
    const dashBody = document.getElementById('dashboardTableBody');
    const investBody = document.getElementById('investTableBody');
    
    fullBody.innerHTML = '';
    dashBody.innerHTML = '';
    if (investBody) investBody.innerHTML = '';
    
    if (!data.length) {
        fullBody.innerHTML = dashBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem;">Inventário Vazio! 🏜️</td></tr>`;
        if (investBody) investBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem;">Cofre Vazio! 🏜️</td></tr>`;
        return;
    }
    
    const reversedData = [...data].reverse();
    
    reversedData.slice(0, 5).forEach(t => {
        const valClass = t.type === 'income' ? 'val-income' : (t.type === 'expense' ? 'val-expense' : 'val-investment');
        const sign = t.type === 'expense' ? '-' : (t.type === 'income' ? '+' : '');
        dashBody.innerHTML += `<tr><td>${t.desc}</td><td class="${valClass}">${sign} ${fCurr(t.amount)}</td></tr>`;
    });
    
    reversedData.forEach(t => {
        const valClass = t.type === 'income' ? 'val-income' : (t.type === 'expense' ? 'val-expense' : 'val-investment');
        const sign = t.type === 'expense' ? '-' : (t.type === 'income' ? '+' : '');
        const buttons = `
            <button class="btn-icon" onclick="openEditModal(${t.id})">🔨</button>
            <button class="btn-icon" style="color:var(--primary)" onclick="duplicateTransaction(${t.id})">👯</button>
            <button class="btn-icon" style="color:var(--danger)" onclick="deleteTransaction(${t.id})">🗑️</button>
        `;
        const rowHTML = `<tr><td>${t.desc}</td><td>${t.category}</td><td>${t.date}</td><td class="${valClass}">${sign} ${fCurr(t.amount)}</td><td style="display:flex;gap:5px;">${buttons}</td></tr>`;
        
        fullBody.innerHTML += rowHTML;
        if (t.type === 'investment' && investBody) {
            investBody.innerHTML += rowHTML;
        }
    });
};

const renderCharts = (data) => {
    const ctxHistory = document.getElementById('historyChart').getContext('2d');
    const ctxExpense = document.getElementById('expenseChart').getContext('2d');
    
    const isDark = ['dark', 'abyss', 'galaxy', 'cyberpunk', 'arcade', 'vampire'].includes(document.documentElement.getAttribute('data-theme'));
    const textColor = isDark ? '#F8FAFC' : '#4B5563';
    
    // Gráfico de Pizza (Despesas)
    const expensesOnly = data.filter(t => t.type === 'expense');
    const catTotals = {};
    expensesOnly.forEach(t => catTotals[t.category] = (catTotals[t.category] || 0) + t.amount);
    
    if (expenseChartInst) expenseChartInst.destroy();
    expenseChartInst = new Chart(ctxExpense, {
        type: 'doughnut',
        data: {
            labels: Object.keys(catTotals).length ? Object.keys(catTotals) : ['Paz interior'],
            datasets: [{
                data: Object.values(catTotals).length ? Object.values(catTotals) : [1],
                backgroundColor: Object.values(catTotals).length ? ['#FB7185', '#FBBF24', '#A78BFA', '#34D399', '#60A5FA'] : [isDark ? '#1E293B' : '#FFFFFF'],
                borderWidth: 0,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: textColor, font: { family: "'Fredoka'" } } }
            },
            cutout: '70%'
        }
    });

    // Gráfico de Linha (Evolução)
    const sortedData = [...data].sort((a, b) => new Date(fIsoDate(a.date)) - new Date(fIsoDate(b.date)));
    let runningBalance = 0;
    const dates = [];
    const balances = [];
    
    sortedData.forEach(t => {
        runningBalance += t.type === 'expense' ? -t.amount : t.amount;
        dates.push(t.date.substring(0, 5));
        balances.push(runningBalance);
    });
    
    if (historyChartInst) historyChartInst.destroy();
    historyChartInst = new Chart(ctxHistory, {
        type: 'line',
        data: {
            labels: dates.length ? dates : ['Hoje'],
            datasets: [{
                label: 'Baú',
                data: balances.length ? balances : [0],
                borderColor: '#A78BFA',
                backgroundColor: 'rgba(167, 139, 250, 0.2)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: textColor } },
                y: { ticks: { color: textColor } }
            },
            plugins: { legend: { display: false } }
        }
    });
};

const updateCategorySelects = (typeSelectId, catSelectId) => {
    const type = document.getElementById(typeSelectId).value;
    const catSelect = document.getElementById(catSelectId);
    catSelect.innerHTML = '';
    
    let options = [];
    if (type === 'income') options = ['Salário', 'Loot', 'Venda', 'Outros'];
    else if (type === 'expense') options = ['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Outros'];
    else options = ['Baú', 'Bolsa', 'Cripto'];
    
    options.forEach(opt => {
        const el = document.createElement('option');
        el.value = opt;
        el.innerText = opt;
        catSelect.appendChild(el);
    });
};

document.getElementById('type').addEventListener('change', () => updateCategorySelects('type', 'category'));
document.getElementById('editType').addEventListener('change', () => updateCategorySelects('editType', 'editCategory'));

document.getElementById('transactionForm').addEventListener('submit', (e) => {
    e.preventDefault();
    transactions.push({
        id: Date.now(),
        desc: document.getElementById('desc').value,
        amount: parseFloat(document.getElementById('amount').value),
        type: document.getElementById('type').value,
        category: document.getElementById('category').value,
        date: fBrDate(document.getElementById('transDate').value)
    });
    
    localStorage.setItem('financas_kawaii', JSON.stringify(transactions));
    e.target.reset();
    document.getElementById('transDate').value = new Date().toISOString().split('T')[0];
    
    const bossEmoji = document.getElementById('bossEmoji');
    bossEmoji.classList.remove('boss-hit');
    void bossEmoji.offsetWidth;
    bossEmoji.classList.add('boss-hit');
    
    playSound('coin');
    updateUI();
    showToast('Ação Salva!', '🎒', 'var(--success)');
});

window.deleteTransaction = (id) => {
    transactions = transactions.filter(t => t.id !== id);
    localStorage.setItem('financas_kawaii', JSON.stringify(transactions));
    playSound('error');
    updateUI();
};

window.duplicateTransaction = (id) => {
    const t = transactions.find(t => t.id === id);
    if (t) {
        transactions.push({ ...t, id: Date.now(), date: new Date().toLocaleDateString('pt-BR') });
        localStorage.setItem('financas_kawaii', JSON.stringify(transactions));
        playSound('coin');
        updateUI();
        showToast('Clonado!', '👯', 'var(--primary)');
    }
};

window.openEditModal = (id) => {
    const t = transactions.find(t => t.id === id);
    document.getElementById('editId').value = t.id;
    document.getElementById('editDesc').value = t.desc;
    document.getElementById('editAmount').value = t.amount;
    document.getElementById('editType').value = t.type;
    updateCategorySelects('editType', 'editCategory');
    document.getElementById('editCategory').value = t.category;
    document.getElementById('editDate').value = fIsoDate(t.date);
    document.getElementById('editModal').classList.add('active');
};

document.getElementById('editForm').addEventListener('submit', (e) => {
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
        localStorage.setItem('financas_kawaii', JSON.stringify(transactions));
        document.getElementById('editModal').classList.remove('active');
        playSound('coin');
        updateUI();
        showToast('Reforjado!', '🔨', 'var(--warning)');
    }
});

document.getElementById('questForm').addEventListener('submit', (e) => {
    e.preventDefault();
    quests.push({
        id: Date.now(),
        name: document.getElementById('questName').value,
        target: parseFloat(document.getElementById('questTarget').value),
        current: 0
    });
    localStorage.setItem('quests_kawaii', JSON.stringify(quests));
    e.target.reset();
    playSound('coin');
    updateUI();
    showToast('Contrato Assinado!', '📜', 'var(--warning)');
});

const renderQuests = () => {
    const container = document.getElementById('questsContainer');
    container.innerHTML = '';
    
    if (quests.length === 0) {
        container.innerHTML = '<p class="text-muted" style="text-align:center;">Sem missões.</p>';
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
                    <button class="btn-icon" style="background:var(--success); color:white;" onclick="addQuest(${q.id})">💰</button>
                    <button class="btn-icon" style="margin-left:auto; color:var(--danger);" onclick="delQuest(${q.id})">🗑️</button>
                </div>` : `
                <button class="btn-primary pulse-hover" style="background:var(--success); margin-top:1rem;" onclick="finishQuest(${q.id})">Pegar Recompensa!</button>
                `}
            </div>`;
    });
};

window.addQuest = (id) => {
    const amount = parseFloat(document.getElementById(`addQ_${id}`).value);
    if (!amount || amount <= 0) return;
    quests.find(q => q.id === id).current += amount;
    localStorage.setItem('quests_kawaii', JSON.stringify(quests));
    playSound('coin');
    updateUI();
};

window.delQuest = (id) => {
    quests = quests.filter(q => q.id !== id);
    localStorage.setItem('quests_kawaii', JSON.stringify(quests));
    playSound('error');
    updateUI();
};

window.finishQuest = (id) => {
    window.delQuest(id);
    completedQuestsCount++;
    guildCoins += 50;
    localStorage.setItem('completed_quests_kawaii', completedQuestsCount);
    localStorage.setItem('kawaii_guild_coins', guildCoins);
    playSound('success');
    fireConfetti();
    showToast('Missão Cumprida! (+50🟡)', '🎉', 'var(--success)');
    updateUI();
};

let recapIndex = 0;
let recapData = {};

document.getElementById('btnRecap').addEventListener('click', () => {
    const prevMonthStr = new Date().getMonth() === 0 ? `12/${new Date().getFullYear() - 1}` : `${String(new Date().getMonth()).padStart(2, '0')}/${new Date().getFullYear()}`;
    const pastData = transactions.filter(t => t.date.includes(prevMonthStr));
    recapData = calculateTotals(pastData);
    recapIndex = 0;
    document.getElementById('recapModal').classList.add('active');
    playSound('success');
    showRecapSlide();
});

const showRecapSlide = () => {
    const icon = document.getElementById('recapIcon');
    const title = document.getElementById('recapTitle');
    const text = document.getElementById('recapText');
    
    if (recapIndex === 0) {
        icon.innerText = '📅';
        title.innerText = 'O Mês Passou...';
        text.innerText = `Ganhaste ${fCurr(recapData.income)} de Ouro!`;
    } else if (recapIndex === 1) {
        icon.innerText = '💸';
        title.innerText = 'Batalhas Travadas';
        text.innerText = `Sofreste ${fCurr(recapData.expense)} de Dano nas lojas.`;
    } else if (recapIndex === 2) {
        icon.innerText = '💎';
        title.innerText = 'Poder Guardado';
        text.innerText = `Escondeste ${fCurr(recapData.investment)} no Cofre!`;
    } else {
        document.getElementById('recapModal').classList.remove('active');
        fireConfetti();
        return;
    }
};

document.getElementById('recapContent').addEventListener('click', () => {
    recapIndex++;
    playSound('coin');
    showRecapSlide();
});

document.getElementById('btnExportCSV').addEventListener('click', () => {
    let csv = "data:text/csv;charset=utf-8,\uFEFFData,Descrição,Categoria,Tipo,Valor\r\n";
    transactions.forEach(t => csv += `${t.date},"${t.desc}","${t.category}",${t.type},${t.amount}\r\n`);
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "bolsa.csv";
    link.click();
    playSound('coin');
});

document.getElementById('btnExportJSON').addEventListener('click', () => {
    const payload = {
        transactions, subs, guildCoins, unlockedThemes, unlockedSkins, unlockedTitles, 
        equippedSkin, equippedTitle, playerClass, monthlyBudget, bonusXP, mascotName, bankCoins, bankLastDate
    };
    const link = document.createElement("a");
    link.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload));
    link.download = "save_kawaii.json";
    link.click();
    playSound('coin');
});

document.getElementById('btnImportJSON').addEventListener('click', () => {
    const file = document.getElementById('importJSON').files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const s = JSON.parse(e.target.result);
            if (s.transactions) transactions = s.transactions;
            if (s.subs) subs = s.subs;
            if (s.guildCoins) guildCoins = s.guildCoins;
            if (s.unlockedThemes) unlockedThemes = s.unlockedThemes;
            if (s.unlockedSkins) unlockedSkins = s.unlockedSkins;
            if (s.unlockedTitles) unlockedTitles = s.unlockedTitles;
            if (s.equippedSkin) equippedSkin = s.equippedSkin;
            if (s.equippedTitle) equippedTitle = s.equippedTitle;
            if (s.playerClass) playerClass = s.playerClass;
            if (s.monthlyBudget) monthlyBudget = s.monthlyBudget;
            if (s.bonusXP) bonusXP = s.bonusXP;
            if (s.mascotName) mascotName = s.mascotName;
            if (s.bankCoins) bankCoins = s.bankCoins;
            if (s.bankLastDate) bankLastDate = s.bankLastDate;
            
            localStorage.setItem('financas_kawaii', JSON.stringify(transactions));
            localStorage.setItem('kawaii_subs', JSON.stringify(subs));
            localStorage.setItem('kawaii_guild_coins', guildCoins);
            localStorage.setItem('kawaii_unlocked_themes', JSON.stringify(unlockedThemes));
            localStorage.setItem('kawaii_unlocked_skins', JSON.stringify(unlockedSkins));
            localStorage.setItem('kawaii_unlocked_titles', JSON.stringify(unlockedTitles));
            localStorage.setItem('kawaii_equipped_skin', equippedSkin);
            localStorage.setItem('kawaii_equipped_title', equippedTitle);
            localStorage.setItem('kawaii_class', playerClass);
            localStorage.setItem('kawaii_budget', monthlyBudget);
            localStorage.setItem('kawaii_bonus_xp', bonusXP);
            localStorage.setItem('kawaii_mascot_name', mascotName);
            localStorage.setItem('kawaii_bank_coins', bankCoins);
            localStorage.setItem('kawaii_bank_date', bankLastDate);
            
            playSound('success');
            updateUI();
            document.getElementById('mascotNameDisplay').innerText = mascotName;
            showToast('Save Carregado!', '🧙‍♂️');
        } catch (err) {
            playSound('error');
            showToast('Corrompido!', '❌', 'var(--danger)');
        }
    };
    reader.readAsText(file);
});

document.getElementById('btnWipe').addEventListener('click', () => {
    if (confirm("⚠️ APAGAR TUDO PERMANENTEMENTE?")) {
        transactions = []; subs = []; guildCoins = 0;
        unlockedThemes = ['default', 'dark']; unlockedSkins = ['none']; unlockedTitles = ['title_0'];
        equippedSkin = 'none'; equippedTitle = 'title_0'; playerClass = null;
        monthlyBudget = 2000; bonusXP = 0; bankCoins = 0; mascotName = 'Mascote';
        localStorage.clear();
        playSound('error');
        updateUI();
        document.getElementById('classModal').classList.add('active');
        showToast('Personagem Deletado.', '☠️', 'var(--danger)');
    }
});

updateCategorySelects('type', 'category');
runSubscriptions();
setTimeout(checkDaily, 1000);
updateUI();