import { handleHealth } from '@holyarted/api-shared/handlers/health.js';
import { withGetHandler } from '@holyarted/api-shared/vercel.js';

export default withGetHandler(() => handleHealth());
