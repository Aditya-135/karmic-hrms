(() => {
  const HISTORY_KEY = 'resume_agent_history_v4';

  const form = document.getElementById('uploadForm');
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('resumeFile');
  const fileMeta = document.getElementById('fileMeta');
  const submitBtn = document.getElementById('submitBtn');
  const clearBtn = document.getElementById('clearBtn');
  const statusEl = document.getElementById('status');
  const steps = Array.from(document.querySelectorAll('.step'));
  const tabs = document.getElementById('tabs');
  const skillSearch = document.getElementById('skillSearch');
  const outputEl = document.getElementById('output');
  const noteEl = document.getElementById('note');
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const historyList = document.getElementById('historyList');
  const themeToggle = document.getElementById('themeToggle');
  const toast = document.getElementById('toast');

  const mPrimary = document.getElementById('mPrimary');
  const mSecondary = document.getElementById('mSecondary');
  const mLead = document.getElementById('mLead');
  const mComp = document.getElementById('mComp');

  const bSkills = document.getElementById('bSkills');
  const bIntent = document.getElementById('bIntent');
  const bLead = document.getElementById('bLead');
  const bComp = document.getElementById('bComp');

  const tSkills = document.getElementById('tSkills');
  const tIntent = document.getElementById('tIntent');
  const tLead = document.getElementById('tLead');
  const tComp = document.getElementById('tComp');

  const skillsTech = document.getElementById('skillsTech');
  const skillsSoft = document.getElementById('skillsSoft');
  const eLead = document.getElementById('eLead');
  const eComp = document.getElementById('eComp');
  const cLead = document.getElementById('cLead');
  const cComp = document.getElementById('cComp');

  const state = {
    technical: [],
    soft: [],
    current: null,
    timer: null,
    history: [],
    fileName: '',
  };

  function showToast(message, kind = 'ok') {
    toast.textContent = message;
    toast.className = `toast-ui show ${kind}`;
    setTimeout(() => {
      toast.className = 'toast-ui';
    }, 2000);
  }

  function setStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.className = isError ? 'status error' : 'status ok';
  }

  function updateStep(active, doneOnly = false) {
    steps.forEach((item, idx) => {
      item.classList.remove('active', 'done');
      if (idx < active) item.classList.add('done');
      else if (idx === active && !doneOnly) item.classList.add('active');
    });
  }

  function startProgress() {
    let i = 1;
    updateStep(1);
    state.timer = setInterval(() => {
      i += 1;
      if (i > 4) i = 4;
      updateStep(i);
    }, 650);
  }

  function stopProgress(ok) {
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
    if (ok) updateStep(5, true);
    else updateStep(0);
  }

  function updateFileMeta() {
    const file = fileInput.files && fileInput.files[0];
    if (!file) {
      state.fileName = '';
      fileMeta.textContent = 'No file selected';
      return;
    }
    state.fileName = file.name;
    fileMeta.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
  }

  function toPct(v) {
    return Math.max(0, Math.min(100, Math.round((Number(v) || 0) * 100)));
  }

  function setBar(bar, text, v) {
    const pct = toPct(v);
    bar.style.width = `${pct}%`;
    text.textContent = `${pct}%`;
  }

  function toTwo(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(2) : '0.00';
  }

  function renderChips(target, items, query = '') {
    if (!Array.isArray(items) || !items.length) {
      target.innerHTML = '<span class="empty">No data</span>';
      return;
    }
    const q = query.trim().toLowerCase();
    const list = q ? items.filter((x) => String(x).toLowerCase().includes(q)) : items;
    if (!list.length) {
      target.innerHTML = '<span class="empty">No matching skills</span>';
      return;
    }
    target.innerHTML = list.map((x) => `<span class="chip">${x}</span>`).join('');
  }

  function renderEvidence(target, items) {
    if (!Array.isArray(items) || !items.length) {
      target.innerHTML = '<li class="empty">No evidence available</li>';
      return;
    }
    target.innerHTML = items.map((x) => `<li>${x}</li>`).join('');
  }

  function renderResult(data) {
    state.current = data;
    const skills = data && data.skills ? data.skills : {};
    const intent = data && data.intent_profile ? data.intent_profile : {};
    const lead = data && data.leadership_analysis ? data.leadership_analysis : {};
    const comp = data && data.compensation_emphasis_index ? data.compensation_emphasis_index : {};

    state.technical = Array.isArray(skills.technical) ? skills.technical : [];
    state.soft = Array.isArray(skills.soft) ? skills.soft : [];

    mPrimary.textContent = intent.primary_intent || '-';
    mSecondary.textContent = intent.secondary_intent || '-';
    mLead.textContent = toTwo(lead.score);
    mComp.textContent = toTwo(comp.score);

    setBar(bSkills, tSkills, skills.confidence);
    setBar(bIntent, tIntent, intent.confidence);
    setBar(bLead, tLead, lead.confidence);
    setBar(bComp, tComp, comp.confidence);

    renderChips(skillsTech, state.technical, skillSearch.value || '');
    renderChips(skillsSoft, state.soft, skillSearch.value || '');

    const leadEv = Array.isArray(lead.evidence) ? lead.evidence : [];
    const compEv = Array.isArray(comp.evidence) ? comp.evidence : [];

    renderEvidence(eLead, leadEv);
    renderEvidence(eComp, compEv);
    cLead.textContent = String(leadEv.length);
    cComp.textContent = String(compEv.length);
  }

  function resetView() {
    outputEl.textContent = '{\n  "message": "Upload a resume to see analysis output"\n}';
    mPrimary.textContent = '-';
    mSecondary.textContent = '-';
    mLead.textContent = '0.00';
    mComp.textContent = '0.00';

    setBar(bSkills, tSkills, 0);
    setBar(bIntent, tIntent, 0);
    setBar(bLead, tLead, 0);
    setBar(bComp, tComp, 0);

    skillsTech.innerHTML = '<span class="empty">No data</span>';
    skillsSoft.innerHTML = '<span class="empty">No data</span>';
    eLead.innerHTML = '<li class="empty">No evidence available</li>';
    eComp.innerHTML = '<li class="empty">No evidence available</li>';
    cLead.textContent = '0';
    cComp.textContent = '0';

    setStatus('Ready.', false);
    updateStep(0);
    noteEl.textContent = '';

    state.current = null;
    state.technical = [];
    state.soft = [];
  }

  function isAllowedFile(file) {
    const name = String(file.name || '').toLowerCase();
    const typeOk = name.endsWith('.pdf') || name.endsWith('.docx');
    const sizeOk = file.size <= 10 * 1024 * 1024;
    return typeOk && sizeOk;
  }

  function parseJson(text) {
    try {
      return JSON.parse(text);
    } catch (_) {
      return null;
    }
  }

  function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-panel').forEach((panel) => {
      panel.classList.toggle('active', panel.id === `tab-${tab}`);
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme === 'dark' ? 'dark' : 'light');
    localStorage.setItem('resume_agent_theme', theme === 'dark' ? 'dark' : 'light');
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      state.history = Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      state.history = [];
    }
    renderHistory();
  }

  function saveHistory() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history.slice(0, 6)));
    renderHistory();
  }

  function addHistory(result) {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      at: new Date().toLocaleString(),
      file: state.fileName || 'resume',
      primary: result.intent_profile && result.intent_profile.primary_intent ? result.intent_profile.primary_intent : '-',
      payload: result,
    };
    state.history.unshift(entry);
    state.history = state.history.slice(0, 6);
    saveHistory();
  }

  function renderHistory() {
    if (!state.history.length) {
      historyList.innerHTML = '<div class="empty">No previous analyses</div>';
      return;
    }

    historyList.innerHTML = state.history.map((item) => `
      <div class="history-item">
        <strong>${item.file}</strong>
        <div class="history-meta">${item.at} | primary intent: ${item.primary}</div>
        <button class="history-btn" data-id="${item.id}">Load Result</button>
      </div>
    `).join('');
  }

  function downloadJson() {
    const blob = new Blob([outputEl.textContent || '{}'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume-analysis.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  ['dragenter', 'dragover'].forEach((name) => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('active');
    });
  });

  ['dragleave', 'drop'].forEach((name) => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('active');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer && e.dataTransfer.files;
    if (!files || !files.length) return;
    fileInput.files = files;
    updateFileMeta();
  });

  fileInput.addEventListener('change', updateFileMeta);

  tabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    switchTab(btn.dataset.tab);
  });

  skillSearch.addEventListener('input', () => {
    renderChips(skillsTech, state.technical, skillSearch.value || '');
    renderChips(skillsSoft, state.soft, skillSearch.value || '');
  });

  clearBtn.addEventListener('click', () => {
    form.reset();
    updateFileMeta();
    resetView();
    showToast('Cleared', 'ok');
  });

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-bs-theme') || 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(outputEl.textContent || '{}');
      noteEl.textContent = 'Copied JSON to clipboard.';
      showToast('Copied JSON', 'ok');
    } catch (_) {
      noteEl.textContent = 'Clipboard access failed.';
      showToast('Clipboard failed', 'error');
    }
  });

  downloadBtn.addEventListener('click', () => {
    downloadJson();
    noteEl.textContent = 'Downloaded JSON.';
    showToast('Downloaded', 'ok');
  });

  clearHistoryBtn.addEventListener('click', () => {
    state.history = [];
    saveHistory();
    showToast('History cleared', 'ok');
  });

  historyList.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-id]');
    if (!btn) return;

    const item = state.history.find((x) => x.id === btn.dataset.id);
    if (!item) return;

    outputEl.textContent = JSON.stringify(item.payload, null, 2);
    renderResult(item.payload);
    switchTab('overview');
    setStatus(`Loaded history: ${item.file}`, false);
    showToast('History loaded', 'ok');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = fileInput.files && fileInput.files[0];
    if (!file) {
      setStatus('Please select a resume file.', true);
      return;
    }
    if (!isAllowedFile(file)) {
      setStatus('Only PDF/DOCX up to 10 MB are allowed.', true);
      showToast('Invalid file', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Analyzing...';
    setStatus('Analyzing resume with multi-agent pipeline...', false);
    outputEl.textContent = '{\n  "status": "processing"\n}';
    startProgress();

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/v1/resume/analyze', {
        method: 'POST',
        body: formData,
      });

      const text = await res.text();
      const data = parseJson(text) || { detail: text };
      outputEl.textContent = JSON.stringify(data, null, 2);

      if (!res.ok) {
        stopProgress(false);
        setStatus('Analysis failed. Review details in JSON panel.', true);
        showToast('Analysis failed', 'error');
      } else {
        stopProgress(true);
        renderResult(data);
        addHistory(data);
        switchTab('overview');
        setStatus('Analysis completed successfully.', false);
        showToast('Analysis complete', 'ok');
      }
    } catch (_) {
      stopProgress(false);
      setStatus('Browser upload failed. Submitting with server fallback...', true);
      form.submit();
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Analyze Resume';
    }
  });

  const initialTheme = localStorage.getItem('resume_agent_theme') || 'light';
  applyTheme(initialTheme);
  updateFileMeta();
  loadHistory();

  const parsed = parseJson(outputEl.textContent || '');
  if (parsed && parsed.skills && parsed.intent_profile) {
    renderResult(parsed);
    updateStep(5, true);
    setStatus('Loaded result.', false);
  } else {
    resetView();
  }
})();
