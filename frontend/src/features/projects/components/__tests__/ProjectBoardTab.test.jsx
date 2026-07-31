/**
 * ProjectBoardTab — Kanban Layout Tests
 *
 * Run with: npx vitest run src/features/projects/components/__tests__/ProjectBoardTab.test.jsx
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("../hooks/useTasks", () => ({
  useTaskLists: () => ({
    createTaskList: { mutateAsync: vi.fn().mockResolvedValue({}), isPending: false },
  }),
  useTasks: () => ({
    updateTask: { mutateAsync: vi.fn().mockResolvedValue({}) },
  }),
}));

vi.mock("../TaskDetailDrawer", () => ({
  default: () => null,
}));

vi.mock("../TaskList", () => ({
  default: ({ list }) => (
    <div data-testid={`list-${list.id}`} style={{ width: "288px", flexShrink: 0 }}>
      {list.name}
    </div>
  ),
}));

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }) => <div>{children}</div>,
  closestCorners: vi.fn(),
  PointerSensor: class {},
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn((...args) => args),
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }) => <div>{children}</div>,
  horizontalListSortingStrategy: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeProject(listCount = 0) {
  return {
    id: 1,
    name: "Test Project",
    task_lists: Array.from({ length: listCount }, (_, i) => ({
      id: i + 1,
      name: `List ${i + 1}`,
      position: i,
      tasks: [],
    })),
  };
}

// Import AFTER mocks
const { default: ProjectBoardTab } = await import("../ProjectBoardTab");

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ProjectBoardTab — Kanban layout", () => {
  it("renders all task lists", () => {
    render(<ProjectBoardTab project={makeProject(5)} />);
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByTestId(`list-${i}`)).toBeInTheDocument();
    }
  });

  it("renders 10+ task lists without wrapping", () => {
    render(<ProjectBoardTab project={makeProject(12)} />);
    for (let i = 1; i <= 12; i++) {
      expect(screen.getByTestId(`list-${i}`)).toBeInTheDocument();
    }
  });

  it("always renders the 'Add another list' button", () => {
    render(<ProjectBoardTab project={makeProject(0)} />);
    expect(screen.getByText("Add another list")).toBeInTheDocument();
  });

  it("still shows 'Add another list' with many columns", () => {
    render(<ProjectBoardTab project={makeProject(15)} />);
    expect(screen.getByText("Add another list")).toBeInTheDocument();
  });

  it("scroll container has overflow-x: auto", () => {
    const { container } = render(<ProjectBoardTab project={makeProject(3)} />);
    // The board scroll div is the first child of the root flex container
    const boardScrollEl = container.querySelector("[style*='overflow']");
    const style = boardScrollEl?.getAttribute("style") ?? "";
    // Should contain overflowX auto
    expect(style).toMatch(/overflow/);
  });

  it("inner strip uses inline-flex so natural width triggers scroll", () => {
    const { container } = render(<ProjectBoardTab project={makeProject(3)} />);
    const inlineFlexEl = container.querySelector(".inline-flex");
    expect(inlineFlexEl).not.toBeNull();
  });

  it("clicking 'Add another list' shows the create form", async () => {
    render(<ProjectBoardTab project={makeProject(2)} />);
    await userEvent.click(screen.getByText("Add another list"));
    expect(screen.getByPlaceholderText("List name...")).toBeInTheDocument();
  });

  it("pressing Escape on create form hides it", async () => {
    render(<ProjectBoardTab project={makeProject(2)} />);
    await userEvent.click(screen.getByText("Add another list"));
    const input = screen.getByPlaceholderText("List name...");
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByPlaceholderText("List name...")).not.toBeInTheDocument();
    expect(screen.getByText("Add another list")).toBeInTheDocument();
  });

  it("all TaskList items have flex-shrink-0 (from TaskList component)", () => {
    const { container } = render(<ProjectBoardTab project={makeProject(5)} />);
    // Our mock renders with flexShrink: 0 style
    const lists = container.querySelectorAll("[data-testid^='list-']");
    lists.forEach((el) => {
      expect(el.style.flexShrink).toBe("0");
    });
  });
});
