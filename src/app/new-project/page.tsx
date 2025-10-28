'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'react-hot-toast';
import { Search, Edit, RefreshCw, X, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { projectsAPI, usersAPI, userAPI } from '@/lib/api';
import { format } from 'date-fns';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [projectDetails, setProjectDetails] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [projectStatus, setProjectStatus] = useState(0); // Progress percentage
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch current user on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await userAPI.getProfile();
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to fetch current user:', error);
        toast.error('Failed to load user profile');
      }
    };
    fetchCurrentUser();
  }, []);

  // Search users
  const handleUserSearch = async (query: string) => {
    setUserSearch(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const users = await usersAPI.search(query);
      setSearchResults(users);
    } catch (error) {
      console.error('Failed to search users:', error);
      toast.error('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  // Add member
  const handleAddMember = (user: User) => {
    if (!selectedMembers.find((m) => m._id === user._id)) {
      setSelectedMembers([...selectedMembers, user]);
    }
    setUserSearch('');
    setSearchResults([]);
    setShowUserSearch(false);
  };

  // Remove member
  const handleRemoveMember = (userId: string) => {
    setSelectedMembers(selectedMembers.filter((m) => m._id !== userId));
  };

  // Create project
  const handleCreateProject = async () => {
    if (!title.trim()) {
      toast.error('Please enter a project title');
      return;
    }

    if (!currentUser) {
      toast.error('User not loaded. Please refresh the page.');
      return;
    }

    setIsCreating(true);
    try {
      const projectData = {
        name: title,
        description: description || summary,
        members: selectedMembers.map((m) => m._id),
        // Note: No 'lead' field - backend automatically sets createdBy from authenticated user
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: 'active' as const,
      };

      const project = await projectsAPI.create(projectData);
      toast.success('Project created successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Failed to create project:', error);
      toast.error(error.message || 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  // Get initials from name
  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AppLayout>
      <div className="flex-1 bg-white p-4 sm:p-6 md:p-8 overflow-y-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Find Something"
              className="pl-10 border-gray-200 rounded-xl w-full"
            />
          </div>
          <div className="flex flex-col gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              onClick={handleCreateProject}
              disabled={isCreating || !title.trim()}
              className="bg-[#AEA1E4] hover:bg-purple-500 text-white px-4 sm:px-6 py-3 rounded-xl flex-1 sm:flex-none"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Creating...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Create Project</span>
                  <span className="sm:hidden">Create</span>
                </>
              )}
            </Button>
          </div>
        </header>

        {/* Full Form View */}
        <main className="space-y-6 sm:space-y-8">
          {/* Title */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Edit className="h-6 w-6 sm:h-8 sm:w-8 text-gray-500 flex-shrink-0" />
            <Input
              placeholder="Untitled Project"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl sm:text-3xl md:text-4xl font-bold border-none focus:ring-0 p-0 h-auto"
            />
          </div>

          {/* Summary */}
          <div>
            <Textarea
              placeholder="Add a short summary..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="border-gray-200 focus:ring-purple-500 w-full sm:max-w-md rounded-xl p-3 bg-purple-50"
              rows={2}
            />
          </div>

          {/* Properties */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-700">
            <span className="font-semibold text-gray-900">Properties</span>

            {/* Lead (Current User - Non-editable) */}
            <div className="flex items-center gap-2">
              {currentUser ? (
                <>
                  <Avatar className="h-8 w-8 border-2 border-purple-500">
                    <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                    <AvatarFallback className="bg-purple-100">{getInitials(currentUser.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{currentUser.name}</span>
                    <span className="text-xs text-gray-500">Lead/Owner</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  <span className="text-sm text-gray-500">Loading...</span>
                </div>
              )}
            </div>

            {/* Invited Members */}
            <div className="relative">
              <div
                className="flex items-center gap-2 cursor-pointer hover:text-black"
                onClick={() => setShowUserSearch(!showUserSearch)}
              >
                {selectedMembers.length > 0 ? (
                  <div className="flex -space-x-2">
                    {selectedMembers.slice(0, 4).map((member) => (
                      <Avatar key={member._id} className="h-8 w-8 border-2 border-white">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                      </Avatar>
                    ))}
                    {selectedMembers.length > 4 && (
                      <div className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium">
                        +{selectedMembers.length - 4}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-500">No members</span>
                )}
              </div>

              {/* Members Selection Dropdown */}
              {showUserSearch && (
                <div className="absolute top-full mt-2 left-0 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
                  <h3 className="text-sm font-semibold mb-3">Invite Members</h3>
                  <div className="mb-3">
                    <Input
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => handleUserSearch(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {selectedMembers.length > 0 && (
                    <div className="mb-3 pb-3 border-b">
                      <div className="text-xs font-semibold text-gray-500 mb-2">Selected ({selectedMembers.length})</div>
                      <div className="space-y-1">
                        {selectedMembers.map((member) => (
                          <div key={member._id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={member.avatar} alt={member.name} />
                                <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{member.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member._id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isSearching ? (
                    <div className="text-center py-4 text-gray-500">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {searchResults
                        .filter((user) => !selectedMembers.find((m) => m._id === user._id))
                        .map((user) => (
                          <div
                            key={user._id}
                            className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                            onClick={() => handleAddMember(user)}
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                            </Avatar>
                            <div className="text-sm">
                              <div className="font-medium">{user.name}</div>
                              <div className="text-xs text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : userSearch ? (
                    <div className="text-center py-4 text-gray-500 text-sm">No users found</div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">Start typing to search</div>
                  )}
                </div>
              )}
            </div>

            {/* Calendar Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
              <path d="M7 2H8C8.26522 2 8.51957 2.10536 8.70711 2.29289C8.89464 2.48043 9 2.73478 9 3V4H14V3C14 2.73478 14.1054 2.48043 14.2929 2.29289C14.4804 2.10536 14.7348 2 15 2H16C16.2652 2 16.5196 2.10536 16.7071 2.29289C16.8946 2.48043 17 2.73478 17 3V4C17.7956 4 18.5587 4.31607 19.1213 4.87868C19.6839 5.44129 20 6.20435 20 7V18C20 18.7956 19.6839 19.5587 19.1213 20.1213C18.5587 20.6839 17.7956 21 17 21H6C5.20435 21 4.44129 20.6839 3.87868 20.1213C3.31607 19.5587 3 18.7956 3 18V7C3 6.20435 3.31607 5.44129 3.87868 4.87868C4.44129 4.31607 5.20435 4 6 4V3C6 2.73478 6.10536 2.48043 6.29289 2.29289C6.48043 2.10536 6.73478 2 7 2ZM15 4H16V3H15V4ZM8 4V3H7V4H8ZM6 5C5.46957 5 4.96086 5.21071 4.58579 5.58579C4.21071 5.96086 4 6.46957 4 7V8H19V7C19 6.46957 18.7893 5.96086 18.4142 5.58579C18.0391 5.21071 17.5304 5 17 5H6ZM4 18C4 18.5304 4.21071 19.0391 4.58579 19.4142C4.96086 19.7893 5.46957 20 6 20H17C17.5304 20 18.0391 19.7893 18.4142 19.4142C18.7893 19.0391 19 18.5304 19 18V9H4V18ZM12 13H17V18H12V13ZM13 14V17H16V14H13Z" fill="black"/>
            </svg>

            {/* Start Date */}
            <div className="relative">
              <div
                className="cursor-pointer hover:text-black"
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                <span className="font-medium">
                  {startDate ? format(new Date(startDate), 'MMM dd, yyyy') : 'Start Date'}
                </span>
              </div>

              {showDatePicker && (
                <div className="absolute top-full mt-2 left-0 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Date</label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Date</label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                        className="w-full"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowDatePicker(false)}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Arrow Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="10" viewBox="0 0 14 10" fill="none" className="flex-shrink-0">
              <path d="M8.75 8.75L12.75 4.75M12.75 4.75L8.75 0.75M12.75 4.75H0.75" stroke="black" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>

            {/* End Date */}
            <span className="font-medium">
              {endDate ? format(new Date(endDate), 'MMM dd, yyyy') : 'End Date'}
            </span>

            {/* Status/Loading Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
              <g clipPath="url(#clip0_2076_23646)">
                <path fillRule="evenodd" clipRule="evenodd" d="M23.9115 10.5495C24.2434 13.274 23.6313 16.03 22.1773 18.3579C20.7232 20.6858 18.5151 22.4449 15.9211 23.3418C13.3271 24.2388 10.504 24.2194 7.92261 23.2869C5.34118 22.3544 3.15744 20.5651 1.7355 18.2175C1.58075 17.9623 1.53371 17.6561 1.60474 17.3662C1.67577 17.0763 1.85905 16.8265 2.11425 16.6717C2.36945 16.517 2.67568 16.47 2.96557 16.541C3.25545 16.612 3.50525 16.7953 3.66 17.0505C4.42596 18.3153 5.46958 19.3894 6.71189 20.1914C7.95419 20.9933 9.36263 21.5023 10.8306 21.6796C12.2987 21.8569 13.7878 21.698 15.1853 21.2149C16.5828 20.7319 17.8522 19.9372 18.8973 18.8912C19.9424 17.8451 20.7359 16.575 21.2178 15.1771C21.6996 13.7791 21.8572 12.2898 21.6785 10.822C21.4999 9.35414 20.9897 7.94615 20.1866 6.70457C19.3835 5.46298 18.3085 4.42033 17.043 3.6555C16.7876 3.50114 16.604 3.25165 16.5325 2.96191C16.4611 2.67216 16.5076 2.3659 16.662 2.1105C16.8164 1.8551 17.0658 1.67147 17.3556 1.60002C17.6453 1.52857 17.9516 1.57514 18.207 1.7295C19.7644 2.67088 21.0873 3.95414 22.0756 5.48218C23.0639 7.01023 23.6917 8.74304 23.9115 10.5495ZM13.5 1.5C13.5 1.89782 13.342 2.27936 13.0607 2.56066C12.7794 2.84196 12.3978 3 12 3C11.6022 3 11.2206 2.84196 10.9393 2.56066C10.658 2.27936 10.5 1.89782 10.5 1.5C10.5 1.10218 10.658 0.720644 10.9393 0.43934C11.2206 0.158035 11.6022 0 12 0C12.3978 0 12.7794 0.158035 13.0607 0.43934C13.342 0.720644 13.5 1.10218 13.5 1.5ZM4.206 7.5C4.30605 7.32934 4.37135 7.14058 4.39815 6.94459C4.42495 6.74859 4.41271 6.54923 4.36215 6.35798C4.31159 6.16673 4.22369 5.98737 4.10353 5.83023C3.98337 5.67309 3.83331 5.54127 3.66199 5.44235C3.49068 5.34344 3.30149 5.27939 3.10532 5.2539C2.90915 5.2284 2.70987 5.24195 2.51896 5.29379C2.32805 5.34562 2.14928 5.4347 1.99294 5.5559C1.8366 5.6771 1.70577 5.82803 1.608 6C1.41223 6.34434 1.36059 6.75213 1.46438 7.1344C1.56816 7.51666 1.81893 7.84236 2.16196 8.04041C2.50499 8.23847 2.91243 8.2928 3.29538 8.19156C3.67832 8.09031 4.00567 7.84171 4.206 7.5ZM1.5 10.5C1.89782 10.5 2.27936 10.658 2.56066 10.9393C2.84196 11.2206 3 11.6022 3 12C3 12.3978 2.84196 12.7794 2.56066 13.0607C2.27936 13.342 1.89782 13.5 1.5 13.5C1.10218 13.5 0.720644 13.342 0.43934 13.0607C0.158035 12.7794 0 12.3978 0 12C0 11.6022 0.158035 11.2206 0.43934 10.9393C0.720644 10.658 1.10218 10.5 1.5 10.5ZM7.5 4.206C7.67197 4.10823 7.8229 3.9774 7.9441 3.82106C8.0653 3.66472 8.15438 3.48595 8.20622 3.29504C8.25805 3.10413 8.2716 2.90485 8.2461 2.70868C8.22061 2.51251 8.15656 2.32332 8.05765 2.15201C7.95873 1.98069 7.82691 1.83063 7.66977 1.71047C7.51263 1.59031 7.33327 1.50241 7.14202 1.45185C6.95077 1.40129 6.75141 1.38905 6.55541 1.41585C6.35942 1.44265 6.17066 1.50795 6 1.608C5.65829 1.80833 5.40969 2.13568 5.30844 2.51862C5.2072 2.90157 5.26153 3.30901 5.45959 3.65204C5.65764 3.99507 5.98334 4.24584 6.3656 4.34962C6.74787 4.45341 7.15566 4.40177 7.5 4.206Z" fill="#47FF04"/>
              </g>
              <defs>
                <clipPath id="clip0_2076_23646">
                  <rect width="24" height="24" fill="white"/>
                </clipPath>
              </defs>
            </svg>

            {/* Status/Progress */}
            <div className="flex items-center gap-2">
              <span className="font-semibold">Status:</span>
              <Input
                type="number"
                min="0"
                max="100"
                value={projectStatus}
                onChange={(e) => setProjectStatus(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-16 h-8 px-2 text-center"
              />
              <span className="font-medium">%</span>
            </div>

            <RefreshCw
              className="h-5 w-5 text-gray-500 cursor-pointer hover:text-black ml-auto flex-shrink-0"
              onClick={() => {
                setTitle('');
                setSummary('');
                setDescription('');
                setProjectDetails('');
                setSelectedMembers([]);
                setStartDate('');
                setEndDate('');
                setProjectStatus(0);
              }}
            />
          </div>

          {/* Project Details Area */}
          <div className="relative">
            <div className="border border-purple-200 rounded-3xl p-4 sm:p-6">
              <Textarea
                placeholder="Start writing your project details here..."
                value={projectDetails}
                onChange={(e) => setProjectDetails(e.target.value)}
                className="w-full border-none resize-none focus:ring-0 p-0 min-h-[200px] sm:min-h-[300px] md:min-h-[400px]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <Textarea
              placeholder="Add a detailed description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-gray-200 focus:ring-purple-500"
              rows={4}
            />
            </div>
          </main>
      </div>
    </AppLayout>
  );
}