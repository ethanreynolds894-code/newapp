# Voice Notes Daily Planner

A lightweight browser app that lets you:

- Record voice notes from your microphone.
- Transcribe speech into editable text (when browser speech recognition is available).
- Generate a to-do list from your note.
- Rank tasks by priority (High/Medium/Low) using simple urgency heuristics.

## Run locally

Because this is a static app, you can open `index.html` directly, or run a simple server:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## How prioritization works

The app scores each task based on urgency keywords:

- High-signal words (e.g. `urgent`, `today`, `deadline`) increase score strongly.
- Medium-signal words (e.g. `soon`, `this week`) increase score moderately.
- Low-signal words (e.g. `later`, `optional`) reduce score.

Tasks are sorted by score in descending order and mapped to:

- **High** priority: score >= 4
- **Medium** priority: score >= 1 and < 4
- **Low** priority: score < 1
