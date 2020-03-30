const express = require('express')
const router  = express.Router()
const auth = require('../../middleware/auth')
const Profile = require('../../models/Profile')
const User = require('../../models/User')
const {check, validationResult} = require('express-validator')
const request  = require('request')
const config = require('config')

router.post('/me',auth, async (req, res) =>{
    try {
        const profile = await (await Profile.findOne({ user: req.user.id })).populate('user',['name', 'avatar'])
        if(!profile){
            res.status(400).json({ msg: 'There is not profile of user'})
        }
        res.json(profile)
    } catch (err) {
        console.log(err.message)
        res.status(500).send('Server error')
    }
})

router.post('/',[ auth, [
    check('status', 'Status is required').not().isEmpty(),
    check('skills', 'Skills is req').not().isEmpty()
]],async (req, res)=>{
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() })
    }
    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin
    } = req.body

    const profileFields = {}
    profileFields.user = req.user.id
    if(company) profileFields.company = company
    if(website) profileFields.website = website
    if(location) profileFields.location = company
    if(bio) profileFields.bio = bio
    if(status) profileFields.status = status
    if(githubusername) profileFields.githubusername = githubusername
    if(skills){
        profileFields.skills = skills.split(',').map(skill => skill.trim())
    }
    profileFields.social = {}
    if(youtube) profileFields.social.youtube = youtube
    if(twitter) profileFields.social.twitter = twitter
    if(facebook) profileFields.social.facebook = facebook
    if(linkedin) profileFields.social.linkedin = linkedin
    if(instagram) profileFields.social.instagram = instagram
    try {
        let profile = await Profile.findOne({user: req.user.id})
        if(profile) {
            profile = await Profile.findOneAndUpdate(
                { user: req.user.id },
                { $set: profileFields },
                { new: true }
                )
                return res.json(profile)
        }
        profile = new Profile(profileFields)
        await profile.save()
        res.json(profile)

    } catch (err) {
        console.log(err.message)
        res.status(500).send('Server error')
    }
})

router.get('/', async (req,res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name','avatar'])
        res.json(profiles)


    } catch (err) {
        console.log(err.message)
        res.status(500).send('Server error')
    }
})

router.get('/user/:user_id', async (req,res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id}).populate('user', ['name','avatar'])
        res.json(profile)
        if(!profile) return res.status(400).json({ msg:'Profile not found'})
        
    } catch (err) {
        console.log(err.message)
        if(err.kind== 'ObjectId'){
            return res.status(400).json({ msg:'Profile not found'})
        }
        res.status(500).send('Server error')
    }
})

router.delete('/',auth, async (req,res) => {
    try {
        await Profile.findOneAndRemove({ user: req.user.id})

        await User.findOneAndRemove({ _id: req.user.id})
        
        res.json({msg:'User removed'})
    } catch (err) {
        console.log(err.message)
        res.status(500).send('Server error')
    }
})


router.put('/experience', [auth, 
    check('title', 'Title is required').not().isEmpty(),
    check('company', 'Company is required').not().isEmpty()
], async (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array()})
    }
    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body
    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }

    try {
        const profile = await Profile.findOne({ user: req.user.id })
        profile.experiences.unshift(newExp)
        await profile.save()
        res.json(profile)
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server error')
    }
})


router.delete('/experience/:exp_id',auth, async (req,res)=>{
    try {
        const profile = await Profile.findOne({user:req.user.id})
        const removeIndex = profile.experiences.map(item => item.id).indexOf(req.params.exp_id)
        profile.experiences.splice(removeIndex,1)
        await profile.save()
        res.json(profile)
    } catch (err) {
        console.error(err)
        res.status(500).send('Server error')
    }
})

router.put('/education', [auth, 
    check('school', 'School is required').not().isEmpty(),
    check('degree', 'Degree is required').not().isEmpty(),
    check('fieldofstudy', 'Field of study is required').not().isEmpty()
], async (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array()})
    }
    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    } = req.body
    const newEdu = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    }

    try {
        const profile = await Profile.findOne({ user: req.user.id })
        profile.education.unshift(newEdu)
        await profile.save()
        res.json(profile)
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server error')
    }
})

router.delete('/education/:edu_id',auth, async (req,res)=>{
    try {
        const profile = await Profile.findOne({user:req.user.id})
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id)
        profile.education.splice(removeIndex,1)
        await profile.save()
        res.json(profile)
    } catch (err) {
        console.error(err)
        res.status(500).send('Server error')
    }
})

router.get('/github/:username', (req,res) =>{
    try {
        const options = {
            uri: `https://api.github.com/users/${
                req.params.username}/repos?per_page=5&sort=created:asc&clent_id=${
                config.get('githubClientId')}&client_secret=${
                config.get('githubSecret')}`,
            method: 'GET',
            headers:{'user-agent': 'node.js'}
        }
        request(options, (error, response, body)=> {
            if(!error) console.error(error)
            if(response.statusCode !=200){
               return res.status(404).json({msg:'Profile not found'})
            }
            res.json(JSON.parse(body))
        })

    } catch (err) {
        console.log(err.message)
        res.status(500).send('Server error')
    }
})

module.exports = router