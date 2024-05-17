import express from 'express';
import { formularioLogin, autenticar, cerrarSesion, formularioRegister,registrar, confirmar, formularioOlvidePassword,actualizarContraseña, comprobarToken, nuevaContraseña } from '../controllers/usuarioController.js';


const router = express.Router()

//Routing
router.get('/login', formularioLogin);
router.post('/login', autenticar);

//Cerrar sesión
router.post('/cerrar-sesion', cerrarSesion)

router.get('/register', formularioRegister);

router.post('/register', registrar);
router.get('/confirmar/:token', confirmar);

router.get('/olvide-password', formularioOlvidePassword);
router.post('/olvide-password', actualizarContraseña);

//Reestablecer contraseña
router.get('/olvide-password/:token', comprobarToken) //Si el token es válido, se le mostrará la página 
router.post('/olvide-password/:token',nuevaContraseña)

export default router
