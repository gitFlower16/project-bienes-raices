import express from 'express'
import csrf from 'csurf'
import cookieParser from 'cookie-parser'
import usuarioRoutes from './routes/usuarioRoutes.js'
import propiedadesRoutes from './routes/propiedadesRoutes.js'
import appRoutes from './routes/appRoutes.js'
import apiRoutes from './routes/apiRoutes.js'
import db from './config/db.js'
const app =  express()  //Instancia de express

//Habilitar lectura de datos de formularios
app.use(express.urlencoded({extended:true}))

//Habilitar cookie-parser
app.use(cookieParser())

//Habilitar CSRF
app.use(csrf({cookie: true}))


//Conexión a la base de datos
try{
    await db.authenticate();
    db.sync()
    console.log('Conexión correcta a la bd')
}catch(error){
    console.log(error)
}

//Habilitar pug
app.set('view engine', 'pug')
app.set('views', './views')

//Carpeta PUBLIC
app.use(express.static('public'))

//Routing
app.use('/',appRoutes)
app.use('/auth', usuarioRoutes)
app.use('/',propiedadesRoutes)  //Use busca todas las rutas que inicien con una diagonal  - Get busca la ruta exacta
app.use('/api',apiRoutes)



//Definir un puerto y arrancar el proyecto
const port = 4000;
app.listen(port, () => {
    console.log(`El servidor está funcionando en el puerto ${port}`)
});