// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { AnnotationService } from './services/AnnotationService';
import { LocalFileRepository } from './repositories/LocalFileRepository';
import { Annotation } from './records/Annotation';


let decorationType = vscode.window.createTextEditorDecorationType({
  backgroundColor: 'rgba(255, 255, 0, 0.3)'
});

let annotationService: AnnotationService;

// This method is called when the extension is initialized
export async function activate(context: vscode.ExtensionContext) {

  // Initialize the annotation service - this handles CRUD for annotations
  annotationService = new AnnotationService(new LocalFileRepository());
  
  const editor = vscode.window.activeTextEditor;
  const handleEditorChange = async (editor?: vscode.TextEditor) => {
    if (!editor) {
      decorationType.dispose();
      decorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 255, 0, 0.3)'
      });
      return;
    }

    await annotationService.refreshAnnotations();
    await updateDecorations();
  };

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(handleEditorChange)
  );

  // Set up the Add command
  vscode.commands.registerCommand('BoxesNLines.AddAnnotation', async ()=>{
		const editor = vscode.window.activeTextEditor!;
		let selection = editor.selection;

		// If the selection contains zero chars, swap it for the whole line
		if (selection.end.character - selection.start.character === 0) {
			selection = new vscode.Selection(selection.start.line, 0, selection.end.line, editor.document.lineAt(selection.end.line).text.length);
		}

		const text = await vscode.window.showInputBox({ prompt: 'Enter annotation text' });
		await annotationService.addAnnotation(new Annotation(selection, text!, 'TODO'));
		await updateDecorations();
	});

	if (editor) {
		await updateDecorations();
	}
}

// Refresh "decorations" to show highlights on annotated lines and enable 'hover-to-show' functionality
async function updateDecorations() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
	  return;
	}
  
	const allAnnotations = await annotationService.getAnnotations();
	const decorations: vscode.DecorationOptions[] = [];
  
	allAnnotations.forEach((annotations, selectionKey) => {
	  const [start, end] = selectionKey.split('-');
	  const [startLine, startChar] = start.split(':').map(Number);
	  const [endLine, endChar] = end.split(':').map(Number);
	  const range = new vscode.Range(startLine, startChar, endLine, endChar);
  
	  annotations.forEach(annotation =>
		decorations.push({
		  range,
		  hoverMessage: new vscode.MarkdownString(`💬\n${annotation.text}`)
		})
	  );
	});
  
	editor.setDecorations(decorationType, decorations);
  }

// class AnnotationProvider implements vscode.TreeDataProvider<IAnnotation> {
//   private _onDidChangeTreeData = new vscode.EventEmitter<IAnnotation | undefined>();
//   readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

//   getTreeItem(element: IAnnotation): vscode.TreeItem {
//     const item = new vscode.TreeItem(element.text, vscode.TreeItemCollapsibleState.None);
//     item.command = {
//       command: 'codeAnnotator.revealAnnotation',
//       title: 'Reveal Annotation',
//       arguments: [element]
//     };
//     return item;
//   }

//   getChildren(): IAnnotation[] {
//     return annotations;
//   }

//   refresh(): void {
//     this._onDidChangeTreeData.fire(undefined);
//   }
// }