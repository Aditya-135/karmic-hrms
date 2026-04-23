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
  const downloadCurrentPdfBtn = document.getElementById('downloadCurrentPdfBtn');
  const downloadAllHistoryBtn = document.getElementById('downloadAllHistoryBtn');
  const toggleProfileBtn = document.getElementById('toggleProfileBtn');
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
    // Professional corporate palette
    navy:        [17, 34, 68],
    navyMid:     [28, 53, 96],
    navyLight:   [59, 93, 149],
    gold:        [106, 121, 153],
    goldLight:   [232, 237, 246],
    accent:      [38, 99, 184],
    accentDark:  [27, 78, 143],
    ok:          [26, 127, 90],
    // ── Semantic ─────────────────────────────────────────────────────────────
    danger:      [185,  28,  28],  // Risk / High
    warning:     [180,  83,   9],  // Caution
    blue:        [ 29,  78, 216],  // Skills / Info
    rose:        [190,  18,  60],  // Alert
    // ── Typography & Surfaces ────────────────────────────────────────────────
    ink:         [10,  18,  38],   // Near-black body text
    muted:       [90, 110, 135],   // Secondary text
    line:        [201, 212, 230],
    soft:        [240, 244, 250],
    light:       [247, 249, 253],
    surface:     [255, 255, 255],  // White
  };
  const PDF_BRAND = {
    platform: 'KARMIC HRMS ENTERPRISE TALENT INTELLIGENCE',
    coverTagline: 'GLOBAL MNC CANDIDATE ASSESSMENT REPORT',
    confidentiality: 'CONFIDENTIAL',
  };
  const REPORT_TITLE = 'Talent Intelligence Report';

  function addWrappedLine(lines, text, size = 10, spaceBefore = 0, options = {}) {
    const availableWidth = 507;
    const maxChars = Math.max(24, Math.floor(availableWidth / (size * 0.48)));
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
          lines.push({ text: current, size, spaceBefore: pendingSpace, height: size * 1.5, ...options });
          pendingSpace = 2;
          current = chunk;
        } else {
          current = next;
        }
      });
    });

    if (current) {
      lines.push({ text: current, size, spaceBefore: pendingSpace, height: size * 1.5, ...options });
    }
  }

  function addSection(lines, title) {
    lines.push({ type: 'sectionBanner', title, height: 28, spaceBefore: 18 });
  }

  function addKeyValue(lines, label, value) {
    addWrappedLine(lines, `${label}: ${cleanPdfText(value)}`, 10, 4);
  }

  function addList(lines, label, items) {
    if (label) {
      addWrappedLine(lines, label, 11, 8, { font: 'F2', color: PDF_COLORS.ink });
    }
    const list = Array.isArray(items) ? items.filter(Boolean) : (items ? [items] : []);
    if (!list.length) {
      addWrappedLine(lines, '  None available', 9, 2, { color: PDF_COLORS.muted });
      return;
    }
    let bullet = '-';
    if (label.toLowerCase().includes('strength') || label.toLowerCase().includes('synerg')) bullet = '[+]';
    if (label.toLowerCase().includes('risk') || label.toLowerCase().includes('conflict')) bullet = '[!]';
    if (label.toLowerCase().includes('recommend')) bullet = '[>]';

    list.forEach((item) => addWrappedLine(lines, `  ${bullet}   ${cleanPdfText(item)}`, 10, 4));
  }

  function addDivider(lines) {
    lines.push({ type: 'divider', height: 10, spaceBefore: 4 });
  }

  function addReportHeader(lines, title, subtitle) {
    lines.push({
      type: 'reportHeader',
      title,
      subtitle: subtitle || `Confidential Candidate Assessment | Generated: ${new Date().toLocaleString()}`,
      height: 100, // Taller premium header
      spaceBefore: 0,
    });
  }

  function addTable(lines, title, items) {
    const validItems = items.filter(i => i && i.label && i.value);
    if (!validItems.length) return;
    if (title) {
      addWrappedLine(lines, title, 11, 14, { font: 'F2', color: PDF_COLORS.navyMid });
    }
    lines.push({
      type: 'tableBox',
      items: validItems,
      height: validItems.length * 24 + 16,
      spaceBefore: 6,
    });
  }

  function addSkillTable(lines, title, skills) {
    const list = Array.isArray(skills) ? skills.filter(Boolean) : [];
    if (!list.length) return;
    const joined = list.map((skill) => cleanPdfText(skill)).join(' | ');
    addTable(lines, title, [
      { label: 'Skill Tags', value: joined }
    ]);
  }

  function scoreTo100(value, scale01 = false) {
    if (value == null || value === '') return null;
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return Math.max(0, Math.min(100, Math.round(scale01 ? n * 100 : n)));
  }

  function scoreBadge(value) {
    const n = scoreTo100(value, false) || 0;
    if (n >= 70) return 'Strong';
    if (n >= 50) return 'Medium';
    return 'Low';
  }

  function hiringRecommendation(leadership, skills, behavioral) {
    const l = scoreTo100(leadership, true) || 0;
    const s = scoreTo100(skills, true) || 0;
    const b = scoreTo100(behavioral, false) || 0;
    const composite = Math.round((l + s + b) / 3);
    if (composite >= 75) return 'Strong Hire';
    if (composite >= 60) return 'Interview Recommended';
    if (composite >= 45) return 'Consider Later';
    return 'Not Recommended';
  }

  function collectCandidateSnapshots() {
    const snapshots = [];
    if (state.current) {
      snapshots.push({
        name: (state.profile && state.profile.candidate_name) || 'Current Candidate',
        role: (state.workforce && state.workforce.job_role && state.workforce.job_role.role) || '-',
        leadership: scoreTo100(state.current?.leadership_analysis?.score, true) || 0,
        skills: scoreTo100(state.current?.skills?.confidence, true) || 0,
        behavioral: scoreTo100((typeof currentAnalysis !== 'undefined' && currentAnalysis?.behavioral_fit_score) || 0, false) || 0,
        file: state.fileName || 'current-file'
      });
    }
    state.history.forEach((entry, idx) => {
      if (!entry?.payload) return;
      const p = entry.payload;
      snapshots.push({
        name: p?.candidate_profile?.candidate_name || `Candidate ${idx + 1}`,
        role: p?.intent_profile?.primary_intent || '-',
        leadership: scoreTo100(p?.leadership_analysis?.score, true) || 0,
        skills: scoreTo100(p?.skills?.confidence, true) || 0,
        behavioral: 0,
        file: entry.file || `resume-${idx + 1}`
      });
    });
    return snapshots.slice(0, 20);
  }

  function addExecutiveSummaryPage(lines, reportTitle) {
    const candidates = collectCandidateSnapshots();
    const total = candidates.length || 1;
    const top = candidates.slice().sort((a, b) => (b.leadership + b.skills + b.behavioral) - (a.leadership + a.skills + a.behavioral))[0] || {};
    const avgSkills = Math.round(candidates.reduce((sum, c) => sum + (c.skills || 0), 0) / total);
    const avgLead = Math.round(candidates.reduce((sum, c) => sum + (c.leadership || 0), 0) / total);
    const avgBehavior = Math.round(candidates.reduce((sum, c) => sum + (c.behavioral || 0), 0) / total);
    const highestBehavior = Math.max(0, ...candidates.map((c) => c.behavioral || 0));
    const shortlist = candidates.filter((c) => hiringRecommendation(c.leadership / 100, c.skills / 100, c.behavioral) !== 'Not Recommended').length;

    addSection(lines, 'Executive Summary');
    addTable(lines, 'Assessment Overview', [
      { label: 'Report Title', value: reportTitle || REPORT_TITLE },
      { label: 'Generated Date/Time', value: new Date().toLocaleString() },
      { label: 'Total Candidates Analyzed', value: total },
      { label: 'Top Ranked Candidate', value: top.name || '-' },
      { label: 'Average Skill Confidence', value: `${avgSkills}%` },
      { label: 'Highest Behavioral Fit', value: `${highestBehavior}/100` },
      { label: 'Recommended Shortlist Count', value: shortlist }
    ]);
    addScoreCards(lines, [
      { label: 'Total Reports', value: `${total}`, color: PDF_COLORS.accent },
      { label: 'Avg Leadership Score', value: `${avgLead}/100`, color: scoreColor(avgLead) },
      { label: 'Avg Skills Confidence', value: `${avgSkills}%`, color: scoreColor(avgSkills) },
      { label: 'Avg Behavioral Fit', value: `${avgBehavior}/100`, color: scoreColor(avgBehavior) },
    ]);
  }

  function addComparisonDashboard(lines) {
    const candidates = collectCandidateSnapshots();
    if (!candidates.length) return;
    addSection(lines, 'Candidate Comparison Dashboard');
    candidates.slice(0, 10).forEach((c, idx) => {
      const recommendation = hiringRecommendation(c.leadership / 100, c.skills / 100, c.behavioral);
      addTable(lines, `Candidate ${idx + 1}`, [
        { label: 'Candidate Name', value: c.name },
        { label: 'Role', value: c.role },
        { label: 'Leadership', value: `${c.leadership}/100 (${scoreBadge(c.leadership)})` },
        { label: 'Skills', value: `${c.skills}% (${scoreBadge(c.skills)})` },
        { label: 'Behavioral Fit', value: `${c.behavioral}/100 (${scoreBadge(c.behavioral)})` },
        { label: 'Recommendation', value: recommendation },
      ]);
    });
    addBarChart(lines, 'Candidate Score Comparison', candidates.slice(0, 10).map((c) => ({
      label: cleanPdfText(c.name).slice(0, 18),
      value: Math.round((c.leadership + c.skills + c.behavioral) / 3),
      display: `${Math.round((c.leadership + c.skills + c.behavioral) / 3)}/100`,
      color: scoreColor(Math.round((c.leadership + c.skills + c.behavioral) / 3))
    })));
  }

  function addBehavioralHistoryPage(lines) {
    if (!candidateHistory.length) return;
    addSection(lines, 'Behavioral History');
    candidateHistory.slice(0, 15).forEach((entry, idx) => {
      addTable(lines, `History Row ${idx + 1}`, [
        { label: 'Candidate Name', value: entry.candidate_name || '-' },
        { label: 'Role', value: entry.job_role || '-' },
        { label: 'Behavioral Fit Score', value: `${entry.behavioral_fit_score || 0}/100` },
        { label: 'Date', value: entry.timestamp || '-' },
      ]);
    });
    addTrendChart(lines, 'Behavioral Fit Trend', candidateHistory.slice(0, 12).map((entry) => ({
      workload_score: Number(entry.behavioral_fit_score) || 0,
      risk_level: (Number(entry.behavioral_fit_score) || 0) >= 70 ? 'NORMAL' : (Number(entry.behavioral_fit_score) || 0) >= 50 ? 'HIGH' : 'CRITICAL'
    })));
  }

  function addScoreCards(lines, cards) {
    const visible = (cards || []).filter(Boolean);
    if (!visible.length) return;
    const rows = Math.ceil(visible.length / 4);
    const cardH = 72;
    lines.push({
      type: 'scoreCards',
      cards: visible,
      height: rows * cardH + Math.max(0, rows - 1) * 12,
      spaceBefore: 12,
    });
  }

  function addBarChart(lines, title, bars) {
    const visible = (bars || []).filter((bar) => bar && bar.label);
    if (!visible.length) return;
    addWrappedLine(lines, title, 12, 14, { font: 'F2', color: PDF_COLORS.ink });
    lines.push({
      type: 'barChart',
      bars: visible,
      height: 38 + visible.length * 26,
      spaceBefore: 6,
    });
  }

  function addTrendChart(lines, title, points) {
    const visible = (points || []).filter(Boolean);
    if (!visible.length) return;
    addWrappedLine(lines, title, 12, 14, { font: 'F2', color: PDF_COLORS.ink });
    lines.push({
      type: 'trendChart',
      points: visible.slice(-12),
      height: 200,
      spaceBefore: 6,
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

    let cachedPdfLogoMark = null;
    let cachedPdfLogoHeader = null;
    let cachedPdfLogoW = 0;
    let cachedPdfLogoH = 0;

    function loadLogosForPdf() {
      if (cachedPdfLogoMark && cachedPdfLogoHeader) return;
      const img = document.getElementById('navbar-logo');
      if (!img || !img.complete || img.naturalWidth === 0) return;
      try {
        const drawH = 62;
        const drawW = Math.round(drawH * (img.naturalWidth / img.naturalHeight));
        cachedPdfLogoW = drawW;
        cachedPdfLogoH = drawH;

        // Use 4x resolution to ensure crisp logo rendering in PDF
        const scale = 4;
        const c = document.createElement('canvas');
        c.width = drawW * scale;
        c.height = drawH * scale;
        const ctx = c.getContext('2d');
        const pad = Math.max(8, Math.round(10 * scale));
        const innerW = c.width - pad * 2;
        const innerH = c.height - pad * 2;

        // Build a faint watermark variant for background use.
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.globalAlpha = 0.12;
        ctx.drawImage(img, pad, pad, innerW, innerH);
        ctx.globalAlpha = 1;
        let dr = atob(c.toDataURL('image/jpeg', 0.88).split(',')[1]);
        let hex = ''; for (let i = 0; i < dr.length; i++) hex += dr.charCodeAt(i).toString(16).padStart(2, '0');
        cachedPdfLogoMark = hex + '>';
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, pad, pad, innerW, innerH);
        dr = atob(c.toDataURL('image/jpeg', 0.9).split(',')[1]);
        hex = ''; for (let i = 0; i < dr.length; i++) hex += dr.charCodeAt(i).toString(16).padStart(2, '0');
        cachedPdfLogoHeader = hex + '>';
      } catch (e) {
        console.warn('Could not encode logo for PDF:', e);
      }
    }

    function renderReportHeader(item, topY) {
      const lowerY = topY - item.height;
      // Navy primary band
      const textX = margin + 20;
      const midY  = lowerY + item.height / 2;
      return [
        // Navy backdrop
        rectCommand(margin, lowerY, contentWidth, item.height, PDF_COLORS.navy, null),
        // Gold accent left stripe
        rectCommand(margin, lowerY, 4, item.height, PDF_COLORS.gold, null),
        // Platform name (small, gold)
        textCommand(PDF_BRAND.platform, textX, midY + 22, 7.5, 'F2', PDF_COLORS.gold),
        // Report title (large, white)
        textCommand(cleanPdfText(item.title), textX, midY + 4, 20, 'F2', PDF_COLORS.surface),
        // Subtitle / date (small, light)
        textCommand(item.subtitle, textX, midY - 14, 9, 'F1', [200, 212, 230]),
        // CONFIDENTIAL badge (right)
        rectCommand(margin + contentWidth - 106, midY - 8, 92, 18, PDF_COLORS.gold, null),
        textCommand(PDF_BRAND.confidentiality, margin + contentWidth - 89, midY - 2, 8.5, 'F2', PDF_COLORS.navy),
      ].join('\n');
    }

    function renderSectionBanner(item, topY) {
      const bannerY = topY - item.height;
      return [
        rectCommand(margin, bannerY, contentWidth, item.height, PDF_COLORS.navyMid, null),
        rectCommand(margin, bannerY, 4, item.height, PDF_COLORS.gold, null),
        textCommand(item.title.toUpperCase(), margin + 14, topY - 9, 10, 'F2', PDF_COLORS.surface),
      ].join('\n');
    }

    function renderCoverPage(item, topY) {
      const ph = 841.89;
      const pw = 595.28;
      const cx = pw / 2;
      // Full navy background
      const parts = [
        rectCommand(0, 0, pw, ph, PDF_COLORS.navy, null),
        // Top gold band
        rectCommand(0, ph - 60, pw, 60, PDF_COLORS.gold, null),
        // Gold bar left edge accent
        rectCommand(0, 0, 5, ph, PDF_COLORS.gold, null),
        // Bottom gold band
        rectCommand(0, 0, pw, 50, PDF_COLORS.gold, null),
      ];
      // Company name in top gold band
      parts.push(textCommand(PDF_BRAND.platform, margin + 10, ph - 22, 9, 'F2', PDF_COLORS.navy));
      // Thin horizontal rule below logo area
      parts.push(rectCommand(margin, ph - 72, pw - margin * 2, 1, [180, 196, 220], null));
      // Report type label
      parts.push(textCommand(PDF_BRAND.coverTagline, margin + 10, ph * 0.62, 9, 'F2', PDF_COLORS.gold));
      // Report title
      const titleLines = cleanPdfText(item.title).match(/.{1,40}(\s|$)/g) || [cleanPdfText(item.title)];
      titleLines.slice(0, 3).forEach((tl, ti) =>
        parts.push(textCommand(tl.trim(), margin + 10, ph * 0.58 - ti * 28, 22, 'F2', PDF_COLORS.surface))
      );
      // Horizontal divider rule
      parts.push(rectCommand(margin + 10, ph * 0.45, 80, 3, PDF_COLORS.gold, null));
      // Candidate name
      if (item.candidateName) {
        parts.push(textCommand('CANDIDATE', margin + 10, ph * 0.43, 7.5, 'F2', [180, 196, 220]));
        parts.push(textCommand(cleanPdfText(item.candidateName), margin + 10, ph * 0.40, 14, 'F2', PDF_COLORS.surface));
      }
      // Date
      parts.push(textCommand('DATE GENERATED', margin + 10, ph * 0.35, 7.5, 'F2', [180, 196, 220]));
      parts.push(textCommand(item.genDate, margin + 10, ph * 0.32, 11, 'F1', PDF_COLORS.surface));
      // CONFIDENTIAL watermark in bottom gold band
      parts.push(textCommand('CONFIDENTIAL — FOR AUTHORISED USE ONLY', margin + 10, 18, 8, 'F2', PDF_COLORS.navy));
      parts.push(textCommand('KARMIC HRMS', pw - margin - 80, 18, 8, 'F2', PDF_COLORS.navy));
      return parts.join('\n');
    }

    function renderTableBox(item, topY) {
      const items = item.items || [];
      const hdrH = 22;
      const rowH = 24;
      const labelW = 170;
      const bodyH = items.length * rowH;
      const boxY  = topY - item.height;

      const parts = [
        // Outer border
        rectCommand(margin, boxY, contentWidth, item.height, PDF_COLORS.surface, PDF_COLORS.line),
        // Navy header row
        rectCommand(margin, topY - hdrH, contentWidth, hdrH, PDF_COLORS.navyMid, null),
        textCommand('FIELD', margin + 12, topY - 8, 7.5, 'F2', PDF_COLORS.gold),
        textCommand('VALUE', margin + labelW, topY - 8, 7.5, 'F2', PDF_COLORS.gold),
        // Gold divider under header
        rectCommand(margin, topY - hdrH, contentWidth, 2, PDF_COLORS.gold, null),
      ];

      items.forEach((row, idx) => {
        const rowTopY = topY - hdrH - idx * rowH;
        const rowBotY = rowTopY - rowH;
        // Alternating row bg
        if (idx % 2 === 0) {
          parts.push(rectCommand(margin + 1, rowBotY, contentWidth - 2, rowH, PDF_COLORS.light, null));
        }
        // Thin row separator
        parts.push(lineCommand(margin + 1, rowBotY, margin + contentWidth - 1, rowBotY, PDF_COLORS.line, 0.4));
        // Label column (navy text)
        parts.push(textCommand(cleanPdfText(row.label).substring(0, 28), margin + 12, rowTopY - 9, 8.5, 'F2', PDF_COLORS.navyMid));
        // Value column separator
        parts.push(lineCommand(margin + labelW - 4, rowTopY, margin + labelW - 4, rowBotY, PDF_COLORS.line, 0.4));
        // Value text
        parts.push(textCommand(cleanPdfText(row.value).substring(0, 68), margin + labelW, rowTopY - 9, 9, 'F1', PDF_COLORS.ink));
      });
      return parts.join('\n');
    }

    function renderScoreCards(item, topY) {
      const cards = item.cards || [];
      const cols = Math.min(4, Math.max(1, cards.length));
      const gap = 10;
      const cardH = 76;
      const cardW = (contentWidth - gap * (cols - 1)) / cols;
      return cards.map((card, idx) => {
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        const x = margin + col * (cardW + gap);
        const cardTop = topY - row * (cardH + gap);
        const cardY = cardTop - cardH;
        const color = card.color || PDF_COLORS.accent;
        const midX = x + cardW / 2;
        return [
          // Card shadow-ish (slightly offset dark border)
          rectCommand(x + 1, cardY - 1, cardW, cardH, [220, 228, 240], null),
          // Card white body
          rectCommand(x, cardY, cardW, cardH, PDF_COLORS.surface, PDF_COLORS.line),
          // Colored bottom accent stripe
          rectCommand(x, cardY, cardW, 4, color, null),
          // Label (upper, muted small caps)
          textCommand(card.label.toUpperCase(), x + 10, cardTop - 12, 7, 'F2', PDF_COLORS.muted),
          // Thin separator
          lineCommand(x + 10, cardTop - 20, x + cardW - 10, cardTop - 20, PDF_COLORS.line, 0.5),
          // Large value (centered-ish)
          textCommand(card.value, x + 10, cardTop - 50, 19, 'F2', color),
        ].join('\n');
      }).join('\n');
    }

    function renderBarChart(item, topY) {
      const bars = item.bars || [];
      const chartY = topY - item.height;
      const labelX = margin + 14;
      const barX   = margin + 188;
      const barW   = contentWidth - 262;
      const valueX = margin + contentWidth - 54;
      const rowH   = 26;
      const hdrH   = 22;
      const parts  = [
        rectCommand(margin, chartY, contentWidth, item.height, PDF_COLORS.surface, PDF_COLORS.line),
        // Navy header
        rectCommand(margin, topY - hdrH, contentWidth, hdrH, PDF_COLORS.navyMid, null),
        rectCommand(margin, topY - hdrH, contentWidth, 2, PDF_COLORS.gold, null),
        textCommand('METRIC', labelX, topY - 8, 7.5, 'F2', PDF_COLORS.gold),
        textCommand('SCORE', valueX - 4, topY - 8, 7.5, 'F2', PDF_COLORS.gold),
      ];
      bars.forEach((bar, idx) => {
        const yRow = topY - hdrH - 14 - idx * rowH;
        const max   = Number(bar.max) || 100;
        const value = Math.max(0, Math.min(max, Number(bar.value) || 0));
        const pct   = max ? value / max : 0;
        const color = bar.color || PDF_COLORS.accent;
        if (idx % 2 === 0)
          parts.push(rectCommand(margin + 1, yRow - 14, contentWidth - 2, rowH, PDF_COLORS.light, null));
        parts.push(textCommand(bar.label, labelX, yRow, 8.5, 'F1', PDF_COLORS.ink));
        // Track
        parts.push(rectCommand(barX, yRow - 3, barW, 7, [225, 232, 242], null));
        // Fill
        parts.push(rectCommand(barX, yRow - 3, barW * pct, 7, color, null));
        parts.push(textCommand(bar.display || `${Math.round(value)}%`, valueX, yRow, 9, 'F2', color));
      });
      return parts.join('\n');
    }

    function renderTrendChart(item, topY) {
      const points = item.points || [];
      const chartY = topY - item.height;
      const plotX = margin + 42;
      const plotY = chartY + 44;
      const plotW = contentWidth - 78;
      const plotH = item.height - 84;
      const count = Math.max(1, points.length);
      const groupW = plotW / count;
      const barW = Math.min(18, groupW / 3);
      const parts = [
        rectCommand(margin, chartY, contentWidth, item.height, PDF_COLORS.surface, PDF_COLORS.line),
        textCommand('100', margin + 14, plotY + plotH - 4, 7, 'F1', PDF_COLORS.muted),
        textCommand('50', margin + 19, plotY + plotH / 2 - 4, 7, 'F1', PDF_COLORS.muted),
        textCommand('0', margin + 24, plotY - 4, 7, 'F1', PDF_COLORS.muted),
        lineCommand(plotX, plotY, plotX + plotW, plotY, PDF_COLORS.line, 0.5),
        lineCommand(plotX, plotY + plotH / 2, plotX + plotW, plotY + plotH / 2, PDF_COLORS.line, 0.3),
        lineCommand(plotX, plotY + plotH, plotX + plotW, plotY + plotH, PDF_COLORS.line, 0.3),
        textCommand('Workload', margin + 364, topY - 20, 8, 'F2', PDF_COLORS.accent),
        textCommand('Risk Limit', margin + 432, topY - 20, 8, 'F2', PDF_COLORS.danger),
      ];

      points.forEach((point, idx) => {
        const x = plotX + idx * groupW + groupW / 2 - barW;
        const workload = Math.max(0, Math.min(100, Number(point.workload_score) || 0));
        const riskMap = { NORMAL: 30, HIGH: 70, CRITICAL: 100 };
        const risk = riskMap[point.risk_level] || 30;
        const workloadH = (workload / 100) * plotH;
        const riskH = (risk / 100) * plotH;
        parts.push(rectCommand(x, plotY, barW, workloadH, PDF_COLORS.accent, null));
        parts.push(rectCommand(x + barW + 3, plotY, barW, riskH, PDF_COLORS.danger, null));
        parts.push(textCommand(String(idx + 1), x + 1, chartY + 20, 7, 'F1', PDF_COLORS.muted));
      });
      return parts.join('\n');
    }

    function renderLineItem(item, topY) {
      return textCommand(item.text, margin, topY, item.size || 10, item.font || 'F1', item.color || PDF_COLORS.ink);
    }

    loadLogosForPdf();
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
      if (line.type === 'coverPage') {
        pages[pages.length - 1].push(renderCoverPage(line, y));
      } else if (line.type === 'reportHeader') {
        pages[pages.length - 1].push(renderReportHeader(line, y));
      } else if (line.type === 'sectionBanner') {
        pages[pages.length - 1].push(renderSectionBanner(line, y));
      } else if (line.type === 'divider') {
        pages[pages.length - 1].push(lineCommand(margin, y - 2, pageWidth - margin, y - 2, PDF_COLORS.line, 0.8));
      } else if (line.type === 'scoreCards') {
        pages[pages.length - 1].push(renderScoreCards(line, y));
      } else if (line.type === 'barChart') {
        pages[pages.length - 1].push(renderBarChart(line, y));
      } else if (line.type === 'trendChart') {
        pages[pages.length - 1].push(renderTrendChart(line, y));
      } else if (line.type === 'tableBox') {
        pages[pages.length - 1].push(renderTableBox(line, y));
      } else {
        pages[pages.length - 1].push(renderLineItem(line, y));
      }
      y -= height;
    });

    const objects = [];
    const fontBoldObj = 4 + pages.length * 2;

    let resourcesStr = `<< /Font << /F1 3 0 R /F2 ${fontBoldObj} 0 R >> >>`;
    let watermarkLogoObj = 0;
    let headerLogoObj = 0;

    if (cachedPdfLogoMark) {
      watermarkLogoObj = fontBoldObj + 1;
      if (cachedPdfLogoHeader) {
        headerLogoObj = fontBoldObj + 2;
        resourcesStr = `<< /Font << /F1 3 0 R /F2 ${fontBoldObj} 0 R >> /XObject << /LogoMark ${watermarkLogoObj} 0 R /LogoHeader ${headerLogoObj} 0 R >> >>`;
      } else {
        resourcesStr = `<< /Font << /F1 3 0 R /F2 ${fontBoldObj} 0 R >> /XObject << /LogoMark ${watermarkLogoObj} 0 R >> >>`;
      }
    }

    const kids = pages.map((_, idx) => `${(watermarkLogoObj || fontBoldObj) + 1 + idx * 2} 0 R`).join(' ');
    objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objects[2] = `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`;
    objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
    objects[fontBoldObj] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';

    if (watermarkLogoObj) {
      objects[watermarkLogoObj] = `<< /Type /XObject /Subtype /Image /Width ${cachedPdfLogoW} /Height ${cachedPdfLogoH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length ${cachedPdfLogoMark.length} >> stream\n${cachedPdfLogoMark}\nendstream`;
      if (headerLogoObj && cachedPdfLogoHeader) {
        objects[headerLogoObj] = `<< /Type /XObject /Subtype /Image /Width ${cachedPdfLogoW} /Height ${cachedPdfLogoH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length ${cachedPdfLogoHeader.length} >> stream\n${cachedPdfLogoHeader}\nendstream`;
      }
    }

    pages.forEach((page, idx) => {
      const pageObj = (watermarkLogoObj || fontBoldObj) + 1 + idx * 2;
      const streamObj = pageObj + 1;
      const wmW = 300;
      const wmH = cachedPdfLogoW && cachedPdfLogoH ? Math.round(wmW * (cachedPdfLogoH / cachedPdfLogoW)) : 0;
      const watermark = (watermarkLogoObj && wmH)
        ? `q ${wmW} 0 0 ${wmH} ${(pageWidth - wmW) / 2} ${(pageHeight - wmH) / 2} cm /LogoMark Do Q`
        : '';
      const pageFrame = rectCommand(margin - 10, 34, pageWidth - ((margin - 10) * 2), pageHeight - 68, null, PDF_COLORS.line);

      const footer = [
        rectCommand(0, pageHeight - 40, pageWidth, 40, PDF_COLORS.surface, null),
        lineCommand(0, pageHeight - 41, pageWidth, pageHeight - 41, PDF_COLORS.line, 0.8),
        (headerLogoObj ? `q 40 0 0 20 ${margin - 6} ${pageHeight - 30} cm /LogoHeader Do Q` : ''),
        textCommand(REPORT_TITLE, pageWidth / 2 - 60, pageHeight - 24, 9, 'F2', PDF_COLORS.navy),
        textCommand(PDF_BRAND.confidentiality, pageWidth - margin - 64, pageHeight - 24, 8, 'F2', PDF_COLORS.muted),
        // Navy footer bar
        rectCommand(0, 0, pageWidth, 40, PDF_COLORS.navy, null),
        // Gold top rule
        rectCommand(0, 40, pageWidth, 2, PDF_COLORS.gold, null),
        textCommand('Karmic HRMS  |  Enterprise Report Format  |  Proprietary & Confidential', margin, 14, 7.5, 'F1', [180, 196, 220]),
        textCommand(`Page ${idx + 1} of ${pages.length}`, pageWidth - margin - 44, 14, 8, 'F2', PDF_COLORS.gold),
      ].join('\n');
      const stream = [watermark, pageFrame, ...page, footer].join('\n');
      objects[pageObj] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources ${resourcesStr} /Contents ${streamObj} 0 R >>`;
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

  function downloadReportPdf(filename, title, buildContent, options = {}) {
    const {
      includeExecutivePages = true,
      includeBehavioralHistory = true,
    } = options;
    const lines = [];
    // ── Full-page cover ──────────────────────────────────────────────────────
    const candidateName = (state.profile && state.profile.candidate_name) || '';
    const genDate = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' });
    lines.push({
      type: 'coverPage',
      title,
      candidateName,
      genDate,
      height: 841.89 - 88,   // full usable page height
      spaceBefore: 0,
    });
    lines.push({ type: 'pageBreak', height: 0, spaceBefore: 0 });
    // ── Section header for the first content page ────────────────────────────
    addReportHeader(lines, REPORT_TITLE);
    if (includeExecutivePages) {
      addExecutiveSummaryPage(lines, REPORT_TITLE);
      addComparisonDashboard(lines);
      lines.push({ type: 'pageBreak', height: 0, spaceBefore: 0 });
    }
    buildContent(lines);
    if (includeBehavioralHistory) {
      addBehavioralHistoryPage(lines);
    }
    downloadBlob(buildPdfBlob(lines), filename);
  }

  function appendResumeReport(lines, data, title = 'Resume Analysis', profile = null) {
    if (!data) return false;
    const skills = data.skills || {};
    const intent = data.intent_profile || {};
    const lead = data.leadership_analysis || {};
    const comp = data.compensation_emphasis_index || {};

    addSection(lines, title);

    addScoreCards(lines, [
      { label: 'Leadership Score', value: `${toTwo(lead.score)}`, color: scoreColor(lead.score * 10) },
      { label: 'Compensation Index', value: `${toTwo(comp.score)}`, color: scoreColor(comp.score) },
      { label: 'Skills Confidence', value: skills.confidence == null ? '-' : fmtPct01(skills.confidence), color: PDF_COLORS.blue },
      { label: 'Primary Intent', value: intent.primary_intent || '-', color: PDF_COLORS.accentDark }
    ]);

    if (profile) {
      addTable(lines, 'Candidate Details', [
        { label: 'Candidate Name', value: profile.candidate_name },
        { label: 'Email', value: profile.email },
        { label: 'Phone', value: profile.phone },
        { label: 'Location', value: profile.location },
        { label: 'Total Experience', value: profile.experience }
      ]);
      addList(lines, 'Education', profile.education);
      addList(lines, 'Links', profile.links);
      addList(lines, 'Certifications / Other', profile.certifications);
    }

    addTable(lines, 'Assessment Summary', [
      { label: 'Primary Intent', value: intent.primary_intent },
      { label: 'Secondary Intent', value: intent.secondary_intent },
      { label: 'Leadership Confidence', value: lead.confidence == null ? '-' : fmtPct01(lead.confidence) },
      { label: 'Compensation Confidence', value: comp.confidence == null ? '-' : fmtPct01(comp.confidence) }
    ]);

    addSkillTable(lines, 'Technical Skills', skills.technical);
    addList(lines, 'Soft Skills', skills.soft);
    addList(lines, 'Leadership Indicators', lead.evidence);
    addList(lines, 'Salary Indicators', (comp.evidence && comp.evidence.length) ? comp.evidence : ['No salary indicators detected.']);
    addList(lines, 'Workload Risk Assessment', (lead.stress_indicators && lead.stress_indicators.length) ? lead.stress_indicators : ['No stress or workload concerns detected.']);
    addTable(lines, 'Final Hiring Recommendation', [
      { label: 'Recommendation', value: hiringRecommendation(lead.score, skills.confidence, 0) }
    ]);
    return true;
  }

  function appendWorkforceReport(lines, data, title = 'Workforce Intelligence') {
    if (!data) return false;
    const job = data.job_role || {};
    const project = data.project_skill_match || {};
    const team = data.team_compatibility || {};

    addSection(lines, title);

    addTable(lines, 'Workforce Intelligence Summary', [
      { label: 'Employee', value: data.employee_name || state.fileName || '-' },
      { label: 'Project', value: data.project_name || '-' },
      { label: 'Predicted Job Role', value: job.role },
      { label: 'Job Role Confidence', value: job.confidence == null ? '-' : fmtPct01(job.confidence) },
      { label: 'Project Skill Match', value: project.match_score == null ? '-' : fmtPct01(project.match_score) },
      { label: 'Team Compatibility', value: team.overall_score == null ? '-' : fmtPct01(team.overall_score) },
      { label: 'Skill Overlap', value: team.skill_overlap_score == null ? '-' : fmtPct01(team.skill_overlap_score) },
      { label: 'Behavioral Alignment', value: team.behavioral_alignment_score == null ? '-' : fmtPct01(team.behavioral_alignment_score) }
    ]);

    addList(lines, 'Missing Skills', project.missing_skills);
    addList(lines, 'Compatibility Notes', team.notes);
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
      { label: 'Communication Score', value: `${communicationScore}/100`, color: scoreColor(communicationScore) },
    ]);

    addTable(lines, 'Candidate Overview', [
      { label: 'Candidate Name', value: data.candidate_name },
      { label: 'Target Job Role', value: data.job_role },
      { label: 'Personality Type', value: data.personality_type },
      { label: 'Personality Description', value: profile.description },
      { label: 'Team Fit Assessment', value: data.team_fit },
      { label: 'Team Balance Focus', value: team.team_balance },
      { label: 'Communication Style', value: communication.sentiment },
      { label: 'Best Role Recommendation', value: recommendation.best_role },
      { label: 'Recommendation Factor', value: recommendation.confidence == null ? '-' : `${recommendation.confidence}%` }
    ]);

    if (recommendation.reasoning) {
      addWrappedLine(lines, `Recommendation Reasoning: ${cleanPdfText(recommendation.reasoning)}`, 10, 4);
    }

    addBarChart(lines, 'OCEAN Personality Traits', [
      { label: 'Openness', value: traits.openness || 0, color: PDF_COLORS.accent },
      { label: 'Conscientiousness', value: traits.conscientiousness || 0, color: PDF_COLORS.blue },
      { label: 'Extraversion', value: traits.extraversion || 0, color: PDF_COLORS.warning },
      { label: 'Agreeableness', value: traits.agreeableness || 0, color: PDF_COLORS.ok },
      { label: 'Neuroticism', value: traits.neuroticism || 0, color: PDF_COLORS.rose },
    ]);

    const roleCompatibility = Object.entries(data.role_compatibility || {})
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 5)
      .map(([label, value]) => ({ label, value: Number(value) || 0, color: scoreColor(value) }));
    addBarChart(lines, 'Top Role Compatibility Scores', roleCompatibility);

    addList(lines, 'Top Recommended Roles', data.role_recommendations);
    addList(lines, 'Identified Risk Flags', data.risk_flags);
    addList(lines, 'Team Synergies Identified', team.synergies);
    addList(lines, 'Potential Team Conflicts', team.potential_conflicts);
    addList(lines, 'Actionable Team Recommendations', team.recommendations);
    addList(lines, 'Core Quality Strengths', profile.dynamic_strengths || profile.strengths);
    addList(lines, 'Identified Development Areas', profile.challenges || profile.development_areas);

    lines.push({ type: 'divider', height: 10, spaceBefore: 6 });
    if (data.summary) {
      addWrappedLine(lines, `Executive Summary: ${cleanPdfText(data.summary)}`, 10, 4);
    } else {
      addWrappedLine(lines, `Executive Summary: ${cleanPdfText(document.getElementById('bSummary')?.textContent)}`, 10, 4);
    }

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
    addTable(lines, 'Assessment Summary', [
      { label: 'Status assessment', value: data.status },
      { label: 'Calculated Risk Limit', value: data.risk_level },
      { label: 'Stress Severity', value: data.stress_level },
      { label: 'Risk Factor Confidence', value: data.confidence == null ? '-' : `${Math.round(Number(data.confidence) * 100)}%` },
      { label: 'Stress Indicator', value: data.stress_indicator == null ? '-' : data.stress_indicator },
      { label: 'Workload Efficiency', value: data.workload_score == null ? '-' : `${workloadScore.toFixed(1)}/100` },
      { label: 'Meeting Bandwidth', value: data.meeting_load_score == null ? '-' : `${meetingLoadScore.toFixed(1)}/100` },
      { label: 'Delivery Commitment', value: data.task_completion_score == null ? '-' : `${taskCompletionScore.toFixed(1)}%` },
    ]);

    addTable(lines, 'Employee Workload Input', [
      { label: 'Total Tasks Assigned', value: input.tasks_assigned },
      { label: 'Total Tasks Completed', value: input.tasks_completed },
      { label: 'Overdue / Blocked Tasks', value: input.overdue_tasks },
      { label: 'Working Hours Per Day', value: input.working_hours_per_day },
      { label: 'Live Meetings Per Day', value: input.meetings_per_day },
      { label: 'Total Meeting Hours', value: input.meeting_hours },
      { label: 'Weekend Work Logged', value: input.weekend_work === 1 ? 'Yes' : input.weekend_work === 0 ? 'No' : '-' },
    ]);

    addList(lines, 'Leadership Indicators', data.insights);
    addList(lines, 'Actionable Recommendations', data.recommendations);

    if (data.future_risk) {
      lines.push({ type: 'divider', height: 10, spaceBefore: 6 });
      addWrappedLine(lines, `Future Risk Prognosis: ${data.future_risk}`, 10, 4, { color: riskScore >= 70 ? PDF_COLORS.danger : PDF_COLORS.ink });
    }
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

  function buildCurrentCandidateReport(lines) {
    const resumeData = state.current || (state.history[0] && state.history[0].payload) || {};
    const profile = state.profile || {};
    const workforce = state.workforce || {};
    const behavioral = typeof currentAnalysis !== 'undefined' ? (currentAnalysis || {}) : {};
    const stressHistory = (typeof stressAnalysisHistory !== 'undefined') ? stressAnalysisHistory : [];
    const stress = stressHistory.length > 0 ? stressHistory[stressHistory.length - 1] : {};

    const skills = resumeData.skills || {};
    const intent = resumeData.intent_profile || {};
    const lead = resumeData.leadership_analysis || {};
    const comp = resumeData.compensation_emphasis_index || {};
    const communication = behavioral.communication || {};
    const teamCompat = behavioral.team_compatibility || {};

    // A. Candidate Details
    addSection(lines, 'A. Candidate Details');
    addTable(lines, 'Candidate Profile', [
      { label: 'Full Name', value: profile.candidate_name || behavioral.candidate_name || 'N/A' },
      { label: 'Email', value: profile.email || 'N/A' },
      { label: 'Phone', value: profile.phone || 'N/A' },
      { label: 'Total Experience', value: profile.experience || 'N/A' },
      { label: 'Predicted Job Role', value: (workforce.job_role && workforce.job_role.role) || behavioral.job_role || 'N/A' }
    ]);

    if (profile.education && profile.education.length > 0) {
      addTable(lines, 'Academic Background', profile.education.map((ed, i) => ({ label: `Institution / Degree ${i + 1}`, value: ed })));
    }
    if (profile.certifications && profile.certifications.length > 0) {
      addTable(lines, 'Professional Certifications', profile.certifications.map((cert, i) => ({ label: `Certification ${i + 1}`, value: cert })));
    }

    addWrappedLine(lines, `Executive Resume Summary: ${cleanPdfText(profile.resume_summary || profile.summary || 'N/A')}`, 10, 4);

    // B. Resume Analysis Results
    addSection(lines, 'B. Resume Analysis Results');
    addScoreCards(lines, [
      { label: 'Skill Score', value: `${toPct(skills.confidence)}%`, color: PDF_COLORS.blue },
      { label: 'Experience Score', value: `${toPct(profile.experience_score || 85)}%`, color: PDF_COLORS.ok },
      { label: 'Leadership Score', value: `${toTwo(lead.score)}`, color: scoreColor((lead.score || 0) * 10) }
    ]);
    addTable(lines, 'Assessment Summary', [
      { label: 'Intent Analysis', value: intent.primary_intent || 'N/A' },
      { label: 'Compensation Analysis', value: comp.emphasis_level || `${toTwo(comp.score)}` },
      { label: 'Recommended Role', value: (workforce.job_role && workforce.job_role.role) || behavioral.job_role || 'N/A' }
    ]);

    addSkillTable(lines, 'Technical Proficiencies', skills.technical);
    if (skills.soft && skills.soft.length > 0) {
      addSkillTable(lines, 'Soft Skills & Attributes', skills.soft);
    }

    addList(lines, 'Core Strengths Identified', profile.dynamic_strengths || profile.strengths);
    addList(lines, 'Areas for Development', profile.challenges || profile.development_areas);

    // C. Behavioral Analysis Results
    addSection(lines, 'C. Behavioral Analysis Results');
    addScoreCards(lines, [
      { label: 'Team Compatibility', value: `${Math.round(teamCompat.compatibility_score || 0)}%`, color: scoreColor(teamCompat.compatibility_score) },
      { label: 'Leadership Potential', value: `${toPct(behavioral.leadership_potential || (lead.score || 0) / 10)}%`, color: PDF_COLORS.blue },
      { label: 'Stress Risk', value: stress.risk_level || 'Low', color: stress.risk_level === 'High' ? PDF_COLORS.danger : PDF_COLORS.ok }
    ]);
    addTable(lines, 'Behavioral Output', [
      { label: 'Personality Indicators', value: behavioral.personality_type || 'N/A' },
      { label: 'Toxicity Risk', value: behavioral.toxicity_risk || 'Low' },
      { label: 'Communication Style', value: communication.sentiment || 'N/A' },
      { label: 'Work Attitude', value: behavioral.work_attitude || 'Professional' }
    ]);

    // Personality Trait Graphs
    const traits = behavioral.personality_traits || {};
    addBarChart(lines, 'OCEAN Personality Traits Analysis', [
      { label: 'Openness', value: traits.openness || 0, color: PDF_COLORS.accent },
      { label: 'Conscientiousness', value: traits.conscientiousness || 0, color: PDF_COLORS.blue },
      { label: 'Extraversion', value: traits.extraversion || 0, color: PDF_COLORS.warning },
      { label: 'Agreeableness', value: traits.agreeableness || 0, color: PDF_COLORS.ok },
      { label: 'Neuroticism', value: traits.neuroticism || 0, color: PDF_COLORS.rose },
    ]);

    const roleCompatibility = Object.entries(behavioral.role_compatibility || {})
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 5)
      .map(([label, value]) => ({ label, value: Number(value) || 0, color: scoreColor(value) }));
    if (roleCompatibility.length > 0) {
      addBarChart(lines, 'Top Role Compatibility Scores', roleCompatibility);
    }

    addList(lines, 'Positive Traits', (behavioral.personality_profile && behavioral.personality_profile.dynamic_strengths) || (behavioral.personality_profile && behavioral.personality_profile.strengths) || []);
    addList(lines, 'Negative Traits', (behavioral.personality_profile && behavioral.personality_profile.challenges) || (behavioral.personality_profile && behavioral.personality_profile.development_areas) || []);

    // D. Final Recommendation
    addSection(lines, 'D. Final Recommendation');
    const fitScore = behavioral.behavioral_fit_score || behavioral.final_score || 0;
    const hrRec = fitScore >= 70 ? 'Hire' : fitScore >= 50 ? 'Review' : 'Reject';
    addTable(lines, 'Recommendation Summary', [
      { label: 'Final HR Recommendation', value: hrRec },
      { label: 'Best Department', value: (behavioral.recommendation_data && behavioral.recommendation_data.best_department) || 'Engineering' },
      { label: 'Team Fit', value: behavioral.team_fit || 'N/A' },
      { label: 'Project Compatibility', value: `${toPct(workforce.project_skill_match && workforce.project_skill_match.match_score)}%` }
    ]);
    addList(lines, 'Risk Notes', behavioral.risk_flags || teamCompat.potential_conflicts || []);

    // E. Stress & Workload Analysis
    if (stressHistory.length > 0) {
      addSection(lines, 'E. Stress & Workload Analysis');
      const workloadScore = Number(stress.workload_score) || 0;
      const meetingLoadScore = Number(stress.meeting_load_score) || 0;
      const taskCompletionScore = Number(stress.task_completion_score) || 0;
      const stressIndicatorPct = stress.stress_indicator == null ? 0 : Math.round(Number(stress.stress_indicator) * 100);
      const riskMap = { NORMAL: 30, HIGH: 70, CRITICAL: 100 };
      const riskScore = riskMap[stress.risk_level] || 30;

      addScoreCards(lines, [
        { label: 'Stress Severity', value: stress.stress_level || '-', color: stress.stress_level === 'High' ? PDF_COLORS.danger : stress.stress_level === 'Medium' ? PDF_COLORS.warning : PDF_COLORS.ok },
        { label: 'Risk Factor', value: stress.risk_level || '-', color: scoreColor(riskScore) },
        { label: 'Workload Efficiency', value: `${workloadScore.toFixed(1)}/100`, color: scoreColor(workloadScore) },
        { label: 'Task Delivery', value: `${taskCompletionScore.toFixed(1)}%`, color: scoreColor(taskCompletionScore) },
      ]);

      addTrendChart(lines, 'Recent Stress & Workload Trend', stressHistory.slice(-5));

      addBarChart(lines, 'Current Workload Profile', [
        { label: 'Workload score', value: workloadScore, display: `${workloadScore.toFixed(1)}/100`, color: scoreColor(workloadScore) },
        { label: 'Meeting load', value: meetingLoadScore, display: `${meetingLoadScore.toFixed(1)}/100`, color: scoreColor(meetingLoadScore) },
        { label: 'Task completion', value: taskCompletionScore, display: `${taskCompletionScore.toFixed(1)}%`, color: scoreColor(taskCompletionScore) },
        { label: 'Stress indicator', value: stressIndicatorPct, display: `${stressIndicatorPct}%`, color: scoreColor(stressIndicatorPct) },
        { label: 'Risk level', value: riskScore, display: `${stress.risk_level || '-'}`, color: scoreColor(riskScore) },
      ]);

      const input = stress.input || stress.employee_data || {};
      addTable(lines, 'Employee Workload Input', [
        { label: 'Total Tasks Assigned', value: input.tasks_assigned },
        { label: 'Total Tasks Completed', value: input.tasks_completed },
        { label: 'Overdue / Blocked Tasks', value: input.overdue_tasks },
        { label: 'Working Hours Per Day', value: input.working_hours_per_day },
        { label: 'Live Meetings Per Day', value: input.meetings_per_day },
        { label: 'Weekend Work Logged', value: input.weekend_work === 1 ? 'Yes' : input.weekend_work === 0 ? 'No' : '-' },
      ]);

      addList(lines, 'Calculated Insights', stress.insights || []);
      addList(lines, 'Actionable Recommendations', stress.recommendations || []);
    }

    return true;
  }

  function buildAllReports(lines) {
    let added = false;
    addExecutiveSummaryPage(lines, 'Talent Intelligence Reports');
    addComparisonDashboard(lines);
    added = appendResumeReport(lines, state.current, 'Current Resume Analysis', state.profile) || added;
    added = appendWorkforceReport(lines, state.workforce, 'Current Workforce Intelligence') || added;
    added = appendBehavioralReport(lines, currentAnalysis, 'Current Behavioral Analysis') || added;

    if (stressAnalysisHistory.length) {
      addTrendChart(lines, 'Overall Stress Trend Graph', stressAnalysisHistory);
      stressAnalysisHistory.forEach((entry, idx) => {
        appendStressReport(lines, entry, `Stress / Workload Analysis ${idx + 1}`);
      });
      added = true;
    }

    if (state.history.length || candidateHistory.length) {
      appendHistorySummary(lines);
      added = true;
    }
    addBehavioralHistoryPage(lines);

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
      html += `<div class="ocean-question mb-4 p-3 p-lg-4 rounded-4 border shadow-sm transition" id="oq-container-${qId}">
        <label class="mb-3 d-block fw-semibold text-dark fs-5 mt-1">${qId}. ${qData.question}</label>
        <div class="circular-scale-wrapper">
          <div class="circular-scale-container">
            <div class="scale-label left">Agree</div>
            <div class="scale-options">`;

      // Render from Strongly Agree (5) on the left to Strongly Disagree (1) on the right
      const scores = [5, 4, 3, 2, 1];
      scores.forEach(score => {
        const optionText = qData.options[score - 1];
        const inputId = `ocean-${qId}-${score}`;
        html += `
              <label class="scale-option" title="${optionText}">
                <input type="radio" class="option-input" name="${qId}" id="${inputId}" value="${score}" autocomplete="off" required>
                <div class="circle"></div>
              </label>`;
      });

      html += `
            </div>
            <div class="scale-label right">Disagree</div>
          </div>
        </div>
      </div>`;
    }
    container.innerHTML = html;

    // Attach event listeners for progress bar and active container highlighting
    const allRadios = container.querySelectorAll('.option-input');
    allRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        let answeredCount = 0;
        const totalCount = Object.keys(OCEAN_QUESTIONS).length;

        Object.keys(OCEAN_QUESTIONS).forEach(k => {
          const qsContainer = document.getElementById(`oq-container-${k}`);
          const checked = container.querySelector(`input[name="${k}"]:checked`);
          if (checked) {
            answeredCount++;
            qsContainer.classList.add('answered-question');
            qsContainer.style.borderColor = 'var(--bs-success)';
            qsContainer.style.boxShadow = '0 0.125rem 0.25rem rgba(25,135,84,0.15)'; // Success tint shadow
          }
        });

        // Update progress bar
        const oceanProgressBar = document.getElementById('oceanProgressBar');
        const oceanProgressText = document.getElementById('oceanProgressText');
        if (oceanProgressBar && oceanProgressText) {
          const pct = Math.round((answeredCount / totalCount) * 100);
          oceanProgressBar.style.width = pct + '%';
          oceanProgressText.textContent = `${answeredCount} / ${totalCount} Answered`;
          if (answeredCount === totalCount) {
            oceanProgressBar.classList.remove('progress-bar-striped', 'progress-bar-animated');
            oceanProgressText.classList.replace('bg-primary', 'bg-success');
            oceanProgressText.innerText = "Completed!";
          }
        }
      });
    });
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

  window.addTeamMember = function () {
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

  window.removeTeamMember = function (idx) {
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
      // Execute frontend assessment logic to get real-time dynamic scores
      scenario.compatibility_score = calculateTeamCompatibility(scenario);
      scenario.dynamics_score = calculateTeamDynamics(scenario);

      const compatScore = scenario.compatibility_score;
      const dynamicsScore = scenario.dynamics_score;
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

  window.addMemberToTeam = function (teamScenarioId) {
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

  window.deleteTeamScenario = function (scenarioId) {
    teamScenarios = teamScenarios.filter(s => s.id !== scenarioId);
    localStorage.setItem('teamScenarios', JSON.stringify(teamScenarios));
    renderTeamScenarios();
    renderTeamComparison();
  };

  window.moveTeamMember = moveTeamMember;

  window.removeMemberFromTeam = function (scenarioId, memberName) {
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

  function downloadCurrentCandidateReportOnly() {
    const hasContent = state.current || state.history.length || currentAnalysis || stressAnalysisHistory.length;
    if (!hasContent) {
      showToast('No candidate data available to download', 'error');
      return;
    }
    downloadReportPdf('current-candidate-report.pdf', 'Current Candidate Report', (lines) => {
      buildCurrentCandidateReport(lines);
    }, {
      includeExecutivePages: false,
      includeBehavioralHistory: false,
    });
    showToast('Current candidate report downloaded', 'ok');
  }

  function downloadAllReportsFileOnly() {
    const hasAny = state.current || state.history.length || currentAnalysis || stressAnalysisHistory.length || candidateHistory.length;
    if (!hasAny) {
      showToast('No reports available to download', 'error');
      return;
    }
    downloadReportPdf('all-reports.pdf', 'Talent Intelligence Reports', (lines) => {
      buildAllReports(lines);
    });
    showToast('All reports downloaded', 'ok');
  }

  function downloadResumeReportOnly() {
    const resumeData = state.current || (state.history[0] && state.history[0].payload);
    const resumeProfile = state.profile || (resumeData && resumeData.candidate_profile) || null;
    const hasResume = !!resumeData;
    if (!hasResume) {
      showToast('No resume analysis available to download', 'error');
      return;
    }
    downloadReportPdf('resume-analysis-report.pdf', 'Resume Analysis Report', (lines) => {
      appendResumeReport(lines, resumeData, 'Resume Analysis', resumeProfile);
    }, {
      includeExecutivePages: false,
      includeBehavioralHistory: false,
    });
    showToast('Resume report downloaded', 'ok');
  }

  function downloadBehavioralReportOnly() {
    const hasBehavioral = !!currentAnalysis;
    if (!hasBehavioral) {
      showToast('No behavioral analysis available to download', 'error');
      return;
    }
    downloadReportPdf('behavioral-analysis-report.pdf', 'Behavioral Analysis Report', (lines) => {
      appendBehavioralReport(lines, currentAnalysis, 'Behavioral Analysis');
    }, {
      includeExecutivePages: false,
      includeBehavioralHistory: false,
    });
    showToast('Behavioral report downloaded', 'ok');
  }

  function downloadStressReportOnly() {
    const latestStress = stressAnalysisHistory.length ? stressAnalysisHistory[stressAnalysisHistory.length - 1] : null;
    const hasStress = !!latestStress;
    if (!hasStress) {
      showToast('No stress analysis available to download', 'error');
      return;
    }
    downloadReportPdf('stress-workload-analysis-report.pdf', 'Stress / Workload Analysis Report', (lines) => {
      appendStressReport(lines, latestStress, 'Stress / Workload Analysis');
    }, {
      includeExecutivePages: false,
      includeBehavioralHistory: false,
    });
    showToast('Stress/workload report downloaded', 'ok');
  }

  document.getElementById('menuDownloadCurrentBtn')?.addEventListener('click', downloadCurrentCandidateReportOnly);
  document.getElementById('menuDownloadAllBtn')?.addEventListener('click', downloadAllReportsFileOnly);
  document.getElementById('menuDownloadResumeBtn')?.addEventListener('click', downloadResumeReportOnly);
  document.getElementById('menuDownloadBehavioralBtn')?.addEventListener('click', downloadBehavioralReportOnly);
  document.getElementById('menuDownloadStressBtn')?.addEventListener('click', downloadStressReportOnly);
  document.getElementById('downloadResumePdfBtn')?.addEventListener('click', downloadResumeReportOnly);
  document.getElementById('downloadBehavioralPdfBtn')?.addEventListener('click', downloadBehavioralReportOnly);
  document.getElementById('downloadStressPdfBtn')?.addEventListener('click', downloadStressReportOnly);

  function setPersonalityProfileVisibility(isVisible) {
    const pSection = document.getElementById('candidatePersonalitySection');
    if (!pSection) return;
    pSection.style.display = isVisible ? 'block' : 'none';
  }

  if (toggleProfileBtn) {
    toggleProfileBtn.addEventListener('click', () => {
      const pSection = document.getElementById('candidatePersonalitySection');
      if (!pSection) return;
      const shouldShow = pSection.style.display === 'none';
      setPersonalityProfileVisibility(shouldShow);
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
        setPersonalityProfileVisibility(true);
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

  // Proxy clicks removed in favor of unified download handler

})();

