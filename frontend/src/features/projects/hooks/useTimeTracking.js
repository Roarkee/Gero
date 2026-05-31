import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "../api/projects.api";

export const useTimeTracking = () => {
  const queryClient = useQueryClient();

  const timeEntriesQuery = useQuery({
    queryKey: ["timeEntries"],
    queryFn: projectsApi.getTimeEntries,
  });

  const activeTimerQuery = useQuery({
    queryKey: ["activeTimer"],
    queryFn: projectsApi.getActiveTimer,
    refetchInterval: 60000, // Refetch every minute to keep UI in sync
  });

  const startTimer = useMutation({
    mutationFn: projectsApi.startTimer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeTimer"] });
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      queryClient.invalidateQueries({ queryKey: ["project"] }); // To update time logged on tasks
    },
  });

  const stopTimer = useMutation({
    mutationFn: projectsApi.stopTimer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeTimer"] });
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
  });

  const createTimeEntry = useMutation({
    mutationFn: projectsApi.createTimeEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
  });

  const updateTimeEntry = useMutation({
    mutationFn: projectsApi.updateTimeEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
  });

  const deleteTimeEntry = useMutation({
    mutationFn: projectsApi.deleteTimeEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeEntries"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
  });

  return {
    timeEntriesQuery,
    activeTimerQuery,
    startTimer,
    stopTimer,
    createTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
  };
};
