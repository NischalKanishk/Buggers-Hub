const express = require('express')
const router  = express.Router()
const {check, validationResult} = require('express-validator')
const auth = require('../../middleware/auth')
const Post = require('../../models/Posts')
const Profile = require('../../models/Profile')
const User = require('../../models/User')

router.post('/',[auth,
check('text', 'Text is required').not().isEmpty()
],
async (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array()})
    }
    try {
        const user = await User.findById(req.user.id).select('-password')
        const newPost = new Post ({
            text : req.body.text,
            name : req.body.name,
            avatar : req.body.avatar,
            user: req.body.user
        })
        const post = await newPost.save()
        res.json(post)  
    } catch (err) {
        console.log(err.message)
        res.status(500).send('Server error')
    }
})


router.get('/', auth, async (req, res)=>{
    try {
        const posts = await Post.find().sort({ date: -1})
        res.json(posts)
    
    } catch (err) {
        console.log(err.message)
        res.status(500).send('Server error')
        
    }
})

router.get('/:id', auth, async (req, res)=>{
    try {
        const post = await Post.findById(req.params.id)
        res.json(post)
        if(!post){
            return res.status(404).json({msg: 'Post not found'})
        }
    
    } catch (err) {
        console.log(err.message)
        if(err.kind ==='ObjectId'){
            return res.status(404).json({msg: 'Post not found'})
        }
        res.status(500).send('Server error')
        
    }
})

router.delete('/:id', auth, async (req, res) =>{
    try {
        const post = await Post.findById(req.params.id)
        if(!post){
            return res.status(404).json({ msg: 'Post not found'})
        }
        if(post.user !== req.user.id){
            return res.status(401).json({msg: 'user not authorized'})
        }
        
        await post.remove()
        
        res.json({msg: 'Post removed'})
    } catch (err) {
        console.log(err.message)
        if(err.kind ==='ObjectId'){
            return res.status(404).json({msg: 'Post not found'})
        }
        res.status(500).send('Server error')
        
    }
})

module.exports = router