import os
import re
import secrets

import psycopg2
import psycopg2.errors
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from flask import Flask, abort, jsonify, redirect, request, send_from_directory, session
from werkzeug.security import check_password_hash, generate_password_hash
from python.fcfs import fcfs
from python.sjf import sjf
from python.priority import priority
from python.rr import rr

# Loads values from a local .env file if it exists
load_dotenv()

app = Flask(__name__)

BASE_FOLDER = os.path.dirname(os.path.abspath(__file__))
IS_DEV = os.environ.get("APP_ENV") == "development"

# =============== settings ===============

secret_key = os.environ.get("SECRET_KEY")
if not secret_key:
    if IS_DEV:
        # random key for local testing only; logins reset whenever the app restarts
        secret_key = secrets.token_hex(32)
    else:
        # never fall back to a guessable key on a deployed app
        raise RuntimeError("SECRET_KEY is not set.")
app.secret_key = secret_key

app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=not IS_DEV,  # HTTPS-only cookie when deployed
)

# Neon Postgres connection string (set in .env locally, and in Render's Environment tab)
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set.")


# =============== database ===============

def get_db():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


def setup_database():
    """Create the users table the first time the app runs."""
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id            SERIAL PRIMARY KEY,
                    name          TEXT NOT NULL,
                    student_id    TEXT NOT NULL,
                    password_hash TEXT NOT NULL
                )
            """)
            # Student ID is unique regardless of upper/lower case
            cur.execute("""
                CREATE UNIQUE INDEX IF NOT EXISTS users_student_id_key
                ON users (LOWER(student_id))
            """)
        conn.commit()
    finally:
        conn.close()


# Runs when the app loads, so it also works under gunicorn
setup_database()


# =============== student id check ===============

def valid_student_id(student_id):
    """Student ID must be exactly 10 digits (0-9 only)."""
    return re.fullmatch(r"[0-9]{10}", student_id) is not None


# =============== pages (your html, css, and js folders) ===============

@app.route("/")
def home():
    return redirect("/html/login.html")


@app.route("/html/<name>")
def page(name):
    if name not in ("login.html", "signup.html", "home.html", "scheduler.html"):
        abort(404)

    # the scheduler is only for logged-in users
    if name in ("home.html", "scheduler.html") and "student_id" not in session:
        return redirect("/html/login.html")

    return send_from_directory(os.path.join(BASE_FOLDER, "html"), name)


@app.route("/css/<path:name>")
def css_file(name):
    return send_from_directory(os.path.join(BASE_FOLDER, "css"), name)


@app.route("/js/<path:name>")
def js_file(name):
    return send_from_directory(os.path.join(BASE_FOLDER, "js"), name)


# =============== signup ===============

@app.route("/api/signup", methods=["POST"])
def api_signup():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    student_id = str(data.get("student_id", "")).strip()
    password = str(data.get("password", ""))
    confirm = str(data.get("confirm", ""))

    if not name or not student_id or not password or not confirm:
        return jsonify(ok=False, message="Please fill in all fields."), 400
    if not valid_student_id(student_id):
        return jsonify(ok=False, message="Student ID must be exactly 10 digits (numbers only)."), 400
    if len(name) > 100 or len(student_id) > 50:
        return jsonify(ok=False, message="Name or Student ID is too long."), 400
    if len(password) < 8:
        return jsonify(ok=False, message="Password must be at least 8 characters."), 400
    if len(password) > 128:
        return jsonify(ok=False, message="Password is too long."), 400
    if password != confirm:
        return jsonify(ok=False, message="Passwords do not match."), 400

    conn = get_db()
    try:
        with conn.cursor() as cur:
            # the password is saved as a hash, never as plain text
            cur.execute(
                "INSERT INTO users (name, student_id, password_hash) VALUES (%s, %s, %s)",
                (name, student_id, generate_password_hash(password)),
            )
        conn.commit()
    except psycopg2.errors.UniqueViolation:
        # the unique index on student_id makes a second account with the same ID fail
        conn.rollback()
        return jsonify(ok=False, message="That Student ID already has an account."), 400
    finally:
        conn.close()

    return jsonify(ok=True, message="Account created! Redirecting...")


# =============== login ===============

@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json(silent=True) or {}
    student_id = str(data.get("student_id", "")).strip()
    password = str(data.get("password", ""))

    if not student_id or not password:
        return jsonify(ok=False, message="Please enter your Student ID and password."), 400
    if not valid_student_id(student_id):
        return jsonify(ok=False, message="Student ID must be exactly 10 digits (numbers only)."), 400

    # look for this Student ID in the database (not case sensitive)
    conn = get_db()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM users WHERE LOWER(student_id) = LOWER(%s)",
                (student_id,),
            )
            user = cur.fetchone()
    finally:
        conn.close()

    # no such account, or the password does not match the saved hash
    if user is None or not check_password_hash(user["password_hash"], password):
        return jsonify(ok=False, message="Wrong Student ID or password."), 401

    # remember who is logged in
    session["student_id"] = user["student_id"]
    session["name"] = user["name"]
    return jsonify(ok=True, message="Welcome, " + user["name"] + "!")


@app.route("/logout")
def logout():
    session.clear()
    return redirect("/html/login.html")


@app.route("/api/me")
def api_me():
    if "student_id" not in session:
        return jsonify(ok=False), 401
    return jsonify(ok=True, name=session["name"])


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
    if "student_id" not in session:
        return jsonify(ok=False, message="Please log in first."), 401

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
        rows = sjf(rows, len(rows))
        gantt = _gantt_from_rows(rows, ct_index=3)
        completed = _completed_from_rows(rows, ct_index=3)
    elif algo == "priority":
        rows = [[p["id"], p["arrival"], p["burst"], p["priority"]] for p in processes]
        rows = priority(rows, len(rows))
        gantt = _gantt_from_rows(rows, ct_index=4)
        completed = _completed_from_rows(rows, ct_index=4)
    elif algo == "rr":
        rows = [[p["id"], p["arrival"], p["burst"], p["burst"], 0, 0, 0] for p in processes]
        rows.sort(key=lambda x: x[1])
        gantt = []
        rows = rr(rows, len(rows), int(data.get("quantum", 2)), gantt)
        completed = _completed_from_rows(rows, ct_index=4)
    else:
        return jsonify(ok=False, message="Unknown scheduling algorithm."), 400

    n = len(completed)
    avg_tat = sum(v[3] for v in completed.values()) / n
    avg_wt = sum(v[4] for v in completed.values()) / n

    return jsonify(ok=True, gantt=gantt, completed=completed,
                   avg_turnaround=avg_tat, avg_waiting=avg_wt)


# =============== start (local only) ===============

if __name__ == "__main__":
    app.run(debug=IS_DEV)