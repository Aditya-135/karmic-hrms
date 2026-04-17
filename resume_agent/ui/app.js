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
  const initialResumeOutput = document.getElementById('initialResumeOutput');
  const downloadAllPdfBtn = document.getElementById('downloadAllPdfBtn');
  const downloadResumePdfBtn = document.getElementById('downloadResumePdfBtn');
  const downloadBehavioralPdfBtn = document.getElementById('downloadBehavioralPdfBtn');
  const downloadStressPdfBtn = document.getElementById('downloadStressPdfBtn');
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
  const profileStatus = document.getElementById('profileStatus');
  const pName = document.getElementById('pName');
  const pEmail = document.getElementById('pEmail');
  const pPhone = document.getElementById('pPhone');
  const pLocation = document.getElementById('pLocation');
  const pExperience = document.getElementById('pExperience');
  const pLinks = document.getElementById('pLinks');
  const pEducation = document.getElementById('pEducation');
  const pCertifications = document.getElementById('pCertifications');

  // Workforce intelligence (3-agent pipeline)
  const runWorkforceBtn = document.getElementById('runWorkforceBtn');
  const wfEmployeeSkills = document.getElementById('wfEmployeeSkills');
  const wfProjectName = document.getElementById('wfProjectName');
  const wfTeamName = document.getElementById('wfTeamName');
  const wfProjectSkills = document.getElementById('wfProjectSkills');
  const wfTeamSkills = document.getElementById('wfTeamSkills');
  const wfTeamValues = document.getElementById('wfTeamValues');
  const wfLeadershipNeeded = document.getElementById('wfLeadershipNeeded');

  const wfIntent = document.getElementById('wfIntent');
  const wfLeadership = document.getElementById('wfLeadership');
  const wfComp = document.getElementById('wfComp');

  const wfRole = document.getElementById('wfRole');
  const wfRoleConf = document.getElementById('wfRoleConf');
  const wfMatch = document.getElementById('wfMatch');
  const wfMissing = document.getElementById('wfMissing');
  const wfCompat = document.getElementById('wfCompat');
  const wfCompatParts = document.getElementById('wfCompatParts');
  const wfNotes = document.getElementById('wfNotes');
  const wfNotesCount = document.getElementById('wfNotesCount');

  const state = {
    technical: [],
    soft: [],
    current: null,
    timer: null,
    history: [],
    fileName: '',
    profile: null,
    workforce: null,
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

  function parseCsvList(text) {
    return String(text || '')
      .split(',')
      .map((x) => x.trim())
      .filter((x) => x.length > 0);
  }

  function fmtPct01(v) {
    const pct = toPct(v);
    return `${pct}%`;
  }

  function renderNotes(target, items) {
    if (!Array.isArray(items) || !items.length) {
      target.innerHTML = '<li class="empty">No notes</li>';
      return;
    }
    target.innerHTML = items.map((x) => `<li>${x}</li>`).join('');
  }

  function htmlEscape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatProfileValue(value) {
    if (Array.isArray(value)) return value.filter(Boolean).join(', ') || '-';
    return value ? String(value) : '-';
  }

  /** DOM nodes for Experience / Links may be absent; avoid throwing on null. */
  function setProfileField(el, text) {
    if (el) el.textContent = text;
  }

  function renderProfileList(target, items) {
    if (!target) return;
    const list = Array.isArray(items) ? items.filter(Boolean) : [];
    if (!list.length) {
      target.textContent = '-';
      return;
    }
    target.innerHTML = list.map((item) => `<span>${htmlEscape(item)}</span>`).join('');
  }

  function setProfileEmpty(status = 'Awaiting resume', errorDetail = null) {
    state.profile = null;
    if (errorDetail) {
      profileStatus.textContent = `${status}: ${errorDetail}`;
      profileStatus.className = 'profile-status profile-status-error';
    } else {
      profileStatus.textContent = status;
      profileStatus.className = 'profile-status';
    }
    setProfileField(pName, '-');
    setProfileField(pEmail, '-');
    setProfileField(pPhone, '-');
    setProfileField(pLocation, '-');
    setProfileField(pExperience, '-');
    setProfileField(pLinks, '-');
    setProfileField(pEducation, '-');
    setProfileField(pCertifications, '-');
  }

  function renderCandidateProfile(profile) {
    state.profile = profile || null;
    if (!profile) {
      setProfileEmpty('Profile not detected');
      return;
    }

    setProfileField(pName, formatProfileValue(profile.candidate_name));
    setProfileField(pEmail, formatProfileValue(profile.email));
    setProfileField(pPhone, formatProfileValue(profile.phone));
    setProfileField(pLocation, formatProfileValue(profile.location));
    setProfileField(pExperience, formatProfileValue(profile.experience));
    setProfileField(pLinks, formatProfileValue(profile.links));
    renderProfileList(pEducation, profile.education);
    renderProfileList(pCertifications, profile.certifications);

    const found = [
      profile.candidate_name,
      profile.email,
      profile.phone,
      ...(Array.isArray(profile.education) ? profile.education : []),
    ].filter(Boolean).length;
    profileStatus.textContent = found ? 'Detected' : 'Needs review';
    profileStatus.className = found ? 'profile-status detected' : 'profile-status';

    if (profile.candidate_name) {
      const candidateInput = document.getElementById('candidateName');
      if (candidateInput) candidateInput.value = profile.candidate_name;
    }
  }

  async function extractProfileFromFile(file, quiet = false) {
    if (!file || !isAllowedFile(file)) {
      setProfileEmpty('Awaiting resume');
      return null;
    }

    profileStatus.textContent = 'Detecting...';
    profileStatus.className = 'profile-status';

    try {
      const profileFormData = new FormData();
      profileFormData.append('file', file);
      const profileRes = await fetch('/api/v1/resume/extract-profile', {
        method: 'POST',
        body: profileFormData,
      });

      const profileText = await profileRes.text();
      const profileData = parseJson(profileText) || { detail: profileText };

      if (!profileRes.ok) {
        const detail = errorText(profileData, `HTTP ${profileRes.status}`);
        setProfileEmpty('Profile extract failed', detail);
        if (!quiet) {
          showToast('Could not extract candidate profile', 'error');
        }
        return null;
      }

      const prof = profileData.profile;
      renderCandidateProfile(prof);
      if (!quiet && prof && prof.candidate_name) {
        showToast(`Detected: ${prof.candidate_name}`, 'ok');
      }
      return prof || null;
    } catch (err) {
      const detail = err && err.message ? err.message : 'Network error';
      setProfileEmpty('Profile extract failed', detail);
      if (!quiet) {
        showToast('Could not extract candidate profile', 'error');
      }
      return null;
    }
  }

  function setWorkforceEmpty() {
    wfRole.textContent = '-';
    wfRoleConf.textContent = '0%';
    wfMatch.textContent = '0%';
    wfMissing.textContent = '-';
    wfCompat.textContent = '0%';
    wfCompatParts.textContent = '-';
    wfNotesCount.textContent = '0';
    wfNotes.innerHTML = '<li class="empty">No notes</li>';
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

    // Autofill workforce tab inputs + behavioral signals
    const allSkills = [...state.technical, ...state.soft].filter(Boolean);
    if (wfEmployeeSkills) wfEmployeeSkills.value = allSkills.join(', ');
    if (wfIntent) wfIntent.textContent = intent.primary_intent || '-';
    if (wfLeadership) wfLeadership.textContent = toTwo(lead.score);
    if (wfComp) wfComp.textContent = toTwo(comp.score);

    if (data.candidate_profile) {
      renderCandidateProfile(data.candidate_profile);
    }
  }

  function resetView() {
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

    state.current = null;
    state.technical = [];
    state.soft = [];
    state.profile = null;
    state.workforce = null;
    setProfileEmpty();

    if (wfEmployeeSkills) wfEmployeeSkills.value = '';
    if (wfIntent) wfIntent.textContent = '-';
    if (wfLeadership) wfLeadership.textContent = '0.00';
    if (wfComp) wfComp.textContent = '0.00';
    setWorkforceEmpty();
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

  function errorText(data, fallback) {
    if (!data || data.detail == null) return fallback;
    return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
  }

  function cleanPdfText(value) {
    if (value == null || value === '') return '-';
    if (Array.isArray(value)) return value.length ? value.map(cleanPdfText).join(', ') : 'None';
    if (typeof value === 'object') return cleanPdfText(JSON.stringify(value));
    return String(value)
      .normalize('NFKD')
      .replace(/[^\x20-\x7E\r\n]/g, '')
      .replace(/\s+/g, ' ')
      .trim() || '-';
  }

  function escapePdfText(value) {
    return cleanPdfText(value)
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }

  const PDF_COLORS = {
    accent: [10, 122, 115],
    accentDark: [8, 89, 84],
    ink: [16, 42, 51],
    muted: [82, 105, 115],
    line: [203, 222, 225],
    soft: [237, 247, 246],
    surface: [255, 255, 255],
    light: [246, 250, 250],
    danger: [180, 35, 24],
    warning: [180, 100, 20],
    ok: [22, 101, 52],
    blue: [37, 99, 235],
    rose: [225, 29, 72],
  };

  function addWrappedLine(lines, text, size = 10, spaceBefore = 0, options = {}) {
    const availableWidth = 507;
    const maxChars = Math.max(24, Math.floor(availableWidth / (size * 0.52)));
    const words = cleanPdfText(text).split(/\s+/);
    let current = '';
    let pendingSpace = spaceBefore;

    words.forEach((word) => {
      const chunks = [];
      for (let i = 0; i < word.length; i += maxChars) {
        chunks.push(word.slice(i, i + maxChars));
      }
      chunks.forEach((chunk) => {
        const next = current ? `${current} ${chunk}` : chunk;
        if (next.length > maxChars && current) {
          lines.push({ text: current, size, spaceBefore: pendingSpace, ...options });
          pendingSpace = 0;
          current = chunk;
        } else {
          current = next;
        }
      });
    });

    if (current) {
      lines.push({ text: current, size, spaceBefore: pendingSpace, ...options });
    }
  }

  function addSection(lines, title) {
    addWrappedLine(lines, title, 13, 12, { font: 'F2', color: PDF_COLORS.accentDark });
    addDivider(lines);
  }

  function addKeyValue(lines, label, value) {
    addWrappedLine(lines, `${label}: ${cleanPdfText(value)}`);
  }

  function addList(lines, label, items) {
    addWrappedLine(lines, `${label}:`);
    const list = Array.isArray(items) ? items.filter(Boolean) : (items ? [items] : []);
    if (!list.length) {
      addWrappedLine(lines, '  - None');
      return;
    }
    list.forEach((item) => addWrappedLine(lines, `  - ${cleanPdfText(item)}`));
  }

  function addDivider(lines) {
    lines.push({ type: 'divider', height: 8, spaceBefore: 2 });
  }

  function addReportHeader(lines, title, subtitle) {
    lines.push({
      type: 'reportHeader',
      title,
      subtitle: subtitle || `Generated ${new Date().toLocaleString()}`,
      height: 76,
      spaceBefore: 0,
    });
  }

  function addScoreCards(lines, cards) {
    const visible = (cards || []).filter(Boolean);
    if (!visible.length) return;
    const rows = Math.ceil(visible.length / 4);
    lines.push({
      type: 'scoreCards',
      cards: visible,
      height: rows * 66 + Math.max(0, rows - 1) * 8,
      spaceBefore: 8,
    });
  }

  function addBarChart(lines, title, bars) {
    const visible = (bars || []).filter((bar) => bar && bar.label);
    if (!visible.length) return;
    addWrappedLine(lines, title, 11, 10, { font: 'F2', color: PDF_COLORS.ink });
    lines.push({
      type: 'barChart',
      bars: visible,
      height: 34 + visible.length * 24,
      spaceBefore: 4,
    });
  }

  function addTrendChart(lines, title, points) {
    const visible = (points || []).filter(Boolean);
    if (!visible.length) return;
    addWrappedLine(lines, title, 11, 10, { font: 'F2', color: PDF_COLORS.ink });
    lines.push({
      type: 'trendChart',
      points: visible.slice(-12),
      height: 198,
      spaceBefore: 4,
    });
  }

  function scoreColor(value) {
    const n = Number(value) || 0;
    if (n >= 70) return PDF_COLORS.ok;
    if (n >= 50) return PDF_COLORS.warning;
    return PDF_COLORS.danger;
  }

  function buildPdfBlob(lines) {
    const encoder = new TextEncoder();
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 44;
    const bottom = 44;
    const lineHeight = 14;
    const pages = [[]];
    let y = pageHeight - margin;
    const contentWidth = pageWidth - margin * 2;

    function rgb(color) {
      const c = color || PDF_COLORS.ink;
      return `${(c[0] / 255).toFixed(3)} ${(c[1] / 255).toFixed(3)} ${(c[2] / 255).toFixed(3)}`;
    }

    function textCommand(text, x, textY, size = 10, font = 'F1', color = PDF_COLORS.ink) {
      return `${rgb(color)} rg BT /${font} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${textY.toFixed(2)} Tm (${escapePdfText(text)}) Tj ET`;
    }

    function rectCommand(x, rectY, width, height, fill, stroke) {
      const parts = [];
      if (fill) parts.push(`${rgb(fill)} rg ${x.toFixed(2)} ${rectY.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f`);
      if (stroke) parts.push(`${rgb(stroke)} RG ${x.toFixed(2)} ${rectY.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re S`);
      return parts.join('\n');
    }

    function lineCommand(x1, y1, x2, y2, color = PDF_COLORS.line, width = 1) {
      return `${rgb(color)} RG ${width.toFixed(2)} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`;
    }

    function renderReportHeader(item, topY) {
      const lowerY = topY - item.height;
      return [
        rectCommand(margin, lowerY, contentWidth, item.height, PDF_COLORS.accent, PDF_COLORS.accentDark),
        textCommand(item.title, margin + 18, topY - 30, 18, 'F2', PDF_COLORS.surface),
        textCommand(item.subtitle, margin + 18, topY - 52, 10, 'F1', PDF_COLORS.surface),
      ].join('\n');
    }

    function renderScoreCards(item, topY) {
      const cards = item.cards || [];
      const cols = Math.min(4, Math.max(1, cards.length));
      const gap = 8;
      const cardH = 66;
      const cardW = (contentWidth - gap * (cols - 1)) / cols;
      return cards.map((card, idx) => {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const x = margin + col * (cardW + gap);
        const cardTop = topY - row * (cardH + gap);
        const cardY = cardTop - cardH;
        const color = card.color || PDF_COLORS.accent;
        return [
          rectCommand(x, cardY, cardW, cardH, PDF_COLORS.light, PDF_COLORS.line),
          rectCommand(x, cardTop - 5, cardW, 5, color, null),
          textCommand(card.label, x + 10, cardTop - 22, 8, 'F2', PDF_COLORS.muted),
          textCommand(card.value, x + 10, cardTop - 45, 16, 'F2', color),
        ].join('\n');
      }).join('\n');
    }

    function renderBarChart(item, topY) {
      const bars = item.bars || [];
      const chartY = topY - item.height;
      const labelX = margin + 12;
      const barX = margin + 170;
      const barW = contentWidth - 245;
      const valueX = margin + contentWidth - 52;
      const rowH = 24;
      const parts = [
        rectCommand(margin, chartY, contentWidth, item.height, PDF_COLORS.surface, PDF_COLORS.line),
      ];

      bars.forEach((bar, idx) => {
        const yRow = topY - 24 - idx * rowH;
        const max = Number(bar.max) || 100;
        const value = Math.max(0, Math.min(max, Number(bar.value) || 0));
        const pct = max ? value / max : 0;
        const color = bar.color || PDF_COLORS.accent;
        parts.push(textCommand(bar.label, labelX, yRow, 8, 'F1', PDF_COLORS.ink));
        parts.push(rectCommand(barX, yRow - 3, barW, 8, PDF_COLORS.soft, PDF_COLORS.line));
        parts.push(rectCommand(barX, yRow - 3, barW * pct, 8, color, null));
        parts.push(textCommand(bar.display || `${Math.round(value)}%`, valueX, yRow, 8, 'F2', color));
      });

      return parts.join('\n');
    }

    function renderTrendChart(item, topY) {
      const points = item.points || [];
      const chartY = topY - item.height;
      const plotX = margin + 42;
      const plotY = chartY + 44;
      const plotW = contentWidth - 78;
      const plotH = item.height - 78;
      const count = Math.max(1, points.length);
      const groupW = plotW / count;
      const barW = Math.min(18, groupW / 3);
      const parts = [
        rectCommand(margin, chartY, contentWidth, item.height, PDF_COLORS.surface, PDF_COLORS.line),
        textCommand('100', margin + 14, plotY + plotH - 4, 7, 'F1', PDF_COLORS.muted),
        textCommand('50', margin + 19, plotY + plotH / 2 - 4, 7, 'F1', PDF_COLORS.muted),
        textCommand('0', margin + 24, plotY - 4, 7, 'F1', PDF_COLORS.muted),
        lineCommand(plotX, plotY, plotX + plotW, plotY, PDF_COLORS.line, 0.7),
        lineCommand(plotX, plotY + plotH / 2, plotX + plotW, plotY + plotH / 2, PDF_COLORS.line, 0.4),
        lineCommand(plotX, plotY + plotH, plotX + plotW, plotY + plotH, PDF_COLORS.line, 0.4),
        textCommand('Workload', margin + 364, topY - 20, 8, 'F2', PDF_COLORS.blue),
        textCommand('Risk', margin + 432, topY - 20, 8, 'F2', PDF_COLORS.rose),
      ];

      points.forEach((point, idx) => {
        const x = plotX + idx * groupW + groupW / 2 - barW;
        const workload = Math.max(0, Math.min(100, Number(point.workload_score) || 0));
        const riskMap = { NORMAL: 30, HIGH: 70, CRITICAL: 100 };
        const risk = riskMap[point.risk_level] || 30;
        const workloadH = (workload / 100) * plotH;
        const riskH = (risk / 100) * plotH;
        parts.push(rectCommand(x, plotY, barW, workloadH, PDF_COLORS.blue, null));
        parts.push(rectCommand(x + barW + 3, plotY, barW, riskH, PDF_COLORS.rose, null));
        parts.push(textCommand(String(idx + 1), x + 1, chartY + 20, 7, 'F1', PDF_COLORS.muted));
      });

      return parts.join('\n');
    }

    function renderLineItem(item, topY) {
      return textCommand(item.text, margin, topY, item.size || 10, item.font || 'F1', item.color || PDF_COLORS.ink);
    }

    lines.forEach((line) => {
      const size = line.size || 10;
      const spaceBefore = line.spaceBefore || 0;
      const height = line.height || lineHeight;
      if (line.type === 'pageBreak') {
        pages.push([]);
        y = pageHeight - margin;
        return;
      }
      if (y - spaceBefore - height < bottom) {
        pages.push([]);
        y = pageHeight - margin;
      }
      y -= spaceBefore;
      if (line.type === 'reportHeader') {
        pages[pages.length - 1].push(renderReportHeader(line, y));
      } else if (line.type === 'divider') {
        pages[pages.length - 1].push(lineCommand(margin, y - 2, pageWidth - margin, y - 2, PDF_COLORS.line, 0.8));
      } else if (line.type === 'scoreCards') {
        pages[pages.length - 1].push(renderScoreCards(line, y));
      } else if (line.type === 'barChart') {
        pages[pages.length - 1].push(renderBarChart(line, y));
      } else if (line.type === 'trendChart') {
        pages[pages.length - 1].push(renderTrendChart(line, y));
      } else {
        pages[pages.length - 1].push(renderLineItem(line, y));
      }
      y -= height;
    });

    const objects = [];
    const kids = pages.map((_, idx) => `${4 + idx * 2} 0 R`).join(' ');
    objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objects[2] = `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`;
    objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
    const fontBoldObj = 4 + pages.length * 2;
    objects[fontBoldObj] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';

    pages.forEach((page, idx) => {
      const pageObj = 4 + idx * 2;
      const streamObj = pageObj + 1;
      const footer = [
        lineCommand(margin, 32, pageWidth - margin, 32, PDF_COLORS.line, 0.5),
        textCommand(`Page ${idx + 1} of ${pages.length}`, pageWidth - margin - 66, 20, 8, 'F1', PDF_COLORS.muted),
      ].join('\n');
      const stream = [...page, footer].join('\n');
      objects[pageObj] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 ${fontBoldObj} 0 R >> >> /Contents ${streamObj} 0 R >>`;
      objects[streamObj] = `<< /Length ${encoder.encode(stream).length} >>\nstream\n${stream}\nendstream`;
    });

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    for (let i = 1; i < objects.length; i += 1) {
      offsets[i] = encoder.encode(pdf).length;
      pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
    }
    const xrefOffset = encoder.encode(pdf).length;
    pdf += `xref\n0 ${objects.length}\n`;
    pdf += '0000000000 65535 f \n';
    for (let i = 1; i < objects.length; i += 1) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return new Blob([pdf], { type: 'application/pdf' });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function downloadReportPdf(filename, title, buildContent) {
    const lines = [];
    addReportHeader(lines, title);
    buildContent(lines);
    downloadBlob(buildPdfBlob(lines), filename);
  }

  function appendResumeReport(lines, data, title = 'Resume Analysis', profile = null) {
    if (!data) return false;
    const skills = data.skills || {};
    const intent = data.intent_profile || {};
    const lead = data.leadership_analysis || {};
    const comp = data.compensation_emphasis_index || {};

    addSection(lines, title);
    if (profile) {
      addKeyValue(lines, 'Candidate name', profile.candidate_name);
      addKeyValue(lines, 'Email', profile.email);
      addKeyValue(lines, 'Phone', profile.phone);
      addKeyValue(lines, 'Location', profile.location);
      addKeyValue(lines, 'Experience', profile.experience);
      addList(lines, 'Education', profile.education);
      addList(lines, 'Links', profile.links);
      addList(lines, 'Certifications / other', profile.certifications);
    }
    addKeyValue(lines, 'Primary intent', intent.primary_intent);
    addKeyValue(lines, 'Secondary intent', intent.secondary_intent);
    addKeyValue(lines, 'Skills confidence', skills.confidence == null ? '-' : fmtPct01(skills.confidence));
    addKeyValue(lines, 'Leadership score', toTwo(lead.score));
    addKeyValue(lines, 'Leadership confidence', lead.confidence == null ? '-' : fmtPct01(lead.confidence));
    addKeyValue(lines, 'Compensation index', toTwo(comp.score));
    addKeyValue(lines, 'Compensation confidence', comp.confidence == null ? '-' : fmtPct01(comp.confidence));
    addList(lines, 'Technical skills', skills.technical);
    addList(lines, 'Soft skills', skills.soft);
    addList(lines, 'Leadership evidence', lead.evidence);
    addList(lines, 'Compensation evidence', comp.evidence);
    addList(lines, 'Stress indicators', lead.stress_indicators);
    return true;
  }

  function appendWorkforceReport(lines, data, title = 'Workforce Intelligence') {
    if (!data) return false;
    const job = data.job_role || {};
    const project = data.project_skill_match || {};
    const team = data.team_compatibility || {};

    addSection(lines, title);
    addKeyValue(lines, 'Employee', data.employee_name || state.fileName || '-');
    addKeyValue(lines, 'Project', data.project_name || '-');
    addKeyValue(lines, 'Predicted job role', job.role);
    addKeyValue(lines, 'Job role confidence', job.confidence == null ? '-' : fmtPct01(job.confidence));
    addKeyValue(lines, 'Project skill match', project.match_score == null ? '-' : fmtPct01(project.match_score));
    addList(lines, 'Missing skills', project.missing_skills);
    addKeyValue(lines, 'Team compatibility', team.overall_score == null ? '-' : fmtPct01(team.overall_score));
    addKeyValue(lines, 'Skill overlap', team.skill_overlap_score == null ? '-' : fmtPct01(team.skill_overlap_score));
    addKeyValue(lines, 'Behavioral alignment', team.behavioral_alignment_score == null ? '-' : fmtPct01(team.behavioral_alignment_score));
    addList(lines, 'Compatibility notes', team.notes);
    return true;
  }

  function appendBehavioralReport(lines, data, title = 'Behavioral Analysis') {
    if (!data) return false;
    const traits = data.personality_traits || {};
    const communication = data.communication || {};
    const team = data.team_compatibility || {};
    const profile = data.personality_profile || {};
    const recommendation = data.recommendation_data || {};
    const fitScore = data.behavioral_fit_score || data.final_score || 0;
    const roleFitScore = data.role_fit_score || 0;
    const teamCompatScore = team.compatibility_score || 0;
    const communicationScore = communication.score || 0;

    addSection(lines, title);
    addScoreCards(lines, [
      { label: 'Behavioral Fit', value: `${fitScore}/100`, color: scoreColor(fitScore) },
      { label: 'Role Fit', value: `${roleFitScore}/100`, color: scoreColor(roleFitScore) },
      { label: 'Team Compatibility', value: `${teamCompatScore}/100`, color: scoreColor(teamCompatScore) },
      { label: 'Communication', value: `${communicationScore}/100`, color: scoreColor(communicationScore) },
    ]);
    addBarChart(lines, 'OCEAN Trait Graph', [
      { label: 'Openness', value: traits.openness || 0, color: PDF_COLORS.accent },
      { label: 'Conscientiousness', value: traits.conscientiousness || 0, color: PDF_COLORS.blue },
      { label: 'Extraversion', value: traits.extraversion || 0, color: PDF_COLORS.warning },
      { label: 'Agreeableness', value: traits.agreeableness || 0, color: PDF_COLORS.ok },
      { label: 'Neuroticism', value: traits.neuroticism || 0, color: PDF_COLORS.rose },
    ]);

    const roleCompatibility = Object.entries(data.role_compatibility || {})
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 8)
      .map(([label, value]) => ({ label, value: Number(value) || 0, color: scoreColor(value) }));
    addBarChart(lines, 'Role Compatibility Graph', roleCompatibility);

    addKeyValue(lines, 'Candidate', data.candidate_name);
    addKeyValue(lines, 'Target job role', data.job_role);
    addKeyValue(lines, 'Personality type', data.personality_type);
    addKeyValue(lines, 'Personality description', profile.description);
    addKeyValue(lines, 'Behavioral fit score', `${fitScore}/100`);
    addKeyValue(lines, 'Role fit score', `${roleFitScore}/100`);
    addKeyValue(lines, 'Team fit', data.team_fit);
    addKeyValue(lines, 'Team compatibility', `${teamCompatScore}/100`);
    addKeyValue(lines, 'Team balance', team.team_balance);
    addKeyValue(lines, 'Communication sentiment', communication.sentiment);
    addKeyValue(lines, 'Communication score', `${communicationScore}/100`);
    addKeyValue(lines, 'Best role recommendation', recommendation.best_role);
    addKeyValue(lines, 'Recommendation confidence', recommendation.confidence == null ? '-' : `${recommendation.confidence}%`);
    addKeyValue(lines, 'Recommendation reasoning', recommendation.reasoning);
    addKeyValue(lines, 'Openness', `${traits.openness || 0}%`);
    addKeyValue(lines, 'Conscientiousness', `${traits.conscientiousness || 0}%`);
    addKeyValue(lines, 'Extraversion', `${traits.extraversion || 0}%`);
    addKeyValue(lines, 'Agreeableness', `${traits.agreeableness || 0}%`);
    addKeyValue(lines, 'Neuroticism', `${traits.neuroticism || 0}%`);
    addList(lines, 'Role recommendations', data.role_recommendations);
    addList(lines, 'Risk flags', data.risk_flags);
    addList(lines, 'Team synergies', team.synergies);
    addList(lines, 'Potential conflicts', team.potential_conflicts);
    addList(lines, 'Team recommendations', team.recommendations);
    addList(lines, 'Strengths', profile.dynamic_strengths || profile.strengths);
    addList(lines, 'Development areas', profile.challenges || profile.development_areas);
    addList(lines, 'Best roles', profile.best_roles);
    addList(lines, 'All role compatibility scores', Object.entries(data.role_compatibility || {}).map(([role, score]) => `${role}: ${score}%`));
    addWrappedLine(lines, `Summary: ${data.summary || cleanPdfText(document.getElementById('bSummary')?.textContent)}`, 10, 4);
    return true;
  }

  function appendStressReport(lines, data, title = 'Stress / Workload Analysis') {
    if (!data) return false;
    const input = data.input || data.employee_data || {};
    const workloadScore = Number(data.workload_score) || 0;
    const meetingLoadScore = Number(data.meeting_load_score) || 0;
    const taskCompletionScore = Number(data.task_completion_score) || 0;
    const stressIndicatorPct = data.stress_indicator == null ? 0 : Math.round(Number(data.stress_indicator) * 100);
    const riskMap = { NORMAL: 30, HIGH: 70, CRITICAL: 100 };
    const riskScore = riskMap[data.risk_level] || 30;

    addSection(lines, title);
    addScoreCards(lines, [
      { label: 'Stress Level', value: data.stress_level || '-', color: data.stress_level === 'High' ? PDF_COLORS.danger : data.stress_level === 'Medium' ? PDF_COLORS.warning : PDF_COLORS.ok },
      { label: 'Risk Level', value: data.risk_level || '-', color: scoreColor(riskScore) },
      { label: 'Workload', value: `${workloadScore.toFixed(1)}/100`, color: scoreColor(workloadScore) },
      { label: 'Task Completion', value: `${taskCompletionScore.toFixed(1)}%`, color: scoreColor(taskCompletionScore) },
    ]);
    addBarChart(lines, 'Stress / Workload Graph', [
      { label: 'Workload score', value: workloadScore, display: `${workloadScore.toFixed(1)}/100`, color: scoreColor(workloadScore) },
      { label: 'Meeting load score', value: meetingLoadScore, display: `${meetingLoadScore.toFixed(1)}/100`, color: scoreColor(meetingLoadScore) },
      { label: 'Task completion', value: taskCompletionScore, display: `${taskCompletionScore.toFixed(1)}%`, color: scoreColor(taskCompletionScore) },
      { label: 'Stress indicator', value: stressIndicatorPct, display: `${stressIndicatorPct}%`, color: scoreColor(stressIndicatorPct) },
      { label: 'Risk level', value: riskScore, display: `${data.risk_level || '-'}`, color: scoreColor(riskScore) },
    ]);
    addKeyValue(lines, 'Stress level', data.stress_level);
    addKeyValue(lines, 'Risk level', data.risk_level);
    addKeyValue(lines, 'Status', data.status);
    addKeyValue(lines, 'Confidence', data.confidence == null ? '-' : `${Math.round(Number(data.confidence) * 100)}%`);
    addKeyValue(lines, 'Stress indicator', data.stress_indicator == null ? '-' : data.stress_indicator);
    addKeyValue(lines, 'Workload score', data.workload_score == null ? '-' : `${workloadScore.toFixed(1)}/100`);
    addKeyValue(lines, 'Meeting load score', data.meeting_load_score == null ? '-' : `${meetingLoadScore.toFixed(1)}/100`);
    addKeyValue(lines, 'Task completion', data.task_completion_score == null ? '-' : `${taskCompletionScore.toFixed(1)}%`);
    addKeyValue(lines, 'Tasks assigned', input.tasks_assigned);
    addKeyValue(lines, 'Tasks completed', input.tasks_completed);
    addKeyValue(lines, 'Overdue tasks', input.overdue_tasks);
    addKeyValue(lines, 'Working hours per day', input.working_hours_per_day);
    addKeyValue(lines, 'Meetings per day', input.meetings_per_day);
    addKeyValue(lines, 'Meeting hours', input.meeting_hours);
    addKeyValue(lines, 'Weekend work', input.weekend_work === 1 ? 'Yes' : input.weekend_work === 0 ? 'No' : '-');
    addList(lines, 'Insights', data.insights);
    addList(lines, 'Recommendations', data.recommendations);
    addKeyValue(lines, 'Future risk', data.future_risk);
    return true;
  }

  function appendHistorySummary(lines) {
    if (state.history.length) {
      addSection(lines, 'Recent Resume Analyses');
      state.history.forEach((entry, idx) => {
        appendResumeReport(lines, entry.payload, `Saved Resume Analysis ${idx + 1} - ${entry.file} (${entry.at})`);
      });
    }

    if (candidateHistory.length) {
      addSection(lines, 'Candidate Behavioral History');
      candidateHistory.slice(0, 15).forEach((entry, idx) => {
        addKeyValue(lines, `Candidate ${idx + 1}`, `${entry.candidate_name} | ${entry.job_role} | Behavioral fit: ${entry.behavioral_fit_score}/100 | ${entry.timestamp}`);
      });
    }
  }

  function buildAllReports(lines) {
    let added = false;
    added = appendResumeReport(lines, state.current, 'Current Resume Analysis', state.profile) || added;
    added = appendWorkforceReport(lines, state.workforce, 'Current Workforce Intelligence') || added;
    added = appendBehavioralReport(lines, currentAnalysis, 'Current Behavioral Analysis') || added;

    if (stressAnalysisHistory.length) {
      addTrendChart(lines, 'Stress Trend Graph', stressAnalysisHistory);
      stressAnalysisHistory.forEach((entry, idx) => {
        appendStressReport(lines, entry, `Stress / Workload Analysis ${idx + 1}`);
      });
      added = true;
    }

    if (state.history.length || candidateHistory.length) {
      appendHistorySummary(lines);
      added = true;
    }

    return added;
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
    extractProfileFromFile(fileInput.files[0], true);
  });

  fileInput.addEventListener('change', () => {
    updateFileMeta();
    const file = fileInput.files && fileInput.files[0];
    extractProfileFromFile(file, true);
  });

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

    renderResult(item.payload);
    setProfileEmpty('Upload resume to detect profile');
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

      if (!res.ok) {
        stopProgress(false);
        setStatus(errorText(data, 'Analysis failed. Please try again.'), true);
        showToast('Analysis failed', 'error');
      } else {
        stopProgress(true);
        renderResult(data);
        addHistory(data);

        if (!data.candidate_profile) {
          await extractProfileFromFile(file, true);
        }

        switchTab('overview');
        setStatus('Analysis completed successfully.', false);
        showToast('Analysis complete', 'ok');
      }
    } catch (err) {
      stopProgress(false);
      const detail = err && err.message ? err.message : 'Unknown error';
      setStatus(`Analysis request failed: ${detail}`, true);
      showToast('Analysis failed', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Analyze Resume';
    }
  });

  if (runWorkforceBtn) {
    runWorkforceBtn.addEventListener('click', async () => {
      const employeeSkills = parseCsvList(wfEmployeeSkills ? wfEmployeeSkills.value : '');
      const projectSkillsRequired = parseCsvList(wfProjectSkills ? wfProjectSkills.value : '');
      const teamSkills = parseCsvList(wfTeamSkills ? wfTeamSkills.value : '');
      const teamValues = parseCsvList(wfTeamValues ? wfTeamValues.value : '');

      if (!employeeSkills.length) {
        showToast('Analyze a resume (or enter skills) first', 'error');
        switchTab('workforce');
        return;
      }
      if (!projectSkillsRequired.length) {
        showToast('Enter project skills required', 'error');
        switchTab('workforce');
        return;
      }
      if (!teamSkills.length) {
        showToast('Enter team skills', 'error');
        switchTab('workforce');
        return;
      }

      runWorkforceBtn.disabled = true;
      runWorkforceBtn.textContent = 'Running...';
      setStatus('Running workforce intelligence (3-agent pipeline)...', false);
      setWorkforceEmpty();
      switchTab('workforce');

      try {
        // Pull behavioral signals from current resume analysis if present.
        const primaryIntent = state.current && state.current.intent_profile ? state.current.intent_profile.primary_intent : null;
        const leadershipScore = state.current && state.current.leadership_analysis ? state.current.leadership_analysis.score : null;
        const compensationEmphasis = state.current && state.current.compensation_emphasis_index ? state.current.compensation_emphasis_index.score : null;

        const payload = {
          employee_name: state.fileName ? state.fileName.replace(/\.(pdf|docx)$/i, '') : null,
          employee_skills: employeeSkills,
          project_name: wfProjectName ? (wfProjectName.value || null) : null,
          project_skills_required: projectSkillsRequired,
          team: {
            name: wfTeamName ? (wfTeamName.value || 'Team') : 'Team',
            skills: teamSkills,
            values: teamValues,
            leadership_needed: Boolean(wfLeadershipNeeded && wfLeadershipNeeded.checked),
          },
          primary_intent: primaryIntent,
          leadership_score: leadershipScore,
          compensation_emphasis: compensationEmphasis,
        };

        const res = await fetch('/api/v1/workforce/intelligence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const text = await res.text();
        const data = parseJson(text) || { detail: text };

        if (!res.ok) {
          setStatus(errorText(data, 'Workforce intelligence failed. Please try again.'), true);
          showToast('Workforce failed', 'error');
          return;
        }

        state.workforce = data;

        // Render results on Workforce tab
        wfRole.textContent = (data.job_role && data.job_role.role) ? data.job_role.role : '-';
        wfRoleConf.textContent = data.job_role ? fmtPct01(data.job_role.confidence) : '0%';

        wfMatch.textContent = data.project_skill_match ? fmtPct01(data.project_skill_match.match_score) : '0%';
        const missing = data.project_skill_match && Array.isArray(data.project_skill_match.missing_skills) ? data.project_skill_match.missing_skills : [];
        wfMissing.textContent = missing.length ? missing.join(', ') : 'None';

        wfCompat.textContent = data.team_compatibility ? fmtPct01(data.team_compatibility.overall_score) : '0%';
        if (data.team_compatibility) {
          wfCompatParts.textContent = `${fmtPct01(data.team_compatibility.skill_overlap_score)} / ${fmtPct01(data.team_compatibility.behavioral_alignment_score)}`;
          const notes = Array.isArray(data.team_compatibility.notes) ? data.team_compatibility.notes : [];
          wfNotesCount.textContent = String(notes.length);
          renderNotes(wfNotes, notes);
        } else {
          wfCompatParts.textContent = '-';
          wfNotesCount.textContent = '0';
          renderNotes(wfNotes, []);
        }

        setStatus('Workforce intelligence completed successfully.', false);
        showToast('Workforce complete', 'ok');
      } catch (_) {
        setStatus('Workforce intelligence request failed in browser.', true);
        showToast('Workforce failed', 'error');
      } finally {
        runWorkforceBtn.disabled = false;
        runWorkforceBtn.textContent = 'Run Workforce Intelligence';
      }
    });
  }

  const initialTheme = localStorage.getItem('resume_agent_theme') || 'light';
  applyTheme(initialTheme);
  updateFileMeta();
  loadHistory();

  const parsed = parseJson(initialResumeOutput ? initialResumeOutput.value : '');
  if (parsed && parsed.skills && parsed.intent_profile) {
    renderResult(parsed);
    if (!parsed.candidate_profile) {
      setProfileEmpty('Upload resume to refresh candidate profile');
    }
    updateStep(5, true);
    setStatus('Loaded result.', false);
  } else {
    resetView();
    if (parsed && parsed.detail) {
      setStatus(errorText(parsed, 'Analysis failed. Please try again.'), true);
    }
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
  const behavioralMetrics = document.getElementById('behavioralMetrics');
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
    "N1": { trait: "neuroticism", question: "When something goes wrong at work, I tend to worry extensively", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
    "N2": { trait: "neuroticism", question: "I take criticism personally and feel hurt by negative feedback", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] },
    "N3": { trait: "neuroticism", question: "I often feel anxious, worried, or overwhelmed in my daily work", options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] }
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
          <div class="col-12"><label>Neuroticism: <input type="number" value="${member.neuroticism || 50}" min="0" max="100" class="form-control form-control-sm trait-input" data-member="${idx}" data-trait="neuroticism"></label></div>
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
      neuroticism: 50
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
          <strong class="small text-secondary">Strengths</strong>
          <ul class="list-unstyled small mb-0">
            ${analysis.pros.map(p => `<li>• ${p}</li>`).join('')}
          </ul>
        </div>
        
        <div>
          <strong class="small text-secondary">Challenges</strong>
          <ul class="list-unstyled small mb-0">
            ${analysis.cons.map(c => `<li>• ${c}</li>`).join('')}
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
      'Low': { className: 'stress-pill stress-pill-low' },
      'Medium': { className: 'stress-pill stress-pill-medium' },
      'High': { className: 'stress-pill stress-pill-high' }
    };
    
    const riskColorMap = {
      'NORMAL': '#28a745',
      'HIGH': '#ffc107',
      'CRITICAL': '#dc3545'
    };
    
    const stressStyle = stressColorMap[data.stress_level] || stressColorMap['Low'];
    const riskColor = riskColorMap[data.risk_level] || '#000';
    
    document.getElementById('stressLevelDisplay').innerHTML =
      `<span class="${stressStyle.className}">${data.stress_level}</span>`;
    
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
    stressStatus.textContent = 'Analyzing…';
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
        displayStressResults({ ...data, input: payload });
        stressStatus.textContent = 'Analysis complete.';
        
        // Show alert if high risk
        if (data.risk_level === 'CRITICAL') {
          setTimeout(() => {
            alert(`High risk detected\n\nStress level: ${data.stress_level}\nRisk: ${data.risk_level}\n\nImmediate follow-up may be required.`);
          }, 300);
        }
      } else {
        stressStatus.textContent = data.message || 'Analysis failed';
        stressStatus.className = 'status error';
      }
    } catch (error) {
      stressStatus.textContent = `Error: ${error.message}`;
      stressStatus.className = 'status error';
    }
  });
  
  clearStressBtn.addEventListener('click', () => {
    stressForm.reset();
    stressResults.style.display = 'none';
    stressStatus.style.display = 'none';
  });

  if (downloadResumePdfBtn) {
    downloadResumePdfBtn.addEventListener('click', () => {
      const resumeData = state.current || (state.history[0] && state.history[0].payload);
      if (!resumeData) {
        showToast('Analyze or load a resume first', 'error');
        return;
      }
      downloadReportPdf('resume-analysis-report.pdf', 'Resume Analysis Report', (lines) => {
        appendResumeReport(lines, resumeData, 'Resume Analysis', state.profile);
        if (state.workforce) appendWorkforceReport(lines, state.workforce);
      });
      showToast('PDF report downloaded', 'ok');
    });
  }

  if (downloadBehavioralPdfBtn) {
    downloadBehavioralPdfBtn.addEventListener('click', () => {
      if (!currentAnalysis) {
        showToast('Run behavioral analysis first', 'error');
        return;
      }
      downloadReportPdf('behavioral-analysis-report.pdf', 'Behavioral Analysis Report', (lines) => {
        appendBehavioralReport(lines, currentAnalysis);
      });
      showToast('PDF report downloaded', 'ok');
    });
  }

  if (downloadStressPdfBtn) {
    downloadStressPdfBtn.addEventListener('click', () => {
      if (!stressAnalysisHistory.length) {
        showToast('Run stress analysis first', 'error');
        return;
      }
      downloadReportPdf('stress-workload-report.pdf', 'Stress / Workload Report', (lines) => {
        addTrendChart(lines, 'Stress Trend Graph', stressAnalysisHistory);
        stressAnalysisHistory.forEach((entry, idx) => {
          appendStressReport(lines, entry, `Stress / Workload Analysis ${idx + 1}`);
        });
      });
      showToast('PDF report downloaded', 'ok');
    });
  }

  if (downloadAllPdfBtn) {
    downloadAllPdfBtn.addEventListener('click', () => {
      const lines = [];
      addReportHeader(lines, 'All Analysis Reports');
      if (!buildAllReports(lines)) {
        showToast('Run an analysis first', 'error');
        return;
      }
      downloadBlob(buildPdfBlob(lines), 'all-analysis-reports.pdf');
      showToast('All reports PDF downloaded', 'ok');
    });
  }

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
    showToast('Form cleared', 'ok');
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
      neuroticism: m.neuroticism || 50
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

      if (!response.ok) {
        behavioralStatus.textContent = errorText(result, 'Analysis failed. Please try again.');
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
      analyzeBehavioralBtn.textContent = 'Analyze and generate report';
    }
  });

  function renderBehavioralResult(response) {
    // Render Personality Tab
    const ocean = response.personality_traits || {};
    document.getElementById("bOpenness").textContent = (ocean.openness || 0) + "%";
    document.getElementById("bConscientiousness").textContent = (ocean.conscientiousness || 0) + "%";
    document.getElementById("bExtraversion").textContent = (ocean.extraversion || 0) + "%";
    document.getElementById("bAgreeableness").textContent = (ocean.agreeableness || 0) + "%";
    document.getElementById("bNeuroticism").textContent = (ocean.neuroticism || 0) + "%";

    // Render Role Fit Tab
    const roleFitScore = response.role_fit_score || 0;
    const recommendations = response.role_recommendations || [];
    document.getElementById("bRoleScore").innerHTML = `<span class="badge rounded-pill text-bg-light border fs-5 fw-semibold">${roleFitScore}</span>`;
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
        ? synergies.map(s => `<div class="mb-1">• ${s}</div>`).join('')
        : '<span class="text-muted">No synergies detected</span>';
      document.getElementById("bConflicts").innerHTML = conflicts.length > 0 
        ? conflicts.map(c => `<div class="mb-1">• ${c}</div>`).join('')
        : '<span class="text-muted">No conflicts detected</span>';
      document.getElementById("bTeamRec").innerHTML = teamRecs.length > 0 
        ? teamRecs.map(r => `<div class="mb-1">• ${r}</div>`).join('')
        : '<span class="text-muted">Team is well-balanced</span>';
    }

    // Render Summary Tab
    const fitScore = response.behavioral_fit_score || response.final_score || 0;
    document.getElementById("bFitScore").innerHTML = `<span class="badge rounded-pill text-bg-light border fs-5 fw-semibold">${fitScore}</span>`;
    
    const overallAssessment = teamSize > 0 
      ? (fitScore >= 70 && compatScore >= 70 ? 'Excellent fit'
        : fitScore >= 60 && compatScore >= 60 ? 'Good fit'
          : 'Fair match — review compatibility')
      : (fitScore >= 70 ? 'Strong profile' : fitScore >= 60 ? 'Suitable profile' : 'Needs development');
    document.getElementById("bTeamFit").textContent = overallAssessment;
    
    const riskFlags = [];
    if (fitScore < 50) riskFlags.push('Low behavioral fit score');
    if (teamSize > 0 && compatScore < 50) riskFlags.push('Low team compatibility');
    const teamConflicts = (teamCompat.potential_conflicts || []);
    if (teamConflicts.length > 2) riskFlags.push('Multiple team conflicts detected');
    
    document.getElementById("bRiskFlags").innerHTML = riskFlags.length > 0
      ? riskFlags.map(f => `<div class="mb-1">${f}</div>`).join('')
      : '<span class="text-muted">No major risks identified</span>';
    
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
        .map(s => `<div class="mb-2">• ${s}</div>`)
        .join('');
    }
    
    // Display role compatibility scores
    const roleCompatibility = response.role_compatibility || {};
    if (Object.keys(roleCompatibility).length > 0) {
      const roleHtml = Object.entries(roleCompatibility)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)  // Top 5 roles
        .map(([role, score]) => {
          return `<div class="mb-2 d-flex justify-content-between align-items-center">
            <span>${role}</span>
            <span class="badge rounded-pill text-bg-light border">${score}%</span>
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
      roleDiv.innerHTML = '<h6 class="mb-3 fw-semibold">Best role fits</h6>' + roleHtml;
    }
    
    // Display AI recommendations
    const recommendationData = response.recommendation_data || {};
    if (recommendationData.best_role) {
      const bestRole = recommendationData.best_role;
      const confidence = recommendationData.confidence || 0;
      const reasoning = recommendationData.reasoning || '';
      
      const recommendationDiv = document.createElement('div');
      recommendationDiv.className = 'callout-muted mt-3 p-3';
      recommendationDiv.innerHTML = `
        <div class="fw-semibold text-body mb-2">Recommendation</div>
        <div class="mb-2">
          <span class="badge rounded-pill text-bg-light border me-1">${bestRole}</span>
          <span class="badge rounded-pill text-bg-light border">${confidence}% match</span>
        </div>
        <p class="mb-0 small text-muted">${reasoning}</p>
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

