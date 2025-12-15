
import * as vscode from 'vscode';
import { Annotation } from '../records/Annotation';

// Abstraction for annotation data sources
export interface IAnnotationRepository {
    getAnnotations(fileKey:string):Promise<Map<string, Annotation[]>>;
    setAnnotations(fileKey:string, annotations:Map<string, Annotation[]>):Promise<void>;
}