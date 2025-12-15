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

async function testAPI() {
  console.log('\n🧪 Starting API Tests...\n');
  
  let testTaskId = null;

  try {
    // Test 1: Health Check
    log.test('Test 1: Health Check');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    if (healthData.status === 'ok') {
      log.success('Health check passed');
    } else {
      log.error('Health check failed');
    }

    // Test 2: Create Task
    log.test('\nTest 2: Create Task');
    const createRes = await fetch(`${BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Task',
        description: 'This is a test task',
        priority: 'high',
        deadline: '2024-12-31T23:59:59'
      })
    });
    const createData = await createRes.json();
    if (createData.success && createData.data) {
      testTaskId = createData.data.id;
      log.success(`Task created with ID: ${testTaskId}`);
    } else {
      log.error('Failed to create task');
    }

    // Test 3: Get All Tasks
    log.test('\nTest 3: Get All Tasks');
    const getAllRes = await fetch(`${BASE_URL}/api/tasks`);
    const getAllData = await getAllRes.json();
    if (getAllData.success && getAllData.data.length > 0) {
      log.success(`Retrieved ${getAllData.count} task(s)`);
    } else {
      log.error('Failed to retrieve tasks');
    }

    // Test 4: Get Single Task
    if (testTaskId) {
      log.test('\nTest 4: Get Single Task');
      const getOneRes = await fetch(`${BASE_URL}/api/tasks/${testTaskId}`);
      const getOneData = await getOneRes.json();
      if (getOneData.success && getOneData.data) {
        log.success(`Retrieved task: ${getOneData.data.title}`);
      } else {
        log.error('Failed to retrieve single task');
      }
    }

    // Test 5: Update Task
    if (testTaskId) {
      log.test('\nTest 5: Update Task');
      const updateRes = await fetch(`${BASE_URL}/api/tasks/${testTaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Updated Test Task',
          completed: true
        })
      });
      const updateData = await updateRes.json();
      if (updateData.success && updateData.data.completed) {
        log.success('Task updated successfully');
      } else {
        log.error('Failed to update task');
      }
    }

    // Test 6: Batch Sync
    log.test('\nTest 6: Batch Sync');
    const syncRes = await fetch(`${BASE_URL}/api/tasks/sync/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tasks: [
          {
            id: 'sync-test-1',
            title: 'Sync Test Task 1',
            priority: 'low'
          },
          {
            id: 'sync-test-2',
            title: 'Sync Test Task 2',
            priority: 'medium'
          }
        ],
        lastSyncTime: null
      })
    });
    const syncData = await syncRes.json();
    if (syncData.success) {
      log.success(`Sync completed: ${syncData.results.created.length} created, ${syncData.results.updated.length} updated`);
    } else {
      log.error('Batch sync failed');
    }

    // Test 7: Delete Task (Soft Delete)
    if (testTaskId) {
      log.test('\nTest 7: Delete Task (Soft Delete)');
      const deleteRes = await fetch(`${BASE_URL}/api/tasks/${testTaskId}`, {
        method: 'DELETE'
      });
      const deleteData = await deleteRes.json();
      if (deleteData.success) {
        log.success('Task soft deleted successfully');
      } else {
        log.error('Failed to delete task');
      }
    }

    console.log('\n✅ All tests completed!\n');

  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    console.error(error);
  }
}

// Run tests
testAPI();