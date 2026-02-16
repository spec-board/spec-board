'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserStory } from '@/types';

interface PRDToUserStoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserStoriesGenerated: (userStories: UserStory[]) => void;
  projectPath: string;
}

export function PRDToUserStoriesModal({
  isOpen,
  onClose,
  onUserStoriesGenerated,
  projectPath
}: PRDToUserStoriesModalProps) {
  const [prdContent, setPRDContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedStories, setGeneratedStories] = useState<UserStory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!prdContent.trim()) {
      setError('Please enter PRD content');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/prd-to-us', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prdContent,
          projectPath
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate user stories');
      }

      if (data.success && data.userStories) {
        // Convert the generated stories to the UserStory format
        const userStories: UserStory[] = data.userStories.map((story: any, index: number) => ({
          id: story.id,
          title: story.title,
          description: story.description,
          priority: story.priority,
          acceptanceCriteria: story.acceptanceCriteria || []
        }));

        setGeneratedStories(userStories);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while generating user stories');
      console.error('Error generating user stories:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveStories = () => {
    onUserStoriesGenerated(generatedStories);
    onClose();
  };

  const handleClose = () => {
    setPRDContent('');
    setGeneratedStories([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        className={cn(
          'relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh]',
          'overflow-hidden flex flex-col'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="prd-modal-title"
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="text-center">
            <h2
              id="prd-modal-title"
              className="text-xl font-semibold text-gray-900"
            >
              Generate User Stories from PRD
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Paste your Product Requirement Document to generate user stories
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {!generatedStories.length ? (
            <>
              {/* PRD Input */}
              <div>
                <label htmlFor="prd-content" className="block text-sm font-medium text-gray-700 mb-2">
                  Product Requirement Document (PRD)
                </label>
                <textarea
                  ref={textareaRef}
                  id="prd-content"
                  value={prdContent}
                  onChange={(e) => setPRDContent(e.target.value)}
                  placeholder="Paste your PRD content here..."
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isProcessing}
                />
                <p className="mt-2 text-sm text-gray-500">
                  Enter your PRD content to automatically generate user stories.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-3 pt-4">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate User Stories'
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Generated Stories Preview */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Generated User Stories</h3>

                <div className="space-y-4">
                  {generatedStories.map((story, index) => (
                    <div
                      key={story.id || index}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {story.id} - {story.title}
                        </h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          story.priority === 'P1'
                            ? 'bg-red-100 text-red-800'
                            : story.priority === 'P2'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}>
                          {story.priority}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 mb-3">
                        {story.description}
                      </p>

                      <div>
                        <h5 className="text-xs font-medium text-gray-600 mb-1">Acceptance Criteria:</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {story.acceptanceCriteria?.slice(0, 3).map((criterion, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="mr-2">•</span>
                              {criterion}
                            </li>
                          ))}
                          {story.acceptanceCriteria && story.acceptanceCriteria.length > 3 && (
                            <li className="text-xs text-gray-500">
                              + {story.acceptanceCriteria.length - 3} more criteria
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setGeneratedStories([])}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Regenerate
                </button>
                <button
                  onClick={handleSaveStories}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save User Stories
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}