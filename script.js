// ---------- Logistic regression model (weights set by hand for this demo) ----------
// probability of failing = sigmoid(bias + sum(weight * mark))
const MODEL = {
  bias: 9,
  weights: { attendance: -0.035, quiz: -0.025, assignment: -0.03, midterm: -0.04, project: -0.02 },
  labels: { attendance: "Low attendance", quiz: "Weak quizzes", assignment: "Weak assignments", midterm: "Poor midterm", project: "Weak lab/project" }
};
const NEUTRAL = 60; // a mark below this pushes risk up

const sigmoid = z => 1 / (1 + Math.exp(-z));

function predict(s) {
  let z = MODEL.bias;
  const causes = [];
  for (const k in MODEL.weights) {
    z += MODEL.weights[k] * s[k];
    const push = -MODEL.weights[k] * (NEUTRAL - s[k]); // positive = raises risk
    if (push > 0.2) causes.push({ key: k, push });
  }
  causes.sort((a, b) => b.push - a.push);
  const p = sigmoid(z);
  const level = p >= 0.6 ? "High" : p >= 0.3 ? "Medium" : "Low";
  return { p, level, causes: causes.slice(0, 2).map(c => MODEL.labels[c.key]) };
}

const ADVICE = {
  High: "Meet the student this week and arrange extra tutorials.",
  Medium: "Send a reminder and share revision material.",
  Low: "On track. No action needed."
};

// ---------- Data (saved in this browser) ----------
let students = JSON.parse(localStorage.getItem("mlStudents") || "[]");
const save = () => localStorage.setItem("mlStudents", JSON.stringify(students));

const $ = id => document.getElementById(id);
const FIELDS = ["attendance", "quiz", "assignment", "midterm", "project"];

function esc(t) {
  return String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ---------- Rendering ----------
function render() {
  const rows = students.map((s, i) => ({ ...s, i, ...predict(s) })).sort((a, b) => b.p - a.p);
  const filter = $("filter").value;
  const shown = filter === "all" ? rows : rows.filter(r => r.level === filter);

  $("statTotal").textContent = rows.length;
  $("statHigh").textContent = rows.filter(r => r.level === "High").length;
  $("statMed").textContent = rows.filter(r => r.level === "Medium").length;
  $("statLow").textContent = rows.filter(r => r.level === "Low").length;
  $("empty").style.display = shown.length ? "none" : "block";

  $("tbody").innerHTML = shown.map(r => {
    const pct = Math.round(r.p * 100);
    const why = r.causes.length ? r.causes.join(", ") : "No weak areas";
    return `<tr class="r-${r.level}">
      <td><strong>${esc(r.name)}</strong></td>
      <td>${r.attendance}</td><td>${r.quiz}</td><td>${r.assignment}</td><td>${r.midterm}</td><td>${r.project}</td>
      <td>${pct}%<div class="bar"><i class="f-${r.level}" style="width:${pct}%"></i></div></td>
      <td><span class="badge b-${r.level}">${r.level}</span></td>
      <td>${why}<div class="advice">${ADVICE[r.level]}</div></td>
      <td><button class="del" data-i="${r.i}" aria-label="Remove ${esc(r.name)}">Remove</button></td>
    </tr>`;
  }).join("");
}

// ---------- Events ----------
$("studentForm").addEventListener("submit", e => {
  e.preventDefault();
  const s = { name: $("name").value.trim() };
  for (const f of FIELDS) {
    const v = Number($(f).value);
    if (isNaN(v) || v < 0 || v > 100) {
      $("formMsg").textContent = "Every mark must be between 0 and 100.";
      $("formMsg").className = "msg err";
      return;
    }
    s[f] = v;
  }
  students.push(s);
  save();
  e.target.reset();
  $("formMsg").textContent = `${s.name} added.`;
  $("formMsg").className = "msg";
  render();
});

$("tbody").addEventListener("click", e => {
  const b = e.target.closest(".del");
  if (!b) return;
  students.splice(Number(b.dataset.i), 1);
  save();
  render();
});

$("filter").addEventListener("change", render);

$("sampleBtn").addEventListener("click", () => {
  students = [
    { name: "Asha Patil", attendance: 92, quiz: 85, assignment: 90, midterm: 82, project: 88 },
    { name: "Rohan Mehta", attendance: 68, quiz: 55, assignment: 62, midterm: 58, project: 65 },
    { name: "Sara Khan", attendance: 45, quiz: 38, assignment: 50, midterm: 35, project: 42 },
    { name: "Vikram Rao", attendance: 78, quiz: 70, assignment: 48, midterm: 66, project: 72 },
    { name: "Neha Joshi", attendance: 55, quiz: 40, assignment: 35, midterm: 45, project: 50 },
    { name: "Imran Shaikh", attendance: 88, quiz: 74, assignment: 80, midterm: 71, project: 79 }
  ];
  save();
  render();
});

$("clearBtn").addEventListener("click", () => {
  if (students.length && confirm("Remove all students?")) {
    students = [];
    save();
    render();
  }
});

render();