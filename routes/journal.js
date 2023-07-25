const express = require('express');
const router = express.Router();
const journalController = require('../controllers/journal');
const authenticateToken = require('../middleware/auth');

router.post('/',authenticateToken,journalController.createJournal);
router.put('/:id',authenticateToken, journalController.updateJournal);
router.delete('/:id',authenticateToken, journalController.deleteJournal);
router.post('/publish/:id',authenticateToken,journalController.publishJournal);
router.get('/feed',authenticateToken,journalController.getJournalFeed);

module.exports = router;
