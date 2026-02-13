let editor;

require.config({
  paths: { vs: 'https://unpkg.com/monaco-editor@latest/min/vs' }
});

require(['vs/editor/editor.main'], function () {

  monaco.editor.defineTheme('hackerTheme', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: '00FF66' },
      { token: 'string', foreground: '00FF66' },
      { token: 'number', foreground: '00FF66' },
      { token: 'keyword', foreground: '00FF66' },
      { token: 'delimiter', foreground: '00FF66' },
      { token: 'type', foreground: '00FF66' }
    ],
    colors: {
      'editor.background': '#000000',
      'editor.foreground': '#00FF66',
      'editorCursor.foreground': '#00FF66',
      'editorLineNumber.foreground': '#007A33',
      'editor.selectionBackground': '#003311',
      'editor.inactiveSelectionBackground': '#001A0A'
    }
  });

  editor = monaco.editor.create(document.getElementById('editor'), {
    value: '',
    language: 'json',
    theme: 'hackerTheme',
    automaticLayout: true,
    folding: true,
    fontFamily: "Consolas, monospace",
    fontSize: 14
  });

  editor.onDidPaste(() => {
    try {
      const formatted = JSON.stringify(
        JSON.parse(editor.getValue()),
        null,
        4
      );
      editor.setValue(formatted);
      saveToHistory(formatted);
      buildTree();
      showStatus("JSON pasted, formatted and saved ✔", true);
    } catch {
      showStatus("Invalid JSON pasted ❌", false);
    }
  });


});

/* actions */

function validateJSON() {
  const alertBox = document.getElementById("alertBox");
  try {
    JSON.parse(editor.getValue());
    alertBox.className = "alertBox alert-success";
    alertBox.innerText = "JSON is valid ✔";
  } catch (e) {
    alertBox.className = "alertBox alert-error";
    alertBox.innerText = "Invalid JSON ❌ : " + e.message;
  }
  alertBox.style.display = "block";
}

function prettifyJSON() {
  const formatted = JSON.stringify(
    JSON.parse(editor.getValue()), null, 4
  );
  editor.setValue(formatted);
}

function minifyJSON() {
  editor.setValue(
    JSON.stringify(JSON.parse(editor.getValue()))
  );
}

function copyJSON() {
  navigator.clipboard.writeText(editor.getValue());
}

function downloadJSON() {
  const blob = new Blob([editor.getValue()], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "data.json";
  a.click();
}

function buildTree() {
  try {
    const json = JSON.parse(editor.getValue());
    const container = document.getElementById("treeView");
    container.innerHTML = "";
    container.appendChild(createTreeNode(json));
  } catch (e) {
    alert("Invalid JSON");
  }
}

function createTreeNode(data) {

  if (typeof data !== "object" || data === null) {
    const span = document.createElement("span");
    span.className = "value";
    span.textContent = JSON.stringify(data);
    return span;
  }

  const wrapper = document.createElement("div");

  const toggle = document.createElement("span");
  toggle.textContent = "▼";
  toggle.className = "toggle";

  const children = document.createElement("div");
  children.className = "node";

  toggle.onclick = () => {
    if (children.style.display === "none") {
      children.style.display = "block";
      toggle.textContent = "▼";
    } else {
      children.style.display = "none";
      toggle.textContent = "▶";
    }
  }

  wrapper.appendChild(toggle);
  wrapper.appendChild(document.createTextNode(Array.isArray(data) ? "[" : "{"));

  for (let k in data) {
    const row = document.createElement("div");

    if (!Array.isArray(data)) {
      const key = document.createElement("span");
      key.className = "key";
      key.textContent = `"${k}": `;
      key.style.cursor = "pointer";
      key.onclick = () => goToKey(k);
      row.appendChild(key);
    }

    row.appendChild(createTreeNode(data[k]));
    children.appendChild(row);
  }

  const close = document.createElement("div");
  close.textContent = Array.isArray(data) ? "]" : "}";

  wrapper.appendChild(children);
  wrapper.appendChild(close);

  return wrapper;
}

function goToKey(key) {
  const model = editor.getModel();

  const matches = model.findMatches(
    `"${key}"`,
    true,
    false,
    false,
    null,
    false
  );

  if (matches.length) {
    editor.revealLineInCenter(matches[0].range.startLineNumber);
    editor.setPosition({
      lineNumber: matches[0].range.startLineNumber,
      column: matches[0].range.startColumn
    });
    editor.focus();
  }
}

let darkMode = true;

function toggleTheme() {

  darkMode = !darkMode;

  if (darkMode) {
    document.body.classList.remove("light");
    monaco.editor.setTheme('vs-dark');
  } else {
    document.body.classList.add("light");
    monaco.editor.setTheme('vs');
  }
}

function validateJSON() {
  const alertBox = document.getElementById("alertBox");

  try {
    const json = editor.getValue();
    JSON.parse(json);

    saveToHistory(json);

    alertBox.className = "alertBox alert-success";
    alertBox.innerText = "JSON is valid ✔";

  } catch (e) {
    alertBox.className = "alertBox alert-error";
    alertBox.innerText = "Invalid JSON ❌ : " + e.message;
  }

  alertBox.style.display = "block";
}




function saveToHistory(json) {

  let history = JSON.parse(localStorage.getItem("jsonHistory") || "[]");

  history.unshift({
    data: json,
    time: new Date().toLocaleString(),
    size: (json.length / 1024).toFixed(2) + " KB"
  });

  history = history.slice(0, 20);

  localStorage.setItem("jsonHistory", JSON.stringify(history));
}

function openHistory() {
  const panel = document.querySelector(".historyPanel");
  panel.style.display = "block";
  renderHistory();
}

function toggleHistory() {
  document.querySelector(".historyPanel").style.display = "none";
}

function renderHistory() {

  const history = JSON.parse(localStorage.getItem("jsonHistory") || "[]");
  const list = document.getElementById("historyList");
  list.innerHTML = "";

  history.forEach((item, index) => {

    const div = document.createElement("div");
    div.className = "historyItem";

    div.innerHTML =
      `<b>${item.time}</b><br>
       Size: ${item.size}`;

    div.onclick = () => {
      editor.setValue(item.data);
    };

    list.appendChild(div);
  });
}



function showStatus(msg, success) {
  const alertBox = document.getElementById("alertBox");

  alertBox.className = success
    ? "alertBox alert-success"
    : "alertBox alert-error";

  alertBox.innerText = msg;
  alertBox.style.display = "block";

  setTimeout(() => alertBox.style.display = "none", 3000);
}




function clearHistory() {

  if (!confirm("Clear all history?")) return;

  localStorage.removeItem("jsonHistory");

  document.getElementById("historyList").innerHTML = "";
}
