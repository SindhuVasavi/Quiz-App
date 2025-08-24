// Elements
const setupSection   = document.getElementById("setup");
const quizSection    = document.getElementById("quiz");
const resultSection  = document.getElementById("result");

const startBtn       = document.getElementById("start-btn");
const restartBtn     = document.getElementById("restart-btn");
const setupBtn       = document.getElementById("setup-btn");

const categoryEl     = document.getElementById("category");
const difficultyEl   = document.getElementById("difficulty");
const amountEl       = document.getElementById("amount");
const secondsEl      = document.getElementById("seconds");

const qCounterEl     = document.getElementById("q-counter");
const metaEl         = document.getElementById("meta");
const questionEl     = document.getElementById("question");
const answersEl      = document.getElementById("answers");
const nextBtn        = document.getElementById("next-btn");

const progressBar    = document.getElementById("progress-bar");
const progressText   = document.getElementById("progress-text");

const scoreLineEl    = document.getElementById("score-line");
const scorePercentEl = document.getElementById("score-percent");

// State
let settings = {
  category: "18",     // default Computers
  difficulty: "medium",
  amount: 5,
  seconds: 15,
};
let questions = [];
let current = 0;
let score = 0;
let timer = null;
let timeLeft = 15;

// Utilities
function decodeHTML(html){
  const t = document.createElement("textarea");
  t.innerHTML = html;
  return t.value;
}
function shuffle(arr){ return arr.sort(() => Math.random() - 0.5); }

function buildURL(){
  const p = new URLSearchParams();
  p.set("amount", settings.amount);
  p.set("type", "multiple");
  if (settings.category)   p.set("category", settings.category);
  if (settings.difficulty) p.set("difficulty", settings.difficulty);
  return `https://opentdb.com/api.php?${p.toString()}`;
}

// Fetch & prepare questions
async function loadQuestions(){
  const url = buildURL();
  const res = await fetch(url);
  const data = await res.json();

  // Response code 0 = success
  if (data.response_code !== 0 || !data.results?.length){
    throw new Error("No questions available for the chosen settings. Try different options.");
  }

  questions = data.results.map(q => {
    const question = decodeHTML(q.question);
    const correct  = decodeHTML(q.correct_answer);
    const options  = shuffle([correct, ...q.incorrect_answers.map(decodeHTML)]);
    return {
      question,
      options,
      correct,
      category: q.category,
      difficulty: q.difficulty
    };
  });
}

// Screens
function showSetup(){
  setupSection.classList.remove("hide");
  quizSection.classList.add("hide");
  resultSection.classList.add("hide");
}
function showQuiz(){
  setupSection.classList.add("hide");
  quizSection.classList.remove("hide");
  resultSection.classList.add("hide");
}
function showResult(){
  setupSection.classList.add("hide");
  quizSection.classList.add("hide");
  resultSection.classList.remove("hide");
}

// Timer & progress
function resetProgress(){
  progressBar.style.width = "100%";
  progressBar.style.background = "var(--ok)";
  progressText.textContent = "100%";
}
function startTimer(){
  clearInterval(timer);
  timeLeft = Number(settings.seconds);
  updateBar();

  timer = setInterval(() => {
    timeLeft--;
    updateBar();

    if (timeLeft <= 0){
      clearInterval(timer);
      // Time up: reveal correct, enable Next
      revealCorrect();
      nextBtn.disabled = false;
      nextBtn.classList.remove("hide");
    }
  }, 1000);
}
function updateBar(){
  const pct = Math.max(0, Math.round((timeLeft / settings.seconds) * 100));
  progressBar.style.width = pct + "%";
  progressText.textContent = pct + "%";

  // Color thresholds: >5s green, 5–3s orange, <3s red
  if (timeLeft <= 3){
    progressBar.style.background = "var(--bad)";
  } else if (timeLeft <= 5){
    progressBar.style.background = "var(--warn)";
  } else {
    progressBar.style.background = "var(--ok)";
  }
}

// Render question
function renderQuestion(){
  clearInterval(timer);
  nextBtn.classList.add("hide");
  nextBtn.disabled = true;
  answersEl.innerHTML = "";
  resetProgress();

  const q = questions[current];

  qCounterEl.textContent = `Q${current + 1} of ${questions.length}`;
  metaEl.textContent = `${q.category} • ${q.difficulty.toUpperCase()}`;
  questionEl.textContent = q.question;

  q.options.forEach(opt => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = "answer";
    btn.textContent = opt;
    btn.onclick = () => selectAnswer(btn, q.correct);
    li.appendChild(btn);
    answersEl.appendChild(li);
  });

  // Start per-question timer
  startTimer();
}

function selectAnswer(btn, correct){
  clearInterval(timer);

  const chosen = btn.textContent;
  // Mark chosen
  if (chosen === correct){
    btn.classList.add("correct");
    score++;
  } else {
    btn.classList.add("wrong");
  }
  // Reveal correct
  Array.from(answersEl.querySelectorAll("button")).forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add("correct");
  });

  nextBtn.disabled = false;
  nextBtn.classList.remove("hide");
}

function revealCorrect(){
  const correct = questions[current].correct;
  Array.from(answersEl.querySelectorAll("button")).forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add("correct");
  });
}

// Flow
async function startQuizFlow(){
  // Read settings
  settings = {
    category: categoryEl.value,
    difficulty: difficultyEl.value,
    amount: Math.max(3, Math.min(20, Number(amountEl.value) || 5)),
    seconds: Math.max(5, Math.min(60, Number(secondsEl.value) || 15)),
  };

  try{
    showQuiz();
    questionEl.textContent = "Fetching questions…";
    answersEl.innerHTML = "";
    resetProgress();

    await loadQuestions();
    current = 0;
    score = 0;
    renderQuestion();
  } catch (e){
    alert(e.message);
    showSetup();
  }
}

function next(){
  current++;
  if (current < questions.length){
    renderQuestion();
  } else {
    // Done
    showResult();
    scoreLineEl.textContent   = `${score} / ${questions.length}`;
    scorePercentEl.textContent = `${Math.round((score / questions.length) * 100)}%`;
  }
}

// Event handlers
startBtn.addEventListener("click", startQuizFlow);
nextBtn.addEventListener("click", next);
restartBtn.addEventListener("click", startQuizFlow);
setupBtn.addEventListener("click", showSetup);

// Init
showSetup();
