import app from './app';
import { startOrgConsumer } from './workers/orgEventConsumer';

const PORT = process.env.CALENDAR_SERVICE_PORT || 3003;

app.listen(PORT, () => {
  console.log(`Calendar Service listening on port ${PORT}`);
  startOrgConsumer();
}); 