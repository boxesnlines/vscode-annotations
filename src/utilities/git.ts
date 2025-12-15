import { execSync } from "child_process";
import * as vscode from "vscode";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

function getGitRoot(fileUri: vscode.Uri): string | undefined {
  try {
    const cwd = vscode.workspace.getWorkspaceFolder(fileUri)?.uri.fsPath;
    const root = execSync("git rev-parse --show-toplevel", { cwd })
      .toString()
      .trim();
    return root;
  } catch {
    return undefined; // not a git repo
  }
}

async function getGitApi() {
  const gitExtension = vscode.extensions.getExtension('vscode.git');
  if (!gitExtension) return;

  const gitApi = gitExtension.isActive
    ? gitExtension.exports.getAPI(1)
    : (await gitExtension.activate()).getAPI(1);

  return gitApi;
}

async function getGitRepoId(gitRoot: string): Promise<string | null> {
    const api = await getGitApi();
    if (api) {
        const repos = api.repositories;        // All opened repositories
        const repo = repos[0];                 // Typically one repo per workspace

        const remote = repo.state.remotes.find((r: { name: string; }) => r.name === "origin")
                    ?? repo.state.remotes[0];

        const remoteUrl = remote?.fetchUrl || remote?.pushUrl;
        const repoId = crypto.createHash("sha1").update(remoteUrl).digest("hex");
        return repoId;
    }
    else {
        return null;
    }
}