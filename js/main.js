// ========== 星宝旅行日记 · 交互逻辑 ==========

document.addEventListener('DOMContentLoaded', () => {

  // 1. 生成漂浮小云
  createClouds();

  // 2. 黑胶唱片机播放控制
  initVinylPlayer();

  // 3. CHARACTER 页面表情点击说话
  initCharClick();

  // 4. 生成沙滩沙粒
  createSandDots();

  // 5. 导航高亮（当前滚动到哪屏）
  initNavHighlight();
});

// ========== 流星生成（从右上向左下划落） ==========
function createClouds() {
  const container = document.getElementById('clouds');
  if (!container) return;
  const count = 12;
  for (let i = 0; i < count; i++) {
    const meteor = document.createElement('div');
    meteor.className = 'meteor';
    // 流星大小 40~90px
    const size = 40 + Math.random() * 50;
    meteor.style.width = size + 'px';
    meteor.style.height = (size * 0.35) + 'px';
    // 随机起始位置：右上区域（60%~120% 屏幕宽度）
    meteor.style.left = (60 + Math.random() * 60) + 'vw';
    // 随机动画时长 4~9s（流星速度比云朵快）
    const dur = 4 + Math.random() * 5;
    meteor.style.animationDuration = dur + 's';
    // 随机延迟
    meteor.style.animationDelay = (Math.random() * dur) + 's';
    // 随机透明度
    meteor.style.opacity = 0.6 + Math.random() * 0.4;
    // 随机颜色（金黄/白色/薄荷绿）
    const colors = ['#FFC83D', '#FFFFFF', '#78D7C8', '#FFE066'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    // 流星SVG：头部圆点 + 尾部渐变拖尾
    meteor.innerHTML = `
      <svg viewBox="0 0 100 35" width="100%" height="100%">
        <defs>
          <linearGradient id="tail${i}" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stop-color="${color}" stop-opacity="0"/>
            <stop offset="40%" stop-color="${color}" stop-opacity="0.4"/>
            <stop offset="100%" stop-color="${color}" stop-opacity="1"/>
          </linearGradient>
        </defs>
        <rect x="0" y="15" width="70" height="5" rx="2.5" fill="url(#tail${i})"/>
        <circle cx="78" cy="17.5" r="8" fill="${color}" stroke="#000" stroke-width="2"/>
        <circle cx="76" cy="15" r="2.5" fill="#fff" opacity="0.8"/>
      </svg>`;
    container.appendChild(meteor);
  }
}

// ========== 黑胶唱片机 ==========
function initVinylPlayer() {
  const player = document.getElementById('vinylPlayer');
  const audio = document.getElementById('bgm');
  const label = player.querySelector('.vinyl-label');
  if (!player || !audio) return;

  let isPlaying = false;
  label.textContent = '♪ 听歌';

  player.addEventListener('click', () => {
    // 如果没有设置音乐src，给出提示但仍允许旋转动效（演示效果）
    if (!audio.querySelector('source').src || audio.querySelector('source').src === window.location.href) {
      // 无音乐文件时切换视觉状态，不播放音频
      isPlaying = !isPlaying;
      player.classList.toggle('playing', isPlaying);
      label.textContent = isPlaying ? '♪ 播放中 ♪' : '点我听歌';
      // 简单提示
      if (isPlaying) showToast('请在 <audio> 标签中放入音乐文件~');
      return;
    }
    if (audio.paused) {
      audio.play().then(() => {
        isPlaying = true;
        player.classList.add('playing');
        label.textContent = '♪ 恒星向前冲';
      }).catch(err => {
        console.warn('播放失败:', err);
      });
    } else {
      audio.pause();
      isPlaying = false;
      player.classList.remove('playing');
      label.textContent = '♪ 听歌';
    }
  });
}

// 小提示
function showToast(msg) {
  const bubble = document.getElementById('speechBubble');
  if (!bubble) return;
  bubble.textContent = msg;
  bubble.classList.add('show');
  clearTimeout(bubble._t);
  bubble._t = setTimeout(() => bubble.classList.remove('show'), 2000);
}

// ========== 表情点击说话 ==========
function initCharClick() {
  const items = document.querySelectorAll('.char-item');
  const bubble = document.getElementById('speechBubble');
  if (!items.length || !bubble) return;

  // 确保音效系统已初始化（首次用户交互后解锁 AudioContext）
  ensureAudioCtx();

  items.forEach((item, idx) => {
    item.addEventListener('click', (e) => {
      const word = item.dataset.word || '';
      const sound = item.dataset.sound || 'happy';
      if (word) {
        bubble.textContent = word;
        bubble.classList.add('show');
        const rect = item.getBoundingClientRect();
        bubble.style.left = (rect.left + rect.width / 2) + 'px';
        bubble.style.top = (rect.top - 20) + 'px';
        bubble.style.transform = 'translate(-50%, -100%) scale(1)';
        clearTimeout(bubble._t);
        bubble._t = setTimeout(() => {
          bubble.classList.remove('show');
          setTimeout(() => {
            bubble.style.left = '50%';
            bubble.style.top = '50%';
            bubble.style.transform = 'translate(-50%, -50%) scale(0)';
          }, 300);
        }, 1800);
      }
      // 播放对应表情音效
      playEmojiSound(sound);
      // 星宝弹跳动画
      const img = item.querySelector('.char-img');
      if (img) {
        img.animate([
          { transform: 'scale(1)' },
          { transform: 'scale(1.2) rotate(-8deg)' },
          { transform: 'scale(1)' }
        ], { duration: 500, easing: 'cubic-bezier(.34,1.56,.64,1)' });
      }
    });
  });
}

// ========== 音效引擎（Web Audio API 合成可爱卡通音） ==========
let _audioCtx = null;
function ensureAudioCtx() {
  if (!_audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) _audioCtx = new AC();
  }
  if (_audioCtx && _audioCtx.state === 'suspended') {
    _audioCtx.resume();
  }
  return _audioCtx;
}

