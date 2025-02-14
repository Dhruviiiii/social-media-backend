const Post=require("../models/Post");
const User=require("../models/User");


exports.createPost = async(req,res)=>{
    try{
        const newPostData={
            caption:req.body.caption,
            image:{
                public_id:req.body.public_id,
                url:req.body.url
            },
            owner:req.user._id,
        }

        const newPost=await Post.create(newPostData);

        const user=await User.findById(req.user._id);

        user.posts.push(newPost._id);

        await user.save();  
        

        res.status(201).json({
            success:true,
            post:newPost,
        });


    }catch(error){
       res.status(500).json({
        success:false,
        message:error.message,
       })
    }
       
}

exports.deletePost = async(req,res)=>{
    try{
        const post = await Post.findById(req.params.id);

        if(!post){
            return res.status(404).json({
                success:false,
                message:"Post not found",
            });
        }

        if(post.owner.toString()!==req.user._id.toString()){
            return res.status(401).json({
                success:false,
                message:"You are not authorized to delete this post",
            });
        }

        await post.deleteOne();

        const user=await User.findById(req.user._id);
        const index=user.posts.indexOf(req.params.id);

        user.posts.splice(index,1);

        await user.save();

        res.status(200).json({
            success:true,
            message:"Post Deleted Successfully",
        })


    }catch(error){
        res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}

exports.likeAndUnlikePost = async (req,res)=>{
    try{
         
        const post= await Post.findById(req.params.id);

        if(post.likes.includes(req.user._id)){

            const index=post.likes.indexOf(req.user._id);

            post.likes.splice(index,1);

            await post.save();

            return res.status(200).json({
                success:true,
                message:"Post Unliked",
            });
            
        }
        
            post.likes.push(req.user._id);

            await post.save();

            return res.status(200).json({
                success:true,
                message:"Post Liked",
            });
        

    }catch(error){
        res.status(500).json({
            success:false,
            message:error.message,
        })

    }
}

exports.getPostOfFollowing=async (req,res)=>{
    try{

        const user=await User.findById(req.user._id);
        user.following;


        const posts=await Post.find({
            owner:{
                $in: user.following,
            },
        });


        res.status(200).json({
            success:true,
            posts,
        });

    }catch(error){
        res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}

exports.updateCaption=async (req,res)=>{
    try{
        const post=await Post.findById(req.params.id);

        if(!post){
            return res.status(404).json({
                success:false,
                message:"Post not found",
            });
        }
        if(post.owner.toString()!==req.user._id.toString()){
            return res.status(401).json({
                success:false,
                message:"You are not authorized to update this post",
            });
        }

        post.caption=req.body.caption;
        await post.save();
        res.status(200).json({
            success:true,
            message:"Caption updated successfully",
        });

    }catch(error){
        res.status(500).json({
            success:false,
            message:error.message,
        })
    }

}

exports.commentOnPost=async (req,res)=>{

    try{

        const post=await Post.findById(req.params.id);

        if(!post){
            return res.status(404).json({
                success:false,
                message:"Post not found",
            });
        }
        let commentIndex=-1;
        

        post.comments.forEach((comment,index)=>{
            if(comment.user.toString()===req.user._id.toString()){
                commentIndex=index;
            }
        });
        if(commentIndex!==-1)
        {

            post.comments[commentIndex].comment=req.body.comment;

            await post.save();

            return res.status(200).json({
                success:true,
                message:"Comment updated successfully",
            });


        }else{

        post.comments.push({
            user:req.user._id,
            comment:req.body.comment,   
        });

        await post.save();
        return res.status(200).json({
            success:true,
            message:"Comment added successfully",
        });

    }
        

    }catch(error){
        res.status(500).json({
            success:false,
            message:error.message,
        })

    }

}

exports.deleteComment=async(req,res)=>{
    try{
        const post=await Post.findById(req.params.id);

        if(!post){
            return res.status(404).json({
                success:false,
                message:"Post not found",
            });
        }

        if(post.owner.toString()===req.user._id.toString()){

            if(req.body.commentId===undefined){
                return res.status(400).json({
                    success:false,
                    message:"Please provide comment id",
                
                });
            }
            post.comments.forEach((comment,index)=>{
                if(comment._id.toString()===req.body.commentId.toString()){
                    return post.comments.splice(index,1);
                }
            });

            await post.save();
            res.status(200).json({
                success:true,
                message:"selected comment deleted",
            });



        }
        else{
            post.comments.forEach((comment,index)=>{
                if(comment.user.toString()===req.user._id.toString()){
                    return post.comments.splice(index,1);
                }
            });

            await post.save();
            res.status(200).json({
                success:true,
                message:"Comment deleted successfully",
            });
            
                        

        }

    

    }catch(error){
        res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}