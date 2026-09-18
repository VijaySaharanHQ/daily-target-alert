/* ==========================================
   DAILY TARGET ALERT V2
   Main Application
========================================== */

const STORAGE_KEY = "dailyTargetAlertV2";

let state = loadState();

let timerInterval = null;
let timerSeconds = 0;
let timerRunning = false;
let timerTargetId = null;
let timerStartedAt = null;
let totalSessionSeconds = 0;


/* ==========================================
   DOM
========================================== */

const $ = id => document.getElementById(id);

const loginScreen = $("loginScreen");
const appScreen = $("appScreen");

const profileForm = $("profileForm");

const firstNameInput = $("firstName");
const lastNameInput = $("lastName");
const targetYearInput = $("targetYear");

const userName = $("userName");
const todayDate = $("todayDate");

const targetQueue = $("targetQueue");

const currentTargetTitle = $("currentTargetTitle");
const currentSubject = $("currentSubject");
const currentChapter = $("currentChapter");
const currentSubjectIcon = $("currentSubjectIcon");
const currentDuration = $("currentDuration");

const startTargetBtn = $("startTargetBtn");
const skipTargetBtn = $("skipTargetBtn");

const focusPanel = $("focusPanel");
const focusTitle = $("focusTitle");
const focusSubject = $("focusSubject");
const focusTimer = $("focusTimer");
const pauseBtn = $("pauseBtn");
const completeBtn = $("completeBtn");

const modalOverlay = $("modalOverlay");
const modalContent = $("modalContent");
const closeModal = $("closeModal");


/* ==========================================
   STATE
========================================== */

function createInitialState() {

  return {
    profile: null,

    date: getToday(),

    targets: [],

    completedToday: 0,

    studySeconds: 0,

    score: 0,

    streak: 0,

    history: [],

    tomorrowTargets: [],

    notes: "",

    theme: "dark"
  };

}


function loadState() {

  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return createInitialState();
  }

  try {

    const parsed = JSON.parse(saved);

    return {
      ...createInitialState(),
      ...parsed
    };

  } catch {

    return createInitialState();

  }

}


function saveState() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );

}


/* ==========================================
   LOGIN
========================================== */

let selectedExam = "JEE";


document.querySelectorAll(".exam-btn").forEach(button => {

  button.addEventListener("click", () => {

    document.querySelectorAll(".exam-btn")
      .forEach(btn => btn.classList.remove("active"));

    button.classList.add("active");

    selectedExam = button.dataset.exam;

  });

});


profileForm.addEventListener("submit", event => {

  event.preventDefault();

  const first = firstNameInput.value.trim();
  const last = lastNameInput.value.trim();
  const year = targetYearInput.value;

  if (!first || !last) return;

  state.profile = {
    firstName: first,
    lastName: last,
    exam: selectedExam,
    year
  };

  state.date = getToday();

  if (!state.targets.length) {

    state.targets = cloneTargets(
      DEFAULT_TARGETS[selectedExam]
    );

  }

  saveState();

  showApp();

});


function cloneTargets(targets) {

  return targets.map(target => ({
    ...target,
    id: crypto.randomUUID()
  }));

}


/* ==========================================
   APP START
========================================== */

function showApp() {

  loginScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");

  applyTheme();

  updateUI();

  requestNotifications();

}


function showLogin() {

  appScreen.classList.add("hidden");
  loginScreen.classList.remove("hidden");

}


/* ==========================================
   DAILY RESET
========================================== */

function checkNewDay() {

  const today = getToday();

  if (state.date === today) return;

  if (state.targets.length) {

    const completed = state.targets.filter(t => t.completed).length;

    state.history.push({
      date: state.date,
      completed,
      total: state.targets.length,
      studySeconds: state.studySeconds,
      score: state.score
    });

  }

  state.date = today;

  state.targets = [];

  state.completedToday = 0;

  state.studySeconds = 0;

  state.score = 0;

  saveState();

}


/* ==========================================
   UI
========================================== */

