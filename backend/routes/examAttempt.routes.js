// examAttempt.routes.js
const router = require('express').Router();
const controller = require('../controller/examAttempt.controller');

router.get('/:id', controller.getAttemptById); // GET /api/examattempt/:id

module.exports = router;
