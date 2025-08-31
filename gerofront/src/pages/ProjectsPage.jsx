import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiPlus,
  FiFolder,
  FiUsers,
  FiCalendar,
  FiMoreVertical,
} from "react-icons/fi";
import api from "../services/api";
import toast from "react-hot-toast";

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    client: "",
    status: "active",
  });
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone_number: "",
    company_name: "",
  });
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, clientsRes] = await Promise.all([
        api.get("/projects/"),
        api.get("/client/"),
      ]);
      setProjects(projectsRes.data.results || []);
      setClients(clientsRes.data.results || []);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await api.post("/projects/", newProject);
      toast.success("Project created successfully!");
      setShowCreateModal(false);
      setNewProject({
        name: "",
        description: "",
        client: "",
        status: "active",
      });
      fetchData();
    } catch (error) {
      toast.error("Failed to create project");
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    try {
      await api.post("/client/", newClient);
      toast.success("Client created successfully!");
      setShowCreateClientModal(false);
      setNewClient({
        name: "",
        email: "",
        phone_number: "",
        company_name: "",
      });
      fetchData(); // Refresh data to include new client
    } catch (error) {
      toast.error("Failed to create client");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">
            Manage your client projects and track progress
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateClientModal(true)}
            className="btn-secondary flex items-center"
          >
            <FiUsers className="w-4 h-4 mr-2" />
            New Client
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center"
            disabled={clients.length === 0}
          >
            <FiPlus className="w-4 h-4 mr-2" />
            New Project
          </button>
        </div>
      </div>

      {/* No clients message */}
      {clients.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <FiUsers className="w-5 h-5 text-yellow-600 mr-2" />
            <p className="text-yellow-800">
              You need to create at least one client before you can create
              projects.
            </p>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card hover:shadow-lg transition-shadow duration-300"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <FiFolder className="w-5 h-5 text-primary-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {project.name}
                </h3>
              </div>
              <div className="relative">
                <button
                  onClick={() =>
                    setActiveDropdown(
                      activeDropdown === project.id ? null : project.id
                    )
                  }
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiMoreVertical className="w-4 h-4" />
                </button>
                {activeDropdown === project.id && (
                  <div className="absolute right-0 top-6 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                    <div className="py-1">
                      <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Edit Project
                      </button>
                      <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Duplicate
                      </button>
                      <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {project.description}
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-500">
                <FiUsers className="w-4 h-4 mr-2" />
                Client:{" "}
                {clients.find((c) => c.id === project.client)?.name ||
                  "Unknown"}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <FiCalendar className="w-4 h-4 mr-2" />
                Created: {new Date(project.created_at).toLocaleDateString()}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  project.status
                )}`}
              >
                {project.status.charAt(0).toUpperCase() +
                  project.status.slice(1)}
              </span>
              <Link
                to={`/projects/${project.id}/kanban`}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View Board →
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Create New Project
            </h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject({ ...newProject, name: e.target.value })
                  }
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      description: e.target.value,
                    })
                  }
                  className="input-field"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client
                </label>
                <select
                  value={newProject.client}
                  onChange={(e) =>
                    setNewProject({ ...newProject, client: e.target.value })
                  }
                  className="input-field"
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Create Client Modal */}
      {showCreateClientModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Create New Client
            </h2>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={newClient.name}
                  onChange={(e) =>
                    setNewClient({ ...newClient, name: e.target.value })
                  }
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={(e) =>
                    setNewClient({ ...newClient, email: e.target.value })
                  }
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newClient.phone_number}
                  onChange={(e) =>
                    setNewClient({ ...newClient, phone_number: e.target.value })
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={newClient.company_name}
                  onChange={(e) =>
                    setNewClient({ ...newClient, company_name: e.target.value })
                  }
                  className="input-field"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateClientModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Client
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
