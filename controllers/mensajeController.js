import { Propiedad, Mensaje, Usuario} from "../models/index.js";
import { formatearFecha } from "../helpers/index.js";

const verMensaje = async (req,res)=>{
    const { id } = req.params;

    //Validar si la propiedad existe
    const propiedad = await Propiedad.findByPk(id,{
        include: [
            { model:Mensaje, as:"mensajes", include:[
                {model:Usuario.scope('eliminarContraseña'), as:'usuario'}
                ]
            },
            
        ],
    });
  
    if (!propiedad) {
      return res.redirect("/mis-propiedades");
    }
  
    //Validar al usuario que solicita la edición de la propiedad
    if (propiedad.usuario_id.toString() !== req.usuario.id.toString()) {
      return res.redirect("/mis-propiedades");
    }
    res.render('propiedades/mensajes',{
        pagina: 'Mensajes',
        mensajes: propiedad.mensajes,
        formatearFecha
    })
}
export {
    verMensaje
}