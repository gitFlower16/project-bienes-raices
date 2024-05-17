import {check, validationResult} from 'express-validator'
import Usuario from '../models/Usuario.js'
import { generarJWT, generarID} from '../helpers/tokens.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import {emailRegistro, emailOlvideContraseña} from '../helpers/emails.js'

const formularioLogin = (req, res) => {
    res.render('auth/login', {
      pagina:'Iniciar sesión' ,
      csrfToken: req.csrfToken(),
    })
} 

const autenticar = async(req, res) => {
    //Validaciones del login
    await check('email').isEmail().withMessage('El email es obligatorio').run(req)
    await check('password').notEmpty().withMessage('La contraseña es obligatoria').run(req)

    let resultado = validationResult(req)

   if(!resultado.isEmpty()){
       return res.render('auth/login', {
           pagina: 'Iniciar sesión',
           csrfToken : req.csrfToken(),
           errores: resultado.array()
       })
   }
   const{email, password} = req.body
   //Comprobar la existencia del usuario
   const usuario = await Usuario.findOne({where: {email}})

   if(!usuario) {
        return res.render('auth/login', {
            pagina: 'Iniciar sesión',
            csrfToken : req.csrfToken(),
            errores: [{msg: 'El usuario no existe'}]
        })
   }

   //Comprobar si el usuario está confirmado
   if(!usuario.confirmado) {
        return  res.render('auth/login', {
            pagina: 'Iniciar sesión',
            csrfToken : req.csrfToken(),
            errores: [{msg: 'Tu cuenta no ha sido confirmada'}]
        })
    }

    //Revisar el password
    if(!usuario.verificarContraseña(password)) {
        return  res.render('auth/login', {
                pagina: 'Iniciar sesión',
                csrfToken : req.csrfToken(),
                errores: [{msg: 'La contraseña es incorrecta'}]
            })
    }

    //Autenticar el usuario
    const token = generarJWT({id: usuario.id, nombre: usuario.nombre})
    console.log(token)

    //Almacenar el token
    return res.cookie('_token',token, {
        httpOnly: true,
        secure:true
    }).redirect('/mis-propiedades')


    
}

const cerrarSesion = (req, res) =>{
    return res.clearCookie('_token').status(200).redirect('/auth/login')
}

const formularioRegister = (req, res) => {
    console.log(req.csrfToken())

    res.render('auth/register', {
       pagina: 'Crear cuenta',
       csrfToken : req.csrfToken()
    })
} 

const registrar = async (req, res) =>{
    //Validaciones
    await check('nombre').notEmpty().withMessage('El nombre no puede ir vacío')
    .matches(/^[a-zA-ZáéíóúñÑ ]+$/).withMessage('El nombre solo debe contener letras').
    run(req)
    await check('email').isEmail().withMessage('No es un email').run(req)
    await check('password').isLength({min: 6}).withMessage('La contraseña no debe tener menos de 6 caracteres').run(req)
    await check('repetir_password').equals(req.body.password).withMessage('Las contraseñas no coinciden').run(req);


    let resultado = validationResult(req)
   // return res.json(resultado.array())

    //Verificar el resultado
    if(!resultado.isEmpty()){
        return res.render('auth/register',{
            pagina: 'Crear cuenta',
            errores: resultado.array(),
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        })
    }

    //Extraer los datos
    const {nombre, email, password} = req.body

    //Verificar que el usuario no esté duplicado
    const existeUsuario = await Usuario.findOne({where: { email }})
    if(existeUsuario) {
        return res.render('auth/register',{
            pagina: 'Crear cuenta',
            errores: [{msg: 'El usuario ya está registrado'}],
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        })
    }

    //Almacenar un usuario
    const usuario = await Usuario.create({
            nombre,
            email,
            password,
            token: generarID()
    })

    //Envia email de confirmación
    emailRegistro({
        nombre: usuario.nombre,
        email: usuario.email,
        token: usuario.token
    })

    //Mostrar mensaje de confirmación
    res.render('templates/mensaje', {
        pagina: 'Cuenta creada correctamente',
        mensaje: 'Hemos enviado un correo de confirmación de cuenta'
    })

    //Función que comprueba una cuenta
}

