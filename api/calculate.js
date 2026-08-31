import { handleCalculate } from '@holyarted/api-shared/handlers/calculate.js';
import { withJsonHandler } from '@holyarted/api-shared/vercel.js';

export default withJsonHandler((req) => handleCalculate(req.body));
