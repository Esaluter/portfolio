window.PortfolioMap = window.PortfolioMap || {};

(function () {
  "use strict";

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function circleIntersectsRect(cx, cy, radius, rect) {
    const nearestX = clamp(cx, rect.x, rect.x + rect.width);
    const nearestY = clamp(cy, rect.y, rect.y + rect.height);
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return dx * dx + dy * dy < radius * radius;
  }

  function pointInPolygon(x, y, points) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x;
      const yi = points[i].y;
      const xj = points[j].x;
      const yj = points[j].y;
      const intersects = ((yi > y) !== (yj > y)) &&
        (x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi);
      if (intersects) inside = !inside;
    }
    return inside;
  }

  function distanceToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
    const t = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy), 0, 1);
    const x = ax + t * dx;
    const y = ay + t * dy;
    return Math.hypot(px - x, py - y);
  }

  function distanceToPolygonEdge(x, y, points) {
    let min = Infinity;
    for (let i = 0; i < points.length; i += 1) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      min = Math.min(min, distanceToSegment(x, y, a.x, a.y, b.x, b.y));
    }
    return min;
  }

  function circleInsidePolygon(x, y, radius, points) {
    return pointInPolygon(x, y, points) && distanceToPolygonEdge(x, y, points) >= radius;
  }

  function circleIntersectsPolygon(x, y, radius, points) {
    return pointInPolygon(x, y, points) || distanceToPolygonEdge(x, y, points) < radius;
  }

  function pointIsWalkable(x, y, world, radius) {
    if (x < radius || y < radius || x > world.width - radius || y > world.height - radius) {
      return false;
    }

    if (Array.isArray(world.walkableAreas) && world.walkableAreas.length) {
      const insidePlayableArea = world.walkableAreas.some((area) =>
        circleInsidePolygon(x, y, radius, area.points)
      );
      if (!insidePlayableArea) return false;
    }

    if (Array.isArray(world.blockedPolygons)) {
      const hitsBlockedPolygon = world.blockedPolygons.some((area) =>
        circleIntersectsPolygon(x, y, radius, area.points)
      );
      if (hitsBlockedPolygon) return false;
    }

    return !world.obstacles.some((obstacle) => circleIntersectsRect(x, y, radius, obstacle));
  }

  function segmentIsWalkable(a, b, world, radius) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distance = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(distance / Math.max(6, radius * 0.55)));

    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const x = a.x + dx * t;
      const y = a.y + dy * t;
      if (!pointIsWalkable(x, y, world, radius)) return false;
    }

    return true;
  }

  function simplifyPath(path, world, radius) {
    if (path.length <= 2) return path;

    const result = [path[0]];
    let anchor = 0;

    while (anchor < path.length - 1) {
      let furthest = anchor + 1;

      for (let candidate = path.length - 1; candidate > anchor + 1; candidate -= 1) {
        if (segmentIsWalkable(path[anchor], path[candidate], world, radius)) {
          furthest = candidate;
          break;
        }
      }

      result.push(path[furthest]);
      anchor = furthest;
    }

    return result;
  }

  class MinHeap {
    constructor() {
      this.items = [];
    }

    push(item) {
      this.items.push(item);
      let i = this.items.length - 1;
      while (i > 0) {
        const parent = Math.floor((i - 1) / 2);
        if (this.items[parent].f <= this.items[i].f) break;
        [this.items[parent], this.items[i]] = [this.items[i], this.items[parent]];
        i = parent;
      }
    }

    pop() {
      if (this.items.length === 0) return null;
      const root = this.items[0];
      const end = this.items.pop();
      if (this.items.length && end) {
        this.items[0] = end;
        let i = 0;
        while (true) {
          const left = i * 2 + 1;
          const right = left + 1;
          let smallest = i;
          if (left < this.items.length && this.items[left].f < this.items[smallest].f) smallest = left;
          if (right < this.items.length && this.items[right].f < this.items[smallest].f) smallest = right;
          if (smallest === i) break;
          [this.items[i], this.items[smallest]] = [this.items[smallest], this.items[i]];
          i = smallest;
        }
      }
      return root;
    }

    get size() {
      return this.items.length;
    }
  }

  function findPath(start, goal, world, playerRadius, options) {
    const cellSize = options.cellSize;
    const cols = Math.ceil(world.width / cellSize);
    const rows = Math.ceil(world.height / cellSize);

    if (!pointIsWalkable(goal.x, goal.y, world, playerRadius)) return null;
    if (!pointIsWalkable(start.x, start.y, world, playerRadius)) return null;
    if (segmentIsWalkable(start, goal, world, playerRadius)) return [start, goal];

    const toCell = (point) => ({
      x: clamp(Math.floor(point.x / cellSize), 0, cols - 1),
      y: clamp(Math.floor(point.y / cellSize), 0, rows - 1)
    });

    const toWorld = (cell) => ({
      x: Math.min(world.width - playerRadius, cell.x * cellSize + cellSize / 2),
      y: Math.min(world.height - playerRadius, cell.y * cellSize + cellSize / 2)
    });

    const startCell = toCell(start);
    const goalCell = toCell(goal);
    const key = (x, y) => `${x},${y}`;
    const heuristic = (x, y) => Math.hypot(goalCell.x - x, goalCell.y - y);

    const open = new MinHeap();
    const cameFrom = new Map();
    const gScore = new Map();
    const closed = new Set();

    const startKey = key(startCell.x, startCell.y);
    gScore.set(startKey, 0);
    open.push({ x: startCell.x, y: startCell.y, g: 0, f: heuristic(startCell.x, startCell.y) });

    const dirs = [
      { x: 1, y: 0, cost: 1 },
      { x: -1, y: 0, cost: 1 },
      { x: 0, y: 1, cost: 1 },
      { x: 0, y: -1, cost: 1 },
      { x: 1, y: 1, cost: Math.SQRT2 },
      { x: -1, y: 1, cost: Math.SQRT2 },
      { x: 1, y: -1, cost: Math.SQRT2 },
      { x: -1, y: -1, cost: Math.SQRT2 }
    ];

    let iterations = 0;
    let foundKey = null;

    while (open.size && iterations < options.maxIterations) {
      iterations += 1;
      const current = open.pop();
      if (!current) break;
      const currentKey = key(current.x, current.y);
      if (closed.has(currentKey)) continue;
      closed.add(currentKey);

      if (current.x === goalCell.x && current.y === goalCell.y) {
        foundKey = currentKey;
        break;
      }

      for (const dir of dirs) {
        const nx = current.x + dir.x;
        const ny = current.y + dir.y;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;

        const nodeWorld = toWorld({ x: nx, y: ny });
        if (!pointIsWalkable(nodeWorld.x, nodeWorld.y, world, playerRadius)) continue;

        if (dir.x !== 0 && dir.y !== 0) {
          const sideA = toWorld({ x: current.x + dir.x, y: current.y });
          const sideB = toWorld({ x: current.x, y: current.y + dir.y });
          if (!pointIsWalkable(sideA.x, sideA.y, world, playerRadius) ||
              !pointIsWalkable(sideB.x, sideB.y, world, playerRadius)) {
            continue;
          }
        }

        const neighborKey = key(nx, ny);
        if (closed.has(neighborKey)) continue;

        const tentativeG = current.g + dir.cost;
        if (tentativeG >= (gScore.get(neighborKey) ?? Infinity)) continue;

        cameFrom.set(neighborKey, currentKey);
        gScore.set(neighborKey, tentativeG);
        open.push({ x: nx, y: ny, g: tentativeG, f: tentativeG + heuristic(nx, ny) });
      }
    }

    if (!foundKey) return null;

    const cells = [];
    let cursor = foundKey;
    while (cursor) {
      const [x, y] = cursor.split(",").map(Number);
      cells.push({ x, y });
      if (cursor === startKey) break;
      cursor = cameFrom.get(cursor);
    }

    cells.reverse();
    const path = [start];
    for (let i = 1; i < cells.length; i += 1) path.push(toWorld(cells[i]));

    if (segmentIsWalkable(path[path.length - 1], goal, world, playerRadius)) path.push(goal);

    return simplifyPath(path, world, playerRadius);
  }

  window.PortfolioMap.Geometry = {
    clamp,
    circleIntersectsRect,
    pointInPolygon,
    distanceToPolygonEdge,
    pointIsWalkable,
    segmentIsWalkable
  };

  window.PortfolioMap.findPath = findPath;
})();
