import apiClient from "../../../api/client";
import { API_ENDPOINTS } from "../../../api/endpoints";

export const projectsApi = {
  // Projects
  getProjects: async () => {
    const { data } = await apiClient.get(API_ENDPOINTS.PROJECTS);
    return data;
  },
  getProject: async (id) => {
    const { data } = await apiClient.get(API_ENDPOINTS.PROJECT_DETAIL(id));
    return data;
  },
  createProject: async (projectData) => {
    const { data } = await apiClient.post(API_ENDPOINTS.PROJECTS, projectData);
    return data;
  },
  updateProject: async ({ id, ...projectData }) => {
    const { data } = await apiClient.patch(API_ENDPOINTS.PROJECT_DETAIL(id), projectData);
    return data;
  },
  deleteProject: async (id) => {
    const { data } = await apiClient.delete(API_ENDPOINTS.PROJECT_DETAIL(id));
    return data;
  },

  // Task Lists
  getTaskLists: async () => {
    const { data } = await apiClient.get(API_ENDPOINTS.TASK_LISTS);
    return data;
  },
  createTaskList: async (listData) => {
    const { data } = await apiClient.post(API_ENDPOINTS.TASK_LISTS, listData);
    return data;
  },
  updateTaskList: async ({ id, ...listData }) => {
    const { data } = await apiClient.patch(API_ENDPOINTS.TASK_LIST_DETAIL(id), listData);
    return data;
  },
  deleteTaskList: async (id) => {
    const { data } = await apiClient.delete(API_ENDPOINTS.TASK_LIST_DETAIL(id));
    return data;
  },

  // Tasks
  getTasks: async () => {
    const { data } = await apiClient.get(API_ENDPOINTS.TASKS);
    return data;
  },
  createTask: async (taskData) => {
    const { data } = await apiClient.post(API_ENDPOINTS.TASKS, taskData);
    return data;
  },
  updateTask: async ({ id, ...taskData }) => {
    const { data } = await apiClient.patch(API_ENDPOINTS.TASK_DETAIL(id), taskData);
    return data;
  },
  deleteTask: async (id) => {
    const { data } = await apiClient.delete(API_ENDPOINTS.TASK_DETAIL(id));
    return data;
  },

  // Subtasks
  createSubtask: async (subtaskData) => {
    const { data } = await apiClient.post(API_ENDPOINTS.SUBTASKS, subtaskData);
    return data;
  },
  updateSubtask: async ({ id, ...subtaskData }) => {
    const { data } = await apiClient.patch(API_ENDPOINTS.SUBTASK_DETAIL(id), subtaskData);
    return data;
  },
  deleteSubtask: async (id) => {
    const { data } = await apiClient.delete(API_ENDPOINTS.SUBTASK_DETAIL(id));
    return data;
  },

  // Intelligence
  getProjectOverview: async (id) => {
    const { data } = await apiClient.get(API_ENDPOINTS.PROJECT_OVERVIEW(id));
    return data;
  },
  getProjectHealth: async (id) => {
    const { data } = await apiClient.get(API_ENDPOINTS.PROJECT_HEALTH(id));
    return data;
  },
  getProjectBudget: async (id) => {
    const { data } = await apiClient.get(API_ENDPOINTS.PROJECT_BUDGET(id));
    return data;
  },
  getProjectDelivery: async (id) => {
    const { data } = await apiClient.get(API_ENDPOINTS.PROJECT_DELIVERY(id));
    return data;
  },
  getProjectProductivity: async (id) => {
    const { data } = await apiClient.get(API_ENDPOINTS.PROJECT_PRODUCTIVITY(id));
    return data;
  },
  getProjectProfitability: async (id) => {
    const { data } = await apiClient.get(API_ENDPOINTS.PROJECT_PROFITABILITY(id));
    return data;
  },

  // Activities
  getActivities: async () => {
    const { data } = await apiClient.get(API_ENDPOINTS.ACTIVITIES);
    return data;
  },

  // Attachments
  getAttachments: async () => {
    const { data } = await apiClient.get(API_ENDPOINTS.ATTACHMENTS);
    return data;
  },
  createAttachment: async (formData) => {
    const { data } = await apiClient.post(API_ENDPOINTS.ATTACHMENTS, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },
  deleteAttachment: async (id) => {
    const { data } = await apiClient.delete(`${API_ENDPOINTS.ATTACHMENTS}${id}/`);
    return data;
  },

  // Time Tracking
  getTimeEntries: async () => {
    const { data } = await apiClient.get(API_ENDPOINTS.TIME_ENTRIES);
    return data;
  },
  getActiveTimer: async () => {
    const { data } = await apiClient.get(API_ENDPOINTS.ACTIVE_TIMER);
    return data;
  },
  startTimer: async (timerData) => {
    const { data } = await apiClient.post(API_ENDPOINTS.START_TIMER, timerData);
    return data;
  },
  stopTimer: async (id) => {
    const { data } = await apiClient.post(API_ENDPOINTS.STOP_TIMER(id));
    return data;
  },
  createTimeEntry: async (entryData) => {
    const { data } = await apiClient.post(API_ENDPOINTS.TIME_ENTRIES, entryData);
    return data;
  },
  updateTimeEntry: async ({ id, ...entryData }) => {
    const { data } = await apiClient.patch(`${API_ENDPOINTS.TIME_ENTRIES}${id}/`, entryData);
    return data;
  },
  deleteTimeEntry: async (id) => {
    const { data } = await apiClient.delete(`${API_ENDPOINTS.TIME_ENTRIES}${id}/`);
    return data;
  },
};
