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

async function testNotesAPI() {
  console.log('\n📝 Starting Notes API Tests...\n');
  
  let testNoteId = null;

  try {
    // Test 1: Create Note
    log.test('Test 1: Create Note');
    const createRes = await fetch(`${BASE_URL}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Meeting Notes',
        content: '# Project Discussion\n\n- Review requirements\n- Assign tasks\n- Set deadline',
        tags: ['work', 'meeting', 'important'],
        pinned: false
      })
    });
    const createData = await createRes.json();
    if (createData.success && createData.data) {
      testNoteId = createData.data.id;
      log.success(`Note created with ID: ${testNoteId}`);
      log.info(`Tags: ${createData.data.tags.join(', ')}`);
    } else {
      log.error('Failed to create note');
    }

    // Test 2: Create Pinned Note
    log.test('\nTest 2: Create Pinned Note');
    const pinnedRes = await fetch(`${BASE_URL}/api/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Important Reminder',
        content: 'Don\'t forget to submit the report by Friday!',
        tags: ['reminder', 'urgent'],
        pinned: true
      })
    });
    const pinnedData = await pinnedRes.json();
    if (pinnedData.success && pinnedData.data.pinned) {
      log.success('Pinned note created successfully');
    } else {
      log.error('Failed to create pinned note');
    }

    // Test 3: Get All Notes
    log.test('\nTest 3: Get All Notes');
    const getAllRes = await fetch(`${BASE_URL}/api/notes`);
    const getAllData = await getAllRes.json();
    if (getAllData.success && getAllData.data.length > 0) {
      log.success(`Retrieved ${getAllData.count} note(s)`);
      log.info(`First note: "${getAllData.data[0].title}"`);
    } else {
      log.error('Failed to retrieve notes');
    }

    // Test 4: Get Single Note
    if (testNoteId) {
      log.test('\nTest 4: Get Single Note');
      const getOneRes = await fetch(`${BASE_URL}/api/notes/${testNoteId}`);
      const getOneData = await getOneRes.json();
      if (getOneData.success && getOneData.data) {
        log.success(`Retrieved note: "${getOneData.data.title}"`);
        log.info(`Content length: ${getOneData.data.content.length} characters`);
        log.info(`Tags: ${getOneData.data.tags.join(', ')}`);
      } else {
        log.error('Failed to retrieve single note');
      }
    }

    // Test 5: Update Note
    if (testNoteId) {
      log.test('\nTest 5: Update Note');
      const updateRes = await fetch(`${BASE_URL}/api/notes/${testNoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Updated Meeting Notes',
          content: '# Project Discussion - Updated\n\n- ✅ Requirements reviewed\n- Task assignment in progress',
          tags: ['work', 'meeting', 'important', 'in-progress'],
          pinned: true
        })
      });
      const updateData = await updateRes.json();
      if (updateData.success && updateData.data.pinned) {
        log.success('Note updated and pinned successfully');
        log.info(`New tags: ${updateData.data.tags.join(', ')}`);
      } else {
        log.error('Failed to update note');
      }
    }

    // Test 6: Get Pinned Notes Only
    log.test('\nTest 6: Get Pinned Notes Only');
    const pinnedOnlyRes = await fetch(`${BASE_URL}/api/notes?pinned=true`);
    const pinnedOnlyData = await pinnedOnlyRes.json();
    if (pinnedOnlyData.success) {
      log.success(`Retrieved ${pinnedOnlyData.count} pinned note(s)`);
    } else {
      log.error('Failed to retrieve pinned notes');
    }

    // Test 7: Filter by Tag
    log.test('\nTest 7: Filter by Tag');
    const tagFilterRes = await fetch(`${BASE_URL}/api/notes?tag=work`);
    const tagFilterData = await tagFilterRes.json();
    if (tagFilterData.success) {
      log.success(`Found ${tagFilterData.count} note(s) with tag "work"`);
    } else {
      log.error('Failed to filter by tag');
    }

    // Test 8: Search Notes
    log.test('\nTest 8: Search Notes');
    const searchRes = await fetch(`${BASE_URL}/api/notes/search/query?q=meeting`);
    const searchData = await searchRes.json();
    if (searchData.success) {
      log.success(`Search found ${searchData.count} note(s) matching "meeting"`);
    } else {
      log.error('Failed to search notes');
    }

    // Test 9: Batch Sync
    log.test('\nTest 9: Batch Sync');
    const syncRes = await fetch(`${BASE_URL}/api/notes/sync/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: [
          {
            id: 'sync-note-1',
            title: 'Offline Note 1',
            content: 'Created while offline',
            tags: ['offline', 'sync-test']
          },
          {
            id: 'sync-note-2',
            title: 'Offline Note 2',
            content: 'Another offline note',
            tags: ['offline'],
            pinned: true
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

    // Test 10: Delete Note (Soft Delete)
    if (testNoteId) {
      log.test('\nTest 10: Delete Note (Soft Delete)');
      const deleteRes = await fetch(`${BASE_URL}/api/notes/${testNoteId}`, {
        method: 'DELETE'
      });
      const deleteData = await deleteRes.json();
      if (deleteData.success) {
        log.success('Note soft deleted successfully');
        
        // Verify it's not in normal list
        const verifyRes = await fetch(`${BASE_URL}/api/notes`);
        const verifyData = await verifyRes.json();
        const deletedNoteExists = verifyData.data.some(note => note.id === testNoteId);
        if (!deletedNoteExists) {
          log.success('Note correctly excluded from normal list');
        }
      } else {
        log.error('Failed to delete note');
      }
    }

    console.log('\n✅ All Notes API tests completed!\n');

  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    console.error(error);
  }
}

// Run tests
testNotesAPI();