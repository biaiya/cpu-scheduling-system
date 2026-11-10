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
    </nav>
  </header>
`;