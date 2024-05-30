const User=require("../models/User");
const Post=require("../models/Post");
const {sendEmail}=require("../middlewares/sendemail");
const crypto=require("crypto");


exports.register = async (req,res)=>{
    try{
        const {name,email,password}=req.body;

        let user=await User.findOne({email});
        if(user) {
            return res
                .status(400)
                .json({success:false, message:"User already exists"});
        }
        user=await User.create({
            name,
            email,
            password,
            avtar:{public_id:"sample_id",url:"sampleurl"}});

        res.status(201).json({
            success:true,
            user,
        
        });

    }catch(error){
        res.status(500).json({
            success:false,
            message:error.message,
        });

    }
};

exports.login= async (req,res)=>{
    try{
        const {email,password}=req.body;

        const user=await User.findOne({email}).select("+password");
        if(!user){
            return res.status(400).json({
                success:false,
                message:"user does not exist!!please register First!!",
            });
        }

        const ismatch=await user.matchPassword(password);

        if(!ismatch){
            return res.status(400).json({
                success:false,
                message:"Incorrect password",
            });
        }
        const token=await user.generateToken();
        const options={
            expires:new Date(Date.now()+90*24*60*60*1000),
            httpOnly:true
        };
        res.status(201)
           .cookie("token",token, options)
            .json({
            success:true,
            user,
            token,
        });

    }catch(error){
        res.status(500).json({
            success:false,
            message:error.message,
    });
    }
}

exports.Logout=async (req,res)=>{
    try{
    res.status(200).cookie("token","null",{
        expires:new Date(Date.now()),
        httpOnly:true,
    }).json({
        success:true,
        message:"Logged out successfully",
    });
    }
    catch(error){
        res.status(500).json({
            success:false,
            message:error.message,
        });
    }

}

exports.followUser=async (req,res)=>{
    try{
        const userToFollow=await User.findById(req.params.id);
        const LoggedInUser=await User.findById(req.user._id);
        if(!userToFollow){
            
            return res.status(404).json({
                success:false,
                message:"User not found",
            });

           
        }


        if(LoggedInUser.following.includes(userToFollow._id)){

            const indexfollowing=LoggedInUser.following.indexOf(userToFollow._id);

            LoggedInUser.following.splice(indexfollowing,1);

            const indexfollower=userToFollow.followers.indexOf(LoggedInUser._id);

            userToFollow.followers.splice(indexfollower,1);

            await LoggedInUser.save();
            await userToFollow.save();

            res.status(200).json({
                success:true,
                message:"User unfollowed successfully",
            });
             
        }
        else{
            LoggedInUser.following.push(req.params.id);

            userToFollow.followers.push(req.user._id);
    
            await LoggedInUser.save();;
            await userToFollow.save();
    
            res.status(200).json({
                success:true,
                message:"User followed successfully",
            });
        }
        

     

    }catch(error){
        res.status(500).json({
            success:false,
            message:error.message,
        });
    }

}

exports.updatePassword=async (req,res)=>{

    try{

        const user=await User.findById(req.user._id).select("+password");
        

        const {oldPassword,newPassword}=req.body;

        if(!oldPassword || !newPassword){
            return res.status(400).json({
                success:false,
                message:"Please enter old & new password",
            });
        }

        const ismatch=await user.matchPassword(oldPassword);

        if(!ismatch){
            return res.status(400).json({
                success:false,
                message:"Incorrect old password",
            });
        }

        user.password=newPassword;
        await user.save();

        res.status(200).json({
            success:true,
            message:"Password updated successfully",
        });
  

    }catch(error){
        res.status(500).json({
            success:false,
            message:error.message,
        });
    }
}

exports.updateProfile=async (req,res)=>{

    try{
        const user=await User.findById(req.user._id);
        const {name,email}=req.body;

        if(name){
            user.name=name;
        }
        if(email){
            user.email=email;
        }
        //user avtar todo

        await user.save();

        res.status(200).json({
            success:true,
            message:"Profile updated successfully",
        });

    }catch(error){
        res.status(500).json({
            success:false,
            message:error.message,
        });

    }
}


exports.deleteUser=async (req,res)=>{
    try{
        const user= await User.findById(req.user._id);
        const posts=user.posts;
        const followers=user.followers;
        const following=user.following;
        if(!user){
            return res.status(404).json({
                success:false,
                message:"account not found"
            });
        }
       
        await user.deleteOne();

        //logout after deleting profile

        res.cookie("token",null,{
            expires:new Date(Date.now()),
            httpOnly:true
        });

        for(let i=0;i< posts.length;i++){
            const post=await Post.findById(posts[i]);
            await post.deleteOne();
        }   
        
        //removing user from follower's following

        for (let i=0;i<followers.length;i++){
            const follower=await User.findById(followers[i]);

            const index= follower.following.indexOf(user._id);
            follower.following.splice(index,1);
            await follower.save();
        }

        //removing user from following's follower
        for (let i=0;i<following.length;i++){
            const follows=await User.findById(following[i]);

            const index= follows.followers.indexOf(user._id);
            follows.followers.splice(index,1);
            await follows.save();
        }

        res.status(200).json({
            success:true,
            message:"Profile Deleted"
        });



    }catch(error){
        res.status(500).json({
            success:false,
            message:error.message
        });
    }
}

exports.MyProfile=async(req,res)=>{
    try{
        const user=await User.findById(req.user._id).populate("posts");

        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found",
            });
        
        }
        res.status(200).json({
            success:true,
            user,
        });
      
    }catch(error){
        res.status(500).json({
            success:false,
            message:error.message
        })

    }
}

exports.getUser=async(req,res)=>{
    try{
        const user=await User.findById(req.params.id)

        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found",
            });
        
        }
        res.status(200).json({
            success:true,
            user,
        });
      
    }catch(error){
        res.status(500).json({
            success:false,
            message:error.message
        })

    }
}

exports.getAllUser=async(req,res)=>{
    try{

        const users=await User.find({});

        res.status(200).json({
            success:true,
            users,
        });

    }catch(error){
        res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

exports.forgetPassword=async(req,res)=>{
    try{
        const user=await User.findOne({email:req.body.email});
        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found",
            });
        }

        const resetPasswordToken=user.getResetPasswordToken();

        await user.save();

        const resetUrl=`${req.protocol}://${req.get("host")}/password/reset/${resetPasswordToken}`;

        const message=`reset your password by clicking on this link below: \n\n ${resetUrl}`;

        try{
            await sendEmail({
                email:user.email,
                subject:"Reset Password",
                message,
            });
            res.status(200).json({
                success:true,
                message:`email sent to ${user.email}`,
            })

        }catch(error){
              user.reserPasswordToken=undefined;
              user.resetPasswordExpire=undefined;
              await user.save();
              res.status(500).json({
                    success:false,
                    message:error.message
                });
        }


    }catch(error){
        res.status(500).json({
            success:false,
            message:error.message
        });
    }
}

exports.resetPassword=async(req,res)=>{
    try{
        const resetPasswordToken=crypto.createHash("sha256").update(req.params.token).digest("hex");
        const user=await User.findOne({
            resetPasswordToken,
            resetPasswordExpire:{$gt:Date.now()},
        });

        if(!user){
            return res.status(401).json({
                success:false,
                message:"Invalid reset token or token has expired",
            });
            
        }

        user.password=req.body.password;

        user.resetPasswordToken=undefined;
        user.resetPasswordExpire=undefined;

        await user.save();
        res.status(200).json({
            success:true,
            message:"Password reset successfully",
        });



    }catch(error){
        res.status(500).json({
            success:false,
            message:error.message
        });

    }
}    