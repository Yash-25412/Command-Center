"use client";

import { deleteTask } from "@/app/actions/tasks";

export default function DeleteTaskButton({ taskId, taskTitle }: { taskId: string; taskTitle: string }) {
  return (
    <form
      action={deleteTask}
      onSubmit={(e) => {
        if (!confirm(`Delete "${taskTitle}"? This removes its whole Journey and links too, and can't be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="taskId" value={taskId} />
      <button type="submit" className="btn btn-sm w-full justify-center text-red">
        Delete task
      </button>
    </form>
  );
}