const confirmar = async(req, res) =>{
   const {token } = req.params;
   

   const usuario = await Usuario.findOne({where: {token}})

    if(!usuario) {
        return res.render('auth/confirmar_cuenta', {
            pagina: 'Error al confirmar tu cuenta',
            mensaje: 'Hubo un error al confirmar tu cuenta. Intenta de nuevo',
            error: true
        })
    }

    usuario.token = null;
    usuario.confirmado = true;
    await usuario.save()        //Leer un objeto. Hacer cambios y guardar cambios en la BD (commit)
        return res.render('auth/confirmar_cuenta', {
            pagina: 'Cuenta confirmada',
            mensaje: 'La cuenta se confirmó correctamente',
        
        })
}

const formularioOlvidePassword = (req, res) => {
    res.render('auth/olvide-password', {
       pagina: 'Recupera tu cuenta de Bienes Raices',
       csrfToken : req.csrfToken()
       
    })
} 

const actualizarContraseña = async(req, res) => {
   //Validaciones
   await check('email').isEmail().withMessage('No es un email').run(req)
  


   let resultado = validationResult(req)
  // return res.json(resultado.array())

   //Verificar el resultado
   if(!resultado.isEmpty()){
       return res.render('auth/olvide-password',{
           pagina: 'Recupera tu cuenta de BienesRaices.com',
           csrfToken : req.csrfToken(),
           errores: resultado.array()
       })
   }

   //Buscar el usuario
   const { email} = req.body
   const usuario = await Usuario.findOne({where: {email}})
   if (!usuario) {
        return res.render('auth/olvide-password',{
            pagina: 'Recupera tu cuenta de BienesRaices.com',
            csrfToken : req.csrfToken(),
            errores: [{msg: 'El email registrado no existe. Intente de nuevo'}]
    })
   }
   //Generar un token y enviar el email de actualización
   usuario.token = generarID();
   await usuario.save();  

   //Después de generar el ID, se llama a la función emailOlvideContraseña
   emailOlvideContraseña({
    email: usuario.email,
    nombre:usuario.nombre,
    token: usuario.token
   })

   //Renderizar un mensaje
    res.render('templates/mensaje', {
    pagina: 'Reestablece tu contraseña',
    mensaje: 'Hemos enviado un email con las instrucciones'
})

}

const comprobarToken = async(req, res) => {
    const{ token} = req.params;
    const usuario = await Usuario.findOne({ where: {token}})

    if(!usuario){
        return res.render('auth/confirmar_cuenta', {
            pagina: 'Error al actualizar contraseña',
            mensaje: 'Hubo un error al validar tu información. Intenta de nuevo',
            error: true
        })
    }

    //Mostrar el formulario de actualizar contraseña
    res.render('auth/actualizar-password', {
        pagina:'Actualizar contraseña',
        csrfToken: req.csrfToken()
    })
}

const nuevaContraseña = async(req, res) => {
   //Validar la contraseña
   await check('password').isLength({min: 6}).withMessage('La contraseña no debe tener menos de 6 caracteres').run(req)
   
   let resultado = validationResult(req)
  // return res.json(resultado.array())

   //Verificar el resultado
   if(!resultado.isEmpty()){
       return res.render('auth/actualizar-password',{
           pagina: 'Reestablece tu contraseña',
           csrfToken : req.csrfToken(),
           errores: resultado.array()
       })
   }
   //Extraer el token y la contraseña del usuario que desea hacer el cambio
   const { token} = req.params
   const {password} = req.body
   //Identificar al usuario que hace el cambio
   const usuario = await Usuario.findOne({ where: {token}})
   
   //Hashear la contraseña
   const salt = await bcrypt.genSalt(10)
   usuario.password = await bcrypt.hash(password,salt);
   //Cuando se genera la contraseña nueva, se anula el token
   usuario.token = null;

   await usuario.save();

   res.render('auth/confirmar_cuenta',{
    pagina: 'Contraseña reestablecida',
    mensaje: 'La contraseña se actualizó exitosamente'
   })

}


export {
    formularioLogin,
    autenticar,
    cerrarSesion,
    formularioRegister,
    registrar,
    confirmar,
    formularioOlvidePassword,
    actualizarContraseña,
    comprobarToken,
    nuevaContraseña
    
}