function updateUI() {

  checkNewDay();

  const profile = state.profile;

  if (!profile) return;

  userName.textContent = profile.firstName;

  todayDate.textContent = formatDate(new Date());

  $("streakValue").textContent = state.streak;

  renderCurrentTarget();

  renderQueue();

  updateStats();

  $("profileBtn").textContent =
    profile.firstName.charAt(0).toUpperCase();

}


function renderCurrentTarget() {

  const target = getCurrentTarget();

  if (!target) {

    currentTargetTitle.textContent =
      "Today's mission completed 🎉";

    currentSubject.textContent = "All Done";

    currentChapter.textContent =
      "Excellent work. You completed your queue.";

    currentSubjectIcon.textContent = "🏆";

    currentDuration.textContent = "DONE";

    startTargetBtn.disabled = true;

    return;

  }

  startTargetBtn.disabled = false;

  currentTargetTitle.textContent = target.title;

  currentSubject.textContent = target.subject;

  currentChapter.textContent = target.chapter;

  currentDuration.textContent =
    formatMinutes(target.duration);

  const subjectData =
    SUBJECT_DATA[state.profile.exam]?.[target.subject];

  currentSubjectIcon.textContent =
    subjectData?.icon || "📚";

}


function renderQueue() {

  targetQueue.innerHTML = "";

  if (!state.targets.length) {

    targetQueue.innerHTML = `
      <div class="target-item">
        <div class="target-number">+</div>
        <div>
          <h3>No targets for today</h3>
          <p>Add your first target.</p>
        </div>
      </div>
    `;

    return;
  }


  state.targets
    .sort((a,b) => a.order - b.order)
    .forEach((target,index) => {

      const div = document.createElement("div");

      div.className =
        `target-item ${target.completed ? "completed" : ""}`;

      div.innerHTML = `

        <div class="target-number">
          ${index + 1}
        </div>

        <div>
          <h3>${escapeHTML(target.title)}</h3>
          <p>
            ${escapeHTML(target.subject)}
            •
            ${escapeHTML(target.chapter)}
            •
            ${target.duration} min
          </p>
        </div>

        <div class="target-actions">

          ${
            target.completed
              ? `<button disabled>✓ Done</button>`
              : `<button onclick="startSpecificTarget('${target.id}')">▶</button>`
          }

          <button onclick="editTarget('${target.id}')">✎</button>

          <button onclick="deleteTarget('${target.id}')">×</button>

        </div>
      `;

      targetQueue.appendChild(div);

    });

}


function updateStats() {

  const completed =
    state.targets.filter(t => t.completed).length;

  const total = state.targets.length;

  $("completedCount").textContent = completed;

  $("studyTime").textContent =
    formatStudyTime(state.studySeconds);

  $("completionRate").textContent =
    total
      ? Math.round((completed / total) * 100) + "%"
      : "0%";

  $("scoreValue").textContent =
    state.score;

}


/* ==========================================
   TARGET MANAGEMENT
========================================== */

function getCurrentTarget() {

  return state.targets
    .filter(t => !t.completed)
    .sort((a,b) => a.order - b.order)[0];

}


startTargetBtn.addEventListener("click", () => {

  const target = getCurrentTarget();

  if (!target) return;

  startFocus(target);

});


function startSpecificTarget(id) {

  const target =
    state.targets.find(t => t.id === id);

  if (!target || target.completed) return;

  startFocus(target);

}


function startFocus(target) {

  timerTargetId = target.id;

  timerSeconds = 0;

  totalSessionSeconds = 0;

  timerRunning = true;

  timerStartedAt = Date.now();

  focusPanel.classList.remove("hidden");

  focusTitle.textContent = target.title;

  focusSubject.textContent =
    `${target.subject} • ${target.chapter}`;

  pauseBtn.textContent = "⏸ Pause";

  focusTimer.textContent = "00:00:00";

  clearInterval(timerInterval);

  timerInterval = setInterval(runTimer,1000);

  focusPanel.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

}


