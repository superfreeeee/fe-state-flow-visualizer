import React, { useState } from 'react';
import {
  Layers,
  Database,
  Cpu,
  Workflow,
  Sparkles,
  GitBranch,
  ShieldCheck,
  Code,
  CheckCircle2,
  Share2,
} from 'lucide-react';

export const ArchitectureDoc: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'overview' | 'datastruct' | 'indexing' | 'lifecycle' | 'roadmap'>('overview');

  return (
    <div
      id="architecture-design-doc"
      className="w-full h-full bg-neutral-950 text-neutral-200 overflow-y-auto p-6 md:p-8 select-text"
    >
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Hero */}
        <div className="border-b border-neutral-800 pb-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Architecture & Data Structure Refinement</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-100">
            Frontend State Flow Visualizer 架构与数据结构深度设计
          </h2>
          <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
            基于通用图模型（Graph Model）构建的响应式状态流检查器。将不同状态管理框架（Effector、Jotai、Zustand、Signals）通过适配层统一转换为纯净的 DAG 拓扑，实现查询（Query）、投影（Projection）与多端可视化（Renderer/CLI）。
          </p>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'overview', label: '1. 分层架构全貌', icon: Layers },
              { id: 'datastruct', label: '2. 核心数据结构规范', icon: Database },
              { id: 'indexing', label: '3. 图索引与邻接表设计', icon: GitBranch },
              { id: 'lifecycle', label: '4. 运行态与拓扑解耦', icon: Workflow },
              { id: 'roadmap', label: '5. Phase 1-3 落地路线', icon: CheckCircle2 },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
                  activeSection === id
                    ? 'bg-neutral-800 text-emerald-300 border border-emerald-500/40'
                    : 'text-neutral-400 hover:text-neutral-200 bg-neutral-900 border border-neutral-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section 1: Overview */}
        {activeSection === 'overview' && (
          <div className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>分层职责与信息流（The 5 Core Layers）</span>
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                在设计此基础设施时，最核心的原则是：<strong>严禁让框架概念污染核心图与渲染器</strong>，同时<strong>严禁将动态运行态状态（Runtime State）混入静态拓扑（Graph）</strong>。
              </p>

              {/* ASCII Flow Chart */}
              <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 font-mono text-[12px] text-neutral-300 overflow-x-auto leading-relaxed">
                {`[ Frameworks: Effector / Jotai / MobX / Signals ]
                          │
                          ▼
            ┌───────────────────────────┐
            │  Framework Adapter Layer  │  (Static AST Extraction / Runtime Introspection)
            └─────────────┬─────────────┘
                          │ (Builder Pattern: addNode, addEdge)
                          ▼
            ┌───────────────────────────┐
            │     Core Graph Store      │  (Immutable Fact: NodeStore, EdgeStore, GraphIndex)
            └─────────────┬─────────────┘
                          │ (Zero-copy Query: upstream, downstream, kind filter)
                          ▼
            ┌───────────────────────────┐
            │        GraphView          │  (Virtual / Lazy Readonly Subgraph)
            └─────────────┬─────────────┘
                          │ (Semantic transforms: State Flow, Dependency, Trace)
                          ▼
            ┌───────────────────────────┐
            │      Projection Layer     │  (Domain Clusters, Virtual Edges, Collapsing)
            └─────────────┬─────────────┘
                          │
         ┌────────────────┴────────────────┐
         ▼                                 ▼
┌──────────────────┐             ┌──────────────────┐
│  Layout Engine   │ (Sugiyama)  │   Runtime Store  │ (Versioned snapshots,
│  & SVG Renderer  │             │   Event Streams) │  Event subscriptions)
└──────────────────┘             └──────────────────┘`}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                <h4 className="text-sm font-semibold text-neutral-200 mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>核心原则 1：Graph 是事实</span>
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Graph 仅记录系统中客观存在的节点（Node）及其关系依赖（Edge），包含其源码文件、行号以及框架元数据。不随组件渲染或状态变动而频繁重建。
                </p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                <h4 className="text-sm font-semibold text-neutral-200 mb-2 flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-amber-400" />
                  <span>核心原则 2：Runtime 是状态</span>
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  每个节点的当前值（value）、变更版本号（version）、时间戳（updatedAt）以及事件触发流（Event Trace）完全存储于独立的 RuntimeStore 中，通过订阅驱动 UI 高亮与数值更新。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Data Structures */}
        {activeSection === 'datastruct' && (
          <div className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                <Database className="w-4 h-4 text-sky-400" />
                <span>统一数据模型定义（Standard Schema）</span>
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                为支持 Effector、Jotai、Zustand、Pinia 等任意框架，将节点种类（NodeKind）与边关系（EdgeKind）抽象为最高维度的响应式语义：
              </p>

              <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 font-mono text-xs text-neutral-300 overflow-x-auto">
                <pre>{`export type NodeKind =
  | 'state'      // 核心持久状态 ($store, atom, ref, signal)
  | 'derived'    // 纯计算衍生状态 ($total, computed, selector)
  | 'event'      // 触发源/动作 (createEvent, action, dispatch)
  | 'effect'     // 异步副作用/网络IO (createEffect, thunk)
  | 'reaction'   // 监听器/采样守卫 (sample, watch, reaction)
  | 'component'  // UI 宿主绑定组件 (React, Vue, Svelte)
  | 'unknown';

export type EdgeKind =
  | 'dependency' // 依赖关系（目标读取源）
  | 'derive'     // 纯推导边 (源计算生成目标，例如 $count -> $double)
  | 'update'     // 状态突变边 (例如 event -> $store)
  | 'trigger'    // 触发边 (例如 sample 触发 effect)
  | 'effect'     // 异步任务响应或完成
  | 'render'     // 驱动组件渲染 (useUnit, useSelector)
  | 'unknown';`}</pre>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
              <h4 className="text-sm font-semibold text-neutral-200">
                GraphNode 与 GraphEdge 详细结构
              </h4>
              <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 font-mono text-xs text-neutral-300 overflow-x-auto">
                <pre>{`export interface GraphNode {
  id: string;                       // 唯一全局 ID (例如 'store_cart_items')
  kind: NodeKind;                   // 通用语义种类 ('state' | 'derived' | 'event'...)
  name: string;                     // 实体变量名 (例如 '$cartItems')
  description?: string;             // 语义说明或注释
  framework?: {
    name: string;                   // 框架名称 ('effector', 'jotai')
    type: string;                   // 框架原生类型 ('store', 'sample')
    rawConfig?: Record<string, any>;// 框架特有配置
  };
  source?: {
    file: string;                   // 声明源文件路径 ('src/models/cart.ts')
    line: number;                   // 声明行号
    snippet?: string;               // 源码片段
  };
  groupId?: string;                 // 所属领域模块分组 ID
  metadata?: Record<string, any>;   // 扩展属性
}

export interface GraphEdge {
  id: string;                       // 边全局唯一 ID
  source: string;                   // 源节点 NodeId
  target: string;                   // 目标节点 NodeId
  kind: EdgeKind;                   // 边语义类型 ('update' | 'derive' | 'trigger'...)
  label?: string;                   // 边展示文本
  metadata?: Record<string, any>;
}`}</pre>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Indexing */}
        {activeSection === 'indexing' && (
          <div className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-emerald-400" />
                <span>图索引（GraphIndex）与双向邻接设计</span>
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                为满足高频交互下的<strong>上游根因追溯（Upstream Traversal）</strong>、<strong>下游影响面分析（Downstream Analysis）</strong>以及<strong>即时种类筛选</strong>，Graph 内部维护了多维倒排索引与邻接表：
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800">
                  <h4 className="text-xs font-mono font-bold text-emerald-400 mb-2">
                    双向邻接拓扑表 (Adjacency Index)
                  </h4>
                  <ul className="text-[11px] font-mono text-neutral-300 space-y-2">
                    <li>
                      <span className="text-sky-400">incomingEdges:</span> Map&lt;NodeId, Set&lt;EdgeId&gt;&gt;
                      <p className="text-neutral-500 font-sans text-[10px] mt-0.5">
                        记录以当前节点为 Target 的所有入边，支持 O(1) 立即获取上游来源。
                      </p>
                    </li>
                    <li>
                      <span className="text-sky-400">outgoingEdges:</span> Map&lt;NodeId, Set&lt;EdgeId&gt;&gt;
                      <p className="text-neutral-500 font-sans text-[10px] mt-0.5">
                        记录以当前节点为 Source 的所有出边，支持 O(1) 立即获取下游影响目标。
                      </p>
                    </li>
                  </ul>
                </div>

                <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800">
                  <h4 className="text-xs font-mono font-bold text-amber-400 mb-2">
                    倒排类别索引 (Inverted Indices)
                  </h4>
                  <ul className="text-[11px] font-mono text-neutral-300 space-y-2">
                    <li>
                      <span className="text-amber-300">nodesByKind:</span> Map&lt;NodeKind, Set&lt;NodeId&gt;&gt;
                      <p className="text-neutral-500 font-sans text-[10px] mt-0.5">
                        秒级检索全部 Store、Event 或 Effect 节点。
                      </p>
                    </li>
                    <li>
                      <span className="text-amber-300">nodesByFrameworkType:</span> Map&lt;string, Set&lt;NodeId&gt;&gt;
                      <p className="text-neutral-500 font-sans text-[10px] mt-0.5">
                        按 'effector:store' 或 'jotai:atom' 精确提取原生类型。
                      </p>
                    </li>
                    <li>
                      <span className="text-amber-300">nodesByName:</span> Map&lt;string, Set&lt;NodeId&gt;&gt;
                      <p className="text-neutral-500 font-sans text-[10px] mt-0.5">
                        支持快捷文本即时搜索与模糊匹配。
                      </p>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="p-3 bg-neutral-950 rounded border border-neutral-800 text-xs text-neutral-400">
                💡 <strong>内存与性能优势：</strong>在 10,000+ 节点的复杂工程中，用户点击某个状态节点聚焦时，BFS/DFS 遍历只需沿着 Set&lt;EdgeId&gt; 查找，无需对全局 Edges 数组进行全量 filter/find 线性扫描，将遍历时间从 O(E) 降至 O(V + E) 极速响应。
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Lifecycle & Runtime */}
        {activeSection === 'lifecycle' && (
          <div className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                <Workflow className="w-4 h-4 text-emerald-400" />
                <span>RuntimeStore 与动态响应流设计</span>
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                运行时生命周期负责捕获浏览器页面实际运行过程中的状态值快照与事件序列：
              </p>

              <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 font-mono text-xs text-neutral-300 overflow-x-auto">
                <pre>{`export interface RuntimeState {
  nodeId: string;
  value?: unknown;        // 当前值的最新快照
  version: number;        // 累加自增版本号（计算变更次数）
  updatedAt: number;      // 毫秒时间戳
  isPending?: boolean;    // 是否处于异步 effect 执行等待中
}

export interface RuntimeEvent {
  id: string;
  nodeId: string;
  timestamp: number;
  type: 'trigger' | 'update' | 'compute' | 'effect_start' | 'effect_done' | 'error';
  value?: unknown;
  meta?: Record<string, unknown>;
  triggerEdgeId?: string;
  sourceNodeId?: string;
}`}</pre>
              </div>

              <div className="p-3 bg-neutral-950 rounded border border-neutral-800 text-xs text-neutral-400 leading-relaxed">
                <strong>零拷贝视图（Zero-Copy GraphView）：</strong>
                <code>graph.query({'{ root: "$cartItems", direction: "upstream", depth: 2 }'})</code> 返回的
                <code>LazyGraphView</code> 仅仅持有候选节点 ID 的集合与源图的引用，迭代器 <code>nodes()</code>
                与 <code>edges()</code> 采用惰性生成器（Generator），无需开辟大内存深度复制整个图结构。
              </div>
            </div>
          </div>
        )}

        {/* Section 5: Roadmap */}
        {activeSection === 'roadmap' && (
          <div className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>阶段实施规划与关键交付物</span>
              </h3>

              <div className="space-y-3">
                <div className="p-3.5 bg-neutral-950 rounded-lg border border-neutral-800 flex items-start gap-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold">
                    Phase 1 (当前已完整实现)
                  </span>
                  <div>
                    <h5 className="text-xs font-bold text-neutral-200">
                      静态图模型 + 适配器 + 层次化 DAG 渲染引擎
                    </h5>
                    <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                      实现 GraphNode/GraphEdge 标准模型、GraphIndex 高速邻接索引、GraphBuilder 写入接口、EffectorAdapter 与 Jotai 适配器、Sugiyama 层次布局引擎、交互式 SVG 画布（平移、缩放、自适应居中）、节点高亮与源码检查器。
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-neutral-950 rounded-lg border border-neutral-800 flex items-start gap-3">
                  <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[11px] font-bold">
                    Phase 2 (当前已就绪核心框架)
                  </span>
                  <div>
                    <h5 className="text-xs font-bold text-neutral-200">
                      Query 引擎 + RuntimeStore + 实时波纹脉冲流
                    </h5>
                    <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                      实现 LazyGraphView、上游/下游定向切片、RuntimeStore 解耦数据存储、RuntimeEvent 时间线追踪、以及交互式波纹扩散动画演示。
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-neutral-950 rounded-lg border border-neutral-800 flex items-start gap-3">
                  <span className="px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 font-mono text-[11px] font-bold">
                    Phase 3 (未来演进)
                  </span>
                  <div>
                    <h5 className="text-xs font-bold text-neutral-200">
                      Projection 业务投影 + 协议抽象 (CLI / Chrome Extension)
                    </h5>
                    <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                      支持面向业务域的节点聚类收起（State Flow Projection、Component Boundary Projection），并通过 WebSocket 或 CDP 协议直接对接真实运行中的浏览器页面。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
