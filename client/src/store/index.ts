const pollSlice = {
  name: 'poll',
  initialState: {
    pollId: null as string | null,
    role: null as 'teacher' | 'student' | null,
    studentName: null as string | null,
    students: [] as Student[],
    currentQuestion: null as Question | null,
    results: null as PollResults | null,
    timeRemaining: 0,
    chatMessages: [] as ChatMessage[],
    isConnected: false,
    isLoading: false,
  },
  reducers: {
    setPollId: (state: any, action: any) => {
      state.pollId = action.payload;
    },
    setRole: (state: any, action: any) => {
      state.role = action.payload;
    },
    setStudentName: (state: any, action: any) => {
      state.studentName = action.payload;
    },
    setStudents: (state: any, action: any) => {
      state.students = action.payload;
    },
    setCurrentQuestion: (state: any, action: any) => {
      state.currentQuestion = action.payload;
    },
    setResults: (state: any, action: any) => {
      state.results = action.payload;
    },
    setTimeRemaining: (state: any, action: any) => {
      state.timeRemaining = action.payload;
    },
    addChatMessage: (state: any, action: any) => {
      state.chatMessages.push(action.payload);
    },
    setIsConnected: (state: any, action: any) => {
      state.isConnected = action.payload;
    },
    setIsLoading: (state: any, action: any) => {
      state.isLoading = action.payload;
    },
    resetPoll: (state: any) => {
      state.pollId = null;
      state.role = null;
      state.studentName = null;
      state.students = [];
      state.currentQuestion = null;
      state.results = null;
      state.timeRemaining = 0;
      state.chatMessages = [];
      state.isConnected = false;
      state.isLoading = false;
    },
  },
};

const store = configureStore({
  reducer: {
    poll: (state = pollSlice.initialState, action: any) => {
      const reducer = pollSlice.reducers as any;
      if (reducer[action.type]) {
        return reducer[action.type](state, action);
      }
      return state;
    },
  },
});