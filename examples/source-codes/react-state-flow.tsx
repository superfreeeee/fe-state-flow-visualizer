import React, { useState, useCallback, useMemo } from 'react';

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

export const TaskManagerApp: React.FC = () => {
  // 1. Primitive States
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: '1', title: 'Write unit tests for DAG', completed: true, priority: 'high' },
    { id: '2', title: 'Implement AST Extractor', completed: false, priority: 'high' },
    { id: '3', title: 'Optimize canvas rendering', completed: false, priority: 'medium' },
  ]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [newTitle, setNewTitle] = useState<string>('');

  // 2. Memoized Derived Values (State derivation flow)
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchFilter =
        filter === 'all' ? true : filter === 'completed' ? t.completed : !t.completed;
      const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [tasks, filter, searchQuery]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    return { total, completed, pending };
  }, [tasks]);

  // 3. Callback Handlers (Events mutating upstream state)
  const handleAddTask = useCallback(() => {
    if (!newTitle.trim()) return;
    const newTask: TaskItem = {
      id: `task_${Date.now()}`,
      title: newTitle.trim(),
      completed: false,
      priority: 'medium',
    };
    setTasks((prev) => [...prev, newTask]);
    setNewTitle('');
  }, [newTitle]);

  const handleToggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }, []);

  const handleClearCompleted = useCallback(() => {
    setTasks((prev) => prev.filter((t) => !t.completed));
  }, []);

  return (
    <div className="p-4 max-w-md mx-auto bg-neutral-900 text-neutral-100 rounded-lg">
      <h2 className="text-base font-bold mb-2">Task Manager ({stats.pending} pending)</h2>
      <div className="flex gap-2 mb-3">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New task..."
          className="bg-neutral-800 px-2 py-1 rounded text-xs flex-1"
        />
        <button onClick={handleAddTask} className="bg-emerald-600 px-3 py-1 rounded text-xs">
          Add
        </button>
      </div>
      <div className="flex gap-2 mb-3 text-xs">
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('active')}>Active</button>
        <button onClick={() => setFilter('completed')}>Done</button>
        <button onClick={handleClearCompleted} className="text-rose-400 ml-auto">
          Clear Completed
        </button>
      </div>
      <ul className="space-y-1 text-xs">
        {filteredTasks.map((task) => (
          <li
            key={task.id}
            onClick={() => handleToggleTask(task.id)}
            className="p-1.5 bg-neutral-800 rounded cursor-pointer flex items-center justify-between"
          >
            <span className={task.completed ? 'line-through text-neutral-500' : ''}>
              {task.title}
            </span>
            <span className="text-[10px] text-neutral-400">{task.priority}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
