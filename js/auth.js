const message = document.getElementById("message");

function show(text, ok = false) {
    message.textContent = text;
    message.className = ok ? "message ok" : "message";
}

/* ---------- Student ID check (10 digits only) ---------- */
const studentIdInput = document.getElementById("student_id");
const studentIdMsg = document.getElementById("studentIdMsg");

function checkStudentId() {
    const value = studentIdInput.value;
    let error = "";

    if (value === "") {
        error = "Student ID is required.";
    } else if (/\D/.test(value)) {
        error = "Student ID must contain numbers only.";
    } else if (value.length !== 10) {
        error = "Student ID must be exactly 10 digits.";
    }

    if (studentIdMsg) {
        studentIdMsg.textContent = error;
        studentIdMsg.classList.toggle("error", error !== "");
    }
    studentIdInput.classList.toggle("invalid", error !== "");
    return error === "";
}

if (studentIdInput) {
    studentIdInput.addEventListener("input", checkStudentId);
}

// send data to the Python server and get its answer back
async function post(url, data) {
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return await response.json();
    } catch (error) {
        return { ok: false, message: "Cannot reach the server. Is app.py running?" };
    }
}

/* ---------- login page ---------- */
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!checkStudentId()) {
            show("Please enter a valid 10-digit Student ID.");
            studentIdInput.focus();
            return;
        }

        const result = await post("/api/login", {
            student_id: document.getElementById("student_id").value,
            password: document.getElementById("password").value,
        });

        show(result.message, result.ok);
        if (result.ok) {
            setTimeout(() => (window.location.href = "home.html"), 600);
        }
    });
}

/* ---------- sign up page ---------- */
const signupForm = document.getElementById("signupForm");
if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!checkStudentId()) {
            show("Please enter a valid 10-digit Student ID.");
            studentIdInput.focus();
            return;
        }

        const result = await post("/api/signup", {
            name: document.getElementById("full_name").value,
            student_id: document.getElementById("student_id").value,
            password: document.getElementById("password").value,
            confirm: document.getElementById("confirm_password").value,
        });

        show(result.message, result.ok);
        if (result.ok) {
            setTimeout(() => (window.location.href = "login.html"), 1200);
        }
    });
}