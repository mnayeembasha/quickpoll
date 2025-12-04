import { createSlice } from '@reduxjs/toolkit';
import type { Student, Question, PollResults, ChatMessage } from '@/types';

interface PollState {
  pollId: string | null;
  role: 'teacher' | 'student' | null;
  studentName: string | null;
  students: Student[];
  currentQuestion: Question | null;
  results: PollResults | null;
  timeRemaining: number;
  chatMessages: ChatMessage[];
  isConnected: boolean;
  isLoading: boolean;
}

const initialState: PollState = {
  pollId: null,
  role: null,
  studentName: null,
  students: [],
  currentQuestion: null,
  results: null,
  timeRemaining: 0,
  chatMessages: [],
  isConnected: false,
  isLoading: false,
};

const pollSlice = createSlice({
  name: 'poll',
  initialState,
  reducers: {
    setPollId: (state, action: { payload: string }) => {
      state.pollId = action.payload;
    },
    setRole: (state, action: { payload: 'teacher' | 'student' }) => {
      state.role = action.payload;
    },
    setStudentName: (state, action: { payload: string }) => {
      state.studentName = action.payload;
    },
    setStudents: (state, action: { payload: Student[] }) => {
      state.students = action.payload;
    },
    setCurrentQuestion: (state, action: { payload: Question | null }) => {
      state.currentQuestion = action.payload;
    },
    setResults: (state, action: { payload: PollResults | null }) => {
      state.results = action.payload;
    },
    setTimeRemaining: (state, action: { payload: number }) => {
      state.timeRemaining = action.payload;
    },
    addChatMessage: (state, action: { payload: ChatMessage }) => {
      state.chatMessages.push(action.payload);
    },
    setIsConnected: (state, action: { payload: boolean }) => {
      state.isConnected = action.payload;
    },
    setIsLoading: (state, action: { payload: boolean }) => {
      state.isLoading = action.payload;
    },
    resetPoll: () => initialState,
  },
});

export const {
  setPollId,
  setRole,
  setStudentName,
  setStudents,
  setCurrentQuestion,
  setResults,
  setTimeRemaining,
  addChatMessage,
  setIsConnected,
  setIsLoading,
  resetPoll,
} = pollSlice.actions;

export default pollSlice.reducer;