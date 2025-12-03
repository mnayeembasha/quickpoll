import { Server, Socket } from 'socket.io';
import { pollService } from '../services/poll.service';
import { timerService } from '../services/timer.service';
import { SOCKET_EVENTS, USER_ROLES } from '../utils/constants';
import {
  validate,
  joinPollSchema,
  startQuestionSchema,
  submitAnswerSchema,
  removeStudentSchema,
  sendMessageSchema,
} from '../middleware/validation.middleware';
import logger from '../utils/logger';
import { nanoid } from 'nanoid';

/**
 * Socket.io event handlers
 * PROD:
 * - Implement authentication/authorization
 * - Add rate limiting per socket
 * - Implement socket middleware for validation
 * - Add connection pooling and load balancing
 * - Implement reconnection handling with state recovery
 */

class SocketController {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    timerService.setSocketIO(io);
  }

  /**
   * Initialize socket connection
   */
  handleConnection(socket: Socket) {
    logger.info('Client connected', { socketId: socket.id });

    // Register all event handlers
    this.registerTeacherEvents(socket);
    this.registerStudentEvents(socket);
    this.registerChatEvents(socket); // Bonus feature

    // Handle disconnection
    socket.on(SOCKET_EVENTS.DISCONNECT, () => this.handleDisconnect(socket));
  }

  /**
   * Register teacher-specific events
   */
  private registerTeacherEvents(socket: Socket) {
    // Create poll
    socket.on(SOCKET_EVENTS.CREATE_POLL, (data, callback) => {
      try {
        const poll = pollService.createPoll(socket.id);
        
        // Join teacher to their own room
        socket.join(poll.id);
        
        callback({
          success: true,
          data: {
            pollId: poll.id,
            message: 'Poll created successfully',
          },
        });

        logger.info('Teacher created poll', { socketId: socket.id, pollId: poll.id });
      } catch (error: any) {
        logger.error('Error creating poll', { error: error.message });
        callback({
          success: false,
          error: error.message,
        });
      }
    });

    // Start question
    socket.on(SOCKET_EVENTS.START_QUESTION, (data, callback) => {
      try {
        // Validate input
        const validData = validate(startQuestionSchema, data);

        // Get teacher's poll
        const poll = pollService.getPollByTeacher(socket.id);
        if (!poll) {
          throw new Error('You do not have an active poll');
        }

        // Start question with validated timeout
        const timeoutValue = validData.timeout ?? 60;
        const question = pollService.startQuestion(
          poll.id,
          validData.question,
          validData.options,
          timeoutValue
        );

        // Start timer
        const timerHandle = timerService.startTimer(poll.id, question.id, timeoutValue);
        question.timerHandle = timerHandle;

        // Broadcast new question to all students
        this.io.to(poll.id).emit(SOCKET_EVENTS.NEW_QUESTION, {
          questionId: question.id,
          question: question.text,
          options: question.options.map(opt => ({
            id: opt.id,
            text: opt.text,
          })),
          timeout: timeoutValue,
          startedAt: question.startedAt,
        });

        callback({
          success: true,
          data: {
            questionId: question.id,
            message: 'Question started successfully',
          },
        });

        logger.info('Question started', { 
          pollId: poll.id, 
          questionId: question.id,
          timeout: timeoutValue,
        });
      } catch (error: any) {
        logger.error('Error starting question', { error: error.message });
        callback({
          success: false,
          error: error.message,
        });
      }
    });

    // End question manually
    socket.on(SOCKET_EVENTS.END_QUESTION, (data, callback) => {
      try {
        const poll = pollService.getPollByTeacher(socket.id);
        if (!poll) {
          throw new Error('You do not have an active poll');
        }

        if (!poll.currentQuestion) {
          throw new Error('No active question to end');
        }

        // End question early
        timerService.endQuestionEarly(poll.id);

        callback({
          success: true,
          data: { message: 'Question ended successfully' },
        });
      } catch (error: any) {
        logger.error('Error ending question', { error: error.message });
        callback({
          success: false,
          error: error.message,
        });
      }
    });

    // Remove student (Bonus feature)
    socket.on(SOCKET_EVENTS.REMOVE_STUDENT, (data, callback) => {
      try {
        const validData = validate(removeStudentSchema, data);
        
        const poll = pollService.getPollByTeacher(socket.id);
        if (!poll) {
          throw new Error('You do not have an active poll');
        }

        const student = poll.students.get(validData.studentSocketId);
        if (!student) {
          throw new Error('Student not found');
        }

        // Remove student
        pollService.removeStudentFromPoll(poll.id, validData.studentSocketId);

        // Force disconnect student
        const studentSocket = this.io.sockets.sockets.get(validData.studentSocketId);
        if (studentSocket) {
          studentSocket.emit(SOCKET_EVENTS.STUDENT_REMOVED, {
            message: 'You have been removed from the poll',
          });
          studentSocket.leave(poll.id);
        }

        // Notify all participants
        this.io.to(poll.id).emit(SOCKET_EVENTS.STUDENT_LEFT, {
          studentName: student.name,
          totalStudents: poll.students.size,
        });

        callback({
          success: true,
          data: { message: 'Student removed successfully' },
        });

        logger.info('Student removed by teacher', { 
          pollId: poll.id, 
          studentName: student.name,
        });
      } catch (error: any) {
        logger.error('Error removing student', { error: error.message });
        callback({
          success: false,
          error: error.message,
        });
      }
    });
  }

  /**
   * Register student-specific events
   */
  private registerStudentEvents(socket: Socket) {
    // Join poll
    socket.on(SOCKET_EVENTS.JOIN_POLL, (data, callback) => {
      try {
        // Validate input
        const validData = validate(joinPollSchema, data);

        // Add student to poll
        const student = pollService.addStudentToPoll(
          validData.pollId,
          socket.id,
          validData.studentName
        );

        // Join student to poll room
        socket.join(validData.pollId);

        // Get poll info
        const poll = pollService.getPoll(validData.pollId);

        // Notify all participants about new student
        this.io.to(validData.pollId).emit(SOCKET_EVENTS.STUDENT_JOINED, {
          studentName: student.name,
          totalStudents: poll.students.size,
        });

        // Send current poll state to student
        const currentQuestion = poll.currentQuestion ? {
          questionId: poll.currentQuestion.id,
          question: poll.currentQuestion.text,
          options: poll.currentQuestion.options.map(opt => ({
            id: opt.id,
            text: opt.text,
          })),
          timeout: poll.currentQuestion.timeout,
          startedAt: poll.currentQuestion.startedAt,
        } : null;

        callback({
          success: true,
          data: {
            studentName: student.name,
            pollId: validData.pollId,
            totalStudents: poll.students.size,
            currentQuestion,
            message: 'Joined poll successfully',
          },
        });

        logger.info('Student joined poll', { 
          pollId: validData.pollId, 
          studentName: student.name,
        });
      } catch (error: any) {
        logger.error('Error joining poll', { error: error.message });
        callback({
          success: false,
          error: error.message,
        });
      }
    });

    // Submit answer
    socket.on(SOCKET_EVENTS.SUBMIT_ANSWER, (data, callback) => {
      try {
        // Validate input
        const validData = validate(submitAnswerSchema, data);

        // Get student's poll
        const poll = pollService.getPollByStudent(socket.id);
        if (!poll) {
          throw new Error('You are not in any poll');
        }

        // Submit answer
        pollService.submitAnswer(poll.id, socket.id, validData.questionId, validData.answer);

        // Get student info
        const student = poll.students.get(socket.id);

        // Notify teacher and all students about answer received
        this.io.to(poll.id).emit(SOCKET_EVENTS.ANSWER_RECEIVED, {
          studentName: student?.name,
          totalAnswered: Array.from(poll.students.values()).filter(s => s.hasAnswered).length,
          totalStudents: poll.students.size,
        });

        callback({
          success: true,
          data: { message: 'Answer submitted successfully' },
        });

        logger.info('Answer submitted', { 
          pollId: poll.id, 
          studentName: student?.name,
          answer: validData.answer,
        });

        // Check if all students answered
        if (timerService.checkAllAnswered(poll.id)) {
          logger.info('All students answered, ending question early', { pollId: poll.id });
          timerService.endQuestionEarly(poll.id);
        }
      } catch (error: any) {
        logger.error('Error submitting answer', { error: error.message });
        callback({
          success: false,
          error: error.message,
        });
      }
    });

    // Leave poll
    socket.on(SOCKET_EVENTS.LEAVE_POLL, (data, callback) => {
      try {
        const poll = pollService.getPollByStudent(socket.id);
        if (poll) {
          const student = poll.students.get(socket.id);
          const studentName = student?.name || 'Unknown';

          pollService.removeStudentFromPoll(poll.id, socket.id);
          socket.leave(poll.id);

          // Notify all participants
          this.io.to(poll.id).emit(SOCKET_EVENTS.STUDENT_LEFT, {
            studentName,
            totalStudents: poll.students.size,
          });

          logger.info('Student left poll', { pollId: poll.id, studentName });
        }

        callback({
          success: true,
          data: { message: 'Left poll successfully' },
        });
      } catch (error: any) {
        logger.error('Error leaving poll', { error: error.message });
        callback({
          success: false,
          error: error.message,
        });
      }
    });
  }

  /**
   * Register chat events (Bonus feature)
   */
  private registerChatEvents(socket: Socket) {
    socket.on(SOCKET_EVENTS.SEND_MESSAGE, (data, callback) => {
      try {
        const validData = validate(sendMessageSchema, data);

        // Get user's poll (works for both teacher and student)
        let poll = pollService.getPollByTeacher(socket.id);
        let role: 'teacher' | 'student' = USER_ROLES.TEACHER;
        let senderName = 'Teacher';

        if (!poll) {
          poll = pollService.getPollByStudent(socket.id);
          role = USER_ROLES.STUDENT;
          const student = poll?.students.get(socket.id);
          senderName = student?.name || 'Unknown';
        }

        if (!poll) {
          throw new Error('You are not in any poll');
        }

        // Create message
        const message = {
          id: nanoid(10),
          sender: senderName,
          role,
          message: validData.message,
          timestamp: new Date(),
        };

        // Save to poll (optional, for history)
        poll.chatMessages.push(message);

        // Broadcast to all in poll
        this.io.to(poll.id).emit(SOCKET_EVENTS.NEW_MESSAGE, message);

        callback({
          success: true,
          data: { message: 'Message sent' },
        });

        logger.info('Chat message sent', { pollId: poll.id, sender: senderName });
      } catch (error: any) {
        logger.error('Error sending message', { error: error.message });
        callback({
          success: false,
          error: error.message,
        });
      }
    });
  }

  /**
   * Handle socket disconnection
   */
  private handleDisconnect(socket: Socket) {
    logger.info('Client disconnected', { socketId: socket.id });

    // Check if it's a teacher
    const teacherPoll = pollService.getPollByTeacher(socket.id);
    if (teacherPoll) {
      // PROD: Don't auto-delete poll, implement timeout or manual cleanup
      // For now, notify students and optionally keep poll active
      this.io.to(teacherPoll.id).emit(SOCKET_EVENTS.ERROR, {
        message: 'Teacher disconnected',
      });
      
      logger.info('Teacher disconnected', { pollId: teacherPoll.id });
      // Optionally: pollService.deletePoll(teacherPoll.id);
    }

    // Check if it's a student
    const studentPoll = pollService.getPollByStudent(socket.id);
    if (studentPoll) {
      const student = studentPoll.students.get(socket.id);
      const studentName = student?.name || 'Unknown';

      pollService.removeStudentFromPoll(studentPoll.id, socket.id);

      // Notify all participants
      this.io.to(studentPoll.id).emit(SOCKET_EVENTS.STUDENT_LEFT, {
        studentName,
        totalStudents: studentPoll.students.size,
      });

      logger.info('Student disconnected', { 
        pollId: studentPoll.id, 
        studentName,
      });
    }
  }
}

export default SocketController;