// client/src/hooks/useKeyboardShortcuts.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Check if Ctrl/Cmd + K is pressed
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Could open a command palette here
        console.log('Command palette shortcut');
      }

      // Check if Ctrl/Cmd + number
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case '1':
            e.preventDefault();
            navigate('/');
            break;
          case '2':
            e.preventDefault();
            navigate('/tasks');
            break;
          case '3':
            e.preventDefault();
            navigate('/notes');
            break;
          case '4':
            e.preventDefault();
            navigate('/habits');
            break;
          case '5':
            e.preventDefault();
            navigate('/pomodoro');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate]);
};