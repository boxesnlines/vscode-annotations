// import * as vscode from 'vscode';
// import { VSCodeCommand } from './VSCodeCommand';
// import { IAnnotationRepository } from '../repositories/IAnnotationRepository';



// export class AddAnnotationCommand extends VSCodeCommand {
//     readonly id: string = 'codeAnnotator.addAnnotation';
//     async execute(annotationRepository:IAnnotationRepository, updateDecorations: (editor: vscode.TextEditor) => void): Promise<void> {
//         const editor = vscode.window.activeTextEditor!;

//         const selection = editor.selection;
//         const text = await vscode.window.showInputBox({ prompt: 'Enter annotation text' });
//         if (text){
//             annotationRepository.
//             annotations.push({
//                 range: selection,
//                 text,
//                 author: 'TODO'
//             });
//         }
//         updateDecorations(editor);
//     }
// }