const current = location.pathname.split("/").pop();

document.getElementById("nav").innerHTML = `
  <header class="nav-bar">
    <div class="nav-brand">
      <h1>CPU Scheduling System</h1>
      <span>College of Engineering and Architecture</span>
    </div>
    <nav class="nav-links">
      <a href="home.html" class="${current === "home.html" ? "active" : ""}">Home</a>
      <a href="scheduler.html" class="${current === "scheduler.html" ? "active" : ""}">Scheduler</a>
      <a href="/logout" class="nav-user" title="Sign out">
        <span class="nav-avatar" id="navAvatar">?</span>
        <span id="navName">Sign out</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="Sign out">
          <path d="M14 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2"/>
          <path d="M9 12h12l-3-3M18 15l3-3"/>
        </svg>
      </a>
    </nav>
  </header>
`;

/* Logout confirmation dialog */
document.body.insertAdjacentHTML("beforeend", `
  <div id="logoutModal" class="logout-modal">
    <div class="logout-box">
      <h3>Are you sure you want to logout?</h3>
      <p>You will be signed out of the system.</p>
      <div class="logout-actions">
        <button type="button" id="logoutNo">Cancel</button>
        <button type="button" id="logoutYes">Yes, logout</button>
      </div>
    </div>
  </div>
`);

const logoutModal = document.getElementById("logoutModal");

function openLogout() {
  logoutModal.classList.add("open");
}

function closeLogout() {
  logoutModal.classList.remove("open");
}

// Navbar sign-out link and the Exit button both open the dialog
document.addEventListener("click", function (e) {
  if (e.target.closest(".nav-user")) {
    e.preventDefault();
    openLogout();
  }
});

document.getElementById("logoutNo").addEventListener("click", closeLogout);

document.getElementById("logoutYes").addEventListener("click", function () {
  window.location.href = "/logout";
});

logoutModal.addEventListener("click", function (e) {
  if (e.target === logoutModal) closeLogout();
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") closeLogout();
});

fetch("/api/me")
  .then(res => res.json())
  .then(data => {
    if (data.ok) {
      document.getElementById("navName").textContent = data.name;
      document.getElementById("navAvatar").textContent = data.name.charAt(0).toUpperCase();
    }
  });