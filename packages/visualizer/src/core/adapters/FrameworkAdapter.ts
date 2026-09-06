import { GraphBuilder } from '@state-flow/common';

export interface ExtractInput {
  name?: string;
  sourceCode?: string;
  ast?: unknown;
  runtimeInspect?: unknown;
  definitions?: unknown[];
}

export interface FrameworkAdapter {
  readonly framework: string;
  readonly version?: string;
  extract(input: ExtractInput, builder: GraphBuilder): void;
}
