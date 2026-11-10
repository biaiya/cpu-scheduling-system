import os

from dotenv import load_dotenv
from flask import Flask, abort, jsonify, redirect, request, send_from_directory
from python.fcfs import fcfs
from python.sjf import sjf
from python.priority import priority
from python.rr import rr

# Loads values from a local .env file if it exists
load_dotenv()

app = Flask(__name__)

BASE_FOLDER = os.path.dirname(os.path.abspath(__file__))
IS_DEV = os.environ.get("APP_ENV") == "development"


# =============== pages (your html, css, and js folders) ===============

@app.route("/")
def home():
    return redirect("/html/welcome.html")


@app.route("/html/<name>")
def page(name):
    if name not in ("welcome.html", "home.html", "scheduler.html"):
        abort(404)
    return send_from_directory(os.path.join(BASE_FOLDER, "html"), name)


@app.route("/css/<path:name>")
def css_file(name):
    return send_from_directory(os.path.join(BASE_FOLDER, "css"), name)


@app.route("/js/<path:name>")
def js_file(name):
    return send_from_directory(os.path.join(BASE_FOLDER, "js"), name)


# =============== scheduler ===============

def _gantt_from_rows(rows, ct_index):
    """Build Gantt blocks from the algorithm results. Start = CT - burst (non-preemptive)."""
    blocks = [[x[0], x[ct_index] - x[2], x[ct_index]] for x in rows]
    blocks.sort(key=lambda b: b[1])
    return blocks


def _completed_from_rows(rows, ct_index):
    """UI table: { pid: [arrival, burst, ct, tat, wt] }."""
    return {x[0]: [x[1], x[2], x[ct_index], x[ct_index + 1], x[ct_index + 2]] for x in rows}


@app.route("/api/schedule", methods=["POST"])
def api_schedule():
    data = request.get_json(silent=True) or {}
    algo = data.get("algo")
    processes = data.get("processes", [])

    # process layout: [pid, arrival, burst]  (+ priority or remaining)
    if algo == "fcfs":
        rows = [[p["id"], p["arrival"], p["burst"]] for p in processes]
        rows = fcfs(rows)
        gantt = _gantt_from_rows(rows, ct_index=3)
        completed = _completed_from_rows(rows, ct_index=3)
    elif algo == "sjf":
        rows = [[p["id"], p["arrival"], p["burst"]] for p in processes]
        rows, order = sjf(rows)
        gantt = _gantt_from_rows(rows, ct_index=3)
        completed = _completed_from_rows(rows, ct_index=3)
    elif algo == "priority":
        rows = [[p["id"], p["arrival"], p["burst"], p["priority"], p["burst"], 0, 0, 0] for p in processes]
        gantt = []
        rows = priority(rows, len(rows), gantt)
        completed = _completed_from_rows(rows, ct_index=5)
    elif algo == "rr":
        rows = [[p["id"], p["arrival"], p["burst"], p["burst"], 0, 0, 0] for p in processes]
        rows.sort(key=lambda x: x[1])
        gantt = []
        rows = rr(rows, len(rows), int(data.get("quantum", 2)), gantt)
        completed = _completed_from_rows(rows, ct_index=4)
    else:
        return jsonify(ok=False, message="Unknown scheduling algorithm."), 400

    # show the arrival times exactly as the user typed them
    for p in processes:
        if p["id"] in completed:
            completed[p["id"]][0] = p["arrival"]

    n = len(completed)
    avg_tat = sum(v[3] for v in completed.values()) / n
    avg_wt = sum(v[4] for v in completed.values()) / n

    return jsonify(ok=True, gantt=gantt, completed=completed,
                   avg_turnaround=avg_tat, avg_waiting=avg_wt)


# =============== start (local only) ===============

if __name__ == "__main__":
    app.run(debug=IS_DEV)