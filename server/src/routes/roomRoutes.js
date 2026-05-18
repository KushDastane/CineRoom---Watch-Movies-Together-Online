const express = require("express");
const router = express.Router();

const{
    createRoom,
    getRoom,
    joinRoom,
} = require('../controllers/roomController.js');

router.post('/create',createRoom);
router.get('/:roomId',getRoom);
router.post('/:roomId/join',joinRoom); //:roomId means dynamic value

module.exports = router;