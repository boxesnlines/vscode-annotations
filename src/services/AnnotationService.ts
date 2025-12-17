import * as vscode from 'vscode';
import { Annotation } from '../records/Annotation';
import { IAnnotationRepository } from '../repositories/IAnnotationRepository';

export type AnnotationMap = Map<string, Annotation[]>;

export class AnnotationService {
    private readonly annotationRepository: IAnnotationRepository;
    private annotations: AnnotationMap = new Map();

    constructor(annotationRepository: IAnnotationRepository) {
        this.annotationRepository = annotationRepository;
    }

    async getAnnotations(): Promise<AnnotationMap> {
        return this.annotations;
    }

    async getAnnotationsForSelection(selection: vscode.Selection): Promise<Annotation[]> {
        return this.annotations.get(Annotation.GetKeyFromSelection(selection)) || [];
    }

    async refreshAnnotations(): Promise<void> {
        const activeDocument = vscode.window.activeTextEditor?.document;
        if (!activeDocument) {
            this.annotations = new Map();
            return;
        }

        this.annotations = await this.annotationRepository.getAnnotations(activeDocument.uri.fsPath);
    }

    async addAnnotation(annotation: Annotation): Promise<void> {
        const activeDocument = vscode.window.activeTextEditor?.document;
        if (!activeDocument) {
            return;
        }

        const key = Annotation.GetKeyFromSelection(annotation.selection);
        const existing = this.annotations.get(key) || [];
        const next = [...existing, annotation];
        this.annotations.set(key, next);
        await this.annotationRepository.setAnnotations(activeDocument.uri.fsPath, this.annotations);
        await this.refreshAnnotations();
    }

    async deleteAnnotation(selectionKey: string, index: number): Promise<void> {
        const activeDocument = vscode.window.activeTextEditor?.document;
        if (!activeDocument) {
            return;
        }

        const existing = this.annotations.get(selectionKey);
        if (!existing) {
            return;
        }

        const next = existing.filter((_, idx) => idx !== index);
        if (next.length === 0) {
            this.annotations.delete(selectionKey);
        } else {
            this.annotations.set(selectionKey, next);
        }

        await this.annotationRepository.setAnnotations(activeDocument.uri.fsPath, this.annotations);
        await this.refreshAnnotations();
    }

    async updateAnnotation(selectionKey: string, index: number, text: string): Promise<void> {
        const activeDocument = vscode.window.activeTextEditor?.document;
        if (!activeDocument) {
            return;
        }

        const existing = this.annotations.get(selectionKey);
        if (!existing || !existing[index]) {
            return;
        }

        const updated = existing.map((item, idx) => (idx === index ? new Annotation(item.selection, text) : item));
        this.annotations.set(selectionKey, updated);

        await this.annotationRepository.setAnnotations(activeDocument.uri.fsPath, this.annotations);
        await this.refreshAnnotations();
    }
}