import type { Task } from "./types.ts";
export const TREE = {
  cardWidth: 256,
  cardHeight: 154,
  column: 338,
  row: 190,
  padding: 30,
};
export function layoutTasks(tasks: Task[], collapsed: Set<string> = new Set()) {
  const positions = new Map<
    string,
    { x: number; y: number; parent: string | null }
  >();
  const ids = new Set(tasks.map((t) => t.id));
  const visited = new Set<string>();
  let row = 0;
  let deepest = 0;
  let invalid = false;
  const place = (task: Task, depth: number, parent: string | null): number => {
    if (visited.has(task.id)) {
      invalid = true;
      return TREE.padding;
    }
    visited.add(task.id);
    deepest = Math.max(deepest, depth);
    const children = collapsed.has(task.id)
      ? []
      : tasks.filter((t) => t.parentId === task.id && !visited.has(t.id));
    const centers = children.map((t) => place(t, depth + 1, task.id));
    const y = centers.length
      ? (centers[0] + centers.at(-1)!) / 2
      : TREE.padding + row++ * TREE.row;
    positions.set(task.id, {
      x: TREE.padding + depth * TREE.column,
      y,
      parent,
    });
    return y;
  };
  const roots = tasks.filter((t) => !t.parentId || !ids.has(t.parentId));
  roots.forEach((t) => place(t, 1, null));
  // A malformed legacy cycle must remain inspectable rather than hanging the canvas.
  const hidden = new Set<string>();
  const hide = (id: string) => {
    tasks
      .filter((t) => t.parentId === id && !hidden.has(t.id))
      .forEach((t) => {
        hidden.add(t.id);
        hide(t.id);
      });
  };
  collapsed.forEach(hide);
  tasks
    .filter((t) => !visited.has(t.id) && !hidden.has(t.id))
    .forEach((t) => {
      invalid = true;
      place(t, 1, null);
    });
  const rootYs = [...positions.values()]
    .filter((p) => p.parent === null)
    .map((p) => p.y);
  const rootY = rootYs.length
    ? (Math.min(...rootYs) + Math.max(...rootYs)) / 2
    : TREE.padding;
  return {
    positions,
    rootY,
    width:
      TREE.padding * 2 + (deepest || 1) * TREE.column + TREE.cardWidth + 100,
    height: Math.max(TREE.row, row * TREE.row + TREE.padding * 2),
    invalid,
  };
}
