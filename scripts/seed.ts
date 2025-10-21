// This file is used to load environment variables for the seed script
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
config({
  path: path.resolve(process.cwd(), '.env.local')
});

// Run the seed script
import('./seedModels');