import * as vscode from 'vscode';

export class Annotation {
  constructor(selection: vscode.Selection, text: string, author: string) {
    this.selection = selection;
    this.text = text;
    this.author = author;
  }
  get id(): string {
    return Annotation.GetKeyFromSelection(this.selection);
  }
  selection: vscode.Selection;
  text: string;
  author: string;
  toJSON() {
    return {
      id: this.id,
      text: this.text,
      author: this.author
    };
  }
  fromJSON(json: string): Annotation {
    const obj = JSON.parse(json);
    const selection = this.stringToSelection(obj.id);
    return new Annotation(selection, obj.text, obj.author);
  }
  stringToSelection(id: string): vscode.Selection {
    const [startLine, startChar, endLine, endChar] = id.split(":");
    return new vscode.Selection(parseInt(startLine), parseInt(startChar), parseInt(endLine), parseInt(endChar));
  }
  static GetKeyFromSelection(selection: vscode.Selection) {
    return `${selection.start.line}:${selection.start.character}-${selection.end.line}:${selection.end.character}`;
  }
}