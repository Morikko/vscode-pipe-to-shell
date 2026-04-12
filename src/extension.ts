import { AppIntegrator } from "./lib/app-integrator";
import * as vscode from "vscode";

exports.activate = (context: vscode.ExtensionContext) => {
  new AppIntegrator(context);
};

exports.deactivate = () => {};
