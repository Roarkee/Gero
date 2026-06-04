import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { 
  CheckCircle2, 
  FileText, 
  MessageSquare, 
  PlusCircle,
  RefreshCw,
  Clock,
  Briefcase
} from "lucide-react";

const getActivityIcon = (type) => {
  if (type.includes("completed") || type.includes("paid")) return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
  if (type.includes("created")) return <PlusCircle className="w-5 h-5 text-blue-500" />;
  if (type.includes("invoice") || type.includes("file")) return <FileText className="w-5 h-5 text-purple-500" />;
  if (type.includes("note") || type.includes("comment")) return <MessageSquare className="w-5 h-5 text-yellow-500" />;
  if (type.includes("timer")) return <Clock className="w-5 h-5 text-indigo-500" />;
  if (type.includes("status") || type.includes("updated") || type.includes("moved")) return <RefreshCw className="w-5 h-5 text-orange-500" />;
  return <Briefcase className="w-5 h-5 text-gray-500" />;
};

export default function RecentActivityFeed({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-800 mb-4">Recent Activity</h3>
        <p className="text-gray-500 text-sm">No recent activity found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-bold text-gray-800 mb-6">Recent Activity</h3>
      
      <div className="relative">
        <div className="absolute top-0 bottom-0 left-2.5 w-px bg-gray-200"></div>
        <ul className="space-y-6 relative z-10">
          {activities.map((activity) => (
            <li key={activity.id} className="flex gap-4 items-start bg-white">
              <div className="bg-white rounded-full p-0.5">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">
                  {activity.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400 font-medium">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </span>
                  {activity.related_id && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                      <Link
                        to={`/${activity.model}s/${activity.related_id}`}
                        className="text-xs text-indigo-600 hover:text-indigo-800 capitalize font-medium"
                      >
                        View {activity.model}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
