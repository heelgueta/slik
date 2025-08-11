(function(){
  const fileInput = document.getElementById('fileInput');
  const player = document.getElementById('player');
  const meta = document.getElementById('meta');
  const info = document.getElementById('info');
  const playBtn = document.getElementById('playBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const restartBtn = document.getElementById('restartBtn');
  const speed = document.getElementById('speed');
  const overlay = document.getElementById('overlay');
  const progressFill = document.getElementById('progressFill');
  const timeLabel = document.getElementById('timeLabel');

  let data = null;
  let schedule = [];
  let startAt = 0;
  let timer = null;
  let isPlaying = false;
  let playbackSpeed = 1;
  let totalMs = 0;
  let startedAtPerf = 0;
  let startedOffset = 0;

  function setMeta(text){ meta.textContent = text; }
  function setInfo(text){ info.textContent = text; }
  function drawDot(x,y){
    const d = document.createElement('div');
    d.className = 'dot';
    d.style.left = x + 'px';
    d.style.top = y + 'px';
    overlay.appendChild(d);
    setTimeout(()=>overlay.removeChild(d), 400);
  }
  function drawTrail(x,y){
    const t = document.createElement('div');
    t.className = 'trail';
    t.style.left = x + 'px';
    t.style.top = y + 'px';
    overlay.appendChild(t);
    setTimeout(()=>overlay.removeChild(t), 500);
  }

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      data = JSON.parse(await file.text());
    } catch(err) {
      setInfo('Invalid JSON');
      return;
    }

    const viewport = data?.device?.viewport || { width: 390, height: 844 };
    const title = data?.form?.title || 'Untitled';
    setMeta(`Form: ${title} • Session: ${data?.sessionId || 'unknown'} • Size: ${viewport.width}x${viewport.height}`);

    // Resize player to match aspect
    const wrapper = player.parentElement;
    const w = wrapper.clientWidth;
    const aspect = viewport.height / viewport.width;
    const newH = Math.min(700, Math.round(w * aspect));
    player.style.height = `${newH}px`;
    overlay.style.height = `${newH}px`;

    // Rebuild schedule relative to first event and pre-scale coordinates
    const events = (data?.events || []).slice().sort((a,b)=>a.t-b.t);
    if (events.length === 0) {
      setInfo('No events in file');
      return;
    }
    const t0 = events[0].t;
    const overlayRect = overlay.getBoundingClientRect();
    const scaleX = overlayRect.width / viewport.width;
    const scaleY = overlayRect.height / viewport.height;
    schedule = events.map(ev => ({
      at: (ev.t - t0),
      ev: {
        ...ev,
        xScaled: typeof ev.x === 'number' ? ev.x * scaleX : undefined,
        yScaled: typeof ev.y === 'number' ? ev.y * scaleY : undefined
      }
    }));
    totalMs = schedule.length ? schedule[schedule.length - 1].at : 0;
    updateProgress(0, totalMs);
    setInfo('Loaded. Press Play to start.');
  });

  playBtn.addEventListener('click', () => startPlayback());
  pauseBtn.addEventListener('click', () => pausePlayback());
  restartBtn.addEventListener('click', () => { cancelPlayback(); startPlayback(true); });
  speed.addEventListener('input', () => { playbackSpeed = Number(speed.value); });

  function startPlayback(reset=false){
    if (!data || schedule.length === 0) return;
    if (reset) {
      // Use form.html and pass JSON via sessionStorage so all assets are shared correctly
      try { sessionStorage.setItem('SLIK_VIEW_FORM', JSON.stringify(data.form || {})); } catch(_) {}
      player.src = 'form.html?form=session';
      startAt = performance.now();
      startedAtPerf = startAt;
      startedOffset = 0;
      setTimeout(() => runLoop(), 700);
    } else {
      if (isPlaying) return;
      startAt = performance.now();
      startedAtPerf = startAt;
      runLoop();
    }
    isPlaying = true;
  }

  function pausePlayback(){
    isPlaying = false;
    if (timer) cancelAnimationFrame(timer);
    // capture elapsed to resume correctly
    const now = performance.now();
    startedOffset += (now - startedAtPerf) * playbackSpeed;
  }

  function cancelPlayback(){
    isPlaying = false;
    if (timer) cancelAnimationFrame(timer);
    // reset offsets
    startedOffset = 0;
  }

  function updateProgress(elapsed, total){
    const pct = total > 0 ? Math.min(100, (elapsed/total)*100) : 0;
    if (progressFill) progressFill.style.width = pct + '%';
    const fmt = (ms) => {
      const s = Math.floor(ms/1000);
      const m = Math.floor(s/60);
      const msR = Math.floor(ms % 1000).toString().padStart(3,'0');
      const sR = (s % 60).toString().padStart(2,'0');
      return `${m}:${sR}.${msR}`;
    };
    if (timeLabel) timeLabel.textContent = `${fmt(elapsed)} / ${fmt(total)}`;
  }

  function runLoop(){
    const win = player.contentWindow;
    if (!win || !win.document || !win.document.querySelector) {
      timer = requestAnimationFrame(runLoop);
      return;
    }
    const elapsed = (performance.now() - startAt) * playbackSpeed + startedOffset;
    updateProgress(elapsed, totalMs);
    // Emit events whose time <= elapsed
    while (schedule.length && schedule[0].at <= elapsed) {
      const { ev } = schedule.shift();
      simulateEvent(win, ev);
    }
    if (isPlaying && schedule.length) {
      timer = requestAnimationFrame(runLoop);
    } else if (schedule.length === 0) {
      setInfo('Playback finished');
      isPlaying = false;
    }
  }

  function simulateEvent(win, ev){
    try {
      switch(ev.type){
        case 'card_show':
          // no-op, UI already handles navigation
          break;
        case 'swipe_start': {
          drawDot(ev.xScaled ?? ev.x, ev.yScaled ?? ev.y);
          // prevent user interactivity in viewer
          try { win.document.body.style.pointerEvents = 'none'; } catch(_){}
          break; }
        case 'swipe_move': {
          drawTrail(ev.xScaled ?? ev.x, ev.yScaled ?? ev.y);
          break; }
        case 'advance':
          win.document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
          break;
        case 'back':
          win.document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
          break;
        case 'tap': {
          const active = win.document.querySelector('.card.active');
          if (!active) return;
          const value = ev.value;
          const type = (win.cardConfig || [])[ev.cardIndex]?.type;
          drawDot(ev.xScaled ?? ev.x, ev.yScaled ?? ev.y);
          if (type === 'yesno') {
            const selector = value === 'yes' ? '.yes-no-btn.yes' : '.yes-no-btn.no';
            active.querySelector(selector)?.click();
          } else if (type === 'likert5') {
            active.querySelector(`.likert-option[data-value="${value}"]`)?.click();
          } else if (type === 'check') {
            active.querySelector('.check-box')?.click();
          }
          break; }
        case 'select': {
          // already simulated via clicks above; skip
          break; }
        case 'swipe_end': {
          // approximate with arrow keys depending on delta
          if (Math.abs(ev.deltaY) > Math.abs(ev.deltaX)) {
            if (ev.deltaY < 0) {
              win.document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
            } else {
              win.document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
            }
          } else {
            const currentType = (win.cardConfig || [])[ev.cardIndex]?.type;
            if (currentType === 'yesno') {
              if (ev.deltaX > 0) {
                // mimic YES
                const active = win.document.querySelector('.card.active');
                active?.querySelector('.yes-no-btn.yes')?.click();
              } else {
                const active = win.document.querySelector('.card.active');
                active?.querySelector('.yes-no-btn.no')?.click();
              }
            }
          }
          break; }
        default:
          break;
      }
    } catch(err) {
      // ignore simulation errors
    }
  }
})();


