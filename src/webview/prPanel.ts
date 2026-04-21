import * as vscode from 'vscode';

export class PRPanel {
  private static current: PRPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, title: string, body: string) {
    this.panel = panel;
    this.panel.webview.html = getWebviewHtml(title, body);

    this.panel.webview.onDidReceiveMessage(
      async (message: { command: string; text: string }) => {
        if (message.command === 'copy') {
          await vscode.env.clipboard.writeText(message.text);
          vscode.window.showInformationMessage('Copied to clipboard.');
        }
      },
      null,
      this.disposables
    );

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  static createOrShow(title: string, body: string): void {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (PRPanel.current) {
      PRPanel.current.panel.reveal(column);
      PRPanel.current.update(title, body);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'aiPRGenerator',
      'AI PR Description',
      column ?? vscode.ViewColumn.One,
      { enableScripts: true }
    );

    PRPanel.current = new PRPanel(panel, title, body);
  }

  private update(title: string, body: string): void {
    this.panel.webview.html = getWebviewHtml(title, body);
  }

  private dispose(): void {
    PRPanel.current = undefined;
    this.panel.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getWebviewHtml(title: string, body: string): string {
  const safeTitle = escapeHtml(title);
  const safeBody = escapeHtml(body);

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI PR Description</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }

    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      padding: 20px;
      margin: 0;
    }

    h2 {
      margin: 0 0 6px 0;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--vscode-descriptionForeground);
    }

    .field { margin-bottom: 20px; }

    input[type="text"], textarea {
      width: 100%;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border, transparent);
      border-radius: 3px;
      padding: 8px 10px;
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      outline: none;
    }

    input[type="text"]:focus, textarea:focus {
      border-color: var(--vscode-focusBorder);
    }

    textarea {
      min-height: 320px;
      resize: vertical;
      line-height: 1.5;
    }

    .actions {
      display: flex;
      gap: 8px;
      margin-top: 8px;
      flex-wrap: wrap;
    }

    button {
      padding: 5px 14px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: var(--vscode-font-size);
    }

    button:hover {
      background: var(--vscode-button-hoverBackground);
    }

    button.secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }

    button.secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
  </style>
</head>
<body>
  <div class="field">
    <h2>Title</h2>
    <input type="text" id="title" value="${safeTitle}" />
    <div class="actions">
      <button onclick="copyField('title')">Copy Title</button>
    </div>
  </div>

  <div class="field">
    <h2>Body</h2>
    <textarea id="body">${safeBody}</textarea>
    <div class="actions">
      <button onclick="copyField('body')">Copy Body</button>
      <button class="secondary" onclick="copyAll()">Copy All</button>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    function copyField(id) {
      const el = document.getElementById(id);
      vscode.postMessage({ command: 'copy', text: el.value });
    }

    function copyAll() {
      const title = document.getElementById('title').value;
      const body = document.getElementById('body').value;
      vscode.postMessage({ command: 'copy', text: title + '\\n\\n' + body });
    }
  </script>
</body>
</html>`;
}
