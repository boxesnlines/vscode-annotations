// import { initializeApp } from "firebase/app";
// import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc } from "firebase/firestore";
// import * as vscode from 'vscode';

// const firebaseConfig = {
//     apiKey: "AIzaSyCpr_uu8-6gIzURtpUnssNKjEl1PacZ39U",
//     authDomain: "codecommenter-677f9.firebaseapp.com",
//     projectId: "codecommenter-677f9",
//     storageBucket: "codecommenter-677f9.firebasestorage.app",
//     messagingSenderId: "972786856021",
//     appId: "1:972786856021:web:73f569b5a45af99291a4dc"
// };

// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);

// export class Annotation {
//   constructor(file: string, selection: vscode.Selection, text: string, author: string) {
//     this.file = file;
//     this.selection = selection;
//     this.text = text;
//     this.author = author;
//   }
//   get id(): string {
//     return `${this.selection.start.line}:${this.selection.start.character}-${this.selection.end.line}:${this.selection.end.character}`;
//   }
//   file: string;
//   selection: vscode.Selection;
//   text: string;
//   author: string;
// }

// const collectionRef = collection(db, "annotations");

// export async function addAnnotation(annotation: Annotation) {
//   await addDoc(collectionRef, annotation);
// }

// export function subscribeToAnnotations(file: string, onUpdate: (annotations: Annotation[]) => void) {
//   return onSnapshot(collectionRef, snapshot => {
//     const list: Annotation[] = [];
//     snapshot.forEach(docSnap => {
//       const data = docSnap.data() as Annotation;
//       if (data.file === file) {
//         list.push({ id: docSnap.id, ...data });
//       }
//     });
//     onUpdate(list);
//   });
// }

// export async function deleteAnnotation(id: string) {
//   await deleteDoc(doc(db, "annotations", id));
// }