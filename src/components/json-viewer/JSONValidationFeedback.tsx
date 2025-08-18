import React from 'react';

interface JSONValidationFeedbackProps {
  message: string;
  type: 'success' | 'warning' | 'error';
  onDismiss?: () => void;
}

export const JSONValidationFeedback: React.FC<JSONValidationFeedbackProps> = ({ 
  message, 
  type, 
  onDismiss 
}) => {
  const bgColor = {
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200', 
    error: 'bg-red-50 border-red-200'
  }[type];

  const textColor = {
    success: 'text-green-800',
    warning: 'text-yellow-800',
    error: 'text-red-800'
  }[type];

  const icon = {
    success: '✅',
    warning: '⚠️',
    error: '❌'
  }[type];

  return (
    <div className={`${bgColor} border rounded-lg p-3 mb-4 flex items-start justify-between`}>
      <div className="flex items-start">
        <span className="mr-2 text-lg">{icon}</span>
        <p className={`${textColor} text-sm`}>
          {message}
        </p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={`${textColor} hover:opacity-70 ml-3 text-lg leading-none`}
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default JSONValidationFeedback;