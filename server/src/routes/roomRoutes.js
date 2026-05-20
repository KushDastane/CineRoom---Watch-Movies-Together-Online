const express = require("express");
const router = express.Router();

const {
    createRoom,
    getRoom,
    getAllRooms,
} = require('../controllers/roomController.js');

router.post('/create', createRoom);
router.get('/', getAllRooms);
router.get('/:roomId', getRoom);


module.exports = router;