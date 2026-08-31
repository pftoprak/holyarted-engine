import { handleConfig } from '@holyarted/api-shared/handlers/config.js';
import { withGetHandler } from '@holyarted/api-shared/vercel.js';

export default withGetHandler(() => handleConfig());
