import fs from 'fs';
import path from 'path';
import { NodeGraph } from '@state-flow/common';
import { EffectorAstParser, parseEffectorSource } from './parsers/effectorAstParser';

export * from '@state-flow/common';
export * from './parsers/effectorAstParser';

/**
 * Parses an Effector source file from disk directly into universal NodeGraph
 */
export function parseEffectorFile(filePath: string): NodeGraph {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const code = fs.readFileSync(absolutePath, 'utf-8');
  const parser = new EffectorAstParser({
    sourceText: code,
    fileName: path.basename(filePath),
  });
  return parser.parse();
}

/**
 * Writes NodeGraph representation to a formatted JSON file
 */
export function writeGraphJSON(graph: NodeGraph, outputPath: string): void {
  const absolutePath = path.resolve(process.cwd(), outputPath);
  const dir = path.dirname(absolutePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(absolutePath, JSON.stringify(graph, null, 2), 'utf-8');
}
