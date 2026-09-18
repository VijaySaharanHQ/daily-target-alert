```javascript
/* ==========================================
   DAILY TARGET ALERT
   JEE / NEET STUDY DASHBOARD
========================================== */

const STORAGE_KEY = APP_CONFIG.storageKey;

let data = loadData();

const $ = id => document.getElementById(id);

const todayKey = () => {
  const d = new Date();

  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0")
  ].join("-");
};

const today = todayKey();

/* ==========================================
   STORAGE
========================================== */

function loadData() {

  try {

    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return structuredClone(APP_CONFIG.defaultData);
    }

    const parsed = JSON.parse(saved);

    return {
      ...structuredClone(APP_CONFIG.defaultData),
      ...parsed,
      settings: {
        ...APP_CONFIG.defaultData.settings,
        ...(parsed.settings || {})
      }
    };

  } catch (error) {

    console.error(error);

    return structuredClone(APP_CONFIG.defaultData);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* ==========================================
   INIT
========================================== */

document.addEventListener("DOMContentLoaded", () => {

  initializeTheme();
  initializeNavigation();
  initializeExamSwitch();
  initializeModal();
  initializeTargets();
  initializeNotes();
  initializeSettings();
  initializeNotifications();
  initializeDeadline();

  updateDate();
  updateClock();
  updateCountdown();
  updateDashboard();

  setInterval(updateClock, 1000);
  setInterval(updateCountdown, 1000);

  checkReminderTargets();

  setInterval(checkReminderTargets, 30000);

});

/* ==========================================
   THEME
========================================== */

function initializeTheme() {

  if (data.settings.darkMode) {
    document.body.classList.add("dark");
  }

  $("modeToggle").addEventListener("click", toggleTheme);
}

function toggleTheme() {

  document.body.classList.toggle("dark");

  data.settings.darkMode =
    document.body.classList.contains("dark");

  saveData();

  $("modeToggle").textContent =
    data.settings.darkMode
      ? "☀️ Light Mode"
      : "🌙 Dark Mode";
}

/* ==========================================
   NAVIGATION
========================================== */

function initializeNavigation() {

  document.querySelectorAll(".nav-item")
    .forEach(button => {

      button.addEventListener("click", () => {

        const section = button.dataset.section;

        showSection(section);

        document
          .querySelector(".sidebar")
          .classList.remove("open");

      });

    });

  $("mobileMenu").addEventListener("click", () => {
    $("sidebar").classList.toggle("open");
  });
}

function showSection(section) {

  document
    .querySelectorAll(".page-section")
    .forEach(page => page.classList.remove("active"));

  document
    .querySelectorAll(".nav-item")
    .forEach(button => button.classList.remove("active"));

  const page = $(section);

  if (page) page.classList.add("active");

  const navButton =
    document.querySelector(`[data-section="${section}"]`);

  if (navButton) navButton.classList.add("active");

  const titles = {
    dashboard: "Daily Dashboard",
    targets: "My Targets",
    history: "Study History",
    analytics: "Analytics",
    notes: "Study Notes",
    settings: "Settings"
  };

  $("pageTitle").textContent =
    titles[section] || "Daily Dashboard";

  if (section === "history") renderHistory();
  if (section === "analytics") renderAnalytics();
  if (section === "targets") renderAllTargets();
}

/* ==========================================
   EXAM SWITCH
========================================== */

function initializeExamSwitch() {

  document.querySelectorAll(".exam-btn")
    .forEach(button => {

      button.addEventListener("click", () => {

        document
          .querySelectorAll(".exam-btn")
          .forEach(btn => btn.classList.remove("active"));

        button.classList.add("active");

        data.exam = button.dataset.exam;

        saveData();

        showToast(
          `${data.exam} mode activated 🎯`
        );

      });

    });

  document
    .querySelectorAll(".exam-btn")
    .forEach(btn => {

      btn.classList.toggle(
        "active",
        btn.dataset.exam === data.exam
      );

    });
}

/* ==========================================
   DATE / CLOCK
========================================== */

function updateDate() {

  const date = new Date();

  $("todayDate").textContent =
    date.toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    );
}

function updateClock() {

  const now = new Date();

  $("liveClock").textContent =
    now.toLocaleTimeString(
      "en-IN",
      {
        hour12: false
      }
    );
}

/* ==========================================
   COUNTDOWN
========================================== */

function initializeDeadline() {

  const savedDeadline =
    data.settings.deadline || APP_CONFIG.defaultDeadline;

  $("deadlineInput").value = savedDeadline;

  $("deadlineInput").addEventListener("change", event => {

    data.settings.deadline = event.target.value;

    saveData();

    updateCountdown();

    showToast("Deadline updated ⏰");
  });
}

function updateCountdown() {

  const deadline =
    data.settings.deadline || "23:00";

  const [hours, minutes] =
    deadline.split(":").map(Number);

  const now = new Date();

  const target = new Date();

  target.setHours(hours, minutes, 0, 0);

  let difference =
    target.getTime() - now.getTime();

  if (difference < 0) {

    difference = 0;

    $("deadlineStatus").textContent = "DEADLINE PASSED";

    $("deadlineStatus").style.background =
      "#fef2f2";

    $("deadlineStatus").style.color =
      "#dc2626";

  } else {

    $("deadlineStatus").textContent = "ON TRACK";

    $("deadlineStatus").style.background =
      "#ecfdf5";

    $("deadlineStatus").style.color =
      "#059669";
  }

  const totalSeconds =
    Math.floor(difference / 1000);

  const h =
    Math.floor(totalSeconds / 3600);

  const m =
    Math.floor((totalSeconds % 3600) / 60);

  const s =
    totalSeconds % 60;

  $("hours").textContent =
    String(h).padStart(2, "0");

  $("minutes").textContent =
    String(m).padStart(2, "0");

  $("seconds").textContent =
    String(s).padStart(2, "0");
}

/* ==========================================
   MODAL
========================================== */

function initializeModal() {

  ["openAddTarget", "emptyAddButton", "targetsAddButton"]
    .forEach(id => {

      const button = $(id);

      if (button) {
        button.addEventListener("click", openModal);
      }

    });

  $("closeModal").addEventListener("click", closeModal);
  $("cancelModal").addEventListener("click", closeModal);

  $("targetModal").addEventListener("click", event => {

    if (event.target === $("targetModal")) {
      closeModal();
    }

  });

  $("targetForm").addEventListener(
    "submit",
    addTarget
  );
}

function openModal() {

  $("targetModal").classList.add("show");

  $("targetInput").focus();
}

function closeModal() {

  $("targetModal").classList.remove("show");

  $("targetForm").reset();
}

/* ==========================================
   TARGETS
========================================== */

function initializeTargets() {

  renderTargets();
}

function addTarget(event) {

  event.preventDefault();

  const target = {

    id:
      Date.now().toString(),

    subject:
      $("subjectInput").value,

    title:
      $("targetInput").value.trim(),

    priority:
      $("priorityInput").value,

    reminder:
      $("reminderInput").value,

    completed:
      false,

    createdAt:
      new Date().toISOString(),

    date:
      today

  };

  if (!target.title) return;

  data.targets.push(target);

  saveData();

  closeModal();

  renderTargets();
  updateDashboard();

  showToast("Target added successfully 🎯");
}

function renderTargets() {

  const list = $("targetList");
  const allList = $("allTargets");

  const todaysTargets =
    data.targets.filter(
      target => target.date === today
    );

  renderTargetContainer(
    list,
    todaysTargets
  );

  if (allList) {

    renderTargetContainer(
      allList,
      data.targets
    );
  }

  $("emptyTargets").style.display =
    todaysTargets.length
      ? "none"
      : "block";
}

function renderAllTargets() {

  renderTargetContainer(
    $("allTargets"),
    data.targets
  );
}

function renderTargetContainer(
  container,
  targets
) {

  if (!container) return;

  container.innerHTML = "";

  if (!targets.length) {

    container.innerHTML = `
      <div class="empty-state">
        <div>📚</div>
        <h3>No targets available</h3>
        <p>Create a target to begin.</p>
      </div>
    `;

    return;
  }

  targets
    .slice()
    .reverse()
    .forEach(target => {

      const item =
        document.createElement("div");

      item.className =
        `target-item ${
          target.completed ? "completed" : ""
        }`;

      item.innerHTML = `

        <input
          class="target-check"
          type="checkbox"
          ${target.completed ? "checked" : ""}
          data-id="${target.id}"
        >

        <div class="target-info">

          <strong>
            ${escapeHTML(target.title)}
          </strong>

          <small>
            ${escapeHTML(target.subject)}
            ${target.reminder
              ? ` • ⏰ ${target.reminder}`
              : ""}
          </small>

        </div>

        <div>

          <span class="priority ${target.priority}">
            ${target.priority}
          </span>

          <button
            class="delete-target"
            data-delete="${target.id}"
            title="Delete"
          >
            🗑️
          </button>

        </div>
      `;

      container.appendChild(item);

    });

  container
    .querySelectorAll(".target-check")
    .forEach(check => {

      check.addEventListener(
        "change",
        () => toggleTarget(check.dataset.id)
      );

    });

  container
    .querySelectorAll("[data-delete]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => deleteTarget(button.dataset.delete)
      );

    });
}

function toggleTarget(id) {

  const target =
    data.targets.find(t => t.id === id);

  if (!target) return;

  target.completed =
    !target.completed;

  saveData();

  renderTargets();
  updateDashboard();

  if (target.completed) {

    showToast("Target completed! 🔥");

    updateDailyHistory();
  }
}

function deleteTarget(id) {

  const target =
    data.targets.find(t => t.id === id);

  if (!target) return;

  const confirmed =
    confirm(
      `Delete "${target.title}"?`
    );

  if (!confirmed) return;

  data.targets =
    data.targets.filter(
      target => target.id !== id
    );

  saveData();

  renderTargets();
  updateDashboard();

  showToast("Target deleted");
}

/* ==========================================
   DASHBOARD
========================================== */

function updateDashboard() {

  const todaysTargets =
    data.targets.filter(
      target => target.date === today
    );

  const total =
    todaysTargets.length;

  const completed =
    todaysTargets.filter(
      target => target.completed
    ).length;

  const remaining =
    total - completed;

  const percentage =
    total === 0
      ? 0
      : Math.round(
          completed / total * 100
        );

  $("totalTargets").textContent =
    total;

  $("completedTargets").textContent =
    completed;

  $("remainingTargets").textContent =
    remaining;

  $("progressPercent").textContent =
    `${percentage}%`;

  $("ringPercent").textContent =
    `${percentage}%`;

  $("progressRing").style.background =
    `conic-gradient(
      var(--primary) ${percentage}%,
      #e5e7eb ${percentage}%
    )`;

  const streak =
    calculateCurrentStreak();

  $("dashboardStreak").textContent =
    streak;

  $("sideStreak").textContent =
    `${streak} Day${streak === 1 ? "" : "s"}`;

  updateDailyHistory();
}

/* ==========================================
   HISTORY
========================================== */

function updateDailyHistory() {

  const todaysTargets =
    data.targets.filter(
      target => target.date === today
    );

  const total =
    todaysTargets.length;

  const completed =
    todaysTargets.filter(
      target => target.completed
    ).length;

  const percentage =
    total === 0
      ? 0
      : Math.round(
          completed / total * 100
        );

  data.history[today] = {
    total,
    completed,
    percentage
  };

  saveData();
}

function renderHistory() {

  const container =
    $("historyGrid");

  container.innerHTML = "";

  const days = [];

  for (let i = 6; i >= 0; i--) {

    const date =
      new Date();

    date.setDate(
      date.getDate() - i
    );

    const key =
      formatDateKey(date);

    days.push({
      date,
      key
    });
  }

  days.forEach(({ date, key }) => {

    const history =
      data.history[key] || {
        total: 0,
        completed: 0,
        percentage: 0
      };

    const card =
      document.createElement("div");

    card.className =
      "history-day";

    card.innerHTML = `

      <span class="day">
        ${date.toLocaleDateString(
          "en-IN",
          { weekday: "short" }
        )}
      </span>

      <strong>
        ${history.percentage}%
      </strong>

      <small>
        ${history.completed}/${history.total}
        targets
      </small>

    `;

    container.appendChild(card);
  });
}

/* ==========================================
   ANALYTICS
========================================== */

function renderAnalytics() {

  const allHistory =
    Object.values(data.history);

  const completed =
    allHistory.reduce(
      (sum, day) =>
        sum + (day.completed || 0),
      0
    );

  const average =
    allHistory.length
      ? Math.round(
          allHistory.reduce(
            (sum, day) =>
              sum + (day.percentage || 0),
            0
          ) / allHistory.length
        )
      : 0;

  $("analyticsCompleted").textContent =
    completed;

  $("bestStreak").textContent =
    calculateBestStreak();

  $("averageCompletion").textContent =
    `${average}%`;

  renderActivityChart();
}

function renderActivityChart() {

  const chart =
    $("activityChart");

  chart.innerHTML = "";

  for (let i = 6; i >= 0; i--) {

    const date =
      new Date();

    date.setDate(
      date.getDate() - i
    );

    const key =
      formatDateKey(date);

    const percentage =
      data.history[key]?.percentage || 0;

    const wrapper =
      document.createElement("div");

    wrapper.className =
      "chart-bar-wrapper";

    wrapper.innerHTML = `

      <div class="chart-value">
        ${percentage}%
      </div>

      <div
        class="chart-bar"
        style="height:${Math.max(
          percentage,
          5
        )}%"
      ></div>

      <div class="chart-label">
        ${date.toLocaleDateString(
          "en-IN",
          { weekday: "short" }
        )}
      </div>

    `;

    chart.appendChild(wrapper);
  }
}

/* ==========================================
   STREAK
========================================== */

function calculateCurrentStreak() {

  let streak = 0;

  const date =
    new Date();

  while (true) {

    const key =
      formatDateKey(date);

    const history =
      data.history[key];

    if (
      history &&
      history.total > 0 &&
      history.percentage >= 100
    ) {

      streak++;

      date.setDate(
        date.getDate() - 1
      );

    } else {

      break;
    }
  }

  return streak;
}

function calculateBestStreak() {

  const dates =
    Object.keys(data.history)
      .sort();

  let best = 0;
  let current = 0;

  for (const key of dates) {

    const history =
      data.history[key];

    if (
      history &&
      history.total > 0 &&
      history.percentage >= 100
    ) {

      current++;

      best =
        Math.max(
          best,
          current
        );

    } else {

      current = 0;
    }
  }

  return best;
}

/* ==========================================
   NOTES
========================================== */

function initializeNotes() {

  $("notesArea").value =
    data.notes[today] || "";

  $("notesArea").addEventListener(
    "input",
    () => {

      data.notes[today] =
        $("notesArea").value;

      saveData();

      $("saveStatus").textContent =
        "Saved automatically ✓";

    }
  );

  $("saveNotes").addEventListener(
    "click",
    () => {

      data.notes[today] =
        $("notesArea").value;

      saveData();

      showToast("Notes saved 📝");
    }
  );
}

/* ==========================================
   NOTIFICATIONS
========================================== */

function initializeNotifications() {

  $("notificationButton")
    .addEventListener(
      "click",
      requestNotifications
    );

  $("enableNotifications")
    .addEventListener(
      "click",
      requestNotifications
    );
}

async function requestNotifications() {

  if (!("Notification" in window)) {

    showToast(
      "Notifications are not supported."
    );

    return;
  }

  const permission =
    await Notification.requestPermission();

  if (permission === "granted") {

    data.settings.notifications =
      true;

    saveData();

    new Notification(
      "Daily Target Alert",
      {
        body:
          "Notifications are now enabled. Keep studying! 🔥"
      }
    );

    showToast(
      "Notifications enabled 🔔"
    );

  } else {

    showToast(
      "Notification permission denied."
    );
  }
}

/* ==========================================
   REMINDERS
========================================== */

function checkReminderTargets() {

  if (
    !data.settings.notifications ||
    Notification.permission !== "granted"
  ) {
    return;
  }

  const now =
    new Date();

  const currentTime =
    now.toTimeString()
      .slice(0, 5);

  data.targets
    .filter(target =>
      target.date === today &&
      !target.completed &&
      target.reminder === currentTime
    )
    .forEach(target => {

      new Notification(
        "🎯 Target Reminder",
        {
          body:
            `${target.subject}: ${target.title}`
        }
      );

    });
}

/* ==========================================
   SETTINGS
========================================== */

function initializeSettings() {

  $("exportData")
    .addEventListener(
      "click",
      exportData
    );

  $("importData")
    .addEventListener(
      "change",
      importData
    );

  $("resetData")
    .addEventListener(
      "click",
      resetData
    );
}

function exportData() {

  const blob =
    new Blob(
      [
        JSON.stringify(
          data,
          null,
          2
        )
      ],
      {
        type: "application/json"
      }
    );

  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

  a.href = url;

  a.download =
    `daily-target-alert-${today}.json`;

  a.click();

  URL.revokeObjectURL(url);

  showToast("Backup exported 💾");
}

function importData(event) {

  const file =
    event.target.files[0];

  if (!file) return;

  const reader =
    new FileReader();

  reader.onload = () => {

    try {

      const imported =
        JSON.parse(
          reader.result
        );

      data = {
        ...structuredClone(
          APP_CONFIG.defaultData
        ),
        ...imported
      };

      saveData();

      location.reload();

    } catch {

      showToast(
        "Invalid backup file."
      );
    }
  };

  reader.readAsText(file);
}

function resetData() {

  const confirmed =
    confirm(
      "This will permanently delete all your targets, history and notes. Continue?"
    );

  if (!confirmed) return;

  localStorage.removeItem(
    STORAGE_KEY
  );

  location.reload();
}

/* ==========================================
   HELPERS
========================================== */

function formatDateKey(date) {

  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1
    ).padStart(2, "0"),
    String(
      date.getDate()
    ).padStart(2, "0")
  ].join("-");
}

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {

  const container =
    $("toastContainer");

  const toast =
    document.createElement("div");

  toast.className =
    "toast";

  toast.textContent =
    message;

  container.appendChild(toast);

  setTimeout(() => {

    toast.remove();

  }, 3000);
}
```
