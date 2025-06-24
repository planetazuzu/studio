import { config } from 'dotenv';
config();

import '@/ai/flows/course-suggestion.ts';
import '@/ai/flows/feedback-personalization.ts';
import '@/ai/flows/generate-test-questions.ts';
import '@/ai/flows/notification-email-generation.ts';
import '@/ai/flows/course-tutor.ts';
import '@/ai/flows/announcement-email-generation.ts';
import '@/ai/flows/generate-course-from-topic.ts';
