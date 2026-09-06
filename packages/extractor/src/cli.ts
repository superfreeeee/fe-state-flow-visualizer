#!/usr/bin/env node
import path from 'path';
import { parseEffectorFile, writeGraphJSON } from './index';

function printHelp(): void {
  console.log(`
Frontend State Flow - AST Extractor CLI
Usage:
  tsx src/cli.ts <inputFile> [-o <outputJsonFile>]

Examples:
  tsx packages/extractor/src/cli.ts examples/source-codes/effector-cart.ts -o examples/graphs/effector-cart.json
  tsx packages/extractor/src/cli.ts examples/source-codes/effector-counter.ts -o examples/graphs/effector-counter.json
`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const inputFile = args[0];
  let outputFile: string | null = null;

  const outIndex = args.indexOf('-o');
  if (outIndex !== -1 && args[outIndex + 1]) {
    outputFile = args[outIndex + 1];
  }

  console.log(`🔍 [Extractor] Parsing AST for: ${inputFile}...`);
  try {
    const graph = parseEffectorFile(inputFile);
    console.log(
      `✅ [Extractor] Extracted ${graph.nodes.length} nodes and ${graph.edges.length} edges directly from AST!`
    );

    if (outputFile) {
      writeGraphJSON(graph, outputFile);
      console.log(`💾 [Extractor] Successfully saved NodeGraph to ${outputFile}`);
    } else {
      console.log(JSON.stringify(graph, null, 2));
    }
  } catch (err) {
    console.error(`❌ [Extractor] Failed to parse:`, err);
    process.exit(1);
  }
}

main();
