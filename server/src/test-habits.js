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

async function testHabitsAPI() {
  console.log('\n🎯 Starting Habits API Tests...\n');
  
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
  
  let testHabitId = null;
  let dailyHabitId = null;

  try {
    // Test 1: Create Daily Habit
    log.test('Test 1: Create Daily Habit');
    const createDailyRes = await fetch(`${BASE_URL}/api/habits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Morning Exercise',
        frequency: 'daily'
      })
    });
    const createDailyData = await createDailyRes.json();
    if (createDailyData.success && createDailyData.data) {
      dailyHabitId = createDailyData.data.id;
      log.success(`Daily habit created with ID: ${dailyHabitId}`);
      log.info(`Initial streak: ${createDailyData.data.streak}`);
    } else {
      log.error('Failed to create daily habit');
    }

    // Test 2: Create Weekly Habit
    log.test('\nTest 2: Create Weekly Habit');
    const createWeeklyRes = await fetch(`${BASE_URL}/api/habits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Weekly Review',
        frequency: 'weekly'
      })
    });
    const createWeeklyData = await createWeeklyRes.json();
    if (createWeeklyData.success && createWeeklyData.data) {
      testHabitId = createWeeklyData.data.id;
      log.success(`Weekly habit created with ID: ${testHabitId}`);
    } else {
      log.error('Failed to create weekly habit');
    }

    // Test 3: Get All Habits
    log.test('\nTest 3: Get All Habits');
    const getAllRes = await fetch(`${BASE_URL}/api/habits`);
    const getAllData = await getAllRes.json();
    if (getAllData.success && getAllData.data.length > 0) {
      log.success(`Retrieved ${getAllData.count} habit(s)`);
      log.info(`First habit: "${getAllData.data[0].name}"`);
    } else {
      log.error('Failed to retrieve habits');
    }

    // Test 4: Get Single Habit
    if (testHabitId) {
      log.test('\nTest 4: Get Single Habit');
      const getOneRes = await fetch(`${BASE_URL}/api/habits/${testHabitId}`);
      const getOneData = await getOneRes.json();
      if (getOneData.success && getOneData.data) {
        log.success(`Retrieved habit: "${getOneData.data.name}"`);
        log.info(`Frequency: ${getOneData.data.frequency}`);
        log.info(`Current streak: ${getOneData.data.streak}`);
      } else {
        log.error('Failed to retrieve single habit');
      }
    }

    // Test 5: Complete Habit (First Time)
    if (dailyHabitId) {
      log.test('\nTest 5: Complete Habit (First Time)');
      const completeRes = await fetch(`${BASE_URL}/api/habits/${dailyHabitId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const completeData = await completeRes.json();
      if (completeData.success && completeData.data) {
        log.success('Habit completed!');
        log.info(`New streak: ${completeData.data.streak}`);
        log.info(`Streak increased: ${completeData.streakIncreased}`);
      } else {
        log.error('Failed to complete habit');
      }
    }

    // Test 6: Try to Complete Same Habit Again (Should Fail)
    if (dailyHabitId) {
      log.test('\nTest 6: Try to Complete Same Habit Again Today');
      const completeAgainRes = await fetch(`${BASE_URL}/api/habits/${dailyHabitId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const completeAgainData = await completeAgainRes.json();
      if (!completeAgainData.success) {
        log.success('Correctly prevented duplicate completion');
        log.info(`Message: ${completeAgainData.error}`);
      } else {
        log.error('Should not allow completing same habit twice in one day');
      }
    }

    // Test 7: Update Habit
    if (testHabitId) {
      log.test('\nTest 7: Update Habit');
      const updateRes = await fetch(`${BASE_URL}/api/habits/${testHabitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated Weekly Review',
          frequency: 'weekly'
        })
      });
      const updateData = await updateRes.json();
      if (updateData.success && updateData.data) {
        log.success('Habit updated successfully');
        log.info(`New name: "${updateData.data.name}"`);
      } else {
        log.error('Failed to update habit');
      }
    }

    // Test 8: Filter by Frequency
    log.test('\nTest 8: Filter by Frequency (Daily)');
    const filterRes = await fetch(`${BASE_URL}/api/habits?frequency=daily`);
    const filterData = await filterRes.json();
    if (filterData.success) {
      log.success(`Found ${filterData.count} daily habit(s)`);
    } else {
      log.error('Failed to filter habits');
    }

    // Test 9: Get Habit Statistics
    log.test('\nTest 9: Get Habit Statistics');
    const statsRes = await fetch(`${BASE_URL}/api/habits/stats/summary`);
    const statsData = await statsRes.json();
    if (statsData.success && statsData.data) {
      log.success('Statistics retrieved successfully');
      log.info(`Total habits: ${statsData.data.totalHabits}`);
      log.info(`Active streaks: ${statsData.data.activeStreaks}`);
      log.info(`Longest streak: ${statsData.data.longestStreak}`);
      log.info(`Completed today: ${statsData.data.completedToday}`);
    } else {
      log.error('Failed to fetch statistics');
    }

    // Test 10: Reset Habit Streak
    if (dailyHabitId) {
      log.test('\nTest 10: Reset Habit Streak');
      const resetRes = await fetch(`${BASE_URL}/api/habits/${dailyHabitId}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const resetData = await resetRes.json();
      if (resetData.success && resetData.data.streak === 0) {
        log.success('Habit streak reset successfully');
        log.info(`Streak is now: ${resetData.data.streak}`);
      } else {
        log.error('Failed to reset habit streak');
      }
    }

    // Test 11: Batch Sync
    log.test('\nTest 11: Batch Sync');
    const syncRes = await fetch(`${BASE_URL}/api/habits/sync/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        habits: [
          {
            id: 'sync-habit-1',
            name: 'Read for 30 minutes',
            frequency: 'daily',
            streak: 5
          },
          {
            id: 'sync-habit-2',
            name: 'Meditation',
            frequency: 'daily',
            streak: 10
          }
        ],
        lastSyncTime: null
      })
    });
    const syncData = await syncRes.json();
    if (syncData.success) {
      log.success(`Sync completed: ${syncData.results.created.length} created, ${syncData.results.updated.length} updated`);
      if (syncData.results.conflicts.length > 0) {
        log.info(`Conflicts detected: ${syncData.results.conflicts.length}`);
      }
    } else {
      log.error('Batch sync failed');
    }

    // Test 12: Delete Habit (Soft Delete)
    if (testHabitId) {
      log.test('\nTest 12: Delete Habit (Soft Delete)');
      const deleteRes = await fetch(`${BASE_URL}/api/habits/${testHabitId}`, {
        method: 'DELETE'
      });
      const deleteData = await deleteRes.json();
      if (deleteData.success) {
        log.success('Habit soft deleted successfully');
        
        // Verify it's not in normal list
        const verifyRes = await fetch(`${BASE_URL}/api/habits`);
        const verifyData = await verifyRes.json();
        const deletedHabitExists = verifyData.data.some(habit => habit.id === testHabitId);
        if (!deletedHabitExists) {
          log.success('Habit correctly excluded from normal list');
        }
      } else {
        log.error('Failed to delete habit');
      }
    }

    console.log('\n✅ All Habits API tests completed!\n');

  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    console.error(error);
  }
}

// Run tests
testHabitsAPI();