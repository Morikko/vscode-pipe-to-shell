import * as td from "testdouble";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mock<T>(c: new (...args: any[]) => T): T {
  return new (td.constructor(c))();
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mockType<T extends object>(params?: any): T {
  return Object.assign({} as T, params);
}

export function mockMethods<T extends object>(
  methods: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Record<string, any>,
): T {
  return Object.assign(td.object(methods) as T, params);
}

export function mockFunction() {
  return td.function();
}

export const verify = td.verify;
export const when = td.when;
export const contains = td.matchers.contains;
export const any = td.matchers.anything;
