import * as vscode from 'vscode';
import { createHash } from 'crypto';
import { IAnnotationRepository } from "./IAnnotationRepository";
import { Annotation } from '../records/Annotation';

// This repository persists annotations to the local filesystem
export class LocalFileRepository implements IAnnotationRepository {
  localFilePath: vscode.Uri | undefined;

  constructor() {
    const workspaceUri = vscode.workspace.workspaceFolders?.[0]?.uri;
    if (workspaceUri) {
      this.localFilePath = vscode.Uri.joinPath(workspaceUri, '.boxesnlines', 'annotations');
    }
  }

  selectionToString(selection: vscode.Selection): string {
    return `${selection.start.line}:${selection.start.character}-${selection.end.line}:${selection.end.character}`;
  }
  stringToSelection(selectionString: string): vscode.Selection {
    const [startLine, startChar, endLine, endChar] = selectionString.split(':');
    return new vscode.Selection(parseInt(startLine), parseInt(startChar), parseInt(endLine), parseInt(endChar));
  }

  async getAnnotations(fileKey: string): Promise<Map<string, Annotation[]>> {
    try {
      const fileUri = this.getFileUri(fileKey);
      const data = await vscode.workspace.fs.readFile(fileUri); // Read the file contents
      const parsedObj: Record<string, Annotation[]> = JSON.parse(Buffer.from(data).toString('utf8'));

      // Convert back to a Map with vscode.Selection keys
      const parsed = new Map<string, Annotation[]>(
        Object.entries(parsedObj).map(([selectionString, annotationArr]) => [
          selectionString,
          annotationArr
        ])
      );
      return parsed;
    } catch (error) {
      // Unfortunately VSCode doesn't offer an 'exists' function, so we have to catch the error and return an empty map
      return new Map<string, Annotation[]>();
    }
  }

  async setAnnotations(fileKey: string, annotations: Map<string, Annotation[]>): Promise<void> {
    await vscode.workspace.fs.createDirectory(this.localFilePath!);
    const fileUri = this.getFileUri(fileKey); // Determine the file URI for the annotations file
    const serializedSelections = Object.fromEntries(Array.from(annotations.entries()).map(([selection, annotations]) => [selection, annotations]));
    const encoded = Buffer.from(JSON.stringify(serializedSelections, null, 2));
    await vscode.workspace.fs.writeFile(fileUri, encoded);
  }

  private getFileUri(fileKey: string): vscode.Uri {
    const hashedFileName = createHash('sha256').update(fileKey).digest('hex').slice(0, 16) + '.json';
    return vscode.Uri.joinPath(this.localFilePath!, hashedFileName);
  }
}