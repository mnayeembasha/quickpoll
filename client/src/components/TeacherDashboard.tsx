import React, { useContext, useEffect, useState } from 'react';
import { SocketContext } from '@/context/SocketContext';

const TeacherDashboard: React.FC = () => {
  const socket = React.useContext(SocketContext);
  const [pollId, setPollId] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!socket) return;

    // Create poll on mount
    setIsLoading(true);
    socket.emit('createPoll', {}, (response: any) => {
      setIsLoading(false);
      if (response.success) {
        setPollId(response.data.pollId);
      }
    });

    socket.on('studentJoined', (data: any) => {
      setStudents(prev => [...prev, { name: data.studentName, hasAnswered: false }]);
    });

    socket.on('studentLeft', (data: any) => {
      setStudents(prev => prev.filter(s => s.name !== data.studentName));
    });

    socket.on('answerReceived', (data: any) => {
      setStudents(prev => prev.map(s => 
        s.name === data.studentName ? { ...s, hasAnswered: true } : s
      ));
    });

    socket.on('showResults', (data: any) => {
      setResults(data.results);
      setShowResults(true);
      setCurrentQuestion(null);
    });

    return () => {
      socket.off('studentJoined');
      socket.off('studentLeft');
      socket.off('answerReceived');
      socket.off('showResults');
    };
  }, [socket]);

  const handleStartQuestion = () => {
    if (!socket || !questionText.trim()) return;
    
    const validOptions = options.filter(o => o.trim());
    if (validOptions.length < 2) return;

    setIsLoading(true);
    socket.emit('startQuestion', {
      question: questionText,
      options: validOptions,
      timeout: 60
    }, (response: any) => {
      setIsLoading(false);
      if (response.success) {
        setCurrentQuestion({
          question: questionText,
          options: validOptions,
        });
        setShowResults(false);
        setStudents(prev => prev.map(s => ({ ...s, hasAnswered: false })));
      }
    });
  };

  const handleAskNewQuestion = () => {
    setQuestionText('');
    setOptions(['', '', '', '']);
    setResults(null);
    setShowResults(false);
  };

  if (isLoading && !pollId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted">Creating poll...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Teacher Dashboard</h1>
          {pollId && (
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted mb-1">Poll Code:</p>
              <p className="text-2xl font-mono font-bold text-primary">{pollId}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {!currentQuestion && !showResults && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Create Question</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Question</label>
                    <input
                      type="text"
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder="What planet is known as the Red Planet?"
                      className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Options</label>
                    <div className="space-y-2">
                      {options.map((option, index) => (
                        <input
                          key={index}
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...options];
                            newOptions[index] = e.target.value;
                            setOptions(newOptions);
                          }}
                          placeholder={`Option ${index + 1}`}
                          className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleStartQuestion}
                    disabled={isLoading || !questionText.trim() || options.filter(o => o.trim()).length < 2}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Starting...' : 'Start Question'}
                  </button>
                </div>
              </div>
            )}

            {currentQuestion && !showResults && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Current Question</h2>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
                  <p className="text-lg font-medium">{currentQuestion.question}</p>
                </div>
                <div className="space-y-2">
                  {currentQuestion.options.map((option: string, index: number) => (
                    <div key={index} className="bg-background border border-border rounded-lg p-3">
                      <span className="font-medium">Option {index + 1}:</span> {option}
                    </div>
                  ))}
                </div>
                <p className="text-center text-muted mt-4">
                  Wait for the teacher to ask a new question
                </p>
              </div>
            )}

            {showResults && results && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Results</h2>
                <div className="space-y-3">
                  {results.map((result: any, index: number) => {
                    const percentage = results.reduce((sum: number, r: any) => sum + r.votes, 0) > 0
                      ? (result.votes / results.reduce((sum: number, r: any) => sum + r.votes, 0) * 100).toFixed(0)
                      : 0;
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{result.text}</span>
                          <span className="text-muted">{percentage}%</span>
                        </div>
                        <div className="h-3 bg-background rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={handleAskNewQuestion}
                  className="w-full mt-6 bg-secondary text-secondary-foreground py-3 rounded-lg font-semibold hover:bg-secondary/90"
                >
                  Ask a new question
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Participants</h3>
              <p className="text-3xl font-bold text-primary mb-4">{students.length}</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {students.map((student, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-background rounded">
                    <span className="text-sm">{student.name}</span>
                    {currentQuestion && (
                      <span className={`text-xs ${student.hasAnswered ? 'text-green-600' : 'text-muted'}`}>
                        {student.hasAnswered ? '✓' : '○'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;