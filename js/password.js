const eyeOpen = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;

const eyeOff = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

/* ---------- eye button: show or hide the password ---------- */
document.querySelectorAll(".eye").forEach((btn) => {
    btn.innerHTML = eyeOpen;

    btn.addEventListener("click", () => {
        const input = btn.parentElement.querySelector("input");
        const show = input.type === "password";

        input.type = show ? "text" : "password";
        btn.innerHTML = show ? eyeOff : eyeOpen;
        btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
});

/* ---------- Caps Lock warning ---------- */
document.querySelectorAll(".field input").forEach((input) => {
    const warning = document.createElement("p");
    warning.className = "hint bad";
    input.parentElement.after(warning);

    function check(e) {
        const on = e.getModifierState && e.getModifierState("CapsLock");
        warning.textContent = on ? "Caps Lock is on." : "";
    }

    input.addEventListener("keydown", check);
    input.addEventListener("keyup", check);
    input.addEventListener("blur", () => { warning.textContent = ""; });
});

/* ---------- confirm password: live match check (sign up only) ---------- */
const passwordInput = document.getElementById("password");
const confirmInput = document.getElementById("confirm_password");
const matchMsg = document.getElementById("matchMsg");

function checkMatch() {
    if (confirmInput.value === "") {
        matchMsg.textContent = "";
        matchMsg.className = "hint";
    } else if (confirmInput.value === passwordInput.value) {
        matchMsg.textContent = "Passwords match.";
        matchMsg.className = "hint ok";
    } else {
        matchMsg.textContent = "Passwords do not match.";
        matchMsg.className = "hint bad";
    }
}

if (confirmInput && matchMsg) {
    confirmInput.addEventListener("input", checkMatch);
    passwordInput.addEventListener("input", checkMatch);
}