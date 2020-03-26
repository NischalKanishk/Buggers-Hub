const express = require('express')
const router  = express.Router()
const { check, validationResult } = require('express-validator')
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const User = require('../../models/User')

router.post('/',[
    check('name', 'Name is required')
        .not()
        .isEmpty(),
    check('email', 'Please use valid email').isEmail(),
    check('password', 'Please enter a strong password').isLength({ min: 6}) 
] ,
async (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() })
    }

    const { name, email, password } = req.body
    try {
    let user = await User.findOne({email})
    if(user) {
        return res.status(400).json({ errors: [{msg: 'users already exist'}]})
    }

    const avatar = gravatar.url(email,{
        s: '200',
        r: 'pg',
        d: 'mm'
    })
    user = new User( {
        name,
        email,
        avatar,
        password
    })
    
    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(password, salt)
    await user.save()

    //Return JWT
    res.send('User registered')
    }catch(err) {
        console.log(err.message)
        res.status(5000).send('Server error')
    }

    
    res.send('User route')
})

module.exports = router