import { AppIntegrator } from "./lib/app-integrator";
import * as vscode from "vscode";

exports.activate = (context: vscode.ExtensionContext) => {
  const appIntegrator = new AppIntegrator(context);
  appIntegrator.integrate();
};

exports.deactivate = () => {};
