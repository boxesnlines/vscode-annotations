import * as vscode from 'vscode';

export abstract class VSCodeCommand {
    readonly id!: string;
    abstract execute(...args: unknown[]): unknown;
    registerCommand(context: vscode.ExtensionContext) {
        context.subscriptions.push(vscode.commands.registerCommand(this.id, ()=>this.execute()));
    }
}