function runTimer() {

  if (!timerRunning) return;

  timerSeconds++;

  totalSessionSeconds++;

  focusTimer.textContent =
    formatClock(timerSeconds);

  const target =
    state.targets.find(t => t.id === timerTargetId);

  if (target) {

    const planned =
      target.duration * 60;

    const progress =
      Math.min(
        100,
        (timerSeconds / planned) * 100
      );

    $("focusProgressBar").style.width =
      progress + "%";

  }

}


pauseBtn.addEventListener("click", () => {

  timerRunning = !timerRunning;

  pauseBtn.textContent =
    timerRunning
      ? "⏸ Pause"
      : "▶ Resume";

});


completeBtn.addEventListener("click", () => {

  completeCurrentTarget();

});


function completeCurrentTarget() {

  const target =
    state.targets.find(t => t.id === timerTargetId);

  if (!target) return;

  clearInterval(timerInterval);

  timerRunning = false;

  target.completed = true;

  state.studySeconds += timerSeconds;

  state.completedToday++;

  state.score += calculateTargetScore(target);

  updateStreak();

  saveState();

  focusPanel.classList.add("hidden");

  timerTargetId = null;

  timerSeconds = 0;

  updateUI();

  showToast(
    `Target completed! 🔥 +${calculateTargetScore(target)} points`
  );

}


function calculateTargetScore(target) {

  const base = Math.min(30,target.duration / 2);

  return Math.round(base);

}


/* ==========================================
   SKIP / RESCHEDULE
========================================== */

skipTargetBtn.addEventListener("click", () => {

  const target = getCurrentTarget();

  if (!target) return;

  openRescheduleModal(target);

});


function openRescheduleModal(target) {

  openModal(`

    <h2>Reschedule Target</h2>

    <p style="color:var(--muted);margin-bottom:20px">
      What do you want to do with this target?
    </p>

    <div style="display:grid;gap:10px">

      <button class="primary-btn"
        onclick="moveTargetLater('${target.id}')">
        Move to Later
      </button>

      <button class="secondary-btn"
        onclick="moveTargetTomorrow('${target.id}')">
        Move to Tomorrow
      </button>

      <button class="secondary-btn"
        onclick="deleteTarget('${target.id}');closeModalWindow()">
        Remove Target
      </button>

    </div>
  `);

}


function moveTargetLater(id) {

  const index =
    state.targets.findIndex(t => t.id === id);

  if (index === -1) return;

  const [target] =
    state.targets.splice(index,1);

  target.order =
    Math.max(...state.targets.map(t => t.order),0) + 1;

  state.targets.push(target);

  saveState();

  closeModalWindow();

  updateUI();

}


function moveTargetTomorrow(id) {

  const index =
    state.targets.findIndex(t => t.id === id);

  if (index === -1) return;

  const [target] =
    state.targets.splice(index,1);

  state.tomorrowTargets.push(target);

  saveState();

  closeModalWindow();

  updateUI();

  showToast("Moved to tomorrow 📅");

}


/* ==========================================
   ADD TARGET
========================================== */

$("addTargetBtn").addEventListener(
  "click",
  openAddTarget
);


function openAddTarget() {

  const subjects =
    Object.keys(
      SUBJECT_DATA[state.profile.exam]
    );

  openModal(`

    <h2>Add Target</h2>

    <form id="targetForm" class="modal-form">

      <input
        name="title"
        placeholder="Target title"
        required
      >

      <select name="subject">

        ${subjects.map(subject =>
          `<option>${subject}</option>`
        ).join("")}

      </select>

      <input
        name="chapter"
        placeholder="Chapter / Topic"
        required
      >

      <input
        name="duration"
        type="number"
        min="5"
        value="45"
        placeholder="Minutes"
        required
      >

      <button class="primary-btn">
        Add Target
      </button>

    </form>
  `);


  $("targetForm").addEventListener(
    "submit",
    event => {

      event.preventDefault();

      const form =
        new FormData(event.target);

      const target = {

        id: crypto.randomUUID(),

        title: form.get("title"),

        subject: form.get("subject"),

        chapter: form.get("chapter"),

        duration:
          Number(form.get("duration")),

        completed: false,

        order:
          Math.max(
            ...state.targets.map(t => t.order),
            0
          ) + 1

      };

      state.targets.push(target);

      saveState();

      closeModalWindow();

      updateUI();

      showToast("Target added 🎯");

    }
  );

}


