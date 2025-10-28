"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import AdminSidebar from "@/components/adminSidebar";
import {
  Search,
  MessageSquare,
  Bell,
  ChevronDown,
  Mail,
  Phone,
  SquareCheckBig,
  Plus,
  MoreHorizontal,
  Loader2,
  Calendar,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { tasksAPI, projectsAPI, userAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  assignedTo?: any;
  createdBy?: any;
  dueDate?: string;
  projectId?: string;
}

interface KanbanColumn {
  title: string;
  status: string[];
  cards: Task[];
  color: string;
}

export default function KanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string>('todo');
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    priority: 'medium',
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  const columns: KanbanColumn[] = [
    {
      title: "To-do",
      status: ["todo"],
      cards: [],
      color: "#E8E4FF",
    },
    {
      title: "In progress",
      status: ["in-progress"],
      cards: [],
      color: "#FFE8D9",
    },
    {
      title: "Review",
      status: ["review"],
      cards: [],
      color: "#FFF4D9",
    },
    {
      title: "Completed",
      status: ["completed"],
      cards: [],
      color: "#D9FFE8",
    },
  ];

  const loadKanbanData = useCallback(async () => {
    try {
      setLoading(true);

      // Load user profile
      const userData = await userAPI.getProfile().catch(() => null);
      setCurrentUser(userData);

      const tasksData = await tasksAPI.getAll().catch(() => []);
      setTasks(tasksData);

      // Try to load project data (optional)
      try {
        const projects = await projectsAPI.getAll().catch(() => []);
        if (projects.length > 0) {
          setProject(projects[0]);
        }
      } catch {
        console.log("Could not load project data");
      }
    } catch (error: any) {
      console.error('Error loading kanban data:', error);
      toast({
        title: "Error Loading Tasks",
        description: error.message || "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadKanbanData();
  }, [loadKanbanData]);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    // Find the task to preserve its data
    const task = tasks.find(t => t._id === taskId);
    if (!task) return;

    try {
      // Optimistically update UI
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t._id === taskId ? { ...t, status: newStatus } : t
        )
      );

      // Send minimal update with only changed field
      await tasksAPI.update(taskId, { 
        status: newStatus,
        title: task.title, // Required field
        description: task.description || '',
      });
      
      toast({
        title: "Success",
        description: "Task status updated",
      });
    } catch (error: any) {
      // Revert on error
      loadKanbanData();
      console.error('Task update error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDraggedOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnStatus: string) => {
    e.preventDefault();
    setDraggedOverColumn(columnStatus);
  };

  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, columnStatuses: string[]) => {
    e.preventDefault();
    
    if (!draggedTask) return;

    const newStatus = columnStatuses[0]; // Use the first status in the array
    
    if (draggedTask.status !== newStatus) {
      await handleStatusChange(draggedTask._id, newStatus);
    }
    
    setDraggedTask(null);
    setDraggedOverColumn(null);
  };

  const getTasksForColumn = (columnStatuses: string[]) => {
    return tasks.filter(task =>
      columnStatuses.includes(task.status?.toLowerCase() || 'todo')
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return null;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return '#FF6B6B';
      case 'medium':
        return '#FFB547';
      case 'low':
        return '#4ECDC4';
      default:
        return '#999';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleOpenAddCard = (columnStatus: string) => {
    setSelectedColumn(columnStatus);
    setShowAddCardModal(true);
  };

  const handleCloseAddCard = () => {
    setShowAddCardModal(false);
    setNewTaskData({ title: '', description: '', priority: 'medium' });
  };

  const handleCreateTask = async () => {
    if (!newTaskData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a task title",
        variant: "destructive",
      });
      return;
    }

    try {
      const taskData = {
        title: newTaskData.title,
        description: newTaskData.description,
        status: selectedColumn,
        priority: newTaskData.priority,
      };

      const newTask = await tasksAPI.create(taskData);

      setTasks(prevTasks => [...prevTasks, newTask]);

      toast({
        title: "Success",
        description: "Task created successfully",
      });

      handleCloseAddCard();
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create task",
        variant: "destructive",
      });
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F7F5FD" }}>
      {/* Sidebar */}
      <div style={{ flexShrink: 0, height: "100vh" }}>
        <AdminSidebar />
      </div>

      {/* Main Content */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, overflow: "hidden" }}>
        {/* Header */}
        <header
          style={{
            display: "flex",
            padding: "16px 26px",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(199, 199, 199, 0.70)",
            background: "#FFF",
            alignSelf: "stretch",
          }}
        >
          {/* Search Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#8B7BE8", fontSize: 16, fontWeight: 600 }}>
              <div style={{ width: 24, height: 24, background: "#D4CCFA", borderRadius: 8 }} />
              Purple
            </div>
            <div style={{ position: "relative", width: 300 }}>
              <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#999" }} size={20} />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  paddingLeft: 40,
                  background: "#F5F5FF",
                  border: "none",
                  borderRadius: 12,
                }}
              />
            </div>
          </div>

          {/* Right Section */}
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Image src="https://flagcdn.com/w40/in.png" alt="India" width={24} height={16} />
              <span style={{ fontSize: 14 }}>English (US)</span>
              <ChevronDown size={16} />
            </div>
            <div style={{ position: "relative" }}>
              <MessageSquare size={24} color="#666" />
              <span style={{ position: "absolute", top: -4, right: -4, background: "#8B7BE8", color: "white", borderRadius: "50%", width: 16, height: 16, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>3</span>
            </div>
            <div style={{ position: "relative" }}>
              <Bell size={24} color="#666" />
              <span style={{ position: "absolute", top: -4, right: -4, background: "#8B7BE8", color: "white", borderRadius: "50%", width: 16, height: 16, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>3</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {currentUser?.avatar ? (
                <Image src={currentUser.avatar} alt={currentUser.name || 'User'} width={40} height={40} style={{ borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#D4CCFA", display: "flex", alignItems: "center", justifyContent: "center", color: "#8B7BE8", fontWeight: 600, fontSize: 16 }}>
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                </div>
              )}
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{currentUser?.name || "User"}</div>
                <div style={{ fontSize: 12, color: "#999" }}>{currentUser?.role === 'admin' ? 'Admin' : 'User'}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main
          style={{
            flex: 1,
            overflow: "auto",
            padding: "32px",
          }}
        >
          {/* Page Title */}
          <h1 style={{ fontSize: 32, fontWeight: 600, color: "#000", marginBottom: 24 }}>Kanban Board</h1>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#8B7BE8" }} />
            </div>
          ) : (
            <>
              {/* Project Board Header */}
              <div
                style={{
                  background: "#FFF",
                  borderRadius: 16,
                  padding: "20px 24px",
                  marginBottom: 24,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: "1px solid #E5E5E5",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <span style={{ fontSize: 18, fontWeight: 600, color: "#000" }}>
                    {project ? project.name : "All Tasks"} Board
                  </span>
              <button
                style={{
                  background: "#F5F5F5",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Mail size={20} color="#666" />
              </button>
              <button
                style={{
                  background: "#F5F5F5",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Phone size={20} color="#666" />
              </button>
              <button
                style={{
                  background: "#F5F5F5",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SquareCheckBig size={20} color="#666" />
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Avatar Group */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#AEA1E4", border: "2px solid #FFF" }} />
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#9B8FD4", marginLeft: -8, border: "2px solid #FFF" }} />
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#8B7BE8", marginLeft: -8, border: "2px solid #FFF" }} />
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "#8B7BE8",
                    marginLeft: -8,
                    border: "2px solid #FFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#FFF",
                  }}
                >
                  5+
                </div>
              </div>
              <button
                style={{
                  background: "#8B7BE8",
                  color: "#FFF",
                  border: "none",
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                <Plus size={20} />
              </button>
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <MoreHorizontal size={24} color="#999" />
              </button>
            </div>
          </div>

              {/* Kanban Columns */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 20,
                }}
              >
                {columns.map((column, columnIndex) => {
                  const columnTasks = getTasksForColumn(column.status);
                  const filteredTasks = searchQuery ? columnTasks.filter(task =>
                    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
                  ) : columnTasks;

                  return (
              <div
                key={columnIndex}
                style={{
                  background: draggedOverColumn === column.status[0] ? "#D4CCFA" : column.color,
                  borderRadius: 16,
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  transition: "background 0.2s",
                  minHeight: "400px",
                }}
                onDragOver={(e) => handleDragOver(e, column.status[0])}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.status)}
              >
                {/* Column Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "#000", margin: 0 }}>{column.title}</h3>
                  <button
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <MoreHorizontal size={20} color="#999" />
                  </button>
                </div>

                {/* Add Card Button */}
                <button
                  onClick={() => handleOpenAddCard(column.status[0])}
                  style={{
                    background: "#8B7BE8",
                    color: "#FFF",
                    border: "none",
                    borderRadius: 12,
                    padding: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  <Plus size={18} />
                  Add Card
                </button>

                {/* Cards */}
                {filteredTasks.map((task) => (
                  <div
                    key={task._id}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    onDragEnd={handleDragEnd}
                    style={{
                      background: "#FFF",
                      borderRadius: 12,
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      cursor: draggedTask?._id === task._id ? "grabbing" : "grab",
                      transition: "box-shadow 0.2s, opacity 0.2s",
                      opacity: draggedTask?._id === task._id ? 0.5 : 1,
                      border: draggedTask?._id === task._id ? "2px dashed #8B7BE8" : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (draggedTask?._id !== task._id) {
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {/* Card Title */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: getPriorityColor(task.priority),
                          }}
                        />
                        <span style={{ fontSize: 15, fontWeight: 600, color: "#000", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {task.title}
                        </span>
                      </div>
                    </div>

                    {/* Card Description */}
                    {task.description && (
                      <p
                        style={{
                          fontSize: 12,
                          color: "#999",
                          margin: 0,
                          lineHeight: 1.5,
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {task.description}
                      </p>
                    )}

                    {/* Priority Badge */}
                    {task.priority && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "4px 8px",
                            borderRadius: 6,
                            background: `${getPriorityColor(task.priority)}20`,
                            color: getPriorityColor(task.priority),
                            textTransform: "capitalize",
                          }}
                        >
                          {task.priority}
                        </span>
                      </div>
                    )}

                    {/* Card Footer */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                      {/* Assignee Avatar */}
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {task.assignedTo ? (
                          <div
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 6,
                              background: "#AEA1E4",
                              border: "1px solid #FFF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 10,
                              fontWeight: 600,
                              color: "#FFF",
                            }}
                            title={task.assignedTo.name || task.assignedTo.email}
                          >
                            {getInitials(task.assignedTo.name || task.assignedTo.email)}
                          </div>
                        ) : (
                          <div style={{ width: 24, height: 24 }} />
                        )}
                      </div>

                      {/* Due Date */}
                      {task.dueDate && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                            color: "#999",
                          }}
                        >
                          <Calendar size={12} />
                          {formatDate(task.dueDate)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                  </div>
                );
                })}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Add Card Modal */}
      {showAddCardModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={handleCloseAddCard}
        >
          <div
            style={{
              background: "#FFF",
              borderRadius: 16,
              padding: "32px",
              width: "90%",
              maxWidth: "500px",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 24, fontWeight: 600, color: "#000", marginBottom: 24 }}>
              Add New Task
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Title Input */}
              <div>
                <label style={{ fontSize: 14, fontWeight: 500, color: "#666", display: "block", marginBottom: 8 }}>
                  Task Title *
                </label>
                <Input
                  placeholder="Enter task title..."
                  value={newTaskData.title}
                  onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: 14,
                    borderRadius: 8,
                    border: "1px solid #E5E5E5",
                  }}
                />
              </div>

              {/* Description Input */}
              <div>
                <label style={{ fontSize: 14, fontWeight: 500, color: "#666", display: "block", marginBottom: 8 }}>
                  Description
                </label>
                <textarea
                  placeholder="Enter task description..."
                  value={newTaskData.description}
                  onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: 14,
                    borderRadius: 8,
                    border: "1px solid #E5E5E5",
                    minHeight: "100px",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              </div>

              {/* Priority Select */}
              <div>
                <label style={{ fontSize: 14, fontWeight: 500, color: "#666", display: "block", marginBottom: 8 }}>
                  Priority
                </label>
                <select
                  value={newTaskData.priority}
                  onChange={(e) => setNewTaskData({ ...newTaskData, priority: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: 14,
                    borderRadius: 8,
                    border: "1px solid #E5E5E5",
                    background: "#FFF",
                    cursor: "pointer",
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* Status Info */}
              <div>
                <label style={{ fontSize: 14, fontWeight: 500, color: "#666", display: "block", marginBottom: 8 }}>
                  Status
                </label>
                <div
                  style={{
                    padding: "12px",
                    borderRadius: 8,
                    background: "#F5F5F5",
                    fontSize: 14,
                    color: "#666",
                    textTransform: "capitalize",
                  }}
                >
                  {selectedColumn}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <button
                  onClick={handleCloseAddCard}
                  style={{
                    flex: 1,
                    padding: "12px 24px",
                    borderRadius: 8,
                    border: "1px solid #E5E5E5",
                    background: "#FFF",
                    color: "#666",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTask}
                  style={{
                    flex: 1,
                    padding: "12px 24px",
                    borderRadius: 8,
                    border: "none",
                    background: "#8B7BE8",
                    color: "#FFF",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Create Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