// 通用音符播放：波形、起始/结束频率、时长、音量、颤音
function tone({ type = 'sine', f0, f1, dur = 0.2, vol = 0.25, vib = 0, delay = 0, attack = 0.01, release = 0.08 }) {
  const ctx = ensureAudioCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t0);
  if (f1 !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t0 + dur);
  }
  // 颤音
  if (vib > 0) {
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = vib;
    lfoGain.gain.value = 8;
    lfo.connect(lfoGain).connect(osc.frequency);
    lfo.start(t0);
    lfo.stop(t0 + dur + release);
  }
  // 音量包络（防止爆音）
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + attack);
  gain.gain.setValueAtTime(vol, t0 + dur);
  gain.gain.linearRampToValueAtTime(0, t0 + dur + release);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + release + 0.02);
}

// 8种表情对应的可爱音效
function playEmojiSound(type) {
  ensureAudioCtx();
  switch (type) {
    // 开心：明亮上升"叮~" + 轻笑声
    case 'happy':
      tone({ type: 'triangle', f0: 660, f1: 990, dur: 0.12, vol: 0.22 });
      tone({ type: 'sine',     f0: 880, f1: 1320, dur: 0.15, vol: 0.18, delay: 0.1 });
      tone({ type: 'sine',     f0: 520, f1: 780, dur: 0.1,  vol: 0.12, delay: 0.22, vib: 12 });
      break;
    // 生气：低沉短促"哼！"下降音
    case 'angry':
      tone({ type: 'sawtooth', f0: 220, f1: 110, dur: 0.18, vol: 0.2 });
      tone({ type: 'square',   f0: 165, f1: 80,  dur: 0.15, vol: 0.12, delay: 0.05 });
      tone({ type: 'square',   f0: 140,           dur: 0.08, vol: 0.15, delay: 0.22 });
      break;
    // 墨镜酷：低沉滑音"酷~"
    case 'cool':
      tone({ type: 'triangle', f0: 330, f1: 220, dur: 0.35, vol: 0.22, vib: 4 });
      tone({ type: 'sine',     f0: 196,           dur: 0.2,  vol: 0.1,  delay: 0.15 });
      break;
    // 哭：下降呜咽"呜呜~"
    case 'cry':
      tone({ type: 'sine',     f0: 520, f1: 260, dur: 0.35, vol: 0.2, vib: 18 });
      tone({ type: 'triangle', f0: 392, f1: 196, dur: 0.3,  vol: 0.14, delay: 0.15, vib: 15 });
      tone({ type: 'sine',     f0: 600, f1: 300, dur: 0.2,  vol: 0.1,  delay: 0.4, vib: 20 });
      break;
    // 惊讶：突然上扬"哇哦！"
    case 'surprised':
      tone({ type: 'sine',     f0: 440, f1: 1760, dur: 0.18, vol: 0.25 });
      tone({ type: 'triangle', f0: 660, f1: 1320, dur: 0.2,  vol: 0.18, delay: 0.08 });
      break;
    // 爱心：双音"叮咚"（大三度和弦）
    case 'love':
      tone({ type: 'sine',     f0: 523, f1: 784, dur: 0.15, vol: 0.22 });
      tone({ type: 'sine',     f0: 659, f1: 988, dur: 0.15, vol: 0.22 });
      tone({ type: 'sine',     f0: 784, f1: 1046,dur: 0.2,  vol: 0.18, delay: 0.15 });
      tone({ type: 'triangle', f0: 523,           dur: 0.25, vol: 0.1,  delay: 0.2 });
      break;
    // 困：缓慢低沉"呼~"鼾声
    case 'sleepy':
      tone({ type: 'sine',     f0: 180, f1: 140, dur: 0.5,  vol: 0.2, vib: 6 });
      tone({ type: 'triangle', f0: 220, f1: 160, dur: 0.4,  vol: 0.12, delay: 0.25, vib: 5 });
      tone({ type: 'sine',     f0: 160, f1: 120, dur: 0.35, vol: 0.14, delay: 0.55 });
      break;
    // 剪刀手耶：欢快跳跃短音
    case 'peace':
      tone({ type: 'triangle', f0: 660, f1: 880, dur: 0.1,  vol: 0.22 });
      tone({ type: 'triangle', f0: 880, f1: 1100,dur: 0.1,  vol: 0.22, delay: 0.1 });
      tone({ type: 'sine',     f0: 990, f1: 1320,dur: 0.15, vol: 0.2,  delay: 0.2 });
      tone({ type: 'triangle', f0: 523,           dur: 0.1,  vol: 0.1,  delay: 0.1 });
      tone({ type: 'triangle', f0: 659,           dur: 0.1,  vol: 0.1,  delay: 0.2 });
      break;
    default:
      tone({ type: 'sine', f0: 660, f1: 880, dur: 0.15, vol: 0.2 });
  }
}

// ========== 沙粒生成 ==========
function createSandDots() {
  const container = document.getElementById('sandDots');
  if (!container) return;
  const count = 60;
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('div');
    dot.className = 'sand-dot';
    dot.style.left = Math.random() * 100 + '%';
    dot.style.top = Math.random() * 100 + '%';
    const size = 2 + Math.random() * 4;
    dot.style.width = size + 'px';
    dot.style.height = size + 'px';
    container.appendChild(dot);
  }
}

// ========== 导航高亮 ==========
function initNavHighlight() {
  const sections = document.querySelectorAll('.screen');
  const navLinks = document.querySelectorAll('.top-nav a');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(a => {
          a.style.background = a.getAttribute('href') === '#' + id ? 'var(--yellow)' : '#fff';
        });
      }
    });
  }, { threshold: 0.5 });

  sections.forEach(s => observer.observe(s));
}