/* ==========================================
   EDIT TARGET
========================================== */

function editTarget(id) {

  const target =
    state.targets.find(t => t.id === id);

  if (!target) return;

  const subjects =
    Object.keys(
      SUBJECT_DATA[state.profile.exam]
    );

  openModal(`

    <h2>Edit Target</h2>

    <form id="editTargetForm" class="modal-form">

      <input
        name="title"
        value="${escapeAttr(target.title)}"
        required
      >

      <select name="subject">

        ${subjects.map(subject =>
          `<option ${subject === target.subject ? "selected" : ""}>
            ${subject}
          </option>`
        ).join("")}

      </select>

      <input
        name="chapter"
        value="${escapeAttr(target.chapter)}"
        required
      >

      <input
        name="duration"
        type="number"
        min="5"
        value="${target.duration}"
        required
      >

      <button class="primary-btn">
        Save Changes
      </button>

    </form>
  `);


  $("editTargetForm").addEventListener(
    "submit",
    event => {

      event.preventDefault();

      const form =
        new FormData(event.target);

      target.title =
        form.get("title");

      target.subject =
        form.get("subject");

      target.chapter =
        form.get("chapter");

      target.duration =
        Number(form.get("duration"));

      saveState();

      closeModalWindow();

      updateUI();

    }
  );

}


/* ==========================================
   DELETE
========================================== */

function deleteTarget(id) {

  const target =
    state.targets.find(t => t.id === id);

  if (!target) return;

  if (!confirm(
    `Delete "${target.title}"?`
  )) return;

  state.targets =
    state.targets.filter(
      t => t.id !== id
    );

  saveState();

  updateUI();

}


/* ==========================================
   DAILY REPORT
========================================== */

$("reportBtn").addEventListener(
  "click",
  showDailyReport
);


function showDailyReport() {

  const completed =
    state.targets.filter(t => t.completed).length;

  const total =
    state.targets.length;

  const rate =
    total
      ? Math.round((completed / total) * 100)
      : 0;

  openModal(`

    <div style="text-align:center">

      <div style="font-size:55px">
        ${rate >= 80 ? "🏆" : rate >= 50 ? "🔥" : "💪"}
      </div>

      <h2>Today's Report</h2>

      <p style="color:var(--muted)">
        ${formatDate(new Date())}
      </p>

      <div class="stats-grid" style="margin-top:20px">

        <div class="stat-card">
          <strong>${completed}</strong>
          <small>Completed</small>
        </div>

        <div class="stat-card">
          <strong>${rate}%</strong>
          <small>Completion</small>
        </div>

        <div class="stat-card">
          <strong>${formatStudyTime(state.studySeconds)}</strong>
          <small>Study Time</small>
        </div>

        <div class="stat-card">
          <strong>${state.score}</strong>
          <small>Score</small>
        </div>

      </div>

      <button
        class="primary-btn"
        style="margin-top:25px;width:100%"
        onclick="closeModalWindow()">
        Continue
      </button>

    </div>

  `);

}


/* ==========================================
   TOMORROW
========================================== */

$("tomorrowBtn").addEventListener(
  "click",
  () => {

    openModal(`

      <h2>Tomorrow's Plan 📅</h2>

      ${
        state.tomorrowTargets.length
        ?
        state.tomorrowTargets.map(
          t => `
            <div class="target-item"
                 style="margin-bottom:10px">
              <div class="target-number">•</div>
              <div>
                <h3>${escapeHTML(t.title)}</h3>
                <p>${escapeHTML(t.subject)} • ${t.duration} min</p>
              </div>
            </div>
          `
        ).join("")
        :
        `
          <p style="color:var(--muted)">
            No targets planned yet.
          </p>
        `
      }

    `);

  }
);


/* ==========================================
   NOTES
========================================== */

