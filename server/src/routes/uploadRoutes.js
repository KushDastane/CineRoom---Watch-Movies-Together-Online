const express = require("express");
const router = express.Router();
const upload = require("../middlewares/uploadMiddleware.js");


router.post("/video", upload.single("video"), (req,res)=>{
    const videoUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    
    res.json({
        success:true,
        videoUrl,
    })
})


module.exports = router;