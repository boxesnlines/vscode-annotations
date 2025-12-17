import * as vscode from 'vscode';
import { Annotation } from '../records/Annotation';
import { AnnotationService } from '../services/AnnotationService';

const MAX_DESCRIPTION_LENGTH = 60;

function parseSelectionKey(selectionKey: string): vscode.Range | undefined {
	const [start, end] = selectionKey.split('-');
	if (!start || !end) {
		return undefined;
	}

	const [startLine, startChar] = start.split(':').map((value) => parseInt(value, 10));
	const [endLine, endChar] = end.split(':').map((value) => parseInt(value, 10));

	if ([startLine, startChar, endLine, endChar].some((value) => Number.isNaN(value))) {
		return undefined;
	}

	return new vscode.Range(
		new vscode.Position(startLine, startChar),
		new vscode.Position(endLine, endChar)
	);
}

function formatLabel(range: vscode.Range | undefined): string {
	if (!range) {
		return 'Unknown location';
	}
	const startLine = range.start.line + 1;
	const endLine = range.end.line + 1;
	return startLine === endLine ? `Line ${startLine}` : `Lines ${startLine}-${endLine}`;
}

function formatDescription(text: string): string {
	const normalized = text.replace(/\s+/g, ' ').trim();
	if (normalized.length <= MAX_DESCRIPTION_LENGTH) {
		return normalized;
	}

	return `${normalized.slice(0, MAX_DESCRIPTION_LENGTH - 1)}…`;
}

export class AnnotationTreeItem extends vscode.TreeItem {
	readonly selectionKey: string;
	readonly annotationIndex: number;
	readonly annotation: Annotation;
	readonly range?: vscode.Range;

	constructor(annotation: Annotation, selectionKey: string, annotationIndex: number) {
		const range = parseSelectionKey(selectionKey);
		const label = formatLabel(range);
		super(label, vscode.TreeItemCollapsibleState.None);

		this.annotation = annotation;
		this.selectionKey = selectionKey;
		this.annotationIndex = annotationIndex;
		this.range = range;

		this.contextValue = 'annotation';
		this.description = formatDescription(annotation.text);
		this.tooltip = annotation.text;
		this.iconPath = new vscode.ThemeIcon('comment');
		this.command = {
			command: 'BoxesNLines.RevealAnnotation',
			title: 'Reveal Annotation',
			arguments: [this]
		};
	}

	// Compare two annotations by their start line and character
	// Returns a negative number if this annotation is before the other, a positive number if it's after, and 0 if they're the same
	// This is used to sort the annotations in the sidebar
	compareTo(other: AnnotationTreeItem): number {
		const thisLine = this.range?.start.line ?? Number.MAX_SAFE_INTEGER;
		const otherLine = other.range?.start.line ?? Number.MAX_SAFE_INTEGER;
		if (thisLine !== otherLine) {
			return thisLine - otherLine;
		}

		const thisChar = this.range?.start.character ?? Number.MAX_SAFE_INTEGER;
		const otherChar = other.range?.start.character ?? Number.MAX_SAFE_INTEGER;
		if (thisChar !== otherChar) {
			return thisChar - otherChar;
		}

		return this.annotationIndex - other.annotationIndex;
	}
}

export class AnnotationTreeDataProvider implements vscode.TreeDataProvider<AnnotationTreeItem> {
	private readonly _onDidChangeTreeData = new vscode.EventEmitter<AnnotationTreeItem | undefined | void>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	constructor(private readonly annotationService: AnnotationService) {}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: AnnotationTreeItem): vscode.TreeItem {
		return element;
	}

	// This is part of the TreeDataProvider interface and provides the items for the sidebar
	async getChildren(element?: AnnotationTreeItem): Promise<AnnotationTreeItem[]> {
		if (element) {
			return [];
		}

		const annotations = await this.annotationService.getAnnotations();
		const items: AnnotationTreeItem[] = [];

		annotations.forEach((annotationList, selectionKey) => {
			annotationList.forEach((annotation, index) => {
				items.push(new AnnotationTreeItem(annotation, selectionKey, index));
			});
		});

		return items.sort((a, b) => a.compareTo(b));
	}
}
