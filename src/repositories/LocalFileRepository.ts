import { createHash } from 'crypto';
import * as vscode from 'vscode';
import { Annotation } from '../records/Annotation';
import { IAnnotationRepository } from './IAnnotationRepository';

type SerializedAnnotation = {
	text?: string;
	[key: string]: unknown;
};

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

	stringToSelection(selectionString: string): vscode.Selection | undefined {
		const [start, end] = selectionString.split('-');
		if (!start || !end) {
			return undefined;
		}

		const [startLine, startChar] = start.split(':').map((value) => parseInt(value, 10));
		const [endLine, endChar] = end.split(':').map((value) => parseInt(value, 10));

		if ([startLine, startChar, endLine, endChar].some((value) => Number.isNaN(value))) {
			return undefined;
		}

		return new vscode.Selection(startLine, startChar, endLine, endChar);
	}

	async getAnnotations(fileKey: string): Promise<Map<string, Annotation[]>> {
		if (!this.localFilePath) {
			return new Map<string, Annotation[]>();
		}

		try {
			const fileUri = this.getFileUri(fileKey);
			const data = await vscode.workspace.fs.readFile(fileUri);
			const parsedObj: Record<string, Array<SerializedAnnotation | string>> = JSON.parse(
				Buffer.from(data).toString('utf8')
			);

			const parsed = new Map<string, Annotation[]>(
				Object.entries(parsedObj).map(([selectionString, annotationArr]) => {
					const selection = this.stringToSelection(selectionString);
					if (!selection) {
						return [selectionString, []];
					}

					const annotations = (annotationArr || []).map((annotation) => {
						const text =
							typeof annotation === 'string'
								? annotation
								: typeof annotation?.text === 'string'
									? annotation.text
									: '';

						return new Annotation(selection, text);
					});

					return [selectionString, annotations];
				})
			);
			return parsed;
		} catch (error) {
			return new Map<string, Annotation[]>();
		}
	}

	async setAnnotations(fileKey: string, annotations: Map<string, Annotation[]>): Promise<void> {
		if (!this.localFilePath) {
			return;
		}

		await vscode.workspace.fs.createDirectory(this.localFilePath);
		const fileUri = this.getFileUri(fileKey);
		const serializedSelections = Object.fromEntries(
			Array.from(annotations.entries()).map(([selection, annotationList]) => [
				selection,
				(annotationList || []).map((annotation) => annotation.toJSON())
			])
		);
		const encoded = Buffer.from(JSON.stringify(serializedSelections, null, 2));
		await vscode.workspace.fs.writeFile(fileUri, encoded);
	}

	private getFileUri(fileKey: string): vscode.Uri {
		const hashedFileName = createHash('sha256').update(fileKey).digest('hex').slice(0, 16) + '.json';
		return vscode.Uri.joinPath(this.localFilePath!, hashedFileName);
	}
}
