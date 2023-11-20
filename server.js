const express = require('express')
const req = require('express/lib/request')
const res = require('express/lib/response')
const app = express()
const port = 3000

///routes///
app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.get('/blog',(req,res)=>{
    res.send('hello im from blog and my name is fahim')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})