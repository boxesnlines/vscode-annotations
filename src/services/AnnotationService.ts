import { Annotation } from "../records/Annotation";
import { IAnnotationRepository } from "../repositories/IAnnotationRepository";
import * as vscode from 'vscode';

// This class 
export class AnnotationService {
    annotationRepository:IAnnotationRepository;
    constructor (annotationRepository:IAnnotationRepository) {
        this.annotationRepository = annotationRepository;
    }

    annotations:Map<string, Annotation[]> = new Map<string, Annotation[]>();

    async getAnnotations() {
        return this.annotations;
    }
    async getAnnotationsForSelection(selection: vscode.Selection) {
        return this.annotations.get(Annotation.GetKeyFromSelection(selection)) || [];
    }
    async refreshAnnotations() {
        this.annotations = await this.annotationRepository.getAnnotations(vscode.window.activeTextEditor!.document.uri.fsPath);
    }
    async addAnnotation(annotation: Annotation) {
        this.annotations.set(annotation.id, [...this.annotations.get(annotation.id) || [], annotation]);
        await this.annotationRepository.setAnnotations(vscode.window.activeTextEditor!.document.uri.fsPath, this.annotations);
        await this.refreshAnnotations();
    }
    async deleteAnnotation(annotation: Annotation) {
        this.annotations.delete(annotation.id);
        await this.annotationRepository.setAnnotations(vscode.window.activeTextEditor!.document.uri.fsPath, this.annotations);
        await this.refreshAnnotations();
    }
    async updateAnnotation(annotation: Annotation) {
        this.annotations.set(annotation.id, [...this.annotations.get(annotation.id) || [], annotation]);
        await this.annotationRepository.setAnnotations(vscode.window.activeTextEditor!.document.uri.fsPath, this.annotations);
        await this.refreshAnnotations();
    }
}