import { parseSync } from 'oxc-parser';
import { GraphNode, GraphEdge, NodeGraph, EdgeKind } from '@state-flow/common';

export interface ParseOptions {
  fileName?: string;
  sourceText: string;
}

interface SourceLocation {
  file: string;
  line: number;
  column: number;
  snippet: string;
}

/**
 * Effector AST Parser powered by oxc-parser.
 * Rapidly parses modern TypeScript and TSX into universal NodeGraph (nodes & edges)
 * with zero reliance on the heavy TypeScript compiler API.
 */
export class EffectorAstParser {
  private fileName: string;
  private sourceText: string;
  private isTsx: boolean;
  private lineStarts: number[] = [];
  private nodesMap = new Map<string, GraphNode>();
  private edges: GraphEdge[] = [];
  private edgeCounter = 0;

  constructor(options: ParseOptions) {
    this.fileName = options.fileName || 'source.ts';
    this.sourceText = options.sourceText;
    this.isTsx =
      this.fileName.endsWith('.tsx') ||
      this.fileName.endsWith('.jsx') ||
      options.sourceText.includes('</') ||
      options.sourceText.includes('/>');

    this.computeLineStarts();
  }

  private computeLineStarts(): void {
    this.lineStarts = [0];
    for (let i = 0; i < this.sourceText.length; i++) {
      if (this.sourceText[i] === '\n') {
        this.lineStarts.push(i + 1);
      }
    }
  }

