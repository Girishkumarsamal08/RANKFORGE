import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Question } from '../types';

interface TestState {
  attemptId: string | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, string>;       // maps questionId to selected answer value
  timesSpent: Record<string, number>;    // maps questionId to time spent in seconds
  cheatEventsCount: number;
}

const initialState: TestState = {
  attemptId: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  timesSpent: {},
  cheatEventsCount: 0,
};

const testSlice = createSlice({
  name: 'test',
  initialState,
  reducers: {
    initTest: (
      state,
      action: PayloadAction<{ attemptId: string; questions: Question[] }>
    ) => {
      state.attemptId = action.payload.attemptId;
      state.questions = action.payload.questions;
      state.currentQuestionIndex = 0;
      state.answers = {};
      state.cheatEventsCount = 0;
      
      // Initialize times spent
      state.timesSpent = {};
      action.payload.questions.forEach((q) => {
        state.timesSpent[q.id] = 0;
      });
    },
    selectAnswer: (
      state,
      action: PayloadAction<{ questionId: string; answerSelected: string }>
    ) => {
      state.answers[action.payload.questionId] = action.payload.answerSelected;
    },
    clearAnswer: (state, action: PayloadAction<string>) => {
      delete state.answers[action.payload];
    },
    incrementTimeSpent: (
      state,
      action: PayloadAction<{ questionId: string; seconds: number }>
    ) => {
      if (state.timesSpent[action.payload.questionId] !== undefined) {
        state.timesSpent[action.payload.questionId] += action.payload.seconds;
      } else {
        state.timesSpent[action.payload.questionId] = action.payload.seconds;
      }
    },
    setCurrentQuestionIndex: (state, action: PayloadAction<number>) => {
      if (action.payload >= 0 && action.payload < state.questions.length) {
        state.currentQuestionIndex = action.payload;
      }
    },
    incrementCheatCount: (state) => {
      state.cheatEventsCount += 1;
    },
    resetTestState: (state) => {
      state.attemptId = null;
      state.questions = [];
      state.currentQuestionIndex = 0;
      state.answers = {};
      state.timesSpent = {};
      state.cheatEventsCount = 0;
    },
  },
});

export const {
  initTest,
  selectAnswer,
  clearAnswer,
  incrementTimeSpent,
  setCurrentQuestionIndex,
  incrementCheatCount,
  resetTestState,
} = testSlice.actions;

export default testSlice.reducer;
