import { Link } from "react-router-dom";

export default function ProjectHealthTable({ projectHealth }) {
  if (!projectHealth || projectHealth.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-800 mb-4">Active Projects Overview</h3>
        <p className="text-gray-500 text-sm">No active projects found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
      <div className="p-6 border-b border-gray-100">
        <h3 className="font-bold text-gray-800">Active Projects Overview</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium">
            <tr>
              <th className="px-6 py-4">Project</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Progress</th>
              <th className="px-6 py-4">Budget Used</th>
              <th className="px-6 py-4 text-right">Logged Hours</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projectHealth.map((project) => (
              <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <Link 
                    to={`/projects/${project.id}`}
                    className="font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    {project.project_name}
                  </Link>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {project.client_name}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                    project.status === 'active' ? 'bg-indigo-100 text-indigo-800' :
                    project.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, Math.max(0, project.progress_percentage))}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">{project.progress_percentage}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-2 rounded-full ${
                          project.budget_used_percentage > 100 ? 'bg-red-500' :
                          project.budget_used_percentage > 85 ? 'bg-orange-500' : 'bg-emerald-500'
                        }`} 
                        style={{ width: `${Math.min(100, Math.max(0, project.budget_used_percentage))}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">{project.budget_used_percentage}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right text-gray-600 font-medium">
                  {project.hours_logged}h
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
