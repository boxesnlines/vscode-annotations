// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { AnnotationMap, AnnotationService } from './services/AnnotationService';
import { LocalFileRepository } from './repositories/LocalFileRepository';
import { Annotation } from './records/Annotation';
import { AnnotationTreeDataProvider, AnnotationTreeItem } from './sidebar/AnnotationTreeDataProvider';


let decorationType = vscode.window.createTextEditorDecorationType({
  backgroundColor: 'rgba(255, 255, 0, 0.3)'
});

let annotationService: AnnotationService;
let annotationTreeProvider: AnnotationTreeDataProvider | undefined;
let annotationsTreeView: vscode.TreeView<AnnotationTreeItem> | undefined;

// This method is called when the extension is initialized
export async function activate(context: vscode.ExtensionContext) {

  // Initialize the annotation service - this handles CRUD for annotations
  annotationService = new AnnotationService(new LocalFileRepository());
  annotationTreeProvider = new AnnotationTreeDataProvider(annotationService);
  annotationsTreeView = vscode.window.createTreeView('annotationsList', {
    treeDataProvider: annotationTreeProvider,
    showCollapseAll: false
  });

  context.subscriptions.push(annotationsTreeView);

  const editor = vscode.window.activeTextEditor;
  const handleEditorChange = async (editor?: vscode.TextEditor) => {
    await annotationService.refreshAnnotations();

    if (!editor) {
      decorationType.dispose();
      decorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 255, 0, 0.3)'
      });
      await updateDecorations();
      return;
    }

    await updateDecorations();
  };

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(handleEditorChange)
  );

  // Set up the Add command
  context.subscriptions.push(vscode.commands.registerCommand('BoxesNLines.AddAnnotation', async ()=>{
		const editor = vscode.window.activeTextEditor!;
		let selection = editor.selection;

		// If the selection contains zero chars, swap it for the whole line
		if (selection.end.character - selection.start.character === 0) {
			selection = new vscode.Selection(selection.start.line, 0, selection.end.line, editor.document.lineAt(selection.end.line).text.length);
		}

		const text = await vscode.window.showInputBox({ prompt: 'Enter annotation text' });
		if (text === undefined) {
			return;
		}

		await annotationService.addAnnotation(new Annotation(selection, text));
		await updateDecorations();
	}));

  context.subscriptions.push(
    vscode.commands.registerCommand('BoxesNLines.ShowAnnotations', async () => {
      await vscode.commands.executeCommand('workbench.view.extension.annotations-view');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('BoxesNLines.EditAnnotation', async (item?: AnnotationTreeItem) => {
      if (!item) {
        void vscode.window.showInformationMessage('Select an annotation to edit from the sidebar.');
        return;
      }

      const updatedText = await vscode.window.showInputBox({
        prompt: 'Update annotation text',
        value: item.annotation.text ?? ''
      });

      if (updatedText === undefined) {
        return;
      }

      await annotationService.updateAnnotation(item.selectionKey, item.annotationIndex, updatedText);
      await updateDecorations();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('BoxesNLines.DeleteAnnotation', async (item?: AnnotationTreeItem) => {
      if (!item) {
        void vscode.window.showInformationMessage('Select an annotation to delete from the sidebar.');
        return;
      }

      await annotationService.deleteAnnotation(item.selectionKey, item.annotationIndex);
      await updateDecorations();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('BoxesNLines.RevealAnnotation', async (item: AnnotationTreeItem) => {
      const targetRange = item.range;
      const activeEditor = vscode.window.activeTextEditor;
      if (!targetRange || !activeEditor) {
        return;
      }

      activeEditor.selection = new vscode.Selection(targetRange.start, targetRange.end);
      activeEditor.revealRange(targetRange, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
    })
  );

	await handleEditorChange(editor);
}

// Refresh "decorations" to show highlights on annotated lines and enable 'hover-to-show' functionality
async function updateDecorations() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
    await updateSidebarMessage();
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
	await updateSidebarMessage(allAnnotations);
  }

async function updateSidebarMessage(annotationMap?: AnnotationMap): Promise<void> {
  if (!annotationTreeProvider || !annotationsTreeView) {
    return;
  }

  const activeEditor = vscode.window.activeTextEditor;
  const mapToUse = annotationMap ?? await annotationService.getAnnotations();
  const totalAnnotations = Array.from(mapToUse.values()).reduce((acc, annotations) => acc + annotations.length, 0);

  if (!activeEditor) {
    annotationsTreeView.message = 'Open a file to view annotations';
  } else if (totalAnnotations === 0) {
    annotationsTreeView.message = 'No annotations for this file';
  } else {
    annotationsTreeView.message = undefined;
  }

  annotationTreeProvider.refresh();
}