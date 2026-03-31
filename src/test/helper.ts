import * as td from "testdouble";
import * as assert from "assert";
import { ObjectMap } from "../lib/types/collection";

export function mock<T>(c: new (...args: any[]) => T): T {
  return new (td.constructor(c))();
}

export function mockType<T>(params?: any): T {
  return Object.assign({} as T, params);
}

export function mockMethods<T>(methods: string[], params?: any): T {
  return Object.assign(td.object(methods) as T, params);
}

export function mockFunction() {
  return td.function();
}

export const verify = td.verify;
export const when = td.when;
export const contains = td.matchers.contains;
export const any = td.matchers.anything;
