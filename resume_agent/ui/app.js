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
        
        // Extract and auto-populate candidate name in behavioral form
        try {
          const nameFormData = new FormData();
          nameFormData.append('file', file);
          const nameRes = await fetch('/api/v1/resume/extract-name', {
            method: 'POST',
            body: nameFormData,
          });
          if (nameRes.ok) {
            const nameData = await nameRes.json();
            if (nameData.candidate_name) {
              document.getElementById('candidateName').value = nameData.candidate_name;
              showToast(`Auto-populated: ${nameData.candidate_name}`, 'ok');
            }
          }
        } catch (err) {
          // Silently fail if name extraction fails
        }
        
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

  // =========================================================================
  // BEHAVIORAL ANALYSIS SECTION
  // =========================================================================

  const mainTabs = document.getElementById('mainTabs');
  const resumeTab = document.getElementById('resume-tab');
  const behavioralTab = document.getElementById('behavioral-tab');
  const stressTab = document.getElementById('stress-tab');
  const behavioralForm = document.getElementById('behavioralForm');
  const analyzeBehavioralBtn = document.getElementById('analyzeBehavioralBtn');
  const clearBehavioralBtn = document.getElementById('clearBehavioralBtn');
  const behavioralStatus = document.getElementById('behavioralStatus');
  const behavioralOutput = document.getElementById('behavioralOutput');
  const behavioralMetrics = document.getElementById('behavioralMetrics');
  const copyBehavioralBtn = document.getElementById('copyBehavioralBtn');
  const downloadBehavioralBtn = document.getElementById('downloadBehavioralBtn');
  const behavioralTabs = document.getElementById('behavioralTabs');

  // OCEAN Questions Definition (15 questions)
  const OCEAN_QUESTIONS = {
    "O1": { trait: "openness", question: "I am creative and enjoy exploring novel ideas", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
    "O2": { trait: "openness", question: "I value artistic and cultural experiences", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
    "O3": { trait: "openness", question: "I am curious about how things work", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
    "C1": { trait: "conscientiousness", question: "I am organized and keep my work areas tidy", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
    "C2": { trait: "conscientiousness", question: "I am reliable and follow through on commitments", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
    "C3": { trait: "conscientiousness", question: "I carefully plan my work before starting", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
    "E1": { trait: "extraversion", question: "I enjoy working with others and collaborating", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
    "E2": { trait: "extraversion", question: "I am outgoing and enjoy team social events", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
    "E3": { trait: "extraversion", question: "I take initiative in group settings", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
    "A1": { trait: "agreeableness", question: "I cooperate well with others and compromise when needed", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
    "A2": { trait: "agreeableness", question: "I am empathetic and understand others' perspectives", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
    "A3": { trait: "agreeableness", question: "I credit teammates for their contributions", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
    "S1": { trait: "emotional_stability", question: "I remain calm under pressure", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
    "S2": { trait: "emotional_stability", question: "I handle constructive criticism well", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
    "S3": { trait: "emotional_stability", question: "I am resilient when facing setbacks", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] }
  };

  // Generate OCEAN Questions
  function generateOceanQuestions() {
    const container = document.getElementById("oceanQuestions");
    let html = "";
    for (const [qId, qData] of Object.entries(OCEAN_QUESTIONS)) {
      html += `<div class="ocean-question mb-3 p-3 border-start border-4" style="border-color: var(--bs-primary)">
        <label class="mb-3 d-block fw-semibold">${qId}. ${qData.question}</label>
        <div class="ocean-options">`;
      qData.options.forEach((option, idx) => {
        const score = idx + 1;
        html += `
          <label class="option-label">
            <input type="radio" name="${qId}" value="${score}" class="option-input" required>
            <span class="option-text">${option}</span>
          </label>`;
      });
      html += `</div>
      </div>`;
    }
    container.innerHTML = html;
  }

  // Team Members Management
  let teamMembers = [];

  function generateTeamMemberManager() {
    const container = document.getElementById("teamMembersList");
    if (teamMembers.length === 0) {
      container.innerHTML = '';
      return;
    }
    let html = '';
    teamMembers.forEach((member, idx) => {
      html += `
      <div class="team-member-card p-3 mb-2 border rounded">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <strong>${member.name} (Member ${idx + 1})</strong>
          <button type="button" class="btn btn-sm btn-outline-danger" onclick="window.removeTeamMember(${idx})">✕</button>
        </div>
        <div class="row g-2 small">
          <div class="col-6"><label>Openness: <input type="number" value="${member.openness || 50}" min="0" max="100" class="form-control form-control-sm trait-input" data-member="${idx}" data-trait="openness"></label></div>
          <div class="col-6"><label>Conscientiousness: <input type="number" value="${member.conscientiousness || 50}" min="0" max="100" class="form-control form-control-sm trait-input" data-member="${idx}" data-trait="conscientiousness"></label></div>
          <div class="col-6"><label>Extraversion: <input type="number" value="${member.extraversion || 50}" min="0" max="100" class="form-control form-control-sm trait-input" data-member="${idx}" data-trait="extraversion"></label></div>
          <div class="col-6"><label>Agreeableness: <input type="number" value="${member.agreeableness || 50}" min="0" max="100" class="form-control form-control-sm trait-input" data-member="${idx}" data-trait="agreeableness"></label></div>
          <div class="col-12"><label>Emotional Stability: <input type="number" value="${member.emotional_stability || 50}" min="0" max="100" class="form-control form-control-sm trait-input" data-member="${idx}" data-trait="emotional_stability"></label></div>
        </div>
      </div>`;
    });
    container.innerHTML = html;
    document.querySelectorAll('.trait-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const memberIdx = e.target.dataset.member;
        const trait = e.target.dataset.trait;
        teamMembers[memberIdx][trait] = parseInt(e.target.value);
      });
    });
  }

  window.addTeamMember = function() {
    teamMembers.push({
      name: `Team Member ${teamMembers.length + 1}`,
      openness: 50,
      conscientiousness: 50,
      extraversion: 50,
      agreeableness: 50,
      emotional_stability: 50
    });
    generateTeamMemberManager();
  };

  window.removeTeamMember = function(idx) {
    teamMembers.splice(idx, 1);
    generateTeamMemberManager();
  };

  // =========================================================================
  // TEAM & CANDIDATE HISTORY MANAGEMENT
  // =========================================================================

  let candidateHistory = JSON.parse(localStorage.getItem('candidateHistory')) || [];
  let teamScenarios = JSON.parse(localStorage.getItem('teamScenarios')) || [];
  let currentAnalysis = null;

  function saveCandidateToHistory(analysisData) {
    const historyEntry = {
      id: Date.now(),
      candidate_name: analysisData.candidate_name,
      job_role: analysisData.job_role,
      personality_type: analysisData.personality_type,
      personality_traits: analysisData.personality_traits,
      behavioral_fit_score: analysisData.behavioral_fit_score,
      role_fit_score: analysisData.role_fit_score,
      timestamp: new Date().toLocaleString()
    };
    candidateHistory.unshift(historyEntry);
    if (candidateHistory.length > 50) candidateHistory.pop();
    localStorage.setItem('candidateHistory', JSON.stringify(candidateHistory));
    return historyEntry;
  }

  function renderCandidateHistory() {
    const historyList = document.getElementById('candidateHistoryList');
    if (candidateHistory.length === 0) {
      historyList.innerHTML = '<div class="text-muted small">No candidates analyzed yet</div>';
      return;
    }
    let html = '';
    candidateHistory.slice(0, 15).forEach((entry, idx) => {
      const color = entry.behavioral_fit_score >= 70 ? 'success' : entry.behavioral_fit_score >= 50 ? 'warning' : 'danger';
      html += `
      <div class="history-card p-2 mb-2 border rounded cursor-pointer" style="background: var(--bg1); border-left: 3px solid var(--${color});">
        <div class="d-flex justify-content-between">
          <strong class="small">${entry.candidate_name}</strong>
          <span class="badge bg-${color}">${entry.behavioral_fit_score}</span>
        </div>
        <div class="small text-muted">${entry.job_role} • ${entry.timestamp}</div>
        <div class="small mt-1" title="${entry.personality_type}">${entry.personality_type}</div>
      </div>`;
    });
    historyList.innerHTML = html;
  }

  function createTeamScenario() {
    if (teamScenarios.length >= 5) {
      showToast('Maximum 5 scenarios reached', 'error');
      return;
    }
    const scenario = {
      id: Date.now(),
      team_name: `Team ${teamScenarios.length + 1}`,
      members: [],
      created_at: new Date().toLocaleString(),
      compatibility_score: 0,
      dynamics_score: 0
    };
    teamScenarios.push(scenario);
    localStorage.setItem('teamScenarios', JSON.stringify(teamScenarios));
    renderTeamScenarios();
    renderTeamComparison();
  }

  function deleteTeamScenario(scenarioId) {
    teamScenarios = teamScenarios.filter(s => s.id !== scenarioId);
    localStorage.setItem('teamScenarios', JSON.stringify(teamScenarios));
    renderTeamScenarios();
  }

  function renderTeamScenarios() {
    const container = document.getElementById('teamScenariosContainer');
    if (teamScenarios.length === 0) {
      container.innerHTML = '<div class="text-muted text-center p-4">No team scenarios created yet. Click "New Team Scenario" to start.</div>';
      return;
    }

    let html = '';
    teamScenarios.forEach(scenario => {
      const compatScore = scenario.compatibility_score || 0;
      const dynamicsScore = scenario.dynamics_score || 0;
      const color = compatScore >= 70 ? 'success' : compatScore >= 50 ? 'warning' : 'danger';
      
      // Calculate dynamic team compatibility with current members
      const membersList = scenario.members.map(m => `
        <div class="team-member-item mb-2 p-2 border-bottom">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <strong>${m.name}</strong>
              <br><small class="text-muted">${m.personality_type}</small>
              <br><small>Fit: <span class="badge bg-info">${m.compatibility_score || 70}%</span></small>
            </div>
            <button class="btn btn-sm btn-outline-danger" onclick="window.removeMemberFromTeam(${scenario.id}, '${m.name}')">Remove</button>
          </div>
        </div>
      `).join('');
      
      html += `
      <div class="team-scenario-card p-3 border rounded mb-3 ${compatScore < 50 ? 'warning-low' : compatScore >= 70 ? 'warning-good' : 'warning-medium'}" draggable="true" data-team-id="${scenario.id}">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div>
            <input type="text" class="team-name-input" value="${scenario.team_name}" data-team-id="${scenario.id}" style="font-weight: bold; border: none; background: transparent; width: 180px;">
            <div class="small text-muted">${scenario.members.length} members • Created: ${scenario.created_at}</div>
          </div>
          <button class="btn btn-sm btn-outline-danger" onclick="window.deleteTeamScenario(${scenario.id})" title="Delete entire team scenario">✕</button>
        </div>
        
        <div class="mb-2">
          <small class="text-muted">
            Compatibility: <span class="badge bg-${color}">${compatScore}%</span> | 
            Dynamics: <span class="badge bg-secondary">${dynamicsScore}</span>
          </small>
        </div>
        
        ${membersList ? `
        <div class="team-members-details small mb-2" style="max-height: 200px; overflow-y: auto;">
          ${membersList}
        </div>
        ` : '<div class="text-muted small mb-2">No members added</div>'}
        
        <button class="btn btn-xs btn-outline-primary btn-sm" onclick="window.addMemberToTeam(${scenario.id})">+ Add Member</button>
      </div>`;
    });
    container.innerHTML = html;

    // Attach event listeners to team name inputs
    document.querySelectorAll('.team-name-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const teamId = parseInt(e.target.dataset.teamId);
        const scenario = teamScenarios.find(s => s.id === teamId);
        if (scenario) {
          scenario.team_name = e.target.value;
          localStorage.setItem('teamScenarios', JSON.stringify(teamScenarios));
          showToast('Team name updated', 'ok');
        }
      });
    });

    // Attach drag-drop listeners to team scenario cards
    document.querySelectorAll('.team-scenario-card').forEach(card => {
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        card.classList.add('drag-over');
      });

      card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over');
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('drag-over');
        
        const memberName = e.dataTransfer.getData('text/member-name');
        const sourceTeamId = parseInt(e.dataTransfer.getData('text/source-team-id'));
        const destTeamId = parseInt(card.dataset.teamId);
        
        if (memberName && sourceTeamId && destTeamId && sourceTeamId !== destTeamId) {
          window.moveTeamMember(sourceTeamId, destTeamId, memberName);
        }
      });
    });

    // Attach drag listeners to team member badges
    document.querySelectorAll('.team-member-badge').forEach(badge => {
      badge.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/member-name', e.target.dataset.memberName);
        e.dataTransfer.setData('text/source-team-id', e.target.dataset.sourceTeam);
      });
    });
  }

  function moveTeamMember(sourceTeamId, destTeamId, memberName) {
    const sourceTeam = teamScenarios.find(s => s.id === sourceTeamId);
    const destTeam = teamScenarios.find(s => s.id === destTeamId);
    
    if (!sourceTeam || !destTeam) return;

    // Remove from source
    const memberIndex = sourceTeam.members.findIndex(m => m.name === memberName);
    if (memberIndex === -1) return;
    
    const member = sourceTeam.members[memberIndex];
    sourceTeam.members.splice(memberIndex, 1);
    
    // Add to destination (check for duplicates)
    if (!destTeam.members.find(m => m.name === memberName)) {
      destTeam.members.push(member);
    }
    
    // Update localStorage and UI
    localStorage.setItem('teamScenarios', JSON.stringify(teamScenarios));
    renderTeamScenarios();
    renderTeamComparison();
    showToast(`Moved ${memberName} to ${destTeam.team_name}`, 'ok');
  }

  function calculateTeamCompatibility(team) {
    if (team.members.length === 0) return 0;
    
    // Base score from member compatibility
    const memberScores = team.members.map(m => m.compatibility_score || 70);
    const avgScore = memberScores.reduce((a, b) => a + b, 0) / memberScores.length;
    
    // Boost for diversity in personality types
    const uniqueTypes = new Set(team.members.map(m => m.personality_type)).size;
    const diversityBoost = (uniqueTypes / Math.min(team.members.length, 4)) * 10;
    
    const finalScore = Math.min(100, avgScore + diversityBoost);
    return Math.round(finalScore);
  }

  function calculateTeamDynamics(team) {
    if (team.members.length < 2) return 0;
    
    // Personality type frequency analysis
    const typeCounts = {};
    team.members.forEach(m => {
      typeCounts[m.personality_type] = (typeCounts[m.personality_type] || 0) + 1;
    });
    
    const uniqueCount = Object.keys(typeCounts).length;
    const maxRepetition = Math.max(...Object.values(typeCounts));
    
    // Balance score: more diverse is better
    const balanceScore = (uniqueCount / team.members.length) * 100;
    
    // Conflict score: too many of same type = lower dynamics
    const conflictPenalty = (maxRepetition / team.members.length) * 20;
    
    const dynamics = Math.round(balanceScore - conflictPenalty);
    return Math.max(0, dynamics);
  }

  function generateTeamProsAndCons(team) {
    const pros = [];
    const cons = [];
    
    const typeCounts = {};
    team.members.forEach(m => {
      typeCounts[m.personality_type] = (typeCounts[m.personality_type] || 0) + 1;
    });
    
    // Pros analysis
    if (Object.keys(typeCounts).length >= 3) {
      pros.push('Strong personality diversity');
    }
    if (team.members.some(m => m.personality_type.includes('Leader'))) {
      pros.push('Strong leadership presence');
    }
    if (team.members.some(m => m.personality_type.includes('Connector'))) {
      pros.push('Good communication skills');
    }
    if (calculateTeamCompatibility(team) >= 70) {
      pros.push('High compatibility scores');
    }
    
    // Cons analysis
    if (Object.keys(typeCounts).length <= 2) {
      cons.push('Limited personality diversity');
    }
    if (!team.members.some(m => m.personality_type.includes('Organizer'))) {
      cons.push('May lack organizational structure');
    }
    if (team.members.filter(m => m.personality_type.includes('Analyst')).length === team.members.length) {
      cons.push('Too analytical, may lack creativity');
    }
    if (calculateTeamCompatibility(team) < 50) {
      cons.push('Low compatibility concerns');
    }
    
    return {
      pros: pros.slice(0, 3),
      cons: cons.slice(0, 2)
    };
  }

  function renderTeamComparison() {
    const container = document.getElementById('teamComparisonContainer');
    if (teamScenarios.length === 0) {
      container.innerHTML = '<div class="text-muted text-center p-4">Create team scenarios to see comparison analysis.</div>';
      return;
    }

    let html = '<div class="team-comparison-grid">';
    teamScenarios.forEach(scenario => {
      const compat = calculateTeamCompatibility(scenario);
      const dynamics = calculateTeamDynamics(scenario);
      const analysis = generateTeamProsAndCons(scenario);
      const color = compat >= 70 ? 'success' : compat >= 50 ? 'warning' : 'danger';
      
      // Team composition details
      const personalities = scenario.members.map(m => m.personality_type);
      const uniqueTypes = new Set(personalities).size;
      const composition = uniqueTypes > 0 
        ? `${uniqueTypes} personality type${uniqueTypes > 1 ? 's' : ''} represented`
        : 'Empty team';
      
      html += `
      <div class="comparison-card ${compat < 50 ? 'warning-low' : compat >= 70 ? 'warning-good' : 'warning-medium'}">
        <h5 class="mb-2">${scenario.team_name}</h5>
        <small class="text-muted d-block mb-2">
          ${scenario.members.length} members • ${composition}
        </small>
        
        <div class="mb-3">
          <div class="d-flex justify-content-between align-items-center">
            <span>Compatibility</span>
            <span class="badge bg-${color}">${compat}%</span>
          </div>
          <div class="d-flex justify-content-between align-items-center mt-1">
            <span>Team Dynamics</span>
            <span class="badge bg-secondary">${dynamics}</span>
          </div>
        </div>
        
        ${scenario.members.length > 0 ? `
        <div class="mb-2 small">
          <strong>Team Members:</strong>
          <div class="mt-1">
            ${scenario.members.map(m => `
              <span class="badge bg-light text-dark me-1 mb-1" title="${m.personality_type}">
                ${m.name.split(' ')[0]}
              </span>
            `).join('')}
          </div>
        </div>
        ` : ''}
        
        <div class="mb-2">
          <strong class="small text-success">✓ Strengths:</strong>
          <ul class="list-unstyled small mb-0">
            ${analysis.pros.map(p => `<li class="text-success">• ${p}</li>`).join('')}
          </ul>
        </div>
        
        <div>
          <strong class="small text-danger">⚠ Challenges:</strong>
          <ul class="list-unstyled small mb-0">
            ${analysis.cons.map(c => `<li class="text-danger">• ${c}</li>`).join('')}
          </ul>
        </div>
      </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
  }

  window.addMemberToTeam = function(teamScenarioId) {
    if (!currentAnalysis) {
      showToast('Analyze a candidate first', 'error');
      return;
    }
    const scenario = teamScenarios.find(s => s.id === teamScenarioId);
    if (!scenario) return;
    
    const newMember = {
      id: Date.now(),
      name: currentAnalysis.candidate_name,
      personality_type: currentAnalysis.personality_type,
      personality_traits: currentAnalysis.personality_traits,
      compatibility_score: currentAnalysis.behavioral_fit_score || currentAnalysis.final_score || 70,
      role: currentAnalysis.job_role
    };
    scenario.members.push(newMember);
    localStorage.setItem('teamScenarios', JSON.stringify(teamScenarios));
    renderTeamScenarios();
    renderTeamComparison();
    showToast(`Added ${newMember.name} to ${scenario.team_name}`, 'ok');
  };

  window.deleteTeamScenario = function(scenarioId) {
    teamScenarios = teamScenarios.filter(s => s.id !== scenarioId);
    localStorage.setItem('teamScenarios', JSON.stringify(teamScenarios));
    renderTeamScenarios();
    renderTeamComparison();
  };

  window.moveTeamMember = moveTeamMember;

  window.removeMemberFromTeam = function(scenarioId, memberName) {
    const scenario = teamScenarios.find(s => s.id === scenarioId);
    if (!scenario) return;
    
    const memberIndex = scenario.members.findIndex(m => m.name === memberName);
    if (memberIndex === -1) return;
    
    scenario.members.splice(memberIndex, 1);
    localStorage.setItem('teamScenarios', JSON.stringify(teamScenarios));
    renderTeamScenarios();
    renderTeamComparison();
    showToast(`Removed ${memberName} from ${scenario.team_name}`, 'ok');
  };

  // Initialize OCEAN questions on page load
  generateOceanQuestions();
  document.getElementById('addTeamMemberBtn').addEventListener('click', window.addTeamMember);
  
  // Team management event listeners
  const addTeamScenarioBtn = document.getElementById('addTeamScenarioBtn');
  if (addTeamScenarioBtn) {
    addTeamScenarioBtn.addEventListener('click', createTeamScenario);
  }

  // ===== STRESS ANALYSIS TAB =====
  const stressForm = document.getElementById('stressForm');
  const analyzeStressBtn = document.getElementById('analyzeStressBtn');
  const clearStressBtn = document.getElementById('clearStressBtn');
  const stressStatus = document.getElementById('stressStatus');
  const stressResults = document.getElementById('stressResults');
  const stressHistoryTable = document.getElementById('stressHistoryTable');
  const chartCanvas = document.getElementById('stressChart');
  const chartPlaceholder = document.getElementById('chartPlaceholder');
  
  let stressChart = null;
  const stressAnalysisHistory = [];
  
  function initStressChart() {
    if (stressChart) {
      stressChart.destroy();
    }
    stressChart = new Chart(chartCanvas, {
      type: 'bar',
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true, max: 100 } }
      }
    });
  }
  
  function updateStressChart() {
    if (!stressChart || stressAnalysisHistory.length === 0) return;
    
    const labels = stressAnalysisHistory.map((_, i) => `Emp ${i + 1}`);
    const workloads = stressAnalysisHistory.map(d => d.workload_score);
    const risks = stressAnalysisHistory.map(d => {
      const riskMap = { 'NORMAL': 30, 'HIGH': 70, 'CRITICAL': 100 };
      return riskMap[d.risk_level] || 30;
    });
    
    stressChart.data.labels = labels;
    stressChart.data.datasets = [
      {
        label: 'Workload Score',
        data: workloads,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1
      },
      {
        label: 'Risk Level',
        data: risks,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 1
      }
    ];
    stressChart.update();
  }
  
  function addToStressHistory(data) {
    stressAnalysisHistory.push(data);
    const idx = stressAnalysisHistory.length;
    
    const stressColorMap = {
      'Low': '#28a745',
      'Medium': '#ffc107',
      'High': '#dc3545'
    };
    const riskColorMap = {
      'NORMAL': '#28a745',
      'HIGH': '#ffc107',
      'CRITICAL': '#dc3545'
    };
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><small>#${idx}</small></td>
      <td><span style="color: ${stressColorMap[data.stress_level] || '#000'}; font-weight: bold;">${data.stress_level}</span></td>
      <td><span style="color: ${riskColorMap[data.risk_level] || '#000'}; font-weight: bold;">${data.risk_level}</span></td>
      <td><small>${data.workload_score.toFixed(1)}</small></td>
    `;
    
    if (stressHistoryTable.querySelector('tr td[colspan]')) {
      stressHistoryTable.innerHTML = '';
    }
    stressHistoryTable.appendChild(row);
    
    updateStressChart();
  }
  
  function displayStressResults(data) {
    const stressColorMap = {
      'Low': { bg: '#d4edda', text: '#155724', emoji: '✅' },
      'Medium': { bg: '#fff3cd', text: '#856404', emoji: '⚠️' },
      'High': { bg: '#f8d7da', text: '#721c24', emoji: '🔴' }
    };
    
    const riskColorMap = {
      'NORMAL': '#28a745',
      'HIGH': '#ffc107',
      'CRITICAL': '#dc3545'
    };
    
    const stressStyle = stressColorMap[data.stress_level] || stressColorMap['Low'];
    const riskColor = riskColorMap[data.risk_level] || '#000';
    
    document.getElementById('stressLevelDisplay').innerHTML = 
      `<span style="background: ${stressStyle.bg}; color: ${stressStyle.text}; padding: 0.5rem 1rem; border-radius: 0.5rem;">${stressStyle.emoji} ${data.stress_level}</span>`;
    
    document.getElementById('riskLevelDisplay').innerHTML = 
      `<span style="color: ${riskColor}; font-weight: bold;">${data.risk_level}</span>`;
    
    document.getElementById('workloadScore').textContent = `${data.workload_score.toFixed(1)}/100`;
    document.getElementById('meetingLoadScore').textContent = `${data.meeting_load_score.toFixed(1)}/100`;
    document.getElementById('taskCompletion').textContent = `${data.task_completion_score.toFixed(1)}%`;
    
    // Display insights
    const insightsList = document.getElementById('insightsList');
    insightsList.innerHTML = data.insights.map(i => `<div class="mb-2">• ${i}</div>`).join('');
    
    // Display recommendations
    const recommendationsList = document.getElementById('recommendationsList');
    recommendationsList.innerHTML = data.recommendations.map(r => `<div class="mb-2">• ${r}</div>`).join('');
    
    // Display future risk
    const futureRiskAlert = document.getElementById('futureRiskAlert');
    futureRiskAlert.textContent = data.future_risk;
    futureRiskAlert.style.display = data.risk_level === 'CRITICAL' ? 'block' : 'none';
    
    stressResults.style.display = 'block';
    stressStatus.style.display = 'none';
    
    addToStressHistory(data);
    chartPlaceholder.style.display = 'none';
  }
  
  stressForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const payload = {
      tasks_assigned: parseInt(document.getElementById('tasksAssigned').value),
      tasks_completed: parseInt(document.getElementById('tasksCompleted').value),
      overdue_tasks: parseInt(document.getElementById('overdueTasks').value),
      working_hours_per_day: parseFloat(document.getElementById('workingHours').value),
      meetings_per_day: parseInt(document.getElementById('meetingsPerDay').value),
      meeting_hours: parseFloat(document.getElementById('meetingHours').value),
      weekend_work: parseInt(document.getElementById('weekendWork').value),
    };
    
    stressStatus.style.display = 'block';
    stressStatus.textContent = '⏳ Analyzing...';
    stressStatus.className = 'status ok';
    stressResults.style.display = 'none';
    
    try {
      const response = await fetch('/api/v1/stress/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        displayStressResults(data);
        stressStatus.textContent = '✅ Analysis complete!';
        
        // Show alert if high risk
        if (data.risk_level === 'CRITICAL') {
          setTimeout(() => {
            alert(`⚠️ HIGH RISK DETECTED!\n\n${data.stress_level} Stress Level\n${data.risk_level} Risk Classification\n\nImmediate action may be required.`);
          }, 300);
        }
      } else {
        stressStatus.textContent = `❌ ${data.message || 'Analysis failed'}`;
        stressStatus.className = 'status error';
      }
    } catch (error) {
      stressStatus.textContent = `❌ Error: ${error.message}`;
      stressStatus.className = 'status error';
    }
  });
  
  clearStressBtn.addEventListener('click', () => {
    stressForm.reset();
    stressResults.style.display = 'none';
    stressStatus.style.display = 'none';
  });

  // Main tab switching
  mainTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-main-tab]');
    if (!btn) return;

    const tabName = btn.dataset.mainTab;
    document.querySelectorAll('[data-main-tab]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    resumeTab.style.display = tabName === 'resume' ? '' : 'none';
    behavioralTab.style.display = tabName === 'behavioral' ? '' : 'none';
    stressTab.style.display = tabName === 'stress' ? '' : 'none';
    
    // Initialize chart when stress tab is opened
    if (tabName === 'stress' && !stressChart) {
      setTimeout(() => initStressChart(), 100);
    }
  });

  // Behavioral tab switching
  behavioralTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.behavioral-tab-btn');
    if (!btn) return;

    document.querySelectorAll('.behavioral-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('[id^="tab-"]').forEach(panel => panel.classList.remove('active'));
    const tabPanel = document.getElementById(`tab-${btn.dataset.tab}`);
    if (tabPanel) tabPanel.classList.add('active');
  });

  // Clear behavioral form
  clearBehavioralBtn.addEventListener('click', () => {
    behavioralForm.reset();
    behavioralMetrics.style.display = 'none';
    behavioralStatus.style.display = 'none';
    behavioralOutput.textContent = '{"message": "Fill the form and analyze to see results"}';
    showToast('Form cleared', 'ok');
  });

  // Copy behavioral JSON
  copyBehavioralBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(behavioralOutput.textContent || '{}');
      showToast('JSON copied to clipboard', 'ok');
    } catch (_) {
      showToast('Copy failed', 'error');
    }
  });

  // Download behavioral JSON
  downloadBehavioralBtn.addEventListener('click', () => {
    const blob = new Blob([behavioralOutput.textContent || '{}'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'behavioral-analysis.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // Collect Behavioral Data
  function collectBehavioralData() {
    const candidateName = document.getElementById("candidateName").value.trim();
    const jobRole = document.getElementById("jobRole").value.trim();
    const textAnswer = document.getElementById("textAnswer").value.trim();

    if (!candidateName) {
      showToast("Please enter candidate name", 'error');
      return null;
    }
    if (!jobRole) {
      showToast("Please select a job role", 'error');
      return null;
    }

    const oceanAnswers = {};
    document.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
      oceanAnswers[radio.name] = parseInt(radio.value);
    });

    if (Object.keys(oceanAnswers).length < 15) {
      showToast("Please answer all OCEAN questions", 'error');
      return null;
    }

    const teamMembersForApi = teamMembers.map(m => ({
      name: m.name,
      openness: m.openness || 50,
      conscientiousness: m.conscientiousness || 50,
      extraversion: m.extraversion || 50,
      agreeableness: m.agreeableness || 50,
      emotional_stability: m.emotional_stability || 50
    }));

    return { candidateName, jobRole, ocean_answers: oceanAnswers, team_members: teamMembersForApi, text_answers: [textAnswer] };
  }

  // Behavioral form submission
  behavioralForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = collectBehavioralData();
    if (!data) return;

    analyzeBehavioralBtn.disabled = true;
    analyzeBehavioralBtn.textContent = 'Analyzing...';
    behavioralStatus.style.display = 'block';
    behavioralStatus.textContent = 'Analyzing personality & team compatibility...';
    behavioralStatus.className = 'status mt-3';

    try {
      const response = await fetch('/api/v1/behavioral/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_name: data.candidateName,
          job_role: data.jobRole,
          ocean_answers: data.ocean_answers,
          team_members: data.team_members,
          text_answers: data.text_answers
        }),
      });

      const result = await response.json();
      behavioralOutput.textContent = JSON.stringify(result, null, 2);

      if (!response.ok) {
        behavioralStatus.textContent = 'Analysis failed. Review details in JSON panel.';
        behavioralStatus.classList.add('error');
        showToast('Analysis failed', 'error');
      } else {
        renderBehavioralResult(result);
        behavioralMetrics.style.display = 'block';
        behavioralStatus.textContent = 'Analysis completed successfully!';
        behavioralStatus.classList.remove('error');
        behavioralStatus.classList.add('ok');
        showToast('Analysis complete', 'ok');
      }
    } catch (err) {
      behavioralStatus.textContent = 'Error: ' + err.message;
      behavioralStatus.classList.add('error');
      showToast('Network error', 'error');
    } finally {
      analyzeBehavioralBtn.disabled = false;
      analyzeBehavioralBtn.textContent = '🚀 Analyze & Generate Report';
    }
  });

  function renderBehavioralResult(response) {
    // Render Personality Tab
    const ocean = response.personality_traits || {};
    document.getElementById("bOpenness").textContent = (ocean.openness || 0) + "%";
    document.getElementById("bConscientiousness").textContent = (ocean.conscientiousness || 0) + "%";
    document.getElementById("bExtraversion").textContent = (ocean.extraversion || 0) + "%";
    document.getElementById("bAgreeableness").textContent = (ocean.agreeableness || 0) + "%";
    document.getElementById("bEmotionalStability").textContent = (ocean.emotional_stability || 0) + "%";

    // Render Role Fit Tab
    const roleFitScore = response.role_fit_score || 0;
    const scoreColor = roleFitScore >= 70 ? 'success' : roleFitScore >= 50 ? 'warning' : 'danger';
    const recommendations = response.role_recommendations || [];
    document.getElementById("bRoleScore").innerHTML = `<span class="badge bg-${scoreColor} fs-5">${roleFitScore}</span>`;
    if (recommendations.length > 0) {
      document.getElementById("bRoleRec").innerHTML = recommendations.map(r => `<div class="mb-1">• ${r}</div>`).join('');
    } else {
      document.getElementById("bRoleRec").innerHTML = '<span class="text-muted">No recommendations available</span>';
    }

    // Render Team Compatibility Tab
    const teamCompat = response.team_compatibility || {};
    const compatScore = Math.round(teamCompat.compatibility_score || 0);
    const teamSize = response.team_size || 0;
    document.getElementById("bCompatScore").textContent = compatScore + '%';
    document.getElementById("bTeamSize").textContent = teamSize > 0 ? teamSize + ' members' : 'New team';
    
    if (teamSize === 0) {
      document.getElementById("bSynergies").innerHTML = '<span class="text-muted">Add team members to analyze</span>';
      document.getElementById("bConflicts").innerHTML = '<span class="text-muted">Add team members to analyze</span>';
      document.getElementById("bTeamRec").innerHTML = '<span class="text-muted">Add team members to analyze</span>';
    } else {
      const synergies = teamCompat.synergies || [];
      const conflicts = teamCompat.potential_conflicts || [];
      const teamRecs = teamCompat.recommendations || [];
      document.getElementById("bSynergies").innerHTML = synergies.length > 0 
        ? synergies.map(s => `<div class="mb-1">✓ ${s}</div>`).join('')
        : '<span class="text-muted">No synergies detected</span>';
      document.getElementById("bConflicts").innerHTML = conflicts.length > 0 
        ? conflicts.map(c => `<div class="mb-1">⚠ ${c}</div>`).join('')
        : '<span class="text-muted">No conflicts detected</span>';
      document.getElementById("bTeamRec").innerHTML = teamRecs.length > 0 
        ? teamRecs.map(r => `<div class="mb-1">💡 ${r}</div>`).join('')
        : '<span class="text-muted">Team is well-balanced</span>';
    }

    // Render Summary Tab
    const fitScore = response.behavioral_fit_score || response.final_score || 0;
    const fitColor = fitScore >= 70 ? 'success' : fitScore >= 50 ? 'warning' : 'danger';
    document.getElementById("bFitScore").innerHTML = `<span class="badge bg-${fitColor} fs-5">${fitScore}</span>`;
    
    const overallAssessment = teamSize > 0 
      ? (fitScore >= 70 && compatScore >= 70 ? "🟢 Excellent Fit" : 
         fitScore >= 60 && compatScore >= 60 ? "🟡 Good Fit" : 
         "🔴 Fair Match - Review Compatibility")
      : (fitScore >= 70 ? "🟢 Strong Profile" : fitScore >= 60 ? "🟡 Suitable Profile" : "🔴 Needs Development");
    document.getElementById("bTeamFit").textContent = overallAssessment;
    
    const riskFlags = [];
    if (fitScore < 50) riskFlags.push("⚠️ Low behavioral fit score");
    if (teamSize > 0 && compatScore < 50) riskFlags.push("⚠️ Low team compatibility");
    const teamConflicts = (teamCompat.potential_conflicts || []);
    if (teamConflicts.length > 2) riskFlags.push("⚠️ Multiple team conflicts detected");
    
    document.getElementById("bRiskFlags").innerHTML = riskFlags.length > 0
      ? riskFlags.map(f => `<div class="mb-1">${f}</div>`).join('')
      : '<span class="text-success">✓ No major risks identified</span>';
    
    const candidateName = document.getElementById("candidateName").value;
    const jobRole = document.getElementById("jobRole").value;
    const summary = `<strong>${candidateName}</strong> is applying for <strong>${jobRole}</strong> with a behavioral fit score of <strong>${fitScore}/100</strong>.` +
      (teamSize > 0 ? ` Team compatibility is at <strong>${compatScore}/100</strong> with existing team members.` : '') +
      ` Recommended action: ${fitScore >= 70 && (compatScore >= 70 || teamSize === 0) ? "Proceed to offer" : "Conduct further assessment"}.`;
    document.getElementById("bSummary").innerHTML = summary;

    // ===== TEAM MANAGEMENT FEATURES =====
    // Save candidate to history
    currentAnalysis = response;
    saveCandidateToHistory(response);
    renderCandidateHistory();

    // Display personality type with DYNAMIC strengths
    const personalityType = response.personality_type || "The Balanced Professional";
    const personalityProfile = response.personality_profile || {};
    document.getElementById("personalityTypeName").textContent = personalityType;
    document.getElementById("personalityTypeDesc").textContent = personalityProfile.description || "Professional personality profile";
    
    // Show dynamic strengths (prioritize dynamic_strengths over static strengths)
    const strengthsList = personalityProfile.dynamic_strengths || personalityProfile.strengths || [];
    if (strengthsList && Array.isArray(strengthsList)) {
      document.getElementById("personalityStrengths").innerHTML = strengthsList
        .map(s => `<div class="mb-2"><strong>✓</strong> ${s}</div>`)
        .join('');
    }
    
    // Display role compatibility scores
    const roleCompatibility = response.role_compatibility || {};
    if (Object.keys(roleCompatibility).length > 0) {
      const roleHtml = Object.entries(roleCompatibility)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)  // Top 5 roles
        .map(([role, score]) => {
          const scoreColor = score >= 75 ? 'success' : score >= 60 ? 'warning' : 'danger';
          return `<div class="mb-2 d-flex justify-content-between align-items-center">
            <span>${role}</span>
            <span class="badge bg-${scoreColor}">${score}%</span>
          </div>`;
        })
        .join('');
      
      const roleSection = document.getElementById("personalityStrengths").parentElement;
      let roleDiv = roleSection.querySelector('.role-compatibility-section');
      if (!roleDiv) {
        roleDiv = document.createElement('div');
        roleDiv.className = 'role-compatibility-section mt-3 p-2 border-top';
        roleDiv.innerHTML = '<h6 class="mb-3">Best Role Fits</h6>';
        roleSection.appendChild(roleDiv);
      }
      roleDiv.innerHTML = '<h6 class="mb-3">🎯 Best Role Fits</h6>' + roleHtml;
    }
    
    // Display AI recommendations
    const recommendationData = response.recommendation_data || {};
    if (recommendationData.best_role) {
      const bestRole = recommendationData.best_role;
      const confidence = recommendationData.confidence || 0;
      const reasoning = recommendationData.reasoning || '';
      
      const recommendationDiv = document.createElement('div');
      recommendationDiv.className = 'alert alert-info mt-3';
      recommendationDiv.innerHTML = `
        <strong>💡 AI Recommendation:</strong><br>
        <span class="badge bg-primary mb-2">${bestRole}</span> 
        <span class="badge bg-secondary">${confidence}% match</span>
        <p class="mb-0 small mt-2">${reasoning}</p>
      `;
      
      const parentEl = document.getElementById("personalityStrengths").parentElement.parentElement;
      const oldRec = parentEl.querySelector('.ai-recommendation');
      if (oldRec) oldRec.remove();
      recommendationDiv.className += ' ai-recommendation';
      parentEl.appendChild(recommendationDiv);
    }

    // Show team management section
    document.getElementById("team-management-section").style.display = "block";
    renderTeamScenarios();
    renderTeamComparison();
  }
})();

