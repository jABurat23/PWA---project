// server/src/test-pomodoro.js
// Test script for Pomodoro API

const BASE_URL = 'http://localhost:5000';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.yellow}→ ${msg}${colors.reset}`)
};

async function testPomodoroAPI() {
  console.log('\n🍅 Starting Pomodoro API Tests...\n');
  
  // First check if server is running
  try {
    const healthCheck = await fetch(`${BASE_URL}/health`);
    if (!healthCheck.ok) {
      throw new Error('Server not responding');
    }
    log.success('Server is running');
  } catch (error) {
    log.error('Server is not running! Start it with: npm run dev');
    return;
  }
  
  let testSessionId = null;

  try {
    // Test 1: Log Pomodoro Session (25 minutes)
    log.test('Test 1: Log Pomodoro Session (25 minutes)');
    const logRes = await fetch(`${BASE_URL}/api/pomodoro/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        minutes: 25,
        completed_at: new Date().toISOString()
      })
    });
    const logData = await logRes.json();
    if (logData.success && logData.data) {
      testSessionId = logData.data.id;
      log.success(`Session logged with ID: ${testSessionId}`);
      log.info(`Duration: ${logData.data.minutes} minutes`);
    } else {
      log.error('Failed to log session');
    }

    // Test 2: Log Another Session (50 minutes)
    log.test('\nTest 2: Log Another Session (50 minutes)');
    const log2Res = await fetch(`${BASE_URL}/api/pomodoro/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        minutes: 50
      })
    });
    const log2Data = await log2Res.json();
    if (log2Data.success) {
      log.success('Second session logged successfully');
    } else {
      log.error('Failed to log second session');
    }

    // Test 3: Log Short Break (5 minutes)
    log.test('\nTest 3: Log Short Break (5 minutes)');
    const breakRes = await fetch(`${BASE_URL}/api/pomodoro/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        minutes: 5
      })
    });
    const breakData = await breakRes.json();
    if (breakData.success) {
      log.success('Break session logged successfully');
    } else {
      log.error('Failed to log break session');
    }

    // Test 4: Get All Sessions
    log.test('\nTest 4: Get All Sessions');
    const getAllRes = await fetch(`${BASE_URL}/api/pomodoro/logs`);
    const getAllData = await getAllRes.json();
    if (getAllData.success && getAllData.data.length > 0) {
      log.success(`Retrieved ${getAllData.count} session(s)`);
      log.info(`Total minutes in history: ${getAllData.data.reduce((sum, s) => sum + s.minutes, 0)}`);
    } else {
      log.error('Failed to retrieve sessions');
    }

    // Test 5: Get Single Session
    if (testSessionId) {
      log.test('\nTest 5: Get Single Session');
      const getOneRes = await fetch(`${BASE_URL}/api/pomodoro/logs/${testSessionId}`);
      const getOneData = await getOneRes.json();
      if (getOneData.success && getOneData.data) {
        log.success('Session retrieved successfully');
        log.info(`Minutes: ${getOneData.data.minutes}`);
        log.info(`Completed at: ${new Date(getOneData.data.completed_at).toLocaleString()}`);
      } else {
        log.error('Failed to retrieve single session');
      }
    }

    // Test 6: Get Today's Sessions
    log.test('\nTest 6: Get Today\'s Sessions');
    const todayRes = await fetch(`${BASE_URL}/api/pomodoro/today`);
    const todayData = await todayRes.json();
    if (todayData.success && todayData.data) {
      log.success('Today\'s sessions retrieved successfully');
      log.info(`Total sessions today: ${todayData.data.summary.totalSessions}`);
      log.info(`Total minutes today: ${todayData.data.summary.totalMinutes}`);
      log.info(`Total hours today: ${todayData.data.summary.totalHours}`);
    } else {
      log.error('Failed to retrieve today\'s sessions');
    }

    // Test 7: Get Statistics (Last 7 days)
    log.test('\nTest 7: Get Statistics (Last 7 days)');
    const statsRes = await fetch(`${BASE_URL}/api/pomodoro/stats?days=7`);
    const statsData = await statsRes.json();
    if (statsData.success && statsData.data) {
      log.success('Statistics retrieved successfully');
      log.info(`Period: ${statsData.data.period.days} days`);
      log.info(`Total sessions: ${statsData.data.totals.sessions}`);
      log.info(`Total minutes: ${statsData.data.totals.minutes}`);
      log.info(`Total hours: ${statsData.data.totals.hours}`);
      log.info(`Average sessions/day: ${statsData.data.averages.sessionsPerDay}`);
      log.info(`Current streak: ${statsData.data.streak.current} ${statsData.data.streak.unit}`);
      if (statsData.data.mostProductiveDay) {
        log.info(`Most productive day: ${statsData.data.mostProductiveDay.date} (${statsData.data.mostProductiveDay.minutes} minutes)`);
      }
    } else {
      log.error('Failed to retrieve statistics');
    }

    // Test 8: Get Statistics (Last 30 days)
    log.test('\nTest 8: Get Statistics (Last 30 days)');
    const stats30Res = await fetch(`${BASE_URL}/api/pomodoro/stats?days=30`);
    const stats30Data = await stats30Res.json();
    if (stats30Data.success) {
      log.success(`30-day stats: ${stats30Data.data.totals.sessions} sessions, ${stats30Data.data.totals.hours} hours`);
    } else {
      log.error('Failed to retrieve 30-day statistics');
    }

    // Test 9: Filter Sessions by Date Range
    log.test('\nTest 9: Filter Sessions by Date Range');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const filterRes = await fetch(
      `${BASE_URL}/api/pomodoro/logs?start_date=${startDate.toISOString()}&limit=10`
    );
    const filterData = await filterRes.json();
    if (filterData.success) {
      log.success(`Filtered sessions: ${filterData.count} found`);
    } else {
      log.error('Failed to filter sessions');
    }

    // Test 10: Batch Sync
    log.test('\nTest 10: Batch Sync');
    const syncRes = await fetch(`${BASE_URL}/api/pomodoro/sync/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessions: [
          {
            id: 'sync-pomodoro-1',
            minutes: 25,
            completed_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
          },
          {
            id: 'sync-pomodoro-2',
            minutes: 25,
            completed_at: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
          },
          {
            id: 'sync-pomodoro-3',
            minutes: 50,
            completed_at: new Date(Date.now() - 10800000).toISOString() // 3 hours ago
          }
        ],
        lastSyncTime: null
      })
    });
    const syncData = await syncRes.json();
    if (syncData.success) {
      log.success(`Sync completed: ${syncData.results.created.length} created`);
      if (syncData.results.errors.length > 0) {
        log.info(`Errors: ${syncData.results.errors.length}`);
      }
    } else {
      log.error('Batch sync failed');
    }

    // Test 11: Validate Invalid Data (0 minutes)
    log.test('\nTest 11: Validate Invalid Data (0 minutes)');
    const invalidRes = await fetch(`${BASE_URL}/api/pomodoro/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        minutes: 0
      })
    });
    const invalidData = await invalidRes.json();
    if (!invalidData.success) {
      log.success('Correctly rejected invalid data');
      log.info(`Error message: ${invalidData.error}`);
    } else {
      log.error('Should not accept 0 minutes');
    }

    // Test 12: Delete Session
    if (testSessionId) {
      log.test('\nTest 12: Delete Session');
      const deleteRes = await fetch(`${BASE_URL}/api/pomodoro/logs/${testSessionId}`, {
        method: 'DELETE'
      });
      const deleteData = await deleteRes.json();
      if (deleteData.success) {
        log.success('Session deleted successfully');
        
        // Verify deletion
        const verifyRes = await fetch(`${BASE_URL}/api/pomodoro/logs/${testSessionId}`);
        const verifyData = await verifyRes.json();
        if (!verifyData.success) {
          log.success('Session correctly removed from database');
        }
      } else {
        log.error('Failed to delete session');
      }
    }

    console.log('\n✅ All Pomodoro API tests completed!\n');

  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    console.error(error);
  }
}

// Run tests
testPomodoroAPI();