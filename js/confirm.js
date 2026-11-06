// Creates the popup once and reuses it
function askConfirm(title, message, onYes) {
    let overlay = document.getElementById("confirmOverlay");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "confirmOverlay";
        overlay.className = "confirm-overlay";
        overlay.innerHTML = `
      <div class="confirm-box">
        <h3 id="confirmTitle"></h3>
        <p id="confirmMessage"></p>
        <div class="confirm-actions">
          <button class="confirm-cancel" id="confirmNo">Cancel</button>
          <button class="confirm-ok" id="confirmYes">Yes</button>
        </div>
      </div>`;
        document.body.appendChild(overlay);
    }

    document.getElementById("confirmTitle").textContent = title;
    document.getElementById("confirmMessage").textContent = message;
    overlay.classList.add("show");

    const close = () => overlay.classList.remove("show");

    document.getElementById("confirmNo").onclick = close;
    overlay.onclick = (e) => { if (e.target === overlay) close(); };
    document.getElementById("confirmYes").onclick = () => {
        close();
        onYes();
    };
}