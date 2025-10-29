'use client';

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, Plus } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { projectsAPI } from "@/lib/api";

// Priority icons and labels
const priorityOptions = [
  {
    value: 'high',
    label: 'High',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.28 10.0334L8.93338 5.68676C8.42005 5.17342 7.58005 5.17342 7.06671 5.68676L2.72005 10.0334" stroke="#E42020" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    value: 'medium',
    label: 'Medium',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.33333 9.99341H13.6667" stroke="#2B61D5" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13.6667 6.00659H2.33333" stroke="#2B61D5" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    value: 'low',
    label: 'Low',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.28 5.9668L8.93338 10.3135C8.42005 10.8268 7.58005 10.8268 7.06671 10.3135L2.72005 5.9668" stroke="#E2B10E" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

// Time Tracker options
const timeTrackerOptions = [
  {
    value: 'start',
    label: 'Start',
    style: {
      background: '#319239',
      color: '#FFF',
    },
  },
  {
    value: 'break',
    label: 'Break',
    style: {
      background: '#E2B10E',
      color: '#FFF',
    },
  },
  {
    value: 'end',
    label: 'End',
    style: {
      background: '#E42020',
      color: '#FFF',
    },
  },
];

// Status options
const statusOptions = [
  {
    value: 'completed',
    label: 'Completed',
    style: {
      background: 'rgba(27, 177, 81, 0.10)',
      color: '#139A44',
    },
  },
  {
    value: 'in-progress',
    label: 'In Progress',
    style: {
      background: 'rgba(43, 97, 213, 0.10)',
      color: '#2B61D5',
    },
  },
  {
    value: 'to-be-done',
    label: 'To Be Done',
    style: {
      background: 'rgba(34, 34, 34, 0.10)',
      color: '#2D2D2D',
    },
  },
];

interface Task {
  id: string;
  title: string;
  assignedBy: {
    name: string;
    avatar?: string;
  };
  createdOn: string;
  priority: 'high' | 'medium' | 'low';
  timeTracker: 'start' | 'break' | 'end';
  status: 'completed' | 'in-progress' | 'to-be-done';
  projectId?: string;
}

interface Project {
  _id: string;
  name: string;
}

export default function ProjectTasksPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [viewMode, setViewMode] = useState<'board' | 'list'>('list');
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  // Fetch projects and tasks
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all projects
        const projectsData = await projectsAPI.getAll();
        setAllProjects(projectsData);

        // Find current project
        const current = projectsData.find((p: Project) => p._id === projectId);
        setCurrentProject(current || null);

        // Fetch tasks from backend
        const tasksData = await projectsAPI.getProjectTasks(projectId);
        const formattedTasks: Task[] = tasksData.map((task: any) => ({
          id: task._id,
          title: task.title,
          assignedBy: { 
            name: task.assignedBy?.name || task.createdBy?.name || 'Unknown',
            avatar: task.assignedBy?.avatar || task.createdBy?.avatar,
          },
          createdOn: new Date(task.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
          priority: (task.priority?.toLowerCase() || 'medium') as 'high' | 'medium' | 'low',
          timeTracker: (task.timeTracker?.toLowerCase() || 'start') as 'start' | 'break' | 'end',
          status: task.taskStatus === 'Completed' ? 'completed' : 
                  task.taskStatus === 'In Progress' ? 'in-progress' : 
                  'to-be-done',
          projectId,
        }));
        setTasks(formattedTasks);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setTasks([]);
      }
    };

    fetchData();
  }, [projectId]);

  // Handle project selection
  const handleSelectProject = (project: Project) => {
    router.push(`/project-detail/${project._id}/tasks`);
    setShowProjectDropdown(false);
  };

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="border-b px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="relative">
              <button
                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                className="flex items-center gap-2 text-3xl font-bold hover:text-gray-700 transition-colors"
              >
                {currentProject?.name || 'Loading...'}
                <ChevronDown className="h-6 w-6" />
              </button>

              {/* Project Dropdown */}
              {showProjectDropdown && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  {allProjects.map((project) => (
                    <div
                      key={project._id}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      onClick={() => handleSelectProject(project)}
                    >
                      <div className="font-semibold text-gray-900">{project.name}</div>
                      <div className="text-sm text-gray-500">Project ID: {project._id.slice(0, 8)}...</div>
                    </div>
                  ))}
                  {allProjects.length === 0 && (
                    <div className="p-4 text-center text-gray-500">No projects found</div>
                  )}
                </div>
              )}
            </div>
            <Button
              variant="outline"
              className="rounded-full px-6"
              style={{
                border: '1px solid #000',
                background: '#FFF',
              }}
            >
              share
            </Button>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'board' ? 'default' : 'outline'}
              onClick={() => setViewMode('board')}
              className="rounded-full px-6"
              style={
                viewMode === 'board'
                  ? {
                      background: '#000',
                      color: '#FFF',
                    }
                  : {
                      border: '1px solid #000',
                      background: '#FFF',
                      color: '#000',
                    }
              }
            >
              Task Board
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              className="rounded-full px-6 flex items-center gap-2"
              style={
                viewMode === 'list'
                  ? {
                      background: '#000',
                      color: '#FFF',
                    }
                  : {
                      border: '1px solid #000',
                      background: '#FFF',
                      color: '#000',
                    }
              }
            >
              List View
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 7H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M3 17H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-8 py-6">
          <div className="border rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[80px_1fr_200px_180px_180px_180px_180px] bg-gray-50 border-b">
              <div className="px-4 py-3 text-sm font-medium text-gray-700 border-r">No.</div>
              <div className="px-4 py-3 text-sm font-medium text-gray-700 border-r">Tasks</div>
              <div className="px-4 py-3 text-sm font-medium text-gray-700 border-r">Assigned by</div>
              <div className="px-4 py-3 text-sm font-medium text-gray-700 border-r">Created on</div>
              <div className="px-4 py-3 text-sm font-medium text-gray-700 border-r">Priority</div>
              <div className="px-4 py-3 text-sm font-medium text-gray-700 border-r">Time Tracker</div>
              <div className="px-4 py-3 text-sm font-medium text-gray-700">Status</div>
            </div>

            {/* Table Rows */}
            {currentProject && (
              <>
                {/* Project Name Row */}
                <div
                  className="grid grid-cols-[80px_1fr_200px_180px_180px_180px_180px] border-b bg-purple-50 cursor-pointer hover:bg-purple-100"
                  onClick={() => setExpandedProject(expandedProject === projectId ? null : projectId)}
                >
                  <div className="px-4 py-3 flex items-center border-r text-sm font-semibold">
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        expandedProject === projectId ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                  <div className="px-4 py-3 flex items-center border-r font-semibold text-purple-700 col-span-6">
                    {currentProject.name}
                  </div>
                </div>

                {/* Task Rows - Only show when expanded */}
                {expandedProject === projectId &&
                  tasks.map((task, index) => (
                    <div
                      key={task.id}
                      className="grid grid-cols-[80px_1fr_200px_180px_180px_180px_180px] border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                    >
                      {/* No. */}
                      <div className="px-4 py-3 flex items-center border-r text-sm">
                        {index + 1}
                      </div>

                      {/* Tasks */}
                      <div className="px-4 py-3 flex items-center border-r">
                        <div className="flex items-center gap-2 w-full">
                          <Input
                            value={task.title}
                            onChange={(e) => {
                              const newTasks = [...tasks];
                              newTasks[index].title = e.target.value;
                              setTasks(newTasks);
                            }}
                            className="border-none shadow-none p-0 h-auto focus-visible:ring-0"
                          />
                          <ChevronDown size={16} className="flex-shrink-0 text-gray-400" />
                        </div>
                      </div>

                      {/* Assigned by */}
                      <div className="px-4 py-3 flex items-center gap-2 border-r">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={task.assignedBy.avatar} />
                          <AvatarFallback className="text-xs bg-gray-200">
                            {task.assignedBy.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{task.assignedBy.name}</span>
                      </div>

                      {/* Created on */}
                      <div className="px-4 py-3 flex items-center border-r text-sm">
                        {task.createdOn}
                      </div>

                      {/* Priority */}
                      <div className="px-4 py-3 flex items-center border-r">
                        <div
                          className="flex items-center gap-2 cursor-pointer w-full"
                          style={{
                            display: 'flex',
                            height: '40px',
                            padding: '0 16px',
                            alignItems: 'center',
                            gap: '8px',
                            alignSelf: 'stretch',
                            border: '0.5px solid #AAA',
                            borderRadius: '4px',
                          }}
                        >
                          {priorityOptions.find((p) => p.value === task.priority)?.icon}
                          <span className="text-sm flex-1">
                            {priorityOptions.find((p) => p.value === task.priority)?.label}
                          </span>
                          <ChevronDown size={16} className="text-gray-400" />
                        </div>
                      </div>

                      {/* Time Tracker */}
                      <div className="px-4 py-3 flex items-center border-r">
                        <div
                          className="flex items-center justify-center cursor-pointer"
                          style={{
                            display: 'flex',
                            height: '24px',
                            padding: '6px 10px',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '8px',
                            borderRadius: '16px',
                            ...(timeTrackerOptions.find((t) => t.value === task.timeTracker)?.style || {}),
                            fontSize: '12px',
                            fontWeight: 500,
                          }}
                        >
                          {timeTrackerOptions.find((t) => t.value === task.timeTracker)?.label}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="px-4 py-3 flex items-center">
                        <div
                          className="flex items-center justify-center cursor-pointer"
                          style={{
                            display: 'flex',
                            height: '24px',
                            padding: '6px 10px',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '2px',
                            borderRadius: '16px',
                            ...(statusOptions.find((s) => s.value === task.status)?.style || {}),
                            fontSize: '12px',
                            fontWeight: 500,
                          }}
                        >
                          {statusOptions.find((s) => s.value === task.status)?.label}
                        </div>
                      </div>
                    </div>
                  ))}
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
