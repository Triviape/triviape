/**
 * Zod validation schemas for quiz-related data
 */

import { z } from 'zod';

// Quiz difficulty levels
export const difficultyLevelSchema = z.enum(['easy', 'medium', 'hard', 'expert']);

// Question type
export const questionTypeSchema = z.enum(['multiple_choice', 'true_false', 'fill_in_blank', 'matching']);

// Quiz option schema
export const quizOptionSchema = z.object({
  id: z.string(),
  text: z.string().min(1, 'Option text is required').max(500, 'Option text must be less than 500 characters'),
  isCorrect: z.boolean().optional(),
});

// Question schema
export const questionSchema = z.object({
  text: z.string().min(5, 'Question text must be at least 5 characters').max(1000, 'Question text must be less than 1000 characters'),
  options: z.array(quizOptionSchema).min(2, 'At least 2 options are required'),
  correctOption: z.string().min(1, 'Correct option is required'),
  explanation: z.string().max(2000, 'Explanation must be less than 2000 characters').optional(),
  type: questionTypeSchema,
  difficulty: difficultyLevelSchema,
  categoryId: z.string().min(1, 'Category is required'),
  imageUrl: z.string().url('Image URL must be a valid URL').optional().nullable(),
  tags: z.array(z.string()).optional(),
});

// Quiz schema
export const quizSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description must be less than 1000 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  difficulty: difficultyLevelSchema,
  timeLimit: z.number().min(30, 'Time limit must be at least 30 seconds').max(3600, 'Time limit must be less than 1 hour'),
  questionIds: z.array(z.string()).min(1, 'At least 1 question is required'),
  isPublished: z.boolean().optional(),
  imageUrl: z.string().url('Image URL must be a valid URL').optional().nullable(),
  tags: z.array(z.string()).optional(),
});

// Quiz category schema
export const quizCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  iconUrl: z.string().url('Icon URL must be a valid URL').optional().nullable(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color').optional(),
});

// Quiz attempt schema
export const quizAttemptSchema = z.object({
  quizId: z.string().min(1, 'Quiz ID is required'),
  startedAt: z.date(),
  completedAt: z.date().optional(),
  answers: z.array(
    z.object({
      questionId: z.string().min(1, 'Question ID is required'),
      selectedOption: z.string().min(1, 'Selected option is required'),
      isCorrect: z.boolean(),
      timeSpent: z.number().min(0, 'Time spent must be a positive number'),
    })
  ),
}); 