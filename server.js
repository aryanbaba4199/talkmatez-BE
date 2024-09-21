const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDb = require('./Database/db')
const errorHandler = require('./middleware/errorHandler');
const helpers = require('./routes/helpersRoutes');
const Tutors = require('./routes/tutorsRoute');
const GetLanguages = require('./routes/admin');

require('dotenv').config();

const app = express();
const port = 4000;

app.use(cors({
    origin : "*",
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(bodyParser.json());

connectDb();


app.use('/helpers', helpers)
app.use('/tutors', Tutors)
// app.use('/users', )
app.use("/admin/helpers", GetLanguages)


app.use(errorHandler);

app.listen(port, ()=>{
    console.log('listening on port', port);
});