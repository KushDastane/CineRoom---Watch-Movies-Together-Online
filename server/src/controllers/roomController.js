const roomService = require("../services/roomService.js");

const createRoom = async (req, res) => {
    const room = await roomService.createRoom();

    res.json({
        success: true,
        room,
    });
};

const getRoom = async (req,res)=>{
    const roomId = req.params.roomId;
    const room = await roomService.getRoom(roomId);

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

const joinRoom = async (req,res)=>{
    const roomId = req.params.roomId;
    const {username, userId} = req.body;

    if(!username){
        return res.status(400).json({
            "success":false,
            "message":"Username is required."
        });
    }

    const result = await roomService.addUserToRoom(roomId, username, null, userId);

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
const getAllRooms = async (req, res) => {
    const activeRooms = await roomService.getAllRooms();
    res.json({
        success: true,
        rooms: activeRooms,
    });
};

module.exports = { createRoom , getRoom, joinRoom, getAllRooms };
