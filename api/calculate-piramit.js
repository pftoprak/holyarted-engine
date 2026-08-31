import { handlePiramit } from '@holyarted/api-shared/handlers/piramit.js';
import { withPremiumHandler } from '@holyarted/api-shared/vercel.js';

export default withPremiumHandler((req) => handlePiramit(req.body));
