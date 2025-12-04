import React from 'react';

const HomePage: React.FC = () => {
  const navigate = (path: string) => {
    window.location.hash = path;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">QuickPoll</h1>
          <p className="text-muted">Live polling system for teachers and students</p>
        </div>
        <div className="space-y-4">
          <button
            onClick={() => navigate('/teacher')}
            className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            I'm a Teacher
          </button>
          <button
            onClick={() => navigate('/student')}
            className="w-full bg-secondary text-secondary-foreground py-4 px-6 rounded-lg font-semibold hover:bg-secondary/90 transition-colors"
          >
            I'm a Student
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;