$("notesBtn").addEventListener(
  "click",
  () => {

    openModal(`

      <h2>Study Notes 📝</h2>

      <textarea
        id="notesInput"
        class="modal-form"
        style="width:100%;min-height:200px;background:var(--card2);color:white;border:1px solid var(--border);border-radius:12px;padding:15px"
        placeholder="Write today's notes..."
      >${escapeHTML(state.notes)}</textarea>

      <button
        id="saveNotes"
        class="primary-btn"
        style="margin-top:15px;width:100%">
        Save Notes
      </button>

    `);

    $("saveNotes").onclick = () => {

      state.notes =
        $("notesInput").value;

      saveState();

      closeModalWindow();

      showToast("Notes saved 📝");

    };

  }
);


/* ==========================================
   HISTORY
========================================== */

$("historyBtn").addEventListener(
  "click",
  () => {

    const history =
      [...state.history].reverse();

    openModal(`

      <h2>Study History 📊</h2>

      ${
        history.length
        ?
        history.map(item => `

          <div class="target-item"
               style="margin-bottom:10px">

            <div class="target-number">
              📅
            </div>

            <div>

              <h3>${item.date}</h3>

              <p>
                ${item.completed}/${item.total}
                targets
                •
                ${formatStudyTime(item.studySeconds)}
                •
                ${item.score} points
              </p>

            </div>

          </div>

        `).join("")
        :
        `<p style="color:var(--muted)">
          Your completed days will appear here.
        </p>`
      }

    `);

  }
);


/* ==========================================
   PROFILE
========================================== */

$("profileBtn").addEventListener(
  "click",
  () => {

    const p = state.profile;

    openModal(`

      <h2>Your Profile 👤</h2>

      <div class="target-item">

        <div class="target-number">
          ${p.firstName.charAt(0)}
        </div>

        <div>

          <h3>
            ${escapeHTML(p.firstName)}
            ${escapeHTML(p.lastName)}
          </h3>

          <p>
            ${p.exam} • Target ${p.year}
          </p>

        </div>

      </div>

      <button
        class="secondary-btn"
        style="margin-top:15px;width:100%"
        onclick="closeModalWindow()">
        Close
      </button>

    `);

  }
);


/* ==========================================
   NOTIFICATIONS
========================================== */

$("notificationBtn").addEventListener(
  "click",
  requestNotifications
);


async function requestNotifications() {

  if (!("Notification" in window)) {

    showToast(
      "Browser notifications are not supported."
    );

    return;

  }

  if (Notification.permission === "default") {

    await Notification.requestPermission();

  }

  if (Notification.permission === "granted") {

    new Notification(
      "Daily Target Alert 🎯",
      {
        body:
          "Notifications are enabled. Stay consistent!"
      }
    );

    showToast("Notifications enabled 🔔");

  }

}


/* ==========================================
   TARGET ALERT CHECKER
========================================== */

setInterval(() => {

  const target = getCurrentTarget();

  if (!target) return;

  const key =
    `alert_${state.date}_${target.id}`;

  if (localStorage.getItem(key)) return;

  /*
    Simple in-page alert system.
    This checks while the page is open.
  */

  const hour =
    new Date().getHours();

  if (hour >= 6) {

    localStorage.setItem(key,"1");

    if (
      "Notification" in window &&
      Notification.permission === "granted"
    ) {

      new Notification(
        "TARGET ALERT 🎯",
        {
          body:
            `${target.subject}: ${target.title}`
        }
      );

    }

  }

},60000);


/* ==========================================
   THEME
========================================== */

$("themeBtn").addEventListener(
  "click",
  () => {

    state.theme =
      state.theme === "dark"
        ? "light"
        : "dark";

    saveState();

    applyTheme();

  }
);


function applyTheme() {

  document.body.classList.toggle(
    "light",
    state.theme === "light"
  );

  $("themeBtn").textContent =
    state.theme === "dark"
      ? "🌙"
      : "☀️";

}


/* ==========================================
   EXPORT / IMPORT
========================================== */

$("exportBtn").addEventListener(
  "click",
  () => {

    const blob =
      new Blob(
        [JSON.stringify(state,null,2)],
        {type:"application/json"}
      );

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;

    a.download =
      `daily-target-alert-${getToday()}.json`;

    a.click();

    URL.revokeObjectURL(url);

  }
);


$("importBtn").addEventListener(
  "click",
  () => {

    $("importFile").click();

  }
);


$("importFile").addEventListener(
  "change",
  event => {

    const file =
      event.target.files[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload = () => {

      try {

        const imported =
          JSON.parse(reader.result);

        state = imported;

        saveState();

        location.reload();

      } catch {

        alert(
          "Invalid backup file."
        );

      }

    };

    reader.readAsText(file);

  }
);


/* ==========================================
   LOGOUT
========================================== */

$("logoutBtn").addEventListener(
  "click",
  () => {

    if (!confirm(
      "Logout from this device?"
    )) return;

    state.profile = null;

    saveState();

    location.reload();

  }
);


/* ==========================================
   MODAL
========================================== */

function openModal(content) {

  modalContent.innerHTML = content;

  modalOverlay.classList.remove(
    "hidden"
  );

}


function closeModalWindow() {

  modalOverlay.classList.add(
    "hidden"
  );

  modalContent.innerHTML = "";

}


closeModal.addEventListener(
  "click",
  closeModalWindow
);


modalOverlay.addEventListener(
  "click",
  event => {

    if (event.target === modalOverlay) {

      closeModalWindow();

    }

  }
);


/* ==========================================
   STREAK
========================================== */

function updateStreak() {

  const today =
    getToday();

  const lastHistory =
    state.history[state.history.length - 1];

  if (!lastHistory) {

    state.streak = 1;

    return;

  }

  const yesterday =
    new Date();

  yesterday.setDate(
    yesterday.getDate() - 1
  );

  const yesterdayString =
    getDateString(yesterday);

  if (
    lastHistory.date === yesterdayString
  ) {

    state.streak++;

  } else if (
    lastHistory.date !== today
  ) {

    state.streak = 1;

  }

}


/* ==========================================
   HELPERS
========================================== */

function getToday() {

  return getDateString(
    new Date()
  );

}


function getDateString(date) {

  return date
    .toISOString()
    .split("T")[0];

}


function formatDate(date) {

  return date.toLocaleDateString(
    "en-IN",
    {
      weekday:"long",
      day:"numeric",
      month:"long",
      year:"numeric"
    }
  );

}


function formatMinutes(minutes) {

  if (minutes < 60) {

    return `${minutes} min`;

  }

  const h =
    Math.floor(minutes / 60);

  const m =
    minutes % 60;

  return m
    ? `${h}h ${m}m`
    : `${h}h`;

}


function formatClock(seconds) {

  const h =
    Math.floor(seconds / 3600);

  const m =
    Math.floor((seconds % 3600) / 60);

  const s =
    seconds % 60;

  return [
    h,m,s
  ]
  .map(
    n => String(n).padStart(2,"0")
  )
  .join(":");

}


function formatStudyTime(seconds) {

  const hours =
    Math.floor(seconds / 3600);

  const minutes =
    Math.floor((seconds % 3600) / 60);

  if (hours) {

    return `${hours}h ${minutes}m`;

  }

  return `${minutes}m`;

}


function escapeHTML(value) {

  return String(value)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");

}


function escapeAttr(value) {

  return escapeHTML(value);

}


function showToast(message) {

  const toast =
    document.createElement("div");

  toast.textContent = message;

  Object.assign(
    toast.style,
    {
      position:"fixed",
      bottom:"25px",
      left:"50%",
      transform:"translateX(-50%)",
      padding:"13px 18px",
      background:"#171d2e",
      color:"white",
      border:"1px solid rgba(255,255,255,.1)",
      borderRadius:"12px",
      zIndex:"9999",
      boxShadow:"0 15px 40px rgba(0,0,0,.3)",
      fontWeight:"700"
    }
  );

  document.body.appendChild(toast);

  setTimeout(
    () => toast.remove(),
    2500
  );

}


/* ==========================================
   START
========================================== */

if (state.profile) {

  showApp();

} else {

  loginScreen.classList.remove("hidden");
  appScreen.classList.add("hidden");

}
