import { FrameworkAdapter, ExtractInput } from './FrameworkAdapter';
import { GraphBuilder } from '../graph/GraphBuilder';
import { NodeKind, EdgeKind } from '../../types/graph';

export interface EffectorEntityDef {
  id: string;
  name: string;
  kind: 'store' | 'event' | 'effect' | 'derived' | 'sample' | 'component' | 'state';
  initialValue?: unknown;
  sourceFile?: string;
  sourceLine?: number;
  description?: string;
  targets?: Array<{
    targetId: string;
    kind?: EdgeKind;
    label?: string;
  }>;
  sources?: Array<{
    sourceId: string;
    kind?: EdgeKind;
    label?: string;
  }>;
}

/**
 * Effector Framework Adapter
 * Translates Effector Stores, Events, Effects, Samples, and Derived units
 * into universal Graph Nodes and Edges.
 */
export class EffectorAdapter implements FrameworkAdapter {
  public readonly framework = 'effector';
  public readonly version = '23.x';

  public extract(input: ExtractInput, builder: GraphBuilder): void {
    const definitions = (input.definitions || []) as EffectorEntityDef[];

    for (const def of definitions) {
      let nodeKind: NodeKind = 'unknown';

      switch (def.kind) {
        case 'store':
          nodeKind = 'state';
          break;
        case 'event':
          nodeKind = 'event';
          break;
        case 'effect':
          nodeKind = 'effect';
          break;
        case 'derived':
          nodeKind = 'derived';
          break;
        case 'sample':
          nodeKind = 'reaction';
          break;
        case 'component':
          nodeKind = 'component';
          break;
        default:
          nodeKind = 'state';
      }

      builder.addNode({
        id: def.id,
        name: def.name,
        kind: nodeKind,
        description: def.description,
        framework: {
          name: 'effector',
          type: def.kind,
          rawConfig: {
            initialValue: def.initialValue,
          },
        },
        source: {
          file: def.sourceFile || 'src/models/model.ts',
          line: def.sourceLine || 1,
          snippet: this.generateSourceSnippet(def),
        },
        metadata: {
          initialValue: def.initialValue,
        },
      });
    }

    // Now connect relationships
    for (const def of definitions) {
      if (def.targets) {
        for (const t of def.targets) {
          const edgeKind: EdgeKind =
            t.kind ||
            (def.kind === 'event'
              ? 'update'
              : def.kind === 'derived'
              ? 'derive'
              : def.kind === 'effect'
              ? 'effect'
              : 'dependency');

          builder.addEdge({
            source: def.id,
            target: t.targetId,
            kind: edgeKind,
            label: t.label || edgeKind,
          });
        }
      }

      if (def.sources) {
        for (const s of def.sources) {
          builder.addEdge({
            source: s.sourceId,
            target: def.id,
            kind: s.kind || 'dependency',
            label: s.label || s.kind,
          });
        }
      }
    }
  }

  private generateSourceSnippet(def: EffectorEntityDef): string {
    switch (def.kind) {
      case 'store':
        return `export const ${def.name} = createStore(${JSON.stringify(
          def.initialValue ?? 0
        )});`;
      case 'event':
        return `export const ${def.name} = createEvent<any>();`;
      case 'effect':
        return `export const ${def.name} = createEffect(async (params) => {\n  return api.fetch(params);\n});`;
      case 'derived':
        return `export const ${def.name} = $store.map((state) => state.computed);`;
      case 'sample':
        return `sample({\n  clock: ${def.name}Clock,\n  target: ${def.name}Target,\n});`;
      case 'component':
        return `export function ${def.name}() {\n  const value = useUnit($store);\n  return <div>{value}</div>;\n}`;
      default:
        return `// unit ${def.name}`;
    }
  }
}
