import { TestRunnerHttpAdapter } from '../exit/test-runner.http.adapter.js';

export interface BuildTestRunnerApiOptions {
  token?: string;
}

export const buildTestRunnerApi = ({ token }: BuildTestRunnerApiOptions = {}) =>
  new TestRunnerHttpAdapter({ token });
