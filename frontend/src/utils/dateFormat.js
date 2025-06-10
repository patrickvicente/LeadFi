export const formatDate = (dateString) => {
    if (!dateString) return '';
  
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return 'Invalid Date';
      }
  
      // Format options with timezone
      const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone // Gets user's timezone
      };
  
      return new Intl.DateTimeFormat('en-US', options).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };
  
  // Date format without time
  export const formatDateOnly = (dateString) => {
    if (!dateString) return '';
  
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return 'Invalid Date';
      }
  
      const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
  
      return new Intl.DateTimeFormat('en-US', options).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };
  
  // Relative time
  export const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
  
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return 'Invalid Date';
      }
  
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);
  
      if (diffInSeconds < 60) {
        return 'just now';
      }
  
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
      }
  
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
      }
  
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
      }
  
      // If more than a week, return the formatted date
      return formatDate(dateString);
    } catch (error) {
      console.error('Error formatting relative time:', error);
      return 'Invalid Date';
    }
  };