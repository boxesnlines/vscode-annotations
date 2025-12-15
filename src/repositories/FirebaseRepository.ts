// // This repository persists annotations to Firebase

// import * as vscode from 'vscode';
// import { Annotation } from "../records/Annotation";
// import { IAnnotationRepository } from "./IAnnotationRepository";
// import firebase from 'firebase/compat/app';

// export class FirebaseRepository implements IAnnotationRepository {
//     firebaseConfig = {
//         apiKey: "AIzaSyCpr_uu8-6gIzURtpUnssNKjEl1PacZ39U",
//         authDomain: "codecommenter-677f9.firebaseapp.com",
//         projectId: "codecommenter-677f9",
//         storageBucket: "codecommenter-677f9.firebasestorage.app",
//         messagingSenderId: "972786856021",
//         appId: "1:972786856021:web:73f569b5a45af99291a4dc"
//     };

    
//     app = firebase.initializeApp(this.firebaseConfig);
//     db = this.app.firestore();

//     async getAnnotations(fileKey: string): Promise<Map<vscode.Selection, Annotation[]>> {
//         let annotations = new Map<vscode.Selection, Annotation[]>();
//         try {
//             const docRef = this.db.collection('comments').doc(fileKey);
//             const docSnap = await docRef.get();

            

//             if (docSnap.exists) {
//                 const commentsData = docSnap.data();
                
//                 commentsData.comments.forEach(annotation => {
//                     const lineNumber = comment.line;
//                     if (!annotations.has(lineNumber)) {
//                         annotations.set(lineNumber, []);
//                     }
//                     annotations.get(lineNumber).push({
//                         line: annotation.line,
//                         text: annotation.text,
//                         author: annotation.author
//                     });
//                 });
//             }
            
//         } catch (error) {
//             console.error("Error getting comments from Firestore:", error);
//         }
//         return annotations;
//     }

//     setAnnotations(fileKey: string, annotations: Map<vscode.Selection, Annotation[]>): Promise<void> {
//         throw new Error("Method not implemented.");
//     }
// }