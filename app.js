const express = require('express'); 
const app = express(); 

app.get('/', (req, res) => {
    res.send('Hello World'); 
}); 

app.listen(8081, () => {
    console.log('8081에서 대기 중'); 
}); 