const express = require("express");
const router = express.Router();

const {
    createRoom,
    getRoom,
} = require('../controllers/roomController.js');

router.post('/create', createRoom);
router.get('/:roomId', getRoom);


module.exports = router;