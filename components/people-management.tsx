"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Users,
  Edit2,
  Trash2,
  Upload,
  X,
  User,
  Loader2,
  ChevronDown
} from 'lucide-react';

// Predefined dentistry types
const DENTISTRY_TYPES = [
  'Orthodontics',
  'Pediatric',
  'Cosmetics',
  'Cosmetic Dentistry',
  'General Dentistry',
  'Emergency Services',
  'Oral Surgery',
  'Dental Implants',
  'Endodontics',
  'Periodontics',
  'TMJ Treatment',
  'Prosthodontics',
  'Sedation Dentistry',
  'Preventive Care',
  'Routine Checkups',
  'Family Dentistry'
];

// Person interface
interface Person {
  id: string;
  avatar: string | null;
  name: string;
  email: string | null;
  address: string | null;
  biography: string | null;
  dentistry_types: string[] | null;
  degree: string | null;
  created_at: string;
  updated_at: string;
}

// Simple Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, description, children }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// Simple Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea: React.FC<TextareaProps> = ({ className = '', ...props }) => {
  return (
    <textarea
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical ${className}`}
      {...props}
    />
  );
};

// Custom Dropdown Component
interface DropdownProps {
  options: string[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}

const MultiSelectDropdown: React.FC<DropdownProps> = ({ 
  options, 
  selectedValues, 
  onToggle, 
  placeholder, 
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const availableOptions = options.filter(option => !selectedValues.includes(option));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <span className={selectedValues.length === 0 ? 'text-gray-500' : 'text-gray-900'}>
          {selectedValues.length === 0 
            ? placeholder 
            : `${selectedValues.length} selected`
          }
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {availableOptions.length === 0 ? (
            <div className="px-3 py-2 text-gray-500 text-sm">All options selected</div>
          ) : (
            availableOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onToggle(option);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-sm"
              >
                {option}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const PeopleManagement = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [formData, setFormData] = useState({
    avatar: '',
    name: '',
    email: '',
    address: '',
    biography: '',
    dentistry_types: [] as string[], // Fixed: Match backend field name
    degree: ''
  });

  // Fetch people on component mount
  useEffect(() => {
    fetchPeople();
  }, []);

  // Fetch people from API
  const fetchPeople = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/people', {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch people');
      }

      setPeople(data.people || []);
    } catch (err) {
      console.error('Error fetching people:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch people');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      avatar: '',
      name: '',
      email: '',
      address: '',
      biography: '',
      dentistry_types: [], // Fixed: Match backend field name
      degree: ''
    });
    setEditingPerson(null);
    setError(null);
  };

  // Open modal for adding new person
  const handleAddPerson = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Open modal for editing person
  const handleEditPerson = (person: Person) => {
    setFormData({
      avatar: person.avatar || '',
      name: person.name,
      email: person.email || '',
      address: person.address || '',
      biography: person.biography || '',
      dentistry_types: person.dentistry_types || [], // Fixed: Match backend field name
      degree: person.degree || ''
    });
    setEditingPerson(person);
    setIsModalOpen(true);
  };

  // Delete person
  const handleDeletePerson = async (personId: string) => {
    const person = people.find(p => p.id === personId);
    if (!person) return;

    if (!window.confirm(`Are you sure you want to delete ${person.name}?`)) {
      return;
    }

    try {
      setDeleting(personId);
      setError(null);

      const response = await fetch(`/api/people/${personId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete person');
      }

      // Remove person from local state
      setPeople(people.filter(p => p.id !== personId));
      
      // Show success message briefly
      setError(null);
    } catch (err) {
      console.error('Error deleting person:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete person');
    } finally {
      setDeleting(null);
    }
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Toggle dentistry type selection
  const toggleDentistryType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      dentistry_types: prev.dentistry_types.includes(type)
        ? prev.dentistry_types.filter(t => t !== type)
        : [...prev.dentistry_types, type]
    }));
  };

  // Remove dentistry type
  const removeDentistryType = (typeToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      dentistry_types: prev.dentistry_types.filter(type => type !== typeToRemove)
    }));
  };

  // Handle avatar upload
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          avatar: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Save person
  const handleSavePerson = async () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const requestData = {
        avatar: formData.avatar || null,
        name: formData.name.trim(),
        email: formData.email.trim(),
        address: formData.address.trim() || null,
        biography: formData.biography.trim() || null,
        dentistryTypes: formData.dentistry_types.length > 0 ? formData.dentistry_types : null, // This will be mapped correctly in backend
        degree: formData.degree.trim() || null
      };

      let response;
      if (editingPerson) {
        // Update existing person
        response = await fetch('/api/people', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            id: editingPerson.id,
            ...requestData
          }),
        });
      } else {
        // Add new person
        response = await fetch('/api/people', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(requestData),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save person');
      }

      if (editingPerson) {
        // Update person in local state
        setPeople(people.map(person => 
          person.id === editingPerson.id ? data.person : person
        ));
      } else {
        // Add new person to local state
        setPeople([data.person, ...people]);
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving person:', err);
      setError(err instanceof Error ? err.message : 'Failed to save person');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading team members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">People Management</h1>
                <p className="text-gray-600">Manage your team members and staff</p>
              </div>
              
              <Button 
                onClick={handleAddPerson}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Person
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* People Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                People
              </CardTitle>
            </CardHeader>
            <CardContent>
              {people.length === 0 ? (
                <div className="text-center py-12">
                  <User className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
                  <p className="text-gray-500 mb-4">Add your first team member to get started</p>
                  <Button onClick={handleAddPerson} variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Person
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse table-fixed min-w-[1200px]">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-3 font-medium text-gray-900 w-[180px]">Person</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-900 w-[200px]">Contact</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-900 w-[180px]">Address</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-900 w-[250px]">Biography</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-900 w-[200px]">Specialties</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-900 w-[180px]">Degree</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-900 w-[100px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {people.map((person) => (
                        <tr key={person.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-3">
                            <div className="flex items-center space-x-3">
                              <img
                                src={person.avatar || 'https://via.placeholder.com/40'}
                                alt={person.name}
                                className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="font-medium text-gray-900 text-sm">{person.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <div className="text-sm text-gray-900">
                              {person.email || 'No email'}
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <div className="text-sm text-gray-600" title={person.address || ''}>
                              {person.address || 'No address'}
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <div className="text-sm text-gray-600" title={person.biography || ''}>
                              {person.biography || 'No biography'}
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <div className="flex flex-wrap gap-1">
                              {person.dentistry_types && person.dentistry_types.length > 0 ? (
                                person.dentistry_types.map((type, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {type}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-sm text-gray-400">No specialties</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <div className="text-sm text-gray-600" title={person.degree || ''}>
                              {person.degree || 'No degree'}
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditPerson(person)}
                                className="p-2 h-8 w-8"
                                title="Edit"
                                disabled={deleting === person.id}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeletePerson(person.id)}
                                className="text-red-600 hover:text-red-700 p-2 h-8 w-8"
                                title="Delete"
                                disabled={deleting === person.id}
                              >
                                {deleting === person.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Person Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPerson ? 'Edit Person' : 'Add New Person'}
        description={`Fill in the information below to ${editingPerson ? 'update the' : 'add a new'} team member.`}
      >
        <div className="space-y-6">
          {/* Error Message in Modal */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Avatar Upload */}
          <div className="space-y-2">
            <Label>Profile Picture</Label>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={formData.avatar || 'https://via.placeholder.com/80'}
                  alt="Avatar preview"
                  className="h-20 w-20 rounded-full object-cover border-2 border-gray-300"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1 cursor-pointer hover:bg-blue-700"
                >
                  <Upload className="h-3 w-3" />
                </label>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  Click the upload icon to change the profile picture
                </p>
                <p className="text-xs text-gray-500">
                  Recommended: Square image, at least 200x200px
                </p>
              </div>
            </div>
          </div>

          {/* Name and Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter full name"
                className="mt-1"
                disabled={saving}
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                className="mt-1"
                disabled={saving}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter address"
              className="mt-1"
              disabled={saving}
            />
          </div>

          {/* Biography */}
          <div>
            <Label htmlFor="biography">Biography</Label>
            <Textarea
              id="biography"
              value={formData.biography}
              onChange={(e) => handleInputChange('biography', e.target.value)}
              placeholder="Brief professional biography..."
              className="mt-1"
              rows={3}
              disabled={saving}
            />
          </div>

          {/* Degree */}
          <div>
            <Label htmlFor="degree">Degree</Label>
            <Input
              id="degree"
              value={formData.degree}
              onChange={(e) => handleInputChange('degree', e.target.value)}
              placeholder="e.g., DDS, Harvard University"
              className="mt-1"
              disabled={saving}
            />
          </div>

          {/* Dentistry Types - Updated to use dropdown */}
          <div>
            <Label>Dentistry Specialties</Label>
            
            {/* Selected tags display */}
            <div className="flex flex-wrap gap-2 mt-2 mb-2">
              {formData.dentistry_types.map((type, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-red-100 transition-colors"
                  onClick={() => !saving && removeDentistryType(type)}
                >
                  {type} <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}
              {formData.dentistry_types.length === 0 && (
                <p className="text-sm text-gray-500 italic">No specialties selected yet</p>
              )}
            </div>
            
            {/* Dropdown selector */}
            <MultiSelectDropdown
              options={DENTISTRY_TYPES}
              selectedValues={formData.dentistry_types}
              onToggle={toggleDentistryType}
              placeholder="Select dentistry specialties"
              disabled={saving}
            />
            <p className="text-xs text-gray-500 mt-1">
              Select from dropdown to add specialties. Click on tags to remove them.
            </p>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSavePerson} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingPerson ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                editingPerson ? 'Update Person' : 'Add Person'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PeopleManagement;