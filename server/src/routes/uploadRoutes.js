const express = require("express");
const router = express.Router();
const upload = require("../middlewares/uploadMiddleware.js");
const { uploadVideoBuffer } = require("../config/cloudinary.js");


router.post("/video", upload.single("video"), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Video file is required.",
            });
        }

        const result = await uploadVideoBuffer(req.file);

        res.json({
            success: true,
            videoUrl: result.secure_url,
            publicId: result.public_id,
        });
    } catch (error) {
        next(error);
    }
});


module.exports = router;
