const recordBtn = document.getElementById('recordBtn');
const stopBtn = document.getElementById('stopBtn');
const recordingStatus = document.getElementById('recordingStatus');
const audioPlayback = document.getElementById('audioPlayback');
const noteText = document.getElementById('noteText');
const processBtn = document.getElementById('processBtn');
const clearBtn = document.getElementById('clearBtn');
const todoList = document.getElementById('todoList');
const todoTemplate = document.getElementById('todoItemTemplate');

let mediaRecorder;
let audioChunks = [];
let speechRecognition;

function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    return;
  }

  speechRecognition = new SpeechRecognition();
  speechRecognition.continuous = true;
  speechRecognition.interimResults = true;
  speechRecognition.lang = 'en-US';

  let finalTranscript = '';

  speechRecognition.onresult = (event) => {
    let interim = '';

    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += `${transcript} `;
      } else {
        interim += transcript;
      }
    }

    noteText.value = `${finalTranscript}${interim}`.trim();
  };
}

function splitIntoTasks(note) {
  return note
    .split(/[\n.!?;]+/)
    .map((task) => task.trim())
    .filter((task) => task.length > 0)
    .map((task) => task.replace(/^[-*\d.)\s]+/, ''));
}

function rankTask(task) {
  const text = task.toLowerCase();
  let score = 0;

  const highSignals = ['urgent', 'asap', 'immediately', 'today', 'deadline', 'important'];
  const mediumSignals = ['soon', 'this week', 'follow up', 'review'];
  const lowSignals = ['later', 'someday', 'optional', 'low priority'];

  highSignals.forEach((signal) => {
    if (text.includes(signal)) score += 3;
  });

  mediumSignals.forEach((signal) => {
    if (text.includes(signal)) score += 2;
  });

  lowSignals.forEach((signal) => {
    if (text.includes(signal)) score -= 2;
  });

  if (text.startsWith('call') || text.startsWith('pay') || text.startsWith('send')) {
    score += 1;
  }

  let priority = 'Low';
  let priorityClass = 'priority-low';

  if (score >= 4) {
    priority = 'High';
    priorityClass = 'priority-high';
  } else if (score >= 1) {
    priority = 'Medium';
    priorityClass = 'priority-medium';
  }

  return { task, score, priority, priorityClass };
}

function renderTasks(tasks) {
  todoList.innerHTML = '';
  if (tasks.length === 0) {
    todoList.innerHTML = '<li class="todo-item">No tasks found yet.</li>';
    return;
  }

  tasks.forEach((item) => {
    const clone = todoTemplate.content.cloneNode(true);
    clone.querySelector('.task-text').textContent = item.task;
    const badge = clone.querySelector('.priority-badge');
    badge.textContent = `${item.priority} priority`;
    badge.classList.add(item.priorityClass);
    clone.querySelector('.score').textContent = `score: ${item.score}`;
    todoList.appendChild(clone);
  });
}

async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia) {
    recordingStatus.textContent = 'Recording is not supported in this browser.';
    return;
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];

  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(audioChunks, { type: 'audio/webm' });
    const url = URL.createObjectURL(blob);
    audioPlayback.src = url;
    audioPlayback.hidden = false;
    stream.getTracks().forEach((track) => track.stop());
  };

  mediaRecorder.start();
  speechRecognition?.start();
  recordBtn.disabled = true;
  stopBtn.disabled = false;
  recordingStatus.textContent = 'Recording...';
}

function stopRecording() {
  mediaRecorder?.stop();
  speechRecognition?.stop();
  recordBtn.disabled = false;
  stopBtn.disabled = true;
  recordingStatus.textContent = 'Recording stopped';
}

recordBtn.addEventListener('click', () => {
  startRecording().catch((error) => {
    console.error(error);
    recordingStatus.textContent = 'Unable to access microphone.';
  });
});

stopBtn.addEventListener('click', stopRecording);

processBtn.addEventListener('click', () => {
  const tasks = splitIntoTasks(noteText.value).map(rankTask);
  tasks.sort((a, b) => b.score - a.score);
  renderTasks(tasks);
});

clearBtn.addEventListener('click', () => {
  noteText.value = '';
  todoList.innerHTML = '';
  audioPlayback.hidden = true;
  audioPlayback.removeAttribute('src');
  recordingStatus.textContent = 'Not recording';
});

renderTasks([]);
setupSpeechRecognition();
