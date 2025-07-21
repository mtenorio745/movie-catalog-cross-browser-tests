import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = ''
}) => {
  return (
    <div className={`text-center py-16 ${className}`}>
      <div className="bg-dark-card rounded-xl p-8 max-w-md mx-auto border border-dark-border">
        <Icon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm mb-6">{description}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="bg-gradient-to-r from-accent-blue to-purple-600 hover:from-accent-blue-hover hover:to-purple-700 px-6 py-2.5 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
};