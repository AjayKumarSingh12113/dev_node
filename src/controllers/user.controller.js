import {asyncHandler} from "../utils/asynHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req,res) => {
    // res.status(200).json({
    //     message:"ok"
    // })
    const {fullname,username,email,password} = req.body;

    // if (fullname === "") {
    //     throw new ApiError(400,"fullname is required")
    // } yehi sare field ke check krna padega 
    if (
        [fullname,username,email,password].some((f) => f?.trim()==="")
    ) {
        throw new ApiError(400,"fields is required")
    }

    const exitedUser =await User.findOne({
        $or:[{ username },{ email }]
    })

    if (exitedUser) {
        throw new ApiError(409,"User with email or username already exist")
    }
    //console.log(req.body);
    //console.log(req.files);
    
    
    //multer me files ke path niklna hai 
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0  ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400,"Avatar file is required")
    }

    const user = await User.create({
        fullname,
        avatar:avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase(),
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"// yeh folder ko delete kr diya 
    )
    //console.log(createdUser);
    
    if (!createdUser) {
        throw new ApiError(500,"something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User register Successfully")
    )
})

export {registerUser}