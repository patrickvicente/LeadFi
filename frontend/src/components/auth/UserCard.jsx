import React from 'react';
import { 
  CogIcon, 
  UserGroupIcon, 
  UserIcon, 
  EyeIcon 
} from '@heroicons/react/24/outline';
import ErrorBoundary from '../common/ErrorBoundary';

const UserCard = ({ user, onSelect, isSelected }) => {
  const getIcon = (iconName) => {
    const icons = {
      'CogIcon': CogIcon,
      'UserGroupIcon': UserGroupIcon,
      'UserIcon': UserIcon,
      'EyeIcon': EyeIcon
    };
    return icons[iconName] || UserIcon;
  };

  const IconComponent = getIcon(user.icon);

  const handleClick = () => {
    try {
      onSelect(user);
    } catch (error) {
      console.error('Error selecting user:', error);
      // Error will be handled by ErrorBoundary
    }
  };

  return (
    <ErrorBoundary>
      <div 
        className={`
          relative bg-background border border-gray-700 rounded-lg p-6 
          cursor-pointer transition-all duration-300 
          hover:scale-105 hover:shadow-lg hover:border-highlight1/50
          ${isSelected ? 'ring-2 ring-highlight1 border-highlight1' : ''}
        `}
        onClick={handleClick}
      >
        {/* Avatar Container */}
        <div className="flex justify-center mb-4">
          <div 
            className={`
              w-20 h-20 rounded-full flex items-center justify-center
              text-white text-2xl font-bold
              ${user.color.startsWith('highlight') ? `bg-${user.color}` : `bg-${user.color}`}
            `}
          >
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-full h-full rounded-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <IconComponent className="w-8 h-8" style={{ display: user.avatar ? 'none' : 'flex' }} />
          </div>
        </div>
        
        {/* User Info */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-text mb-1">
            {user.name}
          </h3>
          <p className="text-sm text-highlight1 font-medium mb-2">
            {user.role}
          </p>
          <p className="text-sm text-gray-400 leading-relaxed">
            {user.description}
          </p>
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-3 right-3">
            <div className="w-6 h-6 bg-highlight1 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default UserCard;