import React, { useEffect, useState } from 'react';
import { SocketContext } from '@/context/SocketContext';

const StudentInterface: React.FC = () => {
  const socket = React.useContext(SocketContext);
  const [pollId, setPollId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [joined, setJoined] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (!socket || !joined) return;

    socket.on('newQuestion', (data: any) => {
      setCurrentQuestion(data);
      setHasSubmitted(false);
      setSelectedAnswer(null);
      setResults(null);
      setTimeRemaining(data.timeout);
    });

    socket.on('showResults', (data: any) => {
      setResults(data.results);
      setCurrentQuestion(null);
    });

    socket.on('timeUp', () => {
      setHasSubmitted(true);
    });

    return () => {
      socket.off('newQuestion');
      socket.off('showResults');
      socket.off('timeUp');
    };
  }, [socket, joined]);

  useEffect(() => {
    if (timeRemaining > 0 && currentQuestion && !hasSubmitted) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining, currentQuestion, hasSubmitted]);

  const handleJoinPoll = () => {
    if (!socket || !pollId.trim() || !studentName.trim()) return;
    
    setIsLoading(true);
    socket.emit('joinPoll', {
      pollId: pollId.trim(),
      studentName: studentName.trim()
    }, (response: any) => {
      setIsLoading(false);
      if (response.success) {
        setJoined(true);
        if (response.data.currentQuestion) {
          setCurrentQuestion(response.data.currentQuestion);
          setTimeRemaining(response.data.currentQuestion.timeout);
        }
      }
    });
  };

  const handleSubmitAnswer = () => {
    if (!socket || !selectedAnswer || !currentQuestion) return;
    
    setIsLoading(true);
    socket.emit('submitAnswer', {
      questionId: currentQuestion.questionId,
      answer: selectedAnswer
    }, (response: any) => {
      setIsLoading(false);
      if (response.success) {
        setHasSubmitted(true);
      }
    });
  };

  if (!joined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Join Poll</h1>
            <p className="text-muted">Enter poll code and your name</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Poll Code</label>
              <input
                type="text"
                value={pollId}
                onChange={(e) => setPollId(e.target.value)}
                placeholder="Enter poll code"
                className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-center text-2xl font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Your Name</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              onClick={handleJoinPoll}
              disabled={isLoading || !pollId.trim() || !studentName.trim()}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Joining...' : 'Join Poll'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 text-center">
          <p className="text-sm text-muted mb-1">Welcome</p>
          <h2 className="text-2xl font-bold text-foreground">{studentName}</h2>
        </div>

        {!currentQuestion && !results && (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-muted">Wait for the teacher to ask questions..</p>
          </div>
        )}

        {currentQuestion && !hasSubmitted && (
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Question 1</h3>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-destructive" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="text-destructive font-semibold">00:{timeRemaining.toString().padStart(2, '0')}</span>
              </div>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
              <p className="text-lg font-medium">{currentQuestion.question}</p>
            </div>

            <div className="space-y-3 mb-6">
              {currentQuestion.options.map((option: any) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedAnswer(option.id)}
                  className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                    selectedAnswer === option.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedAnswer === option.id ? 'border-primary' : 'border-muted'
                    }`}>
                      {selectedAnswer === option.id && (
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                      )}
                    </div>
                    <span>{option.text}</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer || isLoading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        )}

        {hasSubmitted && !results && (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold mb-2 text-green-600">Answer Submitted!</h3>
            <p className="text-muted">Waiting for results...</p>
          </div>
        )}

        {results && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-6 text-center">Results</h3>
            <div className="space-y-3">
              {results.map((result: any, index: number) => {
                const total = results.reduce((sum: number, r: any) => sum + r.votes, 0);
                const percentage = total > 0 ? (result.votes / total * 100).toFixed(0) : 0;
                
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
            <p className="text-center text-muted mt-6">
              Wait for the teacher to ask a new question..
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
export default StudentInterface;