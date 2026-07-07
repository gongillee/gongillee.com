import { Project } from './types';
import data from './projects.json';

// Source of truth is projects.json — edit it directly,
// or add new works with `npm run add` (scripts/add-media.mjs).
export const PROJECTS_DATA = data as Omit<Project, 'id' | 'imageUrl'>[];
