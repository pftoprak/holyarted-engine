import { handleSynergy } from '@holyarted/api-shared/handlers/synergy.js';
import { withPremiumHandler } from '@holyarted/api-shared/vercel.js';

export default withPremiumHandler((req) => handleSynergy(req.body));
