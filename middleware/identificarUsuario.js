import jwt from 'jsonwebtoken'
import Usuario  from '../models/Usuario.js'

const identificarUsuario = async (req,res,next) =>{
    //Identificar al usuario
    const {_token} = req.cookies
    if(!_token){
        req.usuario = null
        //Pasar al siguiente middleware
        return next()
    }
    try {

        const decoded = jwt.verify(_token, process.env.JWT_SECRET)
        const usuario = await Usuario.scope('eliminarContraseña').findByPk(decoded.id)

        if(usuario){
            req.usuario = usuario
        }
        
        return next();
        
    }catch(error){
        console.log(error)
        return res.clearCookie('_token').redirect('/auth/login')
    }
}
export default identificarUsuario