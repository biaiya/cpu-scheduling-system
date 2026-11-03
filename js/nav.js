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

fetch("/api/me")
    .then(res => res.json())
    .then(data => {
        if (data.ok) {
            document.getElementById("navName").textContent = data.name;
            document.getElementById("navAvatar").textContent = data.name.charAt(0).toUpperCase();
        }
    });