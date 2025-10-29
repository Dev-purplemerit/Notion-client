'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  List, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Palette,
  ArrowLeft,
  X,
  Download,
  Users
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CellContent {
  id: string;
  type: 'list' | 'image' | 'url' | null;
  data: string | string[];
  backgroundColor: string;
}

export default function CollectionEditorPage() {
  const router = useRouter();
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(2);
  const [cells, setCells] = useState<{ [key: string]: CellContent }>(() => {
    const initialCells: { [key: string]: CellContent } = {};
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        initialCells[`${i}-${j}`] = {
          id: `${i}-${j}`,
          type: null,
          data: [],
          backgroundColor: '#FFFFFF'
        };
      }
    }
    return initialCells;
  });

  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [tempListItem, setTempListItem] = useState('');
  const [fileName, setFileName] = useState('Opened file name');

  const addColumn = () => {
    const newCols = cols + 1;
    setCols(newCols);
    
    const newCells = { ...cells };
    for (let i = 0; i < rows; i++) {
      newCells[`${i}-${cols}`] = {
        id: `${i}-${cols}`,
        type: null,
        data: [],
        backgroundColor: '#FFFFFF'
      };
    }
    setCells(newCells);
  };

  const addRow = () => {
    const newRows = rows + 1;
    setRows(newRows);
    
    const newCells = { ...cells };
    for (let j = 0; j < cols; j++) {
      newCells[`${rows}-${j}`] = {
        id: `${rows}-${j}`,
        type: null,
        data: [],
        backgroundColor: '#FFFFFF'
      };
    }
    setCells(newCells);
  };

  const updateCellType = (cellId: string, type: 'list' | 'image' | 'url') => {
    setCells(prev => ({
      ...prev,
      [cellId]: {
        ...prev[cellId],
        type,
        data: type === 'list' ? [] : ''
      }
    }));
    setEditingCell(cellId);
  };

  const updateCellBackground = (cellId: string, color: string) => {
    setCells(prev => ({
      ...prev,
      [cellId]: {
        ...prev[cellId],
        backgroundColor: color
      }
    }));
  };

  const addListItem = (cellId: string) => {
    if (!tempListItem.trim()) return;
    
    setCells(prev => ({
      ...prev,
      [cellId]: {
        ...prev[cellId],
        data: [...(prev[cellId].data as string[]), tempListItem]
      }
    }));
    setTempListItem('');
  };

  const removeListItem = (cellId: string, index: number) => {
    setCells(prev => ({
      ...prev,
      [cellId]: {
        ...prev[cellId],
        data: (prev[cellId].data as string[]).filter((_, i) => i !== index)
      }
    }));
  };

  const updateCellData = (cellId: string, data: string) => {
    setCells(prev => ({
      ...prev,
      [cellId]: {
        ...prev[cellId],
        data
      }
    }));
  };

  const colors = [
    '#FFFFFF', '#F3F4F6', '#DBEAFE', '#FEF3C7', '#FEE2E2', 
    '#F3E8FF', '#D1FAE5', '#FFE4E6', '#E0E7FF', '#FCE7F3'
  ];

  const renderCellContent = (cell: CellContent) => {
    if (!cell.type) {
      return (
        <div className="flex items-center justify-center h-full">
          <span className="text-gray-400 text-sm">Empty cell</span>
        </div>
      );
    }

    switch (cell.type) {
      case 'list':
        return (
          <div className="p-3 h-full overflow-y-auto">
            {(cell.data as string[]).length === 0 ? (
              <span className="text-gray-400 text-sm">No items yet</span>
            ) : (
              <ul className="space-y-2">
                {(cell.data as string[]).map((item, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm group">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600 flex-shrink-0"></span>
                    <span className="flex-1">{item}</span>
                    <button
                      onClick={() => removeListItem(cell.id, index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-red-500" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      
      case 'image':
        return (
          <div className="p-3 h-full flex items-center justify-center">
            {cell.data ? (
              <img 
                src={cell.data as string} 
                alt="Cell content" 
                className="max-w-full max-h-full object-contain rounded"
              />
            ) : (
              <div className="text-center">
                <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <span className="text-gray-400 text-xs">No image URL</span>
              </div>
            )}
          </div>
        );
      
      case 'url':
        return (
          <div className="p-3 h-full flex items-center justify-center">
            {cell.data ? (
              <a 
                href={cell.data as string} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline text-sm break-all"
              >
                {cell.data as string}
              </a>
            ) : (
              <div className="text-center">
                <LinkIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <span className="text-gray-400 text-xs">No URL added</span>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Input
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="text-base font-medium border-none shadow-none focus-visible:ring-0 px-2 max-w-md"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <Avatar className="w-8 h-8 border-2 border-white">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>U1</AvatarFallback>
            </Avatar>
            <Avatar className="w-8 h-8 border-2 border-white">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>U2</AvatarFallback>
            </Avatar>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Users className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Download className="w-4 h-4" />
          </Button>
          <Button className="bg-gray-800 text-white hover:bg-gray-900 rounded-lg px-4">
            Share
          </Button>
        </div>
      </header>

      {/* Grid Container */}
      <div className="p-8 flex items-center justify-center min-h-[calc(100vh-73px)]">
        <div className="flex items-start gap-4">
          {/* Grid */}
          <div 
            className="grid gap-1 bg-gray-200 p-1"
            style={{
              gridTemplateColumns: `repeat(${cols}, 224px)`,
              gridTemplateRows: `repeat(${rows}, 56px)`,
            }}
          >
            {Array.from({ length: rows }).map((_, rowIndex) =>
              Array.from({ length: cols }).map((_, colIndex) => {
                const cellId = `${rowIndex}-${colIndex}`;
                const cell = cells[cellId];
                
                return (
                  <div
                    key={cellId}
                    className="relative group bg-white border border-gray-300 overflow-hidden"
                    style={{ backgroundColor: cell.backgroundColor }}
                  >
                    {/* Cell Content */}
                    {renderCellContent(cell)}

                    {/* Cell Actions Toolbar - Shows on hover */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            size="icon" 
                            variant="secondary" 
                            className="h-7 w-7 bg-white/90 hover:bg-white shadow-sm"
                          >
                            <List className="w-4 h-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3 bg-white">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Add List Items</h4>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Enter item..."
                                value={editingCell === cellId ? tempListItem : ''}
                                onChange={(e) => {
                                  setEditingCell(cellId);
                                  setTempListItem(e.target.value);
                                }}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    if (cell.type !== 'list') {
                                      updateCellType(cellId, 'list');
                                    }
                                    addListItem(cellId);
                                  }
                                }}
                                className="text-sm"
                              />
                              <Button 
                                size="sm"
                                onClick={() => {
                                  if (cell.type !== 'list') {
                                    updateCellType(cellId, 'list');
                                  }
                                  addListItem(cellId);
                                }}
                              >
                                Add
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            size="icon" 
                            variant="secondary" 
                            className="h-7 w-7 bg-white/90 hover:bg-white shadow-sm"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3 bg-white">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Add Image URL</h4>
                            <Input
                              placeholder="https://example.com/image.jpg"
                              value={cell.type === 'image' ? (cell.data as string) : ''}
                              onChange={(e) => {
                                if (cell.type !== 'image') {
                                  updateCellType(cellId, 'image');
                                }
                                updateCellData(cellId, e.target.value);
                              }}
                              className="text-sm"
                            />
                          </div>
                        </PopoverContent>
                      </Popover>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            size="icon" 
                            variant="secondary" 
                            className="h-7 w-7 bg-white/90 hover:bg-white shadow-sm"
                          >
                            <LinkIcon className="w-4 h-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3 bg-white">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Add URL</h4>
                            <Input
                              placeholder="https://example.com"
                              value={cell.type === 'url' ? (cell.data as string) : ''}
                              onChange={(e) => {
                                if (cell.type !== 'url') {
                                  updateCellType(cellId, 'url');
                                }
                                updateCellData(cellId, e.target.value);
                              }}
                              className="text-sm"
                            />
                          </div>
                        </PopoverContent>
                      </Popover>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            size="icon" 
                            variant="secondary" 
                            className="h-7 w-7 bg-white/90 hover:bg-white shadow-sm"
                          >
                            <Palette className="w-4 h-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-3 bg-white">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Background Color</h4>
                            <div className="grid grid-cols-5 gap-2">
                              {colors.map((color) => (
                                <button
                                  key={color}
                                  className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-600 transition-colors"
                                  style={{ backgroundColor: color }}
                                  onClick={() => updateCellBackground(cellId, color)}
                                />
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add Column Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={addColumn}
            className="h-8 w-28 rounded-lg bg-gray-100 hover:bg-gray-200"
            style={{
              width: '112px',
              height: '32px',
              transform: 'rotate(-90deg)',
              flexShrink: 0
            }}
            title="Add column"
          >
            <span className="text-sm font-medium transform rotate-90">Add</span>
          </Button>
        </div>

        {/* Add Row Button */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
          <Button
            variant="ghost"
            onClick={addRow}
            className="rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            style={{
              width: '448px',
              height: '32px',
              flexShrink: 0
            }}
            title="Add row"
          >
            <span className="text-sm font-medium">Add</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
