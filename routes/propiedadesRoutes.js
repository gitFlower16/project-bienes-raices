import express from 'express'
import {body} from 'express-validator'
import {admin, crear, guardar, agregarImagen, almacenarImagen, editar, guardarCambios, eliminar, cambiarEstado, mostrarPropiedad,enviarMensaje} from '../controllers/propiedadController.js'
import { verMensaje } from '../controllers/mensajeController.js'
import protegerRuta from '../middleware/protegerRuta.js'
import upload from '../middleware/subirArchivo.js'
import identificarUsuario from '../middleware/identificarUsuario.js'

const router = express.Router()

//Routing
router.get('/mis-propiedades', protegerRuta, admin)
router.get('/propiedades/crear', protegerRuta, crear)
router.post('/propiedades/crear', 
    protegerRuta,
    body('titulo').notEmpty().withMessage('El título del anuncio es obligatorio'),
    body('descripcion').notEmpty().withMessage('La descripción no no debe ir vacía').isLength({max:200}).withMessage('La descripción es muy larga'),
    body('categoria').isNumeric().withMessage('Selecciona una categoría'),
    body('precio').isNumeric().withMessage('Selecciona un rango de precios'),
    body('habitaciones').isNumeric().withMessage('Selecciona una cantidad de habitaciones'),
    body('estacionamiento').isNumeric().withMessage('Selecciona una cantidad de estacionamientos'),
    body('wc').isNumeric().withMessage('Selecciona una cantidad de wc'),
    body('lat').notEmpty().withMessage('Ubica la propiedad en el mapa'),
    guardar

)
router.get('/propiedades/agregar-imagen/:id', 
protegerRuta,
agregarImagen
)
router.post('/propiedades/agregar-imagen/:id',
protegerRuta,
upload.single('imagen'),
almacenarImagen
)
router.get('/propiedades/editar-propiedad/:id',
protegerRuta,
editar
)
router.post('/propiedades/editar-propiedad/:id', 
    protegerRuta,
    body('titulo').notEmpty().withMessage('El título del anuncio es obligatorio'),
    body('descripcion').notEmpty().withMessage('La descripción no no debe ir vacía').isLength({max:200}).withMessage('La descripción es muy larga'),
    body('categoria').isNumeric().withMessage('Selecciona una categoría'),
    body('precio').isNumeric().withMessage('Selecciona un rango de precios'),
    body('habitaciones').isNumeric().withMessage('Selecciona una cantidad de habitaciones'),
    body('estacionamiento').isNumeric().withMessage('Selecciona una cantidad de estacionamientos'),
    body('wc').isNumeric().withMessage('Selecciona una cantidad de wc'),
    body('lat').notEmpty().withMessage('Ubica la propiedad en el mapa'),
    guardarCambios

)
router.post('/propiedades/eliminar/:id',
protegerRuta,
eliminar
)
router.put('/propiedades/:id' , 
    protegerRuta,
    cambiarEstado
)
//Area pública
router.get('/propiedad/:id' ,
identificarUsuario,
mostrarPropiedad
)

//Almacenar los mensajes del formulario Contactar al vendedor
router.post('/propiedad/:id' ,
identificarUsuario,
body('mensaje').isLength({min:15}).withMessage('El mensaje ir vacío o es muy corto'),
enviarMensaje
)

router.get('/mensajes/:id',
    protegerRuta,
    verMensaje
)

export default router