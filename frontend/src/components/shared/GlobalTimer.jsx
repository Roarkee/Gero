import { useEffect, useState } from "react";
import { useActiveTimer, useStopTimer } from "../../api/queries/useTimeTracking";
import { useAppStore } from "../../store/appStore";
import { Play, Square, Clock } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";

export default function GlobalTimer() {
    const { data: activeTimerData, isLoading } = useActiveTimer();
    const { mutate: stopTimer, isPending: isStopping } = useStopTimer();
    const { setActiveTimer, clearActiveTimer, activeTimer } = useAppStore();
    const [elapsed, setElapsed] = useState("");

    // Sync React Query data to Zustand store
    useEffect(() => {
        if (activeTimerData) {
            setActiveTimer(activeTimerData);
        } else if (activeTimerData === null && !isLoading) {
            clearActiveTimer();
        }
    }, [activeTimerData, isLoading, setActiveTimer, clearActiveTimer]);

    // Update timer display every minute
    useEffect(() => {
        let interval;
        if (activeTimer?.start_time) {
            const updateElapsed = () => {
                try {
                    const startTime = new Date(activeTimer.start_time);
                    setElapsed(formatDistanceToNowStrict(startTime));
                } catch (e) {
                    setElapsed("Running...");
                }
            };
            updateElapsed();
            interval = setInterval(updateElapsed, 60000);
        }
        return () => clearInterval(interval);
    }, [activeTimer]);

    const handleStop = () => {
        if (activeTimer?.id) {
            stopTimer(activeTimer.id);
        }
    };

    if (!activeTimer) return null;

    return (
        <div className="flex items-center gap-3 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-full shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
                <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                </div>
                <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                    {elapsed}
                </span>
            </div>

            <div className="h-4 w-px bg-indigo-200 dark:bg-indigo-700 mx-1"></div>

            <div className="flex items-center text-xs text-indigo-600/80 dark:text-indigo-400 truncate max-w-[150px] hidden sm:flex">
                <span className="truncate">{activeTimer.task_title || 'Active Task'}</span>
            </div>

            <button
                onClick={handleStop}
                disabled={isStopping}
                className="ml-2 p-1.5 bg-white dark:bg-gray-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                title="Stop Timer"
            >
                <Square className="w-3.5 h-3.5 fill-current" />
            </button>
        </div>
    );
}