  private getSourceLocation(start: number, end: number): SourceLocation {
    let low = 0;
    let high = this.lineStarts.length - 1;
    let line = 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (this.lineStarts[mid] <= start) {
        line = mid + 1;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    const lineStart = this.lineStarts[line - 1];
    const column = start - lineStart + 1;
    const rawText = this.sourceText.slice(start, end).trim();
    const snippet = rawText.length > 80 ? rawText.slice(0, 77) + '...' : rawText;

    return {
      file: this.fileName,
      line,
      column,
      snippet,
    };
  }

  private getNodeText(node: { start: number; end: number }): string {
    return this.sourceText.slice(node.start, node.end);
  }

  private addNode(node: GraphNode): void {
    if (!this.nodesMap.has(node.id)) {
      this.nodesMap.set(node.id, node);
    }
  }

  private addEdge(source: string, target: string, kind: EdgeKind, label?: string): void {
    this.edgeCounter++;
    const id = `e_${source}_${target}_${this.edgeCounter}`;
    this.edges.push({
      id,
      source,
      target,
      kind,
      label,
    });
  }

  public parse(): NodeGraph {
    this.nodesMap.clear();
    this.edges = [];
    this.edgeCounter = 0;

    const parseResult = parseSync(this.fileName, this.sourceText, {
      lang: this.isTsx ? 'tsx' : 'ts',
      sourceType: 'module',
    });

    if (parseResult.errors && parseResult.errors.length > 0) {
      console.warn(
        `[oxc-parser] Parsed with ${parseResult.errors.length} syntax warning(s) in ${this.fileName}`
      );
    }

    const ast = parseResult.program;
    this.walkAst(ast);

    return {
      nodes: Array.from(this.nodesMap.values()),
      edges: this.edges,
      metadata: {
        sourceFile: this.fileName,
        framework: 'effector',
        extractedAt: new Date().toISOString(),
      },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private walkAst(rootNode: any): void {
    let currentComponentScope: string | null = null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const traverse = (node: any, parent: any): void => {
      if (!node || typeof node !== 'object') return;

      const previousScope = currentComponentScope;

      // Detect React component declaration in TSX / JSX
      if (
        (node.type === 'FunctionDeclaration' && node.id?.name && /^[A-Z]/.test(node.id.name)) ||
        (node.type === 'VariableDeclarator' &&
          node.id?.name &&
          /^[A-Z]/.test(node.id.name) &&
          node.init &&
          (node.init.type === 'ArrowFunctionExpression' || node.init.type === 'FunctionExpression'))
      ) {
        currentComponentScope = node.id.name;
      }

      // 1. Variable Declarations
      if (node.type === 'VariableDeclaration') {
        for (const decl of node.declarations) {
          if (decl.id && decl.id.type === 'Identifier' && decl.init) {
            const varName = decl.id.name;
            this.analyzeVariableDeclaration(varName, decl.init, decl);
          }
        }
      }

      // 2. Call Expressions
      if (node.type === 'CallExpression') {
        this.analyzeCallExpression(node, parent, currentComponentScope);
      }

      // Walk children
      for (const key of Object.keys(node)) {
        if (key === 'parent') continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const child = (node as any)[key];
        if (Array.isArray(child)) {
          for (const item of child) {
            if (item && typeof item === 'object' && typeof item.type === 'string') {
              traverse(item, node);
            }
          }
        } else if (child && typeof child === 'object' && typeof child.type === 'string') {
          traverse(child, node);
        }
      }

      currentComponentScope = previousScope;
    };

    traverse(rootNode, null);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private analyzeVariableDeclaration(varName: string, initializer: any, declNode: any): void {
    // Unwind method chain, e.g. createStore(0).on(ev, ...).reset(res)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rootCall: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const methodChain: Array<{ method: string; args: any[] }> = [];

    let currentExpr = initializer;
    while (currentExpr && currentExpr.type === 'CallExpression') {
      if (
        currentExpr.callee.type === 'MemberExpression' &&
        currentExpr.callee.property &&
        currentExpr.callee.property.type === 'Identifier'
      ) {
        methodChain.unshift({
          method: currentExpr.callee.property.name,
          args: currentExpr.arguments,
        });
        currentExpr = currentExpr.callee.object;
      } else if (currentExpr.callee.type === 'Identifier') {
        rootCall = currentExpr;
        break;
      } else {
        break;
      }
    }

    if (
      !rootCall &&
      currentExpr &&
      currentExpr.type === 'CallExpression' &&
      currentExpr.callee.type === 'Identifier'
    ) {
      rootCall = currentExpr;
    }

    const loc = this.getSourceLocation(declNode.start, declNode.end);

    // If it's a MemberExpression initialization: e.g. const $isLoading = loadPostsFx.pending
    if (
      !rootCall &&
      initializer.type === 'MemberExpression' &&
      initializer.object?.type === 'Identifier'
    ) {
      const sourceMember = this.getNodeText(initializer);
      this.addNode({
        id: varName,
        kind: 'derived',
        name: varName,
        framework: { name: 'effector', type: 'store' },
        source: loc,
      });
      this.addEdge(sourceMember, varName, 'derive', 'derive');
      return;
    }

    if (!rootCall) return;

    const fnName = rootCall.callee.name;

    // Effector primitives detection:
    if (fnName === 'createStore') {
      const initArg = rootCall.arguments[0];
      let initialValue: unknown = undefined;
      if (initArg) {
        try {
          if (initArg.type === 'Literal') {
            initialValue = initArg.value;
          } else if (
            initArg.type === 'UnaryExpression' &&
            initArg.operator === '-' &&
            initArg.argument.type === 'Literal'
          ) {
            initialValue = -Number(initArg.argument.value);
          } else if (initArg.type === 'ArrayExpression') {
            initialValue = [];
          } else if (initArg.type === 'ObjectExpression') {
            initialValue = {};
          }
        } catch {
          // fallback
        }
      }

      this.addNode({
        id: varName,
        kind: 'state',
        name: varName,
        framework: { name: 'effector', type: 'store' },
        source: loc,
        metadata: { initialValue },
      });
    } else if (fnName === 'createEvent') {
      this.addNode({
        id: varName,
        kind: 'event',
        name: varName,
        framework: { name: 'effector', type: 'event' },
        source: loc,
      });
    } else if (fnName === 'createEffect') {
      this.addNode({
        id: varName,
        kind: 'effect',
        name: varName,
        framework: { name: 'effector', type: 'effect' },
        source: loc,
      });
    } else if (fnName === 'combine') {
      this.addNode({
        id: varName,
        kind: 'derived',
        name: varName,
        framework: { name: 'effector', type: 'combine' },
        source: loc,
      });

      // Wire arguments as dependencies to this combined derived store
      for (const arg of rootCall.arguments) {
        if (arg.type === 'Identifier') {
          this.addEdge(arg.name, varName, 'derive', 'combine');
        } else if (arg.type === 'MemberExpression') {
          const text = this.getNodeText(arg);
          this.addEdge(text, varName, 'derive', 'combine');
        }
      }
    }

    // Process chained methods on the store (e.g. .on(event, fn) or .reset(event))
    for (const step of methodChain) {
      if (step.method === 'on' && step.args.length > 0) {
        const triggerArg = step.args[0];
        const triggerName = this.getNodeText(triggerArg);
        this.addEdge(triggerName, varName, 'update', 'on');
      } else if (step.method === 'reset' && step.args.length > 0) {
        const resetArg = step.args[0];
        const resetName = this.getNodeText(resetArg);
        this.addEdge(resetName, varName, 'update', 'reset');
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private analyzeCallExpression(call: any, parent: any, componentScope: string | null): void {
    const fnName =
      call.callee.type === 'Identifier'
        ? call.callee.name
        : call.callee.type === 'MemberExpression'
          ? call.callee.property?.name
          : this.getNodeText(call.callee);

    // 1. sample({ clock?, source?, filter?, fn?, target? })
    if (fnName === 'sample' && call.arguments.length > 0) {
      const firstArg = call.arguments[0];
      if (firstArg.type === 'ObjectExpression') {
        let clockId: string | null = null;
        let sourceId: string | null = null;
        let targetId: string | null = null;

        for (const prop of firstArg.properties) {
          if (prop.type === 'Property' || prop.type === 'ObjectProperty') {
            const key = prop.key?.name || this.getNodeText(prop.key);
            const val = this.getNodeText(prop.value);

            if (key === 'clock') clockId = val;
            if (key === 'source') sourceId = val;
            if (key === 'target') targetId = val;
          }
        }

        if (targetId) {
          if (clockId) {
            this.addEdge(clockId, targetId, 'trigger', 'sample:clock');
          }
          if (sourceId && sourceId !== clockId) {
            this.addEdge(sourceId, targetId, 'dependency', 'sample:source');
          }
        }
      }
      return;
    }

    // 2. React TSX useUnit({ store: $store, onTrigger: triggerEvent })
    if (fnName === 'useUnit' && call.arguments.length > 0 && componentScope) {
      const compLoc = this.getSourceLocation(call.start, call.end);
      this.addNode({
        id: componentScope,
        kind: 'component',
        name: componentScope,
        framework: { name: 'react', type: 'component' },
        source: compLoc,
      });

      const firstArg = call.arguments[0];
      if (firstArg.type === 'ObjectExpression') {
        for (const prop of firstArg.properties) {
          if (prop.type === 'Property' || prop.type === 'ObjectProperty') {
            const bindingKey = prop.key?.name || this.getNodeText(prop.key);
            const unitName = this.getNodeText(prop.value);

            if (unitName.startsWith('$')) {
              // Store -> Component (render dependency)
              this.addEdge(unitName, componentScope, 'render', `useUnit:${bindingKey}`);
            } else {
              // Component -> Event/Effect (trigger)
              this.addEdge(componentScope, unitName, 'trigger', `useUnit:${bindingKey}`);
            }
          }
        }
      }
      return;
    }

    // 3. Standalone $store.on(event, handler) or $store.reset(event)
    // Only analyze if this is a top-level ExpressionStatement
    if (
      parent?.type === 'ExpressionStatement' &&
      call.callee.type === 'MemberExpression' &&
      call.callee.object?.type === 'Identifier'
    ) {
      const method = call.callee.property?.name;
      if ((method === 'on' || method === 'reset') && call.arguments.length > 0) {
        const storeName = call.callee.object.name;
        const eventName = this.getNodeText(call.arguments[0]);
        this.addEdge(eventName, storeName, 'update', method);
      }
    }
  }
}

export function parseEffectorSource(code: string, fileName?: string): NodeGraph {
  const parser = new EffectorAstParser({ sourceText: code, fileName });
  return parser.parse();
}
