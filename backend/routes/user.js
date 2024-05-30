const express=require('express');
const { register , login, Logout,updatePassword,updateProfile,deleteUser,MyProfile, getAllUser, getUser,forgetPassword,resetPassword} = require('../controllers/user');
const { isAuthenticated } = require('../middlewares/auth');
const { followUser } = require('../controllers/user');

const router=express.Router();

router.route("/register").post(register);

router.route("/login").post(login);

router.route("/follow/:id").get(isAuthenticated,followUser);

router.route("/Logout").get(Logout);

router.route("/update/password").put(isAuthenticated,updatePassword);

router.route("/update/profile").put(isAuthenticated,updateProfile);

router.route("/delete/acc").delete(isAuthenticated,deleteUser);

router.route("/myProfile").get(isAuthenticated,MyProfile);

router.route("/user/:id").get(isAuthenticated,getUser);

router.route("/users").get(isAuthenticated,getAllUser);

router.route("/forgotPassword").post(isAuthenticated,forgetPassword);

router.route("/password/reset/:token").put(isAuthenticated,resetPassword);

module.exports=router;