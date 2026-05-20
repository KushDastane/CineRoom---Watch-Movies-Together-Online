const roomService = require("../services/roomService.js");

const createRoom = (req, res) => {
    const room = roomService.createRoom();

    res.json({
        success: true,
        room,
    });
};

const getRoom = (req,res)=>{
    const roomId = req.params.roomId;
    const room = roomService.getRoom(roomId);

    if(!room){
        return res.status(404).json({
            "success":false,
            "message":"Room not found"
        })
    }
    res.json({
        "success":true,
        room,
    });
};

const joinRoom = (req,res)=>{
    const roomId = req.params.roomId;
    const {username} = req.body;

    if(!username){
        return res.status(400).json({
            "success":false,
            "message":"Username is required."
        });
    }

    const result = roomService.joinRoom(roomId, username);

    if(!result){
        return res.status(404).json({
            "success":false,
            "message":"Room not found",
        })
    }
    res.json({
        success:true,
        room:result.room,
        user:result.user,
    })
}
const getAllRooms = (req, res) => {
    const activeRooms = roomService.getAllRooms();
    res.json({
        success: true,
        rooms: activeRooms,
    });
};

module.exports = { createRoom , getRoom, joinRoom, getAllRooms };