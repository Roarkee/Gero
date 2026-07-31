from typing import List, Optional
from pydantic import BaseModel, Field

class SubtaskPlan(BaseModel):
    todo: str = Field(..., description="Actionable item to be completed.")

class TaskPlan(BaseModel):
    title: str = Field(..., description="Very short, concise title for the task (STRICT MAX 35 CHARACTERS, e.g., 'Setup Auth', 'Design Landing Page').")
    description: Optional[str] = Field(None, description="Detailed description of what the task entails.")
    estimated_hours: Optional[float] = Field(None, description="Estimated time to complete this task in hours.")
    priority: str = Field(
        "medium", 
        description="Priority level. Must be 'low', 'medium', 'high', or 'urgent'."
    )
    subtasks: List[SubtaskPlan] = Field(default_factory=list, description="List of subtasks required to complete this task.")

class TaskListPlan(BaseModel):
    name: str = Field(..., description="Short name of the task list (e.g., 'Design', 'Frontend', 'Backend').")
    tasks: List[TaskPlan] = Field(..., description="Tasks belonging to this list.")

class ProjectPlan(BaseModel):
    title: str = Field(..., description="Concise name of the project (e.g., 'E-commerce App').")
    description: Optional[str] = Field(None, description="Detailed project description.")
    priority: str = Field(
        "medium", 
        description="Project priority level. Must be 'low', 'medium', 'high', or 'urgent'."
    )
    budget: Optional[float] = Field(None, description="Overall budget allocated for the project, if available.")
    task_lists: List[TaskListPlan] = Field(..., description="Structured lists of tasks that make up the project.")
