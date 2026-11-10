const chips = document.getElementById("chips");
const quantumBox = document.getElementById("quantumBox");
const tbody = document.getElementById("processBody");
const ganttBody = document.getElementById("ganttBody");
const resultBody = document.getElementById("resultBody");

const algoNames = {
    fcfs: "FCFS",
    sjf: "SJF",
    priority: "Priority",
    rr: "Round Robin",
};

let algo = "fcfs";

/* ---------- algorithm chips ---------- */
function setAlgo(value) {
    algo = value;

    chips.querySelectorAll(".chip").forEach((chip) => {
        chip.classList.toggle("on", chip.dataset.algo === value);
    });

    // time quantum is only for Round Robin
    quantumBox.classList.toggle("hidden", value !== "rr");

    // priority column is only for Priority
    document.querySelectorAll(".col-priority").forEach((cell) => {
        cell.classList.toggle("hidden", value !== "priority");
    });
}

chips.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip || chip.dataset.algo === algo) return;

    setAlgo(chip.dataset.algo);

    // update the address bar so a refresh keeps the same algorithm
    history.replaceState(null, "", "?algo=" + chip.dataset.algo);

    // clear the old results so they don't look like they belong to the new algorithm
    ganttBody.innerHTML = `<p class="empty">Run the simulation to see the Gantt chart.</p>`;
    resultBody.innerHTML = `<p class="empty">Run the simulation to see the waiting and turnaround times.</p>`;
});
/* ---------- process table ---------- */
function addRow() {
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td class="pid"></td>
        <td><input type="number" class="arrival" min="0" placeholder="0"></td>
        <td><input type="number" class="burst" min="1" placeholder="0"></td>
        <td class="col-priority"><input type="number" class="priority" min="1" placeholder="0"></td>
    `;
    tbody.appendChild(tr);
    renumber();
    setAlgo(algo);
}

// P1, P2, P3...
function renumber() {
    Array.from(tbody.children).forEach((tr, i) => {
        tr.querySelector(".pid").textContent = "P" + (i + 1);
    });

    // P1 always arrives at 0 and cannot be edited
    const first = tbody.firstElementChild;
    if (first) {
        const arrival = first.querySelector(".arrival");
        arrival.value = 0;
        arrival.readOnly = true;
        arrival.classList.add("locked");
    }
}

// make the table have exactly n rows (existing rows keep their values)
const countInput = document.getElementById("processCount");

function setCount(n) {
    while (tbody.children.length < n) addRow();
    while (tbody.children.length > n) tbody.lastElementChild.remove();
    renumber();
}

// update the rows while typing
countInput.addEventListener("input", () => {
    const n = Math.floor(Number(countInput.value));
    if (n >= 2 && n <= 5) setCount(n);
});

const countMsg = document.getElementById("countMsg");

// when leaving the box, fix empty or out-of-range numbers and show a message
countInput.addEventListener("change", () => {
    const typed = Math.floor(Number(countInput.value));
    const n = Math.min(5, Math.max(2, typed || 2));

    if (typed !== n) {
        countMsg.textContent = "Please enter 2 to 5 processes.";
    } else {
        countMsg.textContent = "";
    }

    countInput.value = n;
    setCount(n);
});

// turn the table into a list the algorithms can use
function getProcesses() {
    return Array.from(tbody.children).map((tr, i) => ({
        id: "P" + (i + 1),
        arrival: Number(tr.querySelector(".arrival").value),
        burst: Number(tr.querySelector(".burst").value),
        priority: Number(tr.querySelector(".priority").value),
    }));
}

/* ---------- run ---------- */
const colors = ["#5d3c55", "#8d6b85", "#74506c", "#a07a97", "#43273d"];

function validate(processes, quantum) {
    // 0. no box may be left empty (empty boxes only show the placeholder)
    const rowEls = Array.from(tbody.children);
    for (let i = 0; i < rowEls.length; i++) {
        const id = "P" + (i + 1);
        if (rowEls[i].querySelector(".arrival").value.trim() === "") {
            return id + ": please fill in the arrival time.";
        }
        if (rowEls[i].querySelector(".burst").value.trim() === "") {
            return id + ": please fill in the burst time.";
        }
        if (algo === "priority" && rowEls[i].querySelector(".priority").value.trim() === "") {
            return id + ": please fill in the priority.";
        }
    }

    // 1. every burst time must be at least 1
    if (processes.some((p) => p.burst < 1)) {
        return "Every burst time must be at least 1.";
    }

    // 2. check each row
    for (const p of processes) {
        if (!Number.isFinite(p.arrival) || p.arrival < 0) {
            return p.id + ": arrival time must be 0 or more.";
        }
        if (algo === "priority" && (!Number.isFinite(p.priority) || p.priority < 1)) {
            return p.id + ": priority must be 1 or more.";
        }
    }

    // 3. P1 is the only process that arrives at 0 (all algorithms)
    if (processes[0].arrival !== 0) {
        return "P1: arrival time must be 0.";
    }
    for (const p of processes.slice(1)) {
        if (p.arrival < 1) {
            return p.id + ": only P1 can have arrival time 0.";
        }
    }

    // FCFS and Round Robin also need arrival times 0 to n-1, each used once (so there is no Idle)
    if (algo === "fcfs" || algo === "rr") {
        const used = [];
        for (const p of processes) {
            if (p.arrival > processes.length - 1) {
                return p.id + ": arrival time must be from 0 to " + (processes.length - 1) + ".";
            }
            if (used.includes(p.arrival)) {
                return p.id + ": that arrival time is already used by another process.";
            }
            used.push(p.arrival);
        }
    }

    // 4. Round Robin needs a time quantum
    if (algo === "rr" && (!Number.isFinite(quantum) || quantum < 1)) {
        return "Time quantum must be at least 1.";
    }

    return "";
}

function renderResults(processes, result) {
    // Python sends the gantt as [pid, start, end]
    const gantt = result.gantt.map((b) => ({ id: b[0], start: b[1], end: b[2] }));

    // Python sends the table as { pid: [arrival, burst, ct, tat, wt] }
    const rows = processes.map((p) => {
        const r = result.completed[p.id];
        return { id: p.id, arrival: r[0], burst: r[1], completion: r[2], turnaround: r[3], waiting: r[4] };
    });

    const avgWaiting = result.avg_waiting;
    const avgTurnaround = result.avg_turnaround;
    const total = gantt[gantt.length - 1].end;

    // each process keeps the same color
    const colorOf = (id) => {
        const index = processes.findIndex((p) => p.id === id);
        return colors[index % colors.length];
    };

    // the Gantt bar: block width matches how long it ran
    const blocks = gantt.map((b) => {
        const width = ((b.end - b.start) / total) * 100;
        return `<div class="block" style="width:${width}%;background:${colorOf(b.id)}">${b.id}</div>`;
    }).join("");

    // the time numbers under the bar
    const times = [0, ...gantt.map((b) => b.end)];
    const ticks = times.map((t) => `<span style="left:${(t / total) * 100}%">${t}</span>`).join("");

    const tableRows = rows.map((r) => `
        <tr>
            <td class="pid">${r.id}</td>
            <td>${r.arrival}</td>
            <td>${r.burst}</td>
            <td>${r.completion}</td>
            <td>${r.turnaround}</td>
            <td>${r.waiting}</td>
        </tr>
    `).join("");

    // Gantt chart card
    ganttBody.innerHTML = `
        <div class="gantt">${blocks}</div>
        <div class="ticks">${ticks}</div>
    `;

    // the steps shown under the averages
    const waitingSteps = rows.map((r) => r.waiting).join(" + ");
    const turnaroundSteps = rows.map((r) => r.turnaround).join(" + ");

    // Results card
    resultBody.innerHTML = `
        <table class="result-table">
            <thead>
                <tr>
                    <th>Process</th>
                    <th>Arrival</th>
                    <th>Burst</th>
                    <th>Completion</th>
                    <th>Turnaround</th>
                    <th>Waiting</th>
                </tr>
            </thead>
            <tbody>${tableRows}</tbody>
        </table>

        <div class="summary">
                       <div class="metric">
                <span>Avg waiting</span>
                <b>${avgWaiting.toFixed(2)} ms</b>
                <small>(${waitingSteps}) / ${rows.length} = ${avgWaiting.toFixed(2)} ms</small>
            </div>
            <div class="metric">
                <span>Avg turnaround</span>
                <b>${avgTurnaround.toFixed(2)} ms</b>
                <small>(${turnaroundSteps}) / ${rows.length} = ${avgTurnaround.toFixed(2)} ms</small>
            </div>
            <div class="metric"><span>Finish time</span><b>${total}</b></div>
        </div>
    `;
}

async function run() {
    const processes = getProcesses();
    const quantum = Number(document.getElementById("quantum").value);

    const error = validate(processes, quantum);
    if (error) {
        ganttBody.innerHTML = `<p class="error">${error}</p>`;
        resultBody.innerHTML = `<p class="empty">Fix the input to see the results.</p>`;
        return;
    }

    // send the table to Python (app.py) and wait for the answer
    let result;
    try {
        const response = await fetch("/api/schedule", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ algo: algo, quantum: quantum, processes: processes }),
        });
        result = await response.json();
    } catch (err) {
        ganttBody.innerHTML = `<p class="error">Could not get a result from the server. Check the terminal for the Python error.</p>`;
        return;
    }

    if (!result.ok) {
        ganttBody.innerHTML = `<p class="error">${result.message}</p>`;
        return;
    }

    renderResults(processes, result);
}

document.getElementById("runBtn").addEventListener("click", run);

function resetInputs() {
    Array.from(tbody.children).forEach((tr) => {
        tr.querySelector(".arrival").value = "";
        tr.querySelector(".burst").value = "";
        tr.querySelector(".priority").value = "";
    });
    renumber();   // puts P1's arrival back to 0
    document.getElementById("quantum").value = 2;
    ganttBody.innerHTML = `<p class="empty">Run the simulation to see the Gantt chart.</p>`;
    resultBody.innerHTML = `<p class="empty">Run the simulation to see the waiting and turnaround times.</p>`;
}

document.getElementById("resetBtn").addEventListener("click", () => {
    askConfirm("Reset input", "Are you sure you want to reset all input?", resetInputs);
});

document.getElementById("exitBtn").addEventListener("click", () => {
    askConfirm("Exit", "Are you sure you want to exit?", () => {
        window.location.href = "home.html";
    });
});

/* ---------- start ---------- */
addRow();
addRow();
// open with the algorithm picked on the home page (scheduler.html?algo=rr)
const picked = new URLSearchParams(location.search).get("algo");
setAlgo(algoNames[picked] ? picked : "fcfs");