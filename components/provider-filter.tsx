"use client";

import { Bluetooth as X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEffect } from 'react';

interface ProviderFilterProps {
  selectedTypes: {
    dentist: boolean;
    cosmetic: boolean;
  };
  selectedTags?: string[];
  showSpecialties?: boolean;
  onChange?: (types: { dentist: boolean; cosmetic: boolean }) => void;
  onTagsChange?: (tags: string[]) => void;
}

const availableTags = [
  'General Dentistry',
  'Pediatric',
  'Orthodontics',
  'Cosmetics',
  'Emergency Services',
  'Oral Surgery',
 'Dental Implants',
  'Endodontics',
  'Periodontics',
  'Cosmetic Dentistry'
];

export function ProviderFilter({ 
  selectedTypes, 
  selectedTags = [], 
  showSpecialties = false,
  onChange,
  onTagsChange 
}: ProviderFilterProps) {
  // Log selected tags for debugging
  useEffect(() => {
    if (selectedTags && selectedTags.length > 0) {
      console.log('Selected tags in filter component:', selectedTags);
    }
  }, [selectedTags]);

  const toggleType = (type: 'dentist' | 'cosmetic') => {
    if (!onChange) return;
    onChange({
      ...selectedTypes,
      [type]: !selectedTypes[type],
    });
  };

  const toggleTag = (tag: string) => {
    if (!onTagsChange) return;
    
    const newTags = selectedTags?.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    console.log('Toggling tag:', tag);
    console.log('New tags array:', newTags);
    onTagsChange(newTags);
  };

  const clearAllTags = () => {
    if (onTagsChange) {
      onTagsChange([]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Provider Type Filter */}
      {/* {onChange && (<div>
        <h3 className="text-base font-medium mb-3">Provider Type</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "flex gap-2 border-2 transition-all",
              selectedTypes.dentist
                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                : "border-border"
            )}
            onClick={() => toggleType('dentist')}
          >
            <div className="relative flex h-5 w-5 items-center justify-center rounded-full border">
              {selectedTypes.dentist && (
                <CheckIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <Tooth className="h-4 w-4" />
            <span>Dentist</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className={cn(
              "flex gap-2 border-2 transition-all",
              selectedTypes.cosmetic
                ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                : "border-border"
            )}
            onClick={() => toggleType('cosmetic')}
          >
            <div className="relative flex h-5 w-5 items-center justify-center rounded-full border">
              {selectedTypes.cosmetic && (
                <CheckIcon className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              )}
            </div>
            <Scissors className="h-4 w-4" />
            <span>Cosmetic Surgeon</span>
          </Button>
        </div>
      </div>)}
       */}
      {/* Specialty Tags Section */}
      {onTagsChange && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium">Specialties</h3>
            {selectedTags.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllTags}
                className="text-gray-500 hover:text-gray-700"
              >
                Clear all
              </Button>
            )}
          </div>
          
          {/* Selected Tags */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedTags.map((tag, index) => (
                <Badge
                  key={`${tag}-${index}`}
                  variant="default"
                  className="bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))}
            </div>
          )}
          
          {/* Available Tags */}
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag, index) => (
              <Badge
                key={`${tag}-${index}`}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-colors",
                  selectedTags.includes(tag) 
                    ? "bg-blue-600 text-white hover:bg-blue-700" 
                    : "hover:bg-gray-100"
                )